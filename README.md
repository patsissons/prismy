# Prismy

Prismy shows your impact through GitHub pull requests, served at
<https://prismy.lgtm.page>. Sign in with GitHub and it gathers your pull
requests across every repository you contribute to, then turns them into
throughput, code volume and cycle time with the trend against the prior
period. Focus one repository to see how you compare with its other
contributors.

## How it works

- **Sign in** is GitHub's OAuth web flow, completed by the Cloudflare Worker
  (`worker/auth.ts`). You choose public-only (`read:user`) or private
  (`read:user repo`) access. The token is sealed with AES-GCM into an
  HttpOnly cookie (`worker/session.ts`); the browser never sees it, and
  signing out revokes it at GitHub.
- **GitHub calls** go through `POST /api/github/graphql`, which attaches the
  token and passes GitHub's rate-limit headers back (`worker/github.ts`).
  The Worker keeps no state: no KV, no database.
- **Sync** (`shared/sync/engine.ts`) searches `is:pr author:you` (the
  Launchpad) or `is:pr repo:owner/name` (repo focus) over the selected
  window, newest first. Searches are sliced by creation date so each stays
  under GitHub's 1,000-result limit; every page is written through to
  IndexedDB (`src/db`, one database per login) so an interrupted sync
  resumes. Later runs fetch only pull requests updated since the last one,
  and widening the window fetches only the older range. Repo focus caps at
  3,000 newest pull requests (load more in steps of 1,000, up to 10,000);
  because loading is newest-first the cap shortens the window equally for
  everyone, which keeps comparisons fair, and the page says so.
- **Metrics** (`shared/metrics`) are pure functions over the stored records:
  counts and merge rate, weekly series, cycle time quartiles and histogram,
  size distribution, per-repo and per-contributor rows, rank and percentile.
- **Charts** follow one set of rules: thin marks, hairline grid, a legend for
  two or more series, tooltips everywhere, and a table view for every chart.
  Chart colours are tokens in `src/index.css`; the categorical palette is
  validated for colour-vision deficiency in both themes.

## Setup

```bash
pnpm install
cp .dev.vars.example .dev.vars   # then fill it in
pnpm dev                          # http://localhost:5173
```

Local sign-in needs a GitHub OAuth app (Settings → Developer settings →
OAuth Apps) with callback URL `http://localhost:5173/api/auth/callback`. Put
its client id and secret in `.dev.vars` with a random `SESSION_SECRET`
(`openssl rand -base64 32`).

## Scripts

| Script                                            | What it does                                                 |
| ------------------------------------------------- | ------------------------------------------------------------ |
| `pnpm dev`                                        | Vite dev server with the Worker running in workerd           |
| `pnpm build`                                      | Production build to `dist/`                                  |
| `pnpm deploy`                                     | Build and `wrangler deploy`                                  |
| `pnpm test` / `pnpm test:watch`                   | Unit tests (Vitest): `shared/`, `worker/`, `src/`            |
| `pnpm test:e2e`                                   | Playwright against the dev server (GitHub stubbed)           |
| `pnpm typecheck`                                  | `wrangler types` then `tsc -b` across the three projects     |
| `pnpm lint` / `pnpm format` / `pnpm format:check` | ESLint / Prettier                                            |
| `pnpm validate:quick`                             | format check + typecheck + lint + unit tests                 |
| `pnpm validate`                                   | `validate:quick` + e2e (CI)                                  |
| `pnpm format-and-validate`                        | format, then `validate`                                      |
| `pnpm og`                                         | Regenerate `public/og.png` and `public/apple-touch-icon.png` |

## Deploying

CI (`.github/workflows/ci.yml`) validates every push and PR and deploys
`main` to Cloudflare. Each PR also gets a Workers preview
(`.github/workflows/preview.yml`). Repository secrets: `CLOUDFLARE_API_TOKEN`,
`CLOUDFLARE_ACCOUNT_ID`.

Worker configuration is `wrangler.jsonc`. The production OAuth app's client
id is the `GITHUB_CLIENT_ID` var there; its secret and the session key are
Worker secrets:

```bash
pnpm exec wrangler secret put GITHUB_CLIENT_SECRET
pnpm exec wrangler secret put SESSION_SECRET
```

The production OAuth app's callback URL is
`https://prismy.lgtm.page/api/auth/callback`.

## Stack

React 19, Vite, Tailwind v4, shadcn/ui (charts on Recharts), react-router,
Dexie; one Cloudflare Worker serving the SPA as static assets plus the
`/api` routes; Vitest, Playwright (desktop Chrome and mobile Safari), ESLint,
Prettier.
