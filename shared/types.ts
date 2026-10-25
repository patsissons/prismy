/** Runtime-agnostic types shared by the Worker, the sync engine and the UI. */

export type PrState = "OPEN" | "MERGED" | "CLOSED";

export type ReviewState =
  "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "DISMISSED" | "PENDING";

export type ReviewDecision =
  "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | null;

export interface PrReview {
  login: string;
  state: ReviewState;
  submittedAt: string | null;
}

/** One pull request as stored in IndexedDB. */
export interface PrRecord {
  /** GitHub node id (stable across renames). */
  id: string;
  number: number;
  title: string;
  url: string;
  /** `owner/name` */
  repo: string;
  isPrivate: boolean;
  authorLogin: string;
  authorAvatarUrl: string;
  state: PrState;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  labels: string[];
  baseRefName: string;
  mergedBy: string | null;
  reviewDecision: ReviewDecision;
  commitCount: number;
  commentCount: number;
  reviewThreadCount: number;
  /** The first 10 reviews (GitHub returns them oldest first). */
  reviews: PrReview[];
  reviewTotal: number;
  reviewsTruncated: boolean;
  /** Distinct reviewers other than the author, derived from `reviews`. */
  reviewerLogins: string[];
  /** Earliest non-pending review by someone other than the author. */
  firstReviewAt: string | null;
  /** Which sync sources have seen this PR. */
  sources: SourceKey[];
  fetchedAt: string;
}

/** The user's own PRs across GitHub, or every PR of one repo. */
export type SourceKey = "authored" | `repo:${string}`;

export function repoSource(repo: string): SourceKey {
  return `repo:${repo}`;
}

export type WindowKey = "30d" | "90d" | "180d" | "365d";

export const WINDOW_KEYS: readonly WindowKey[] = ["30d", "90d", "180d", "365d"];

export const WINDOW_DAYS: Record<WindowKey, number> = {
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "365d": 365,
};

export const DEFAULT_WINDOW: WindowKey = "90d";

export function isWindowKey(value: unknown): value is WindowKey {
  return typeof value === "string" && (WINDOW_KEYS as string[]).includes(value);
}

/** A half-open time range [from, to). ISO timestamps. */
export interface TimeWindow {
  from: string;
  to: string;
}

/** A date range of PR creation dates still to fetch (inclusive, YYYY-MM-DD). */
export interface Slice {
  from: string;
  to: string;
  /** Search cursor to resume from inside the slice. */
  cursor: string | null;
  /** Incremental pass: only PRs updated at or after this instant. */
  updatedSince?: string;
  /** Search count once probed, so a resumed run skips the probe. */
  count?: number;
}

export type SyncStatus = "idle" | "syncing" | "done" | "partial" | "error";

export interface SyncState {
  sourceKey: SourceKey;
  /** Oldest creation date (YYYY-MM-DD) the store covers for this source. */
  coveredFrom: string | null;
  lastSyncAt: string | null;
  status: SyncStatus;
  pendingSlices: Slice[];
  /** Sum of search counts for the slices of the last run. */
  expected: number;
  /** PRs written during the last run. */
  loaded: number;
  /** Some PRs were left out (cap or a single day over 1,000 results). */
  truncated: boolean;
  /** Newest-first cap for this source (0 = none). */
  cap: number;
  error: string | null;
}

export interface RateLimit {
  cost: number;
  remaining: number;
  resetAt: string;
}

export type SyncPhase =
  "probing" | "fetching" | "refreshing" | "paused" | "done";

export interface SyncProgress {
  source: SourceKey;
  phase: SyncPhase;
  slicesDone: number;
  slicesTotal: number;
  loaded: number;
  expected: number;
  pointsUsed: number;
  remaining: number | null;
  resetAt: string | null;
  /** When paused for the rate limit: the instant to resume at. */
  resumeAt: string | null;
}

export type OAuthScope = "public" | "private";

export interface Viewer {
  login: string;
  name: string | null;
  avatarUrl: string;
}

/** What GET /api/me returns. */
export interface Session {
  viewer: Viewer;
  scope: OAuthScope;
}
