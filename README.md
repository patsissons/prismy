# PR-ism

PR-ism is a local-first pull request analytics dashboard for GitHub repositories. It lets you connect repositories, sync recent pull request data from the GitHub API, and explore throughput, merge velocity, and review workload from a single browser-based workspace.

## What It Does

- Connect one or more GitHub repositories from the UI
- Sync up to the latest 100 pull requests per repository from the GitHub REST API
- Explore PR activity through overview, team, and history dashboards
- Filter by repository, date range, metric, bucket size, and author
- Persist repository connections and settings in browser `localStorage`
- Persist dashboard filter state in the URL so views are shareable/bookmarkable

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS

## Getting Started

### Requirements

- Node.js 20 or newer
- `pnpm`

### Install

```bash
pnpm install
```

### Run Locally

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
```

## How To Use It

1. Open the **Repositories** page.
2. Add a repository URL like `https://github.com/org/repo`.
3. Optionally add a GitHub personal access token if you need private repo access or higher rate limits.
4. Sync the repository.
5. Review analytics in:
   - **Overview** for KPIs, priority reviews, and status composition
   - **Team** for contribution and merge breakdowns by author
   - **History** for recent PR activity and throughput trends

## Data Model And Storage

- Repository connections, synced PR data, and app settings are stored in browser `localStorage`
- The GitHub token entered in the app is also stored locally in the browser
- Selected dashboard filters are stored in the URL query string
- There is no backend or server-side database in the current implementation

## GitHub Sync Notes

- Sync uses the GitHub REST API from the client
- Public repositories can be queried without a token until rate limits apply
- Private repositories require a token with repository read access
- The current sync fetches up to 100 pull requests per repository request
- Some fields such as additions/deletions may be approximated when the list API does not provide them

## Current Scope

This project is currently focused on a local analytics workspace rather than a production SaaS backend. Settings like alerts are represented in the UI and stored locally, but they are not wired to external delivery systems yet.
