import type { PrRecord, TimeWindow } from "../types";
import {
  CYCLE_BUCKETS,
  SIZE_BUCKETS,
  cycleBucket,
  cycleHours,
  linesChanged,
  mergedIn,
  openedIn,
  sizeBucket,
  type CycleBucket,
  type SizeBucket,
} from "./pr";
import { median } from "./stats";
import { kpis, type Kpis } from "./summary";
import { bucketStart, buckets, priorWindow, type Granularity } from "./window";

export interface PeriodPoint {
  start: string;
  label: string;
  opened: number;
  merged: number;
  additions: number;
  deletions: number;
}

/** One week or day with merged counts per repo series (top repos + "Other"). */
export type StackedPeriodPoint = { start: string; label: string } & Record<
  string,
  number | string
>;

export interface RepoRow {
  repo: string;
  isPrivate: boolean;
  merged: number;
  opened: number;
  lines: number;
  medianCycleHours: number | null;
  /** Percent of the user's merged PRs in the window. */
  share: number;
}

export interface LaunchpadSummary {
  window: TimeWindow;
  prior: TimeWindow;
  kpis: Kpis;
  priorKpis: Kpis;
  activity: Record<Granularity, PeriodPoint[]>;
  mergedByRepo: {
    series: string[];
    points: Record<Granularity, StackedPeriodPoint[]>;
  };
  cycleHistogram: { bucket: CycleBucket; count: number }[];
  sizeDistribution: { bucket: SizeBucket; count: number }[];
  repos: RepoRow[];
  longestOpen: PrRecord[];
  recent: PrRecord[];
}

export const OTHER_SERIES = "Other";
/** Categorical slots available for repo series (8 minus one for Other). */
export const MAX_REPO_SERIES = 7;

export function launchpadSummary(
  all: readonly PrRecord[],
  login: string,
  window: TimeWindow,
): LaunchpadSummary {
  const prs = all.filter((pr) => pr.authorLogin === login);
  const prior = priorWindow(window);
  const merged = prs.filter((pr) => mergedIn(pr, window));
  const repos = repoRows(prs, window);
  const topRepos = repos.slice(0, MAX_REPO_SERIES).map((row) => row.repo);
  const series =
    repos.length > MAX_REPO_SERIES ? [...topRepos, OTHER_SERIES] : topRepos;

  return {
    window,
    prior,
    kpis: kpis(prs, window),
    priorKpis: kpis(prs, prior),
    activity: {
      week: activity(prs, window, "week"),
      day: activity(prs, window, "day"),
    },
    mergedByRepo: {
      series,
      points: {
        week: mergedByRepo(merged, window, series, "week"),
        day: mergedByRepo(merged, window, series, "day"),
      },
    },
    cycleHistogram: CYCLE_BUCKETS.map(({ key }) => ({
      bucket: key,
      count: merged.filter((pr) => cycleBucket(cycleHours(pr)!) === key).length,
    })),
    sizeDistribution: SIZE_BUCKETS.map((bucket) => ({
      bucket,
      count: merged.filter((pr) => sizeBucket(linesChanged(pr)) === bucket)
        .length,
    })),
    repos,
    longestOpen: prs
      .filter((pr) => pr.state === "OPEN")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, 5),
    recent: prs
      .filter((pr) => openedIn(pr, window) || mergedIn(pr, window))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 25),
  };
}

export function activity(
  prs: readonly PrRecord[],
  window: TimeWindow,
  granularity: Granularity,
): PeriodPoint[] {
  const points = new Map<string, PeriodPoint>(
    buckets(window, granularity).map((bucket) => [
      bucket.start,
      { ...bucket, opened: 0, merged: 0, additions: 0, deletions: 0 },
    ]),
  );
  for (const pr of prs) {
    if (openedIn(pr, window)) {
      const point = points.get(bucketStart(pr.createdAt, granularity));
      if (point) point.opened += 1;
    }
    if (mergedIn(pr, window)) {
      const point = points.get(bucketStart(pr.mergedAt!, granularity));
      if (point) {
        point.merged += 1;
        point.additions += pr.additions;
        point.deletions += pr.deletions;
      }
    }
  }
  return [...points.values()];
}

function mergedByRepo(
  merged: readonly PrRecord[],
  window: TimeWindow,
  series: readonly string[],
  granularity: Granularity,
): StackedPeriodPoint[] {
  const points = new Map<string, StackedPeriodPoint>(
    buckets(window, granularity).map((bucket) => [
      bucket.start,
      Object.assign(
        { ...bucket },
        Object.fromEntries(series.map((s) => [s, 0])),
      ),
    ]),
  );
  for (const pr of merged) {
    const point = points.get(bucketStart(pr.mergedAt!, granularity));
    if (!point) continue;
    const key = series.includes(pr.repo) ? pr.repo : OTHER_SERIES;
    if (key in point) point[key] = (point[key] as number) + 1;
  }
  return [...points.values()];
}

export function repoRows(
  prs: readonly PrRecord[],
  window: TimeWindow,
): RepoRow[] {
  const byRepo = new Map<string, PrRecord[]>();
  for (const pr of prs) {
    if (!openedIn(pr, window) && !mergedIn(pr, window)) continue;
    byRepo.set(pr.repo, [...(byRepo.get(pr.repo) ?? []), pr]);
  }
  const totalMerged = prs.filter((pr) => mergedIn(pr, window)).length;
  return [...byRepo.entries()]
    .map(([repo, repoPrs]) => {
      const merged = repoPrs.filter((pr) => mergedIn(pr, window));
      return {
        repo,
        isPrivate: repoPrs[0]!.isPrivate,
        merged: merged.length,
        opened: repoPrs.filter((pr) => openedIn(pr, window)).length,
        lines: merged.reduce((total, pr) => total + linesChanged(pr), 0),
        medianCycleHours: median(merged.map((pr) => cycleHours(pr)!)),
        share: totalMerged ? (merged.length / totalMerged) * 100 : 0,
      };
    })
    .sort(
      (a, b) =>
        b.merged - a.merged ||
        b.opened - a.opened ||
        a.repo.localeCompare(b.repo),
    );
}
