import { VIEWER_QUERY } from "../shared/github/queries";
import type { Session, Viewer } from "../shared/types";
import type { Env } from "./env";
import {
  SESSION_COOKIE,
  clearCookieHeader,
  openSession,
  parseCookies,
  type SessionPayload,
} from "./session";
import { isSecure } from "./auth";

const GITHUB_GRAPHQL = "https://api.github.com/graphql";
/** Response headers the sync engine reads for its rate-limit handling. */
const PASSTHROUGH_HEADERS = [
  "retry-after",
  "x-ratelimit-limit",
  "x-ratelimit-remaining",
  "x-ratelimit-reset",
  "x-ratelimit-used",
];

export async function sessionFrom(
  request: Request,
  env: Env,
): Promise<SessionPayload | null> {
  return openSession(
    env.SESSION_SECRET,
    parseCookies(request.headers.get("cookie"))[SESSION_COOKIE],
  );
}

/** Browsers send Origin on cross-site and same-site POSTs; require ours. */
export function sameOrigin(request: Request, url: URL): boolean {
  const origin = request.headers.get("origin");
  if (origin) return origin === url.origin;
  return request.headers.get("sec-fetch-site") === "same-origin";
}

export function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...init.headers,
    },
  });
}

function unauthorized(url: URL): Response {
  return json(
    { error: "unauthorized" },
    {
      status: 401,
      headers: {
        "set-cookie": clearCookieHeader(SESSION_COOKIE, isSecure(url)),
      },
    },
  );
}

async function github(token: string, body: string): Promise<Response> {
  return fetch(GITHUB_GRAPHQL, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "user-agent": "prismy",
    },
    body,
  });
}

/** GET /api/me -> the signed-in viewer, or 401 (clearing a dead cookie). */
export async function handleMe(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  const session = await sessionFrom(request, env);
  if (!session) return unauthorized(url);
  const response = await github(
    session.token,
    JSON.stringify({ query: VIEWER_QUERY }),
  );
  if (response.status === 401) return unauthorized(url);
  if (!response.ok) return json({ error: "github" }, { status: 502 });
  const body = (await response.json()) as { data?: { viewer?: Viewer } };
  if (!body.data?.viewer) return unauthorized(url);
  const session_: Session = { viewer: body.data.viewer, scope: session.scope };
  return json(session_, { headers: { "cache-control": "no-store" } });
}

/** POST /api/github/graphql -> GitHub, with the session's token attached. */
export async function handleGraphql(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  if (request.method !== "POST")
    return json({ error: "method" }, { status: 405 });
  if (!sameOrigin(request, url))
    return json({ error: "origin" }, { status: 403 });
  const session = await sessionFrom(request, env);
  if (!session) return unauthorized(url);
  const upstream = await github(session.token, await request.text());
  if (upstream.status === 401) return unauthorized(url);
  const headers = new Headers({
    "content-type": upstream.headers.get("content-type") ?? "application/json",
    "cache-control": "no-store",
  });
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}
