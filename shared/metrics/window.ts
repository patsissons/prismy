import { WINDOW_DAYS, type TimeWindow, type WindowKey } from "../types";

const DAY_MS = 86_400_000;

export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * DAY_MS).toISOString();
}

/** The window ending now (exclusive) and starting `days` days earlier. */
export function resolveWindow(key: WindowKey, now: Date): TimeWindow {
  const to = now.toISOString();
  return { from: addDays(to, -WINDOW_DAYS[key]), to };
}

/** The equal-length window immediately before `window`. */
export function priorWindow(window: TimeWindow): TimeWindow {
  const length = Date.parse(window.to) - Date.parse(window.from);
  return {
    from: new Date(Date.parse(window.from) - length).toISOString(),
    to: window.from,
  };
}

export function inWindow(iso: string | null, window: TimeWindow): boolean {
  return iso !== null && iso >= window.from && iso < window.to;
}

export function windowDays(window: TimeWindow): number {
  return Math.round((Date.parse(window.to) - Date.parse(window.from)) / DAY_MS);
}

/** Monday 00:00 UTC of the week containing `iso`. */
export function weekStart(iso: string): string {
  const date = new Date(iso);
  const day = (date.getUTCDay() + 6) % 7;
  const monday = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - day,
  );
  return new Date(monday).toISOString();
}

export interface WeekBucket {
  /** ISO instant of the Monday. */
  start: string;
  /** e.g. "Jan 6" */
  label: string;
}

const LABEL = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export function weekLabel(start: string): string {
  return LABEL.format(new Date(start));
}

/** Every week that overlaps the window, oldest first. */
export function weekBuckets(window: TimeWindow): WeekBucket[] {
  const buckets: WeekBucket[] = [];
  let start = weekStart(window.from);
  while (start < window.to) {
    buckets.push({ start, label: weekLabel(start) });
    start = addDays(start, 7);
  }
  return buckets;
}
