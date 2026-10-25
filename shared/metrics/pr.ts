import type { PrRecord, TimeWindow } from "../types";
import { hoursBetween } from "./stats";
import { inWindow } from "./window";

export function linesChanged(pr: PrRecord): number {
  return pr.additions + pr.deletions;
}

/** Hours from creation to merge; null unless merged. */
export function cycleHours(pr: PrRecord): number | null {
  return pr.mergedAt ? hoursBetween(pr.createdAt, pr.mergedAt) : null;
}

/** Hours from creation to the first outside review; null without one. */
export function firstReviewHours(pr: PrRecord): number | null {
  return pr.firstReviewAt ? hoursBetween(pr.createdAt, pr.firstReviewAt) : null;
}

export function mergedIn(pr: PrRecord, window: TimeWindow): boolean {
  return inWindow(pr.mergedAt, window);
}

export function openedIn(pr: PrRecord, window: TimeWindow): boolean {
  return inWindow(pr.createdAt, window);
}

/** Closed without merging, inside the window. */
export function declinedIn(pr: PrRecord, window: TimeWindow): boolean {
  return pr.state === "CLOSED" && inWindow(pr.closedAt, window);
}

export const SIZE_BUCKETS = ["XS", "S", "M", "L", "XL"] as const;
export type SizeBucket = (typeof SIZE_BUCKETS)[number];

/** Lines changed: XS < 10, S < 50, M < 250, L < 1000, XL otherwise. */
export function sizeBucket(lines: number): SizeBucket {
  if (lines < 10) return "XS";
  if (lines < 50) return "S";
  if (lines < 250) return "M";
  if (lines < 1000) return "L";
  return "XL";
}

export const CYCLE_BUCKETS = [
  { key: "<1h", max: 1 },
  { key: "1-4h", max: 4 },
  { key: "4-24h", max: 24 },
  { key: "1-3d", max: 72 },
  { key: "3-7d", max: 168 },
  { key: "1-2w", max: 336 },
  { key: "2w+", max: Infinity },
] as const;
export type CycleBucket = (typeof CYCLE_BUCKETS)[number]["key"];

export function cycleBucket(hours: number): CycleBucket {
  for (const bucket of CYCLE_BUCKETS) {
    if (hours < bucket.max) return bucket.key;
  }
  return "2w+";
}
