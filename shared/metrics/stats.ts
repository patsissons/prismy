/** Small numeric helpers over plain arrays. */

export function sum(values: readonly number[]): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

/** Linear-interpolated percentile (0..1) of unsorted values; null when empty. */
export function percentile(
  values: readonly number[],
  p: number,
): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower]!;
  const weight = index - lower;
  return sorted[lower]! * (1 - weight) + sorted[upper]! * weight;
}

export function median(values: readonly number[]): number | null {
  return percentile(values, 0.5);
}

export function mean(values: readonly number[]): number | null {
  return values.length ? sum(values) / values.length : null;
}

/** Hours between two ISO instants (never negative). */
export function hoursBetween(from: string, to: string): number {
  return Math.max(0, (Date.parse(to) - Date.parse(from)) / 3_600_000);
}

/** Relative change in percent; null when the base is zero or missing. */
export function percentChange(
  current: number | null,
  previous: number | null,
): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Share of a sorted-descending population the value beats or ties, 0..100.
 * Rank 1 of 10 gives 100; last place gives 10.
 */
export function percentileRank(rank: number, count: number): number {
  if (count <= 0) return 0;
  return Math.round(((count - rank + 1) / count) * 100);
}
