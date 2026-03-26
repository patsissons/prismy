import type {
  BucketSeriesDatum,
  BucketSize,
  MetricKey,
  PullRequestRecord,
  RangePreset,
  RepositoryConnection,
  UserSummary
} from "@/lib/types";

const USER_COLORS = ["rgb(116 177 255)", "rgb(211 132 242)", "rgb(255 177 75)", "rgb(123 214 162)", "rgb(255 120 108)"];

export function getVisibleWindow(range: RangePreset, offset: number = 0) {
  const days = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "180d": 180
  }[range];

  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  if (offset !== 0) {
    const shift = offset * days;
    start.setDate(start.getDate() + shift);
    end.setDate(end.getDate() + shift);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
}

export function getRepositoryRecords(repository: RepositoryConnection | undefined) {
  return repository?.pullRequests ?? [];
}

export function getAvailableUsers(records: PullRequestRecord[]) {
  return Array.from(
    new Map(records.map((record) => [record.authorLogin, { login: record.authorLogin, name: record.authorName }])).values()
  ).map((user, index) => ({
    ...user,
    color: USER_COLORS[index % USER_COLORS.length]
  }));
}

export function filterRecords(records: PullRequestRecord[], range: RangePreset, selectedUsers: string[], offset: number = 0) {
  const { start, end } = getVisibleWindow(range, offset);

  return records.filter((record) => {
    const createdAt = new Date(record.createdAt);
    const mergedAt = record.mergedAt ? new Date(record.mergedAt) : null;
    const withinWindow =
      (createdAt >= start && createdAt <= end) ||
      (mergedAt !== null && mergedAt >= start && mergedAt <= end) ||
      (createdAt <= end && (record.state === "open" || record.state === "draft"));
    const includedUser = !selectedUsers.length || selectedUsers.includes(record.authorLogin);
    return withinWindow && includedUser;
  });
}

export function buildStackedSeries(
  records: PullRequestRecord[],
  metric: MetricKey,
  bucketSize: BucketSize,
  users: { login: string; name: string; color: string }[],
  range: RangePreset,
  offset: number = 0
) {
  const { start, end } = getVisibleWindow(range, offset);
  const buckets = buildBuckets(start, end, bucketSize);
  const bucketMap = new Map(
    buckets.map((bucket) => [
      bucket.bucketKey,
      {
        ...bucket,
        totals: Object.fromEntries(users.map((user) => [user.login, 0])),
        totalValue: 0
      }
    ])
  );

  for (const record of records) {
    const date = metric === "merged" || metric === "duration" ? record.mergedAt : record.createdAt;
    if (!date) {
      continue;
    }

    const bucketKey = getBucketKey(new Date(date), bucketSize);
    const bucket = bucketMap.get(bucketKey);
    if (!bucket) {
      continue;
    }

    const value =
      metric === "created"
        ? 1
        : metric === "merged"
          ? 1
          : Math.max(1, (new Date(record.mergedAt ?? record.createdAt).getTime() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60));

    bucket.totals[record.authorLogin] = (bucket.totals[record.authorLogin] ?? 0) + value;
    bucket.totalValue += value;
  }

  return Array.from(bucketMap.values());
}

export function summarizeUsers(records: PullRequestRecord[], users: { login: string; name: string; color: string }[]): UserSummary[] {
  return users
    .map((user) => {
      const userRecords = records.filter((record) => record.authorLogin === user.login);
      const merged = userRecords.filter((record) => record.mergedAt);
      const averageDurationHours =
        merged.reduce((total, record) => total + getDurationHours(record), 0) / Math.max(merged.length, 1);

      return {
        login: user.login,
        name: user.name,
        color: user.color,
        created: userRecords.length,
        merged: merged.length,
        averageDurationHours,
        openCount: userRecords.filter((record) => record.state === "open" || record.state === "draft").length
      };
    })
    .sort((a, b) => b.created - a.created);
}

export function summarizeKpis(records: PullRequestRecord[]) {
  const merged = records.filter((record) => record.mergedAt);
  const averageDurationHours =
    merged.reduce((total, record) => total + getDurationHours(record), 0) / Math.max(merged.length, 1);

  return {
    totalPrs: records.length,
    mergedPrs: merged.length,
    averageDurationHours,
    mergeRate: records.length ? (merged.length / records.length) * 100 : 0
  };
}

export function getPriorityReviews(records: PullRequestRecord[]) {
  return records
    .filter((record) => record.state === "open" || record.state === "draft")
    .sort((a, b) => priorityValue(b.reviewPriority) - priorityValue(a.reviewPriority) || Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .slice(0, 6);
}

export function getStatusComposition(records: PullRequestRecord[]) {
  const total = Math.max(records.length, 1);
  const counts = {
    inReview: records.filter((record) => record.state === "open").length,
    draft: records.filter((record) => record.state === "draft").length,
    merged: records.filter((record) => record.state === "merged").length
  };

  return {
    inReview: Math.round((counts.inReview / total) * 100),
    draft: Math.round((counts.draft / total) * 100),
    merged: Math.round((counts.merged / total) * 100)
  };
}

export function buildActivityFeed(records: PullRequestRecord[]) {
  return records
    .slice()
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, 12);
}

function buildBuckets(start: Date, end: Date, bucketSize: BucketSize): BucketSeriesDatum[] {
  const buckets: BucketSeriesDatum[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    buckets.push({
      bucketKey: getBucketKey(cursor, bucketSize),
      bucketLabel: formatBucketLabel(cursor, bucketSize),
      totals: {},
      totalValue: 0
    });

    if (bucketSize === "day") {
      cursor.setDate(cursor.getDate() + 1);
    } else if (bucketSize === "week") {
      cursor.setDate(cursor.getDate() + 7);
    } else {
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return dedupeBuckets(buckets);
}

function dedupeBuckets(buckets: BucketSeriesDatum[]) {
  return Array.from(new Map(buckets.map((bucket) => [bucket.bucketKey, bucket])).values());
}

function getBucketKey(date: Date, bucketSize: BucketSize) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  if (bucketSize === "day") {
    return `${year}-${month}-${day}`;
  }

  if (bucketSize === "week") {
    const copy = new Date(date);
    const dayIndex = copy.getDay();
    const diff = (dayIndex + 6) % 7;
    copy.setDate(copy.getDate() - diff);
    return `${copy.getFullYear()}-W${getWeekNumber(copy)}`;
  }

  return `${year}-${month}`;
}

function formatBucketLabel(date: Date, bucketSize: BucketSize) {
  if (bucketSize === "day") {
    return ["U", "M", "T", "W", "R", "F", "S"][date.getDay()];
  }

  if (bucketSize === "week") {
    return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
  }

  return new Intl.DateTimeFormat("en", { month: "short" }).format(date).toUpperCase();
}

function getWeekNumber(date: Date) {
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  temp.setUTCDate(temp.getUTCDate() + 4 - (temp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(), 0, 1));
  return Math.ceil((((temp.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDurationHours(record: PullRequestRecord) {
  const end = record.mergedAt ?? record.closedAt ?? record.createdAt;
  return Math.max(1, (new Date(end).getTime() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60));
}

function priorityValue(priority: PullRequestRecord["reviewPriority"]) {
  return {
    critical: 3,
    high: 2,
    normal: 1
  }[priority];
}
