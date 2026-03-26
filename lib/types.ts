export type MetricKey = "created" | "merged" | "duration";
export type RangePreset = "7d" | "30d" | "90d" | "180d";
export type BucketSize = "day" | "week" | "month";
export type PullRequestState = "open" | "merged" | "draft" | "closed";

export interface PullRequestRecord {
  id: number;
  number: number;
  title: string;
  authorLogin: string;
  authorName: string;
  state: PullRequestState;
  isDraft: boolean;
  createdAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  htmlUrl: string;
  additions: number;
  deletions: number;
  reviewPriority: "critical" | "high" | "normal";
}

export interface RepositoryConnection {
  id: string;
  owner: string;
  name: string;
  url: string;
  addedAt: string;
  lastSyncedAt: string | null;
  pullRequests: PullRequestRecord[];
  syncStatus: "idle" | "syncing" | "error";
  syncError: string | null;
}

export interface AppSettings {
  authToken: string;
  defaultRange: RangePreset;
  alerts: {
    weeklyDigest: boolean;
    slackIntegration: boolean;
    syncFailures: boolean;
  };
}

export interface UserSummary {
  login: string;
  name: string;
  color: string;
  created: number;
  merged: number;
  averageDurationHours: number;
  openCount: number;
}

export interface BucketSeriesDatum {
  bucketKey: string;
  bucketLabel: string;
  totals: Record<string, number>;
  totalValue: number;
}

export interface DashboardFilters {
  repoId: string | null;
  range: RangePreset;
  metric: MetricKey;
  bucket: BucketSize;
  users: string[];
  offset: number;
}
