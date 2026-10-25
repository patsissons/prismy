import type { PrRecord, TimeWindow } from "../types";
import {
  cycleHours,
  declinedIn,
  firstReviewHours,
  linesChanged,
  mergedIn,
  openedIn,
} from "./pr";
import { median, percentile, sum } from "./stats";

/** Headline numbers for a set of PRs inside a window. */
export interface Kpis {
  /** Merged inside the window. */
  merged: number;
  /** Opened inside the window. */
  opened: number;
  /** Closed without merging inside the window. */
  declined: number;
  /** merged / (merged + declined), percent; null when nothing was resolved. */
  mergeRate: number | null;
  medianCycleHours: number | null;
  p75CycleHours: number | null;
  medianFirstReviewHours: number | null;
  /** Over PRs merged in the window. */
  additions: number;
  deletions: number;
  lines: number;
  changedFiles: number;
  medianLines: number | null;
  /** Open right now (any age); drafts counted separately too. */
  openNow: number;
  draftNow: number;
}

export function kpis(prs: readonly PrRecord[], window: TimeWindow): Kpis {
  const merged = prs.filter((pr) => mergedIn(pr, window));
  const opened = prs.filter((pr) => openedIn(pr, window));
  const declined = prs.filter((pr) => declinedIn(pr, window));
  const cycles = merged.map((pr) => cycleHours(pr)!).filter(Number.isFinite);
  const reviews = opened
    .map(firstReviewHours)
    .filter((hours): hours is number => hours !== null);
  const open = prs.filter((pr) => pr.state === "OPEN");
  const resolved = merged.length + declined.length;

  return {
    merged: merged.length,
    opened: opened.length,
    declined: declined.length,
    mergeRate: resolved ? (merged.length / resolved) * 100 : null,
    medianCycleHours: median(cycles),
    p75CycleHours: percentile(cycles, 0.75),
    medianFirstReviewHours: median(reviews),
    additions: sum(merged.map((pr) => pr.additions)),
    deletions: sum(merged.map((pr) => pr.deletions)),
    lines: sum(merged.map(linesChanged)),
    changedFiles: sum(merged.map((pr) => pr.changedFiles)),
    medianLines: median(merged.map(linesChanged)),
    openNow: open.length,
    draftNow: open.filter((pr) => pr.isDraft).length,
  };
}
