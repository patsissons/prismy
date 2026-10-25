import { describe, expect, it } from "vitest";
import {
  delta,
  formatCompact,
  formatHours,
  formatPercent,
  formatRelative,
} from "./utils";

describe("formatting", () => {
  it("compacts only large numbers", () => {
    expect(formatCompact(1284)).toBe("1,284");
    expect(formatCompact(12_900)).toBe("12.9K");
    expect(formatCompact(null)).toBe("–");
  });

  it("formats hours as minutes, hours or days", () => {
    expect(formatHours(0.5)).toBe("30m");
    expect(formatHours(18.4)).toBe("18h");
    expect(formatHours(76)).toBe("3.2d");
    expect(formatHours(500)).toBe("21d");
    expect(formatHours(null)).toBe("–");
  });

  it("formats percentages and deltas", () => {
    expect(formatPercent(66.666, 1)).toBe("66.7%");
    expect(delta(12, 10)).toEqual({ text: "+20%", direction: "up" });
    expect(delta(9.5, 10)).toEqual({ text: "−5.0%", direction: "down" });
    expect(delta(10, 10)).toEqual({ text: "±0%", direction: "flat" });
    expect(delta(10, 0)).toBeNull();
  });

  it("formats relative time", () => {
    const now = new Date("2026-10-01T12:00:00.000Z");
    expect(formatRelative("2026-10-01T11:59:40.000Z", now)).toBe("just now");
    expect(formatRelative("2026-10-01T11:30:00.000Z", now)).toBe(
      "30 minutes ago",
    );
    expect(formatRelative("2026-09-30T12:00:00.000Z", now)).toBe("yesterday");
  });
});
