import type { OAuthScope } from "../shared/types";
import type { Env } from "./env";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  STATE_COOKIE,
  STATE_MAX_AGE,
  clearCookieHeader,
  cookieHeader,
  openSession,
  parseCookies,
  randomToken,
  sealSession,
} from "./session";

const GITHUB_AUTHORIZE = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN = "https://github.com/login/oauth/access_token";

/** The OAuth scopes each sign-in mode asks GitHub for. */
export const OAUTH_SCOPES: Record<OAuthScope, string> = {
  public: "read:user",
  private: "read:user repo",
};

export function isSecure(url: URL): boolean {
  return url.protocol === "https:";
}

export function callbackUrl(url: URL): string {
  return `${url.origin}/api/auth/callback`;
}

/** GET /api/auth/login?scope=public|private -> GitHub's consent page. */
export function handleLogin(env: Env, url: URL): Response {
  const scope: OAuthScope =
    url.searchParams.get("scope") === "private" ? "private" : "public";
  const state = randomToken();
  const target = new URL(GITHUB_AUTHORIZE);
  target.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
  target.searchParams.set("redirect_uri", callbackUrl(url));
  target.searchParams.set("scope", OAUTH_SCOPES[scope]);
  target.searchParams.set("state", state);
  return new Response(null, {
    status: 302,
    headers: {
      location: target.toString(),
      "set-cookie": cookieHeader(STATE_COOKIE, `${state}.${scope}`, {
        maxAge: STATE_MAX_AGE,
        secure: isSecure(url),
      }),
    },
  });
}

/** GET /api/auth/callback?code&state -> session cookie, then the app. */
export async function handleCallback(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const secure = isSecure(url);
  const fail = (reason: string) =>
    new Response(null, {
      status: 302,
      headers: {
        location: `${url.origin}/?error=${reason}`,
        "set-cookie": clearCookieHeader(STATE_COOKIE, secure),
      },
    });

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const stored = parseCookies(request.headers.get("cookie"))[STATE_COOKIE];
  if (!code || !state || !stored) return fail("auth");
  const [expectedState, scope] = stored.split(".");
  if (state !== expectedState) return fail("state");

  const exchange = await fetch(GITHUB_TOKEN, {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: callbackUrl(url),
    }),
  });
  if (!exchange.ok) return fail("exchange");
  const body = (await exchange.json()) as {
    access_token?: string;
    error?: string;
  };
  if (!body.access_token) return fail(body.error ?? "exchange");

  const sealed = await sealSession(env.SESSION_SECRET, {
    token: body.access_token,
    scope: scope === "private" ? "private" : "public",
  });
  const headers = new Headers({ location: `${url.origin}/` });
  headers.append(
    "set-cookie",
    cookieHeader(SESSION_COOKIE, sealed, { maxAge: SESSION_MAX_AGE, secure }),
  );
  headers.append("set-cookie", clearCookieHeader(STATE_COOKIE, secure));
  return new Response(null, { status: 302, headers });
}

/** POST /api/auth/logout -> revokes the token at GitHub and clears the cookie. */
export async function handleLogout(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const session = await openSession(
    env.SESSION_SECRET,
    parseCookies(request.headers.get("cookie"))[SESSION_COOKIE],
  );
  if (session) {
    // Best effort: a failed revocation still ends the session here.
    await fetch(
      `https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/token`,
      {
        method: "DELETE",
        headers: {
          accept: "application/vnd.github+json",
          authorization: `Basic ${btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`)}`,
          "content-type": "application/json",
          "user-agent": "prismy",
        },
        body: JSON.stringify({ access_token: session.token }),
      },
    ).catch(() => undefined);
  }
  return new Response(null, {
    status: 204,
    headers: { "set-cookie": clearCookieHeader(SESSION_COOKIE, isSecure(url)) },
  });
}
