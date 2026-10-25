import { describe, expect, it } from "vitest";
import { pr } from "../testing/fixtures";
import { launchpadSummary } from "./launchpad";
import { cycleBucket, sizeBucket } from "./pr";
import { repoSummary } from "./repo";
import { median, percentChange, percentile, percentileRank } from "./stats";
import { kpis } from "./summary";
import {
  buckets,
  dayStart,
  priorWindow,
  resolveWindow,
  weekBuckets,
  weekStart,
} from "./window";

const NOW = new Date("2026-10-01T00:00:00.000Z");
const WINDOW = resolveWindow("30d", NOW);

describe("stats", () => {
  it("interpolates percentiles", () => {
    expect(percentile([], 0.5)).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(percentile([10, 20, 30, 40], 0.75)).toBe(32.5);
  });

  it("computes change and percentile rank", () => {
    expect(percentChange(12, 10)).toBeCloseTo(20);
    expect(percentChange(12, 0)).toBeNull();
    expect(percentileRank(1, 10)).toBe(100);
    expect(percentileRank(10, 10)).toBe(10);
  });
});

describe("window", () => {
  it("resolves a window and its prior period", () => {
    expect(WINDOW).toEqual({
      from: "2026-09-01T00:00:00.000Z",
      to: "2026-10-01T00:00:00.000Z",
    });
    expect(priorWindow(WINDOW)).toEqual({
      from: "2026-08-02T00:00:00.000Z",
      to: "2026-09-01T00:00:00.000Z",
    });
  });

  it("buckets by UTC Monday", () => {
    expect(weekStart("2026-09-03T15:00:00.000Z")).toBe(
      "2026-08-31T00:00:00.000Z",
    );
    const weeks = weekBuckets(WINDOW);
    expect(weeks[0]).toEqual({
      start: "2026-08-31T00:00:00.000Z",
      label: "Aug 31",
    });
    expect(weeks).toHaveLength(5);
  });

  it("buckets by UTC day", () => {
    expect(dayStart("2026-09-03T15:00:00.000Z")).toBe(
      "2026-09-03T00:00:00.000Z",
    );
    const days = buckets(WINDOW, "day");
    expect(days).toHaveLength(30);
    expect(days[0]).toEqual({
      start: "2026-09-01T00:00:00.000Z",
      label: "Sep 1",
    });
    expect(days.at(-1)?.label).toBe("Sep 30");
  });
});

describe("pr buckets", () => {
  it("assigns size and cycle buckets", () => {
    expect(sizeBucket(9)).toBe("XS");
    expect(sizeBucket(50)).toBe("M");
    expect(sizeBucket(5000)).toBe("XL");
    expect(cycleBucket(0.5)).toBe("<1h");
    expect(cycleBucket(30)).toBe("1-3d");
    expect(cycleBucket(1000)).toBe("2w+");
  });
});

const SAMPLE = [
  pr({
    number: 1,
    createdAt: "2026-09-02T00:00:00.000Z",
    mergedAt: "2026-09-03T00:00:00.000Z",
  }),
  pr({
    number: 2,
    createdAt: "2026-09-10T00:00:00.000Z",
    mergedAt: "2026-09-13T00:00:00.000Z",
    additions: 500,
    deletions: 100,
    repo: "acme/web",
  }),
  pr({
    number: 3,
    createdAt: "2026-09-20T00:00:00.000Z",
    mergedAt: null,
    state: "CLOSED",
    closedAt: "2026-09-21T00:00:00.000Z",
  }),
  pr({
    number: 4,
    createdAt: "2026-09-25T00:00:00.000Z",
    mergedAt: null,
    state: "OPEN",
    isDraft: true,
  }),
  // Prior period
  pr({
    number: 5,
    createdAt: "2026-08-10T00:00:00.000Z",
    mergedAt: "2026-08-12T00:00:00.000Z",
  }),
  // Someone else, same repo
  pr({
    number: 6,
    authorLogin: "sam",
    createdAt: "2026-09-05T00:00:00.000Z",
    mergedAt: "2026-09-05T06:00:00.000Z",
    additions: 10,
    deletions: 0,
  }),
  pr({
    number: 7,
    authorLogin: "sam",
    createdAt: "2026-09-06T00:00:00.000Z",
    mergedAt: "2026-09-06T06:00:00.000Z",
    additions: 10,
    deletions: 0,
  }),
  pr({
    number: 8,
    authorLogin: "kim",
    createdAt: "2026-09-07T00:00:00.000Z",
    mergedAt: null,
    state: "OPEN",
  }),
];

describe("kpis", () => {
  it("summarizes a window", () => {
    const result = kpis(
      SAMPLE.filter((p) => p.authorLogin === "pat"),
      WINDOW,
    );
    expect(result).toMatchObject({
      merged: 2,
      opened: 4,
      declined: 1,
      medianCycleHours: 48,
      additions: 600,
      deletions: 120,
      lines: 720,
      openNow: 1,
      draftNow: 1,
    });
    expect(result.mergeRate).toBeCloseTo(66.67, 1);
  });
});

describe("launchpadSummary", () => {
  const summary = launchpadSummary(SAMPLE, "pat", WINDOW);

  it("compares with the prior window", () => {
    expect(summary.kpis.merged).toBe(2);
    expect(summary.priorKpis.merged).toBe(1);
  });

  it("ranks repos with the user's share", () => {
    expect(
      summary.repos.map((row) => [row.repo, row.merged, row.share]),
    ).toEqual([
      ["acme/app", 1, 50],
      ["acme/web", 1, 50],
    ]);
    expect(summary.mergedByRepo.series).toEqual(["acme/app", "acme/web"]);
  });

  it("buckets weekly activity and distributions", () => {
    const week = summary.activity.week.find(
      (point) => point.label === "Sep 7",
    )!;
    expect(week).toMatchObject({ opened: 1, merged: 1, additions: 500 });
    expect(summary.cycleHistogram.find((b) => b.bucket === "1-3d")?.count).toBe(
      1,
    );
    expect(summary.sizeDistribution.find((b) => b.bucket === "L")?.count).toBe(
      1,
    );
    expect(summary.longestOpen.map((p) => p.number)).toEqual([4]);
    expect(summary.recent.map((p) => p.number)).toEqual([4, 3, 2, 1]);
  });

  it("folds repos beyond the palette into Other", () => {
    const many = Array.from({ length: 9 }, (_, index) =>
      pr({
        number: 100 + index,
        repo: `acme/r${index}`,
        createdAt: "2026-09-10T00:00:00.000Z",
        mergedAt: "2026-09-11T00:00:00.000Z",
      }),
    );
    const result = launchpadSummary(many, "pat", WINDOW);
    expect(result.mergedByRepo.series).toHaveLength(8);
    expect(result.mergedByRepo.series.at(-1)).toBe("Other");
    const week = result.mergedByRepo.points.week.find(
      (point) => point.label === "Sep 7",
    )!;
    expect(week.Other).toBe(2);
    const day = result.mergedByRepo.points.day.find(
      (point) => point.label === "Sep 11",
    )!;
    expect(day.Other).toBe(2);
  });

  it("buckets daily activity on the UTC day", () => {
    const day = (label: string) =>
      summary.activity.day.find((point) => point.label === label)!;
    expect(day("Sep 10")).toMatchObject({ opened: 1, merged: 0 });
    expect(day("Sep 13")).toMatchObject({
      opened: 0,
      merged: 1,
      additions: 500,
      deletions: 100,
    });
    expect(
      summary.mergedByRepo.points.day.find((p) => p.label === "Sep 13"),
    ).toMatchObject({ "acme/web": 1, "acme/app": 0 });
  });

  it("agrees on totals across granularities", () => {
    const total = (points: { opened: number; merged: number }[]) =>
      points.reduce(
        (sum, point) => [sum[0]! + point.opened, sum[1]! + point.merged],
        [0, 0],
      );
    expect(total(summary.activity.day)).toEqual(total(summary.activity.week));
    expect(total(summary.activity.day)).toEqual([4, 2]);
  });
});

describe("repoSummary", () => {
  const summary = repoSummary(SAMPLE, "acme/app", "pat", WINDOW);

  it("ranks the viewer among contributors", () => {
    expect(summary.contributors.map((row) => [row.login, row.merged])).toEqual([
      ["sam", 2],
      ["pat", 1],
      ["kim", 0],
    ]);
    expect(summary.ranks.merged).toEqual({
      rank: 2,
      count: 2,
      percentile: 50,
      median: 1.5,
    });
    // Lower cycle time ranks higher: sam's 6h beats pat's 24h.
    expect(summary.ranks.cycle.rank).toBe(2);
    expect(summary.ranks.lines).toMatchObject({ rank: 1, count: 2 });
    expect(summary.share).toBeCloseTo(33.33, 1);
  });

  it("splits weekly merges and cycle quartiles", () => {
    const week = summary.weekly.find((point) => point.label === "Aug 31")!;
    expect(week).toMatchObject({ repoMerged: 3, youMerged: 1 });
    expect(summary.cycle.you).toMatchObject({ median: 24, count: 1 });
    expect(summary.cycle.others).toMatchObject({ median: 6, count: 2 });
  });

  it("gives null ranks to a viewer without PRs", () => {
    const result = repoSummary(SAMPLE, "acme/app", "nobody", WINDOW);
    expect(result.ranks.merged.rank).toBeNull();
    expect(result.share).toBe(0);
  });
});
