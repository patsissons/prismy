import type { PrRecord, TimeWindow } from "../types";
import { cycleHours, linesChanged, mergedIn, openedIn } from "./pr";
import { median, percentile, percentileRank } from "./stats";
import { kpis, type Kpis } from "./summary";
import { priorWindow, weekBuckets, weekStart } from "./window";

export interface ContributorRow {
  login: string;
  avatarUrl: string;
  merged: number;
  opened: number;
  lines: number;
  medianCycleHours: number | null;
  /** Percent of the repo's merged PRs in the window. */
  share: number;
  isViewer: boolean;
}

export interface RankInfo {
  /** 1 = best; null when the viewer has no value. */
  rank: number | null;
  /** Contributors with a value. */
  count: number;
  /** 0..100, share of contributors the viewer ties or beats. */
  percentile: number | null;
  /** The median contributor's value. */
  median: number | null;
}

export interface Quartiles {
  p25: number;
  median: number;
  p75: number;
  count: number;
}

export interface RepoWeekPoint {
  start: string;
  label: string;
  repoMerged: number;
  youMerged: number;
}

export interface RepoSummary {
  repo: string;
  window: TimeWindow;
  prior: TimeWindow;
  you: Kpis;
  priorYou: Kpis;
  everyone: Kpis;
  contributors: ContributorRow[];
  ranks: { merged: RankInfo; lines: RankInfo; cycle: RankInfo };
  /** Your percent of the repo's merged PRs; null when none were merged. */
  share: number | null;
  weekly: RepoWeekPoint[];
  cycle: { you: Quartiles | null; others: Quartiles | null };
}

export function repoSummary(
  all: readonly PrRecord[],
  repo: string,
  login: string,
  window: TimeWindow,
): RepoSummary {
  const prs = all.filter((pr) => pr.repo === repo);
  const yours = prs.filter((pr) => pr.authorLogin === login);
  const prior = priorWindow(window);
  const contributors = contributorRows(prs, login, window);
  const repoMerged = prs.filter((pr) => mergedIn(pr, window));
  const youMerged = yours.filter((pr) => mergedIn(pr, window));

  return {
    repo,
    window,
    prior,
    you: kpis(yours, window),
    priorYou: kpis(yours, prior),
    everyone: kpis(prs, window),
    contributors,
    ranks: {
      merged: rank(contributors, login, (row) => row.merged || null, "desc"),
      lines: rank(contributors, login, (row) => row.lines || null, "desc"),
      cycle: rank(contributors, login, (row) => row.medianCycleHours, "asc"),
    },
    share: repoMerged.length
      ? (youMerged.length / repoMerged.length) * 100
      : null,
    weekly: weekly(prs, login, window),
    cycle: {
      you: quartiles(youMerged.map((pr) => cycleHours(pr)!)),
      others: quartiles(
        repoMerged
          .filter((pr) => pr.authorLogin !== login)
          .map((pr) => cycleHours(pr)!),
      ),
    },
  };
}

export function contributorRows(
  prs: readonly PrRecord[],
  login: string,
  window: TimeWindow,
): ContributorRow[] {
  const byAuthor = new Map<string, PrRecord[]>();
  for (const pr of prs) {
    if (!openedIn(pr, window) && !mergedIn(pr, window)) continue;
    byAuthor.set(pr.authorLogin, [...(byAuthor.get(pr.authorLogin) ?? []), pr]);
  }
  const totalMerged = prs.filter((pr) => mergedIn(pr, window)).length;
  return [...byAuthor.entries()]
    .map(([author, authorPrs]) => {
      const merged = authorPrs.filter((pr) => mergedIn(pr, window));
      return {
        login: author,
        avatarUrl: authorPrs[0]!.authorAvatarUrl,
        merged: merged.length,
        opened: authorPrs.filter((pr) => openedIn(pr, window)).length,
        lines: merged.reduce((total, pr) => total + linesChanged(pr), 0),
        medianCycleHours: median(merged.map((pr) => cycleHours(pr)!)),
        share: totalMerged ? (merged.length / totalMerged) * 100 : 0,
        isViewer: author === login,
      };
    })
    .sort(
      (a, b) =>
        b.merged - a.merged ||
        b.opened - a.opened ||
        a.login.localeCompare(b.login),
    );
}

/** Competition ranking ("1224") of the viewer among contributors with a value. */
export function rank(
  rows: readonly ContributorRow[],
  login: string,
  value: (row: ContributorRow) => number | null,
  direction: "asc" | "desc",
): RankInfo {
  const scored = rows
    .map((row) => ({ login: row.login, value: value(row) }))
    .filter(
      (row): row is { login: string; value: number } => row.value !== null,
    );
  const yours = scored.find((row) => row.login === login)?.value ?? null;
  const better = (a: number, b: number) =>
    direction === "desc" ? a > b : a < b;
  const position =
    yours === null
      ? null
      : 1 + scored.filter((row) => better(row.value, yours)).length;
  return {
    rank: position,
    count: scored.length,
    percentile:
      position === null ? null : percentileRank(position, scored.length),
    median: median(scored.map((row) => row.value)),
  };
}

function weekly(
  prs: readonly PrRecord[],
  login: string,
  window: TimeWindow,
): RepoWeekPoint[] {
  const points = new Map<string, RepoWeekPoint>(
    weekBuckets(window).map((bucket) => [
      bucket.start,
      { ...bucket, repoMerged: 0, youMerged: 0 },
    ]),
  );
  for (const pr of prs) {
    if (!mergedIn(pr, window)) continue;
    const point = points.get(weekStart(pr.mergedAt!));
    if (!point) continue;
    point.repoMerged += 1;
    if (pr.authorLogin === login) point.youMerged += 1;
  }
  return [...points.values()];
}

export function quartiles(values: readonly number[]): Quartiles | null {
  if (!values.length) return null;
  return {
    p25: percentile(values, 0.25)!,
    median: percentile(values, 0.5)!,
    p75: percentile(values, 0.75)!,
    count: values.length,
  };
}
