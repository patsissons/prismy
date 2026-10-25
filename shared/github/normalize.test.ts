import { describe, expect, it } from "vitest";
import { prNode } from "../testing/fixtures";
import { isPrNode, normalizePr } from "./normalize";

describe("normalizePr", () => {
  it("flattens a node and derives review facts", () => {
    const record = normalizePr(
      prNode(),
      "authored",
      "2026-10-01T00:00:00.000Z",
    );
    expect(record).toMatchObject({
      id: "PR_1",
      repo: "acme/app",
      authorLogin: "pat",
      labels: ["bug"],
      commitCount: 2,
      commentCount: 1,
      reviewThreadCount: 1,
      reviewTotal: 2,
      reviewsTruncated: false,
      reviewerLogins: ["sam"],
      firstReviewAt: "2026-09-01T12:00:00.000Z",
      sources: ["authored"],
      fetchedAt: "2026-10-01T00:00:00.000Z",
    });
  });

  it("ignores the author's own and pending reviews for first-review time", () => {
    const record = normalizePr(
      prNode({
        reviews: {
          totalCount: 12,
          nodes: [
            {
              state: "COMMENTED",
              submittedAt: "2026-09-01T11:00:00.000Z",
              author: { login: "pat" },
            },
            { state: "PENDING", submittedAt: null, author: { login: "kim" } },
            {
              state: "APPROVED",
              submittedAt: "2026-09-03T00:00:00.000Z",
              author: { login: "kim" },
            },
          ],
        },
      }),
      "repo:acme/app",
      "2026-10-01T00:00:00.000Z",
    );
    expect(record.firstReviewAt).toBe("2026-09-03T00:00:00.000Z");
    expect(record.reviewerLogins).toEqual(["kim"]);
    expect(record.reviewsTruncated).toBe(true);
  });

  it("tolerates deleted users and missing connections", () => {
    const record = normalizePr(
      prNode({
        author: null,
        mergedBy: null,
        labels: null,
        reviews: null,
        commits: null,
      }),
      "authored",
      "2026-10-01T00:00:00.000Z",
    );
    expect(record.authorLogin).toBe("ghost");
    expect(record.mergedBy).toBeNull();
    expect(record.labels).toEqual([]);
    expect(record.reviews).toEqual([]);
    expect(record.commitCount).toBe(0);
  });
});

describe("isPrNode", () => {
  it("rejects the empty objects search returns for non-PR matches", () => {
    expect(isPrNode({})).toBe(false);
    expect(isPrNode(null)).toBe(false);
    expect(isPrNode(prNode())).toBe(true);
  });
});
