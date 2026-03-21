import type { PullRequestRecord, RepositoryConnection } from "@/lib/types";

import { parseGitHubUrl } from "@/lib/utils";

interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  html_url: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  closed_at: string | null;
  user: {
    login: string;
  };
  additions?: number;
  deletions?: number;
}

const SYNC_LOOKBACK_DAYS = 180;
const GITHUB_PAGE_SIZE = 100;

export async function syncRepository(connection: RepositoryConnection, authToken: string) {
  const parsed = parseGitHubUrl(connection.url);
  if (!parsed) {
    throw new Error("Repository URL must match https://github.com/org/repo.");
  }

  const headers: HeadersInit = {
    Accept: "application/vnd.github+json"
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const syncedPrs: GitHubPullRequest[] = [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - SYNC_LOOKBACK_DAYS);
  cutoff.setHours(0, 0, 0, 0);

  let page = 1;

  while (true) {
    const response = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.name}/pulls?state=all&sort=updated&direction=desc&per_page=${GITHUB_PAGE_SIZE}&page=${page}`,
      { headers }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error("GitHub rejected the token. Verify scopes for repository access.");
      }

      if (response.status === 404) {
        throw new Error("Repository not found or not visible to the provided token.");
      }

      throw new Error(`GitHub sync failed with status ${response.status}.`);
    }

    const pagePrs = (await response.json()) as GitHubPullRequest[];
    syncedPrs.push(...pagePrs);

    if (pagePrs.length < GITHUB_PAGE_SIZE) {
      break;
    }

    const oldestUpdatedAt = pagePrs[pagePrs.length - 1]?.updated_at;
    if (!oldestUpdatedAt || new Date(oldestUpdatedAt) < cutoff) {
      break;
    }

    page += 1;
  }

  return syncedPrs.map(toRecord);
}

function toRecord(pr: GitHubPullRequest): PullRequestRecord {
  const authorName = pr.user.login
    .split(/[-_.]/)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1)}`)
    .join(" ");

  const ageHours =
    pr.merged_at || pr.closed_at
      ? Math.max(1, Math.round((new Date(pr.merged_at ?? pr.closed_at ?? pr.created_at).getTime() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60)))
      : Math.max(2, Math.round((Date.now() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60)));

  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    authorLogin: pr.user.login,
    authorName,
    state: pr.merged_at ? "merged" : pr.draft ? "draft" : pr.state === "open" ? "open" : "closed",
    isDraft: pr.draft,
    createdAt: pr.created_at,
    mergedAt: pr.merged_at,
    closedAt: pr.closed_at,
    htmlUrl: pr.html_url,
    additions: pr.additions ?? ageHours * 12,
    deletions: pr.deletions ?? ageHours * 7,
    reviewPriority: inferPriority(pr.title, ageHours)
  };
}

function inferPriority(title: string, ageHours: number): PullRequestRecord["reviewPriority"] {
  const normalized = title.toLowerCase();

  if (normalized.includes("security") || normalized.includes("hotfix") || ageHours > 120) {
    return "critical";
  }

  if (normalized.includes("feat") || normalized.includes("refactor") || ageHours > 48) {
    return "high";
  }

  return "normal";
}
