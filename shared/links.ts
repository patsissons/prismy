import type { TimeWindow } from "./types";

/** YYYY-MM-DD in UTC. */
export function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export interface PrSearchLink {
  author?: string;
  repo?: string;
  /** Filter by merge date within the window. */
  mergedIn?: TimeWindow;
  /** Filter by creation date within the window. */
  createdIn?: TimeWindow;
  state?: "open" | "merged" | "closed";
}

/** A GitHub search URL that lists the PRs behind a number. */
export function githubPrSearchUrl(link: PrSearchLink): string {
  const q = ["is:pr"];
  if (link.author) q.push(`author:${link.author}`);
  if (link.state) q.push(`is:${link.state}`);
  if (link.mergedIn) {
    q.push(
      `merged:${dateOnly(link.mergedIn.from)}..${dateOnly(link.mergedIn.to)}`,
    );
  }
  if (link.createdIn) {
    q.push(
      `created:${dateOnly(link.createdIn.from)}..${dateOnly(link.createdIn.to)}`,
    );
  }
  if (link.repo) {
    const url = new URL(`https://github.com/${link.repo}/pulls`);
    url.searchParams.set("q", q.join(" "));
    return url.toString();
  }
  const url = new URL("https://github.com/search");
  url.searchParams.set("q", q.join(" "));
  url.searchParams.set("type", "pullrequests");
  return url.toString();
}

export function githubRepoUrl(repo: string): string {
  return `https://github.com/${repo}`;
}

export function githubUserUrl(login: string): string {
  return `https://github.com/${login}`;
}
