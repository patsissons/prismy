// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env } from "./env";
import { handleApi } from "./index";
import { SESSION_COOKIE, STATE_COOKIE, sealSession } from "./session";

const env: Env = {
  ASSETS: { fetch: async () => new Response("asset") } as unknown as Fetcher,
  GITHUB_CLIENT_ID: "client-id",
  GITHUB_CLIENT_SECRET: "client-secret",
  SESSION_SECRET: "session-secret",
};
const ORIGIN = "https://prismy.lgtm.page";

function api(path: string, init: RequestInit & { cookie?: string } = {}) {
  const headers = new Headers(init.headers);
  if (init.cookie) headers.set("cookie", init.cookie);
  const request = new Request(`${ORIGIN}${path}`, { ...init, headers });
  return handleApi(request, env, new URL(request.url));
}

/** The Set-Cookie headers of a response, parsed by name. */
function setCookies(response: Response): Record<string, string> {
  return Object.fromEntries(
    response.headers
      .getSetCookie()
      .map((header) => header.split(";")[0]!)
      .map((pair) => pair.split("=") as [string, string]),
  );
}

async function sessionCookie(scope: "public" | "private" = "public") {
  return `${SESSION_COOKIE}=${await sealSession(env.SESSION_SECRET, { token: "gho_token", scope })}`;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("/api/auth/login", () => {
  it("redirects to GitHub with a state cookie and the chosen scopes", async () => {
    const response = await api("/api/auth/login?scope=private");
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get("location")!);
    expect(location.origin + location.pathname).toBe(
      "https://github.com/login/oauth/authorize",
    );
    expect(location.searchParams.get("client_id")).toBe("client-id");
    expect(location.searchParams.get("redirect_uri")).toBe(
      `${ORIGIN}/api/auth/callback`,
    );
    expect(location.searchParams.get("scope")).toBe("read:user repo");
    const cookie = response.headers.get("set-cookie")!;
    expect(cookie).toContain(
      `${STATE_COOKIE}=${location.searchParams.get("state")}.private`,
    );
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
  });

  it("asks only for the profile without private access", async () => {
    const response = await api("/api/auth/login");
    const location = new URL(response.headers.get("location")!);
    expect(location.searchParams.get("scope")).toBe("read:user");
  });
});

describe("/api/auth/callback", () => {
  it("exchanges the code and seals the token into the session cookie", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Response.json({ access_token: "gho_new" }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await api("/api/auth/callback?code=c0de&state=abc", {
      cookie: `${STATE_COOKIE}=abc.private`,
    });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(`${ORIGIN}/`);
    const cookies = setCookies(response);
    expect(cookies[STATE_COOKIE]).toBe("");
    expect(cookies[SESSION_COOKIE]).toBeTruthy();
    const body = JSON.parse(fetchMock.mock.calls[0]![1]!.body as string);
    expect(body).toMatchObject({
      code: "c0de",
      client_secret: "client-secret",
    });
  });

  it("rejects a state mismatch without calling GitHub", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    const response = await api("/api/auth/callback?code=c0de&state=evil", {
      cookie: `${STATE_COOKIE}=abc.public`,
    });
    expect(response.headers.get("location")).toBe(`${ORIGIN}/?error=state`);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("/api/auth/logout", () => {
  it("revokes the token and clears the cookie", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () => new Response(null, { status: 204 }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await api("/api/auth/logout", {
      method: "POST",
      headers: { origin: ORIGIN },
      cookie: await sessionCookie(),
    });
    expect(response.status).toBe(204);
    expect(setCookies(response)[SESSION_COOKIE]).toBe("");
    expect(fetchMock.mock.calls[0]![0]).toBe(
      "https://api.github.com/applications/client-id/token",
    );
  });

  it("refuses cross-site posts", async () => {
    const response = await api("/api/auth/logout", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(response.status).toBe(403);
  });
});

describe("/api/me", () => {
  it("returns 401 and clears the cookie without a session", async () => {
    const response = await api("/api/me", {
      cookie: `${SESSION_COOKIE}=garbage`,
    });
    expect(response.status).toBe(401);
    expect(setCookies(response)[SESSION_COOKIE]).toBe("");
  });

  it("returns the viewer and scope", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          data: { viewer: { login: "pat", name: "Pat", avatarUrl: "a" } },
        }),
      ),
    );
    const response = await api("/api/me", {
      cookie: await sessionCookie("private"),
    });
    expect(await response.json()).toEqual({
      viewer: { login: "pat", name: "Pat", avatarUrl: "a" },
      scope: "private",
    });
  });
});

describe("/api/github/graphql", () => {
  it("forwards the body with the token and passes rate-limit headers back", async () => {
    const fetchMock = vi.fn<typeof fetch>(
      async () =>
        new Response('{"data":{}}', {
          status: 200,
          headers: {
            "content-type": "application/json",
            "x-ratelimit-remaining": "4999",
            "retry-after": "0",
            "x-github-request-id": "hidden",
          },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const response = await api("/api/github/graphql", {
      method: "POST",
      headers: { origin: ORIGIN },
      cookie: await sessionCookie(),
      body: '{"query":"{ viewer { login } }"}',
    });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('{"data":{}}');
    expect(response.headers.get("x-ratelimit-remaining")).toBe("4999");
    expect(response.headers.get("x-github-request-id")).toBeNull();
    const [target, init] = fetchMock.mock.calls[0]! as [string, RequestInit];
    expect(target).toBe("https://api.github.com/graphql");
    expect(new Headers(init.headers).get("authorization")).toBe(
      "Bearer gho_token",
    );
    expect(init.body).toBe('{"query":"{ viewer { login } }"}');
  });

  it("requires a session and the app origin", async () => {
    expect(
      (
        await api("/api/github/graphql", {
          method: "POST",
          headers: { origin: ORIGIN },
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await api("/api/github/graphql", {
          method: "POST",
          headers: { origin: "https://evil.example" },
          cookie: await sessionCookie(),
        })
      ).status,
    ).toBe(403);
    expect(
      (await api("/api/github/graphql", { cookie: await sessionCookie() }))
        .status,
    ).toBe(405);
  });
});

describe("router", () => {
  it("answers the health check and 404s unknown routes", async () => {
    expect((await api("/api/health")).status).toBe(200);
    expect((await api("/api/nope")).status).toBe(404);
  });
});
