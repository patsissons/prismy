import type { PrNode } from "../github/normalize";
import type { PrRecord } from "../types";

/** A merged PR record with every field set; override what a test needs. */
export function pr(overrides: Partial<PrRecord> = {}): PrRecord {
  const createdAt = overrides.createdAt ?? "2026-09-01T10:00:00.000Z";
  const number = overrides.number ?? 1;
  return {
    id: `PR_${number}`,
    number,
    title: `Change ${number}`,
    url: `https://github.com/acme/app/pull/${number}`,
    repo: "acme/app",
    isPrivate: false,
    authorLogin: "pat",
    authorAvatarUrl: "https://avatars.githubusercontent.com/u/1",
    state: "MERGED",
    isDraft: false,
    createdAt,
    updatedAt: overrides.mergedAt ?? createdAt,
    mergedAt: new Date(Date.parse(createdAt) + 24 * 3_600_000).toISOString(),
    closedAt: null,
    additions: 100,
    deletions: 20,
    changedFiles: 3,
    labels: [],
    baseRefName: "main",
    mergedBy: "pat",
    reviewDecision: "APPROVED",
    commitCount: 2,
    commentCount: 1,
    reviewThreadCount: 1,
    reviews: [],
    reviewTotal: 0,
    reviewsTruncated: false,
    reviewerLogins: [],
    firstReviewAt: null,
    sources: ["authored"],
    fetchedAt: "2026-10-01T00:00:00.000Z",
    ...overrides,
  };
}

/** A GraphQL node as `PR_FIELDS` returns it. */
export function prNode(overrides: Partial<PrNode> = {}): PrNode {
  const number = overrides.number ?? 1;
  return {
    id: `PR_${number}`,
    number,
    title: `Change ${number}`,
    url: `https://github.com/acme/app/pull/${number}`,
    isDraft: false,
    state: "MERGED",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-02T10:00:00.000Z",
    mergedAt: "2026-09-02T10:00:00.000Z",
    closedAt: "2026-09-02T10:00:00.000Z",
    additions: 100,
    deletions: 20,
    changedFiles: 3,
    baseRefName: "main",
    reviewDecision: "APPROVED",
    totalCommentsCount: 1,
    repository: { nameWithOwner: "acme/app", isPrivate: false },
    author: {
      login: "pat",
      avatarUrl: "https://avatars.githubusercontent.com/u/1",
    },
    mergedBy: { login: "pat" },
    labels: { nodes: [{ name: "bug" }] },
    commits: { totalCount: 2 },
    reviewThreads: { totalCount: 1 },
    reviews: {
      totalCount: 2,
      nodes: [
        {
          state: "COMMENTED",
          submittedAt: "2026-09-01T12:00:00.000Z",
          author: { login: "sam" },
        },
        {
          state: "APPROVED",
          submittedAt: "2026-09-02T09:00:00.000Z",
          author: { login: "sam" },
        },
      ],
    },
    ...overrides,
  };
}
