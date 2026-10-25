export { cn } from "cn";

const compact = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const integer = new Intl.NumberFormat("en");

/** 1,284 -> "1.3K"; small numbers stay exact. */
export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "–";
  return Math.abs(value) < 10_000
    ? integer.format(Math.round(value))
    : compact.format(value);
}

export function formatInt(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "–";
  return integer.format(Math.round(value));
}

/** Hours as a short duration: 42m, 18h, 3.2d. */
export function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined || !Number.isFinite(hours))
    return "–";
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))}m`;
  if (hours < 48) return `${Math.round(hours)}h`;
  const days = hours / 24;
  return `${days < 10 ? days.toFixed(1) : Math.round(days)}d`;
}

export function formatPercent(
  value: number | null | undefined,
  digits = 0,
): string {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "–";
  return `${value.toFixed(digits)}%`;
}

export type Direction = "up" | "down" | "flat";

export interface Delta {
  text: string;
  direction: Direction;
}

/** Signed percent change vs the prior period; null when not comparable. */
export function delta(
  current: number | null,
  previous: number | null,
): Delta | null {
  if (current === null || previous === null || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  if (Math.abs(change) < 0.5) return { text: "±0%", direction: "flat" };
  const text = `${change > 0 ? "+" : "−"}${Math.abs(change) < 10 ? Math.abs(change).toFixed(1) : Math.round(Math.abs(change))}%`;
  return { text, direction: change > 0 ? "up" : "down" };
}

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export function formatRelative(iso: string, now: Date): string {
  const seconds = (Date.parse(iso) - now.getTime()) / 1000;
  const abs = Math.abs(seconds);
  if (abs < 60) return "just now";
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 86_400 * 30)
    return relative.format(Math.round(seconds / 86_400), "day");
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
