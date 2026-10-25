import { describe, expect, it } from "vitest";
import { addDaysToDay, bisectDays, daysInclusive } from "./dates";

describe("dates", () => {
  it("counts inclusive days and adds days across months", () => {
    expect(daysInclusive("2026-01-30", "2026-02-02")).toBe(4);
    expect(addDaysToDay("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDaysToDay("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("bisects a range without gaps or overlap", () => {
    expect(bisectDays("2026-01-01", "2026-01-10")).toEqual([
      ["2026-01-01", "2026-01-05"],
      ["2026-01-06", "2026-01-10"],
    ]);
    expect(bisectDays("2026-01-01", "2026-01-02")).toEqual([
      ["2026-01-01", "2026-01-01"],
      ["2026-01-02", "2026-01-02"],
    ]);
    expect(bisectDays("2026-01-01", "2026-01-03")).toEqual([
      ["2026-01-01", "2026-01-01"],
      ["2026-01-02", "2026-01-03"],
    ]);
  });
});
