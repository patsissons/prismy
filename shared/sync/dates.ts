/** Date-only (YYYY-MM-DD, UTC) helpers for search slices. */

const DAY_MS = 86_400_000;

export function dateOnly(iso: string): string {
  return iso.slice(0, 10);
}

export function parseDay(day: string): number {
  return Date.parse(`${day}T00:00:00.000Z`);
}

export function addDaysToDay(day: string, days: number): string {
  return new Date(parseDay(day) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Inclusive day count of a slice. */
export function daysInclusive(from: string, to: string): number {
  return Math.round((parseDay(to) - parseDay(from)) / DAY_MS) + 1;
}

/** Split an inclusive day range in two; the first half is the older one. */
export function bisectDays(
  from: string,
  to: string,
): [[string, string], [string, string]] {
  const days = daysInclusive(from, to);
  const mid = addDaysToDay(from, Math.floor(days / 2) - 1);
  return [
    [from, mid],
    [addDaysToDay(mid, 1), to],
  ];
}
