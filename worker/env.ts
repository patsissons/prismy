/**
 * Worker bindings. Declared by hand (not the generated `Env`) because the
 * secrets are only known to `wrangler types` when `.dev.vars` exists.
 */
export interface Env {
  ASSETS: Fetcher;
  /** Secret: `wrangler secret put GITHUB_CLIENT_ID`. */
  GITHUB_CLIENT_ID: string;
  /** Secret: `wrangler secret put GITHUB_CLIENT_SECRET`. */
  GITHUB_CLIENT_SECRET: string;
  /** Secret: 32+ random bytes, base64. Rotating it signs everyone out. */
  SESSION_SECRET: string;
}
