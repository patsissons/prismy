import type { Page } from "@playwright/test";
import type { PrNode } from "../shared/github/normalize";
import type { Session } from "../shared/types";

export const VIEWER: Session = {
  viewer: {
    login: "pat",
    name: "Pat",
    avatarUrl: "data:image/gif;base64,R0lGODlhAQABAAAAACw=",
  },
  scope: "public",
};

const DAY = 86_400_000;
const REPOS = ["acme/app", "acme/web", "acme/infra"];
const OTHERS = ["sam", "kim", "lee"];

/** Deterministic PRs over the last 120 days: 60 by the viewer, 60 by others in acme/app. */
export function makePrs(now = Date.now()): PrNode[] {
  const nodes: PrNode[] = [];
  let number = 1;
  const push = (
    author: string,
    repo: string,
    daysAgo: number,
    merged: boolean,
    lines: number,
  ) => {
    const createdAt = new Date(now - daysAgo * DAY).toISOString();
    const mergedAt = merged
      ? new Date(
          now - daysAgo * DAY + 20 * 3_600_000 * (1 + (number % 3)),
        ).toISOString()
      : null;
    nodes.push({
      id: `PR_${number}`,
      number,
      title: `${repo.split("/")[1]} change ${number}`,
      url: `https://github.com/${repo}/pull/${number}`,
      isDraft: false,
      state: merged ? "MERGED" : "OPEN",
      createdAt,
      updatedAt: mergedAt ?? createdAt,
      mergedAt,
      closedAt: mergedAt,
      additions: lines,
      deletions: Math.round(lines / 4),
      changedFiles: 1 + (number % 5),
      baseRefName: "main",
      reviewDecision: merged ? "APPROVED" : "REVIEW_REQUIRED",
      totalCommentsCount: 1,
      repository: { nameWithOwner: repo, isPrivate: repo === "acme/infra" },
      author: { login: author, avatarUrl: VIEWER.viewer.avatarUrl },
      mergedBy: merged ? { login: author } : null,
      labels: { nodes: [] },
      commits: { totalCount: 2 },
      reviewThreads: { totalCount: 0 },
      reviews: { totalCount: 0, nodes: [] },
    });
    number += 1;
  };
  for (let index = 0; index < 60; index += 1) {
    push(
      "pat",
      REPOS[index % 3]!,
      1 + index * 2,
      index % 10 !== 9,
      20 + index * 7,
    );
  }
  for (let index = 0; index < 60; index += 1) {
    push(
      OTHERS[index % 3]!,
      "acme/app",
      1 + index * 2,
      index % 8 !== 7,
      10 + index * 3,
    );
  }
  return nodes;
}

/** Signed in as the fixture viewer. */
export async function stubSession(
  page: Page,
  session: Session | null = VIEWER,
) {
  await page.route(
    (url) => url.pathname === "/api/me",
    (route) =>
      session
        ? route.fulfill({ json: session })
        : route.fulfill({ status: 401, json: { error: "unauthorized" } }),
  );
  await page.route(
    (url) => url.pathname === "/api/auth/logout",
    (route) => route.fulfill({ status: 204 }),
  );
}

/**
 * Serves GitHub GraphQL from the fixture PRs: counts, pages and refreshes.
 * `acme/big` always reports 1,100 results so the engine bisects to single
 * days and flags them truncated.
 */
export async function stubGraphql(page: Page, nodes: PrNode[] = makePrs()) {
  const rateLimit = {
    cost: 1,
    remaining: 4500,
    resetAt: new Date(Date.now() + 3_600_000).toISOString(),
  };
  const matching = (q: string) => {
    const created = /created:(\S+)\.\.(\S+)/.exec(q)!;
    const updated = /updated:>=(\S+)/.exec(q);
    const author = /author:(\S+)/.exec(q)?.[1];
    const repo = /repo:(\S+)/.exec(q)?.[1];
    return nodes
      .filter((node) => node.createdAt.slice(0, 10) >= created[1]!)
      .filter((node) => node.createdAt.slice(0, 10) <= created[2]!)
      .filter((node) => !updated || node.updatedAt >= updated[1]!)
      .filter((node) => !author || node.author?.login === author)
      .filter((node) => !repo || node.repository.nameWithOwner === repo)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  };
  await page.route(
    (url) => url.pathname === "/api/github/graphql",
    (route) => {
      const { query, variables } = route.request().postDataJSON() as {
        query: string;
        variables: Record<string, unknown>;
      };
      const q = (variables.q as string | undefined) ?? "";
      const big = q.includes("repo:acme/big");
      if (query.includes("query SearchCount")) {
        return route.fulfill({
          json: {
            data: {
              search: { issueCount: big ? 1100 : matching(q).length },
              rateLimit,
            },
          },
        });
      }
      if (query.includes("query SearchPRs")) {
        if (big) {
          const day = /created:(\S+)\.\./.exec(q)![1]!;
          const created = `${day}T09:00:00.000Z`;
          const page = [0, 1].map((i) => ({
            ...nodes[i]!,
            id: `BIG_${day}_${i}`,
            number: 9000 + i,
            createdAt: created,
            updatedAt: created,
            mergedAt: created,
            closedAt: created,
            repository: { nameWithOwner: "acme/big", isPrivate: false },
          }));
          return route.fulfill({
            json: {
              data: {
                search: {
                  issueCount: 1100,
                  pageInfo: { hasNextPage: false, endCursor: "2" },
                  nodes: page,
                },
                rateLimit,
              },
            },
          });
        }
        const all = matching(q);
        const start = variables.after ? Number(variables.after) : 0;
        const first = variables.first as number;
        const slice = all.slice(start, start + first);
        const end = start + slice.length;
        return route.fulfill({
          json: {
            data: {
              search: {
                issueCount: all.length,
                pageInfo: {
                  hasNextPage: end < all.length,
                  endCursor: String(end),
                },
                nodes: slice,
              },
              rateLimit,
            },
          },
        });
      }
      if (query.includes("query PRsByIds")) {
        const ids = variables.ids as string[];
        return route.fulfill({
          json: {
            data: {
              nodes: ids.map(
                (id) => nodes.find((node) => node.id === id) ?? null,
              ),
              rateLimit,
            },
          },
        });
      }
      return route.fulfill({
        status: 400,
        json: { errors: [{ message: "unexpected query" }] },
      });
    },
  );
}

/** Signed in with GitHub stubbed: the usual starting point. */
export async function stubApp(page: Page) {
  await stubSession(page);
  await stubGraphql(page);
}
