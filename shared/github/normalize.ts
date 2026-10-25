import type {
  PrRecord,
  PrReview,
  ReviewDecision,
  ReviewState,
  SourceKey,
} from "../types";

/** The shape `PR_FIELDS` (queries.ts) returns for one node. */
export interface PrNode {
  id: string;
  number: number;
  title: string;
  url: string;
  isDraft: boolean;
  state: "OPEN" | "MERGED" | "CLOSED";
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  baseRefName: string;
  reviewDecision: ReviewDecision;
  totalCommentsCount: number | null;
  repository: { nameWithOwner: string; isPrivate: boolean };
  author: { login: string; avatarUrl: string } | null;
  mergedBy: { login: string } | null;
  labels: { nodes: ({ name: string } | null)[] | null } | null;
  commits: { totalCount: number } | null;
  reviewThreads: { totalCount: number } | null;
  reviews: {
    totalCount: number;
    nodes:
      | ({
          state: ReviewState;
          submittedAt: string | null;
          author: { login: string } | null;
        } | null)[]
      | null;
  } | null;
}

/** Search results include non-PR nodes (`{}`) when a query matches issues. */
export function isPrNode(node: unknown): node is PrNode {
  return (
    typeof node === "object" &&
    node !== null &&
    typeof (node as PrNode).id === "string" &&
    typeof (node as PrNode).createdAt === "string"
  );
}

export function normalizePr(
  node: PrNode,
  source: SourceKey,
  fetchedAt: string,
): PrRecord {
  const authorLogin = node.author?.login ?? "ghost";
  const reviews: PrReview[] = (node.reviews?.nodes ?? []).flatMap((review) =>
    review
      ? [
          {
            login: review.author?.login ?? "ghost",
            state: review.state,
            submittedAt: review.submittedAt,
          },
        ]
      : [],
  );
  const external = reviews.filter(
    (review) => review.login !== authorLogin && review.state !== "PENDING",
  );
  const reviewerLogins = [...new Set(external.map((review) => review.login))];
  const firstReviewAt =
    external
      .map((review) => review.submittedAt)
      .filter((at): at is string => at !== null)
      .sort()[0] ?? null;
  const reviewTotal = node.reviews?.totalCount ?? reviews.length;

  return {
    id: node.id,
    number: node.number,
    title: node.title,
    url: node.url,
    repo: node.repository.nameWithOwner,
    isPrivate: node.repository.isPrivate,
    authorLogin,
    authorAvatarUrl: node.author?.avatarUrl ?? "",
    state: node.state,
    isDraft: node.isDraft,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
    mergedAt: node.mergedAt,
    closedAt: node.closedAt,
    additions: node.additions,
    deletions: node.deletions,
    changedFiles: node.changedFiles,
    labels: (node.labels?.nodes ?? []).flatMap((label) =>
      label ? [label.name] : [],
    ),
    baseRefName: node.baseRefName,
    mergedBy: node.mergedBy?.login ?? null,
    reviewDecision: node.reviewDecision,
    commitCount: node.commits?.totalCount ?? 0,
    commentCount: node.totalCommentsCount ?? 0,
    reviewThreadCount: node.reviewThreads?.totalCount ?? 0,
    reviews,
    reviewTotal,
    reviewsTruncated: reviewTotal > reviews.length,
    reviewerLogins,
    firstReviewAt,
    sources: [source],
    fetchedAt,
  };
}
