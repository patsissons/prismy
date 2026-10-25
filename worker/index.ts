import { handleCallback, handleLogin, handleLogout } from "./auth";
import type { Env } from "./env";
import { handleGraphql, handleMe, json, sameOrigin } from "./github";

export async function handleApi(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response> {
  switch (url.pathname) {
    case "/api/health":
      return new Response("ok", { headers: { "cache-control": "no-store" } });
    case "/api/auth/login":
      return handleLogin(env, url);
    case "/api/auth/callback":
      return handleCallback(request, env, url);
    case "/api/auth/logout":
      if (request.method !== "POST")
        return json({ error: "method" }, { status: 405 });
      if (!sameOrigin(request, url))
        return json({ error: "origin" }, { status: 403 });
      return handleLogout(request, env, url);
    case "/api/me":
      return handleMe(request, env, url);
    case "/api/github/graphql":
      return handleGraphql(request, env, url);
    default:
      return json({ error: "not found" }, { status: 404 });
  }
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env, url);
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
