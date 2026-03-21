"use client";

import { startTransition, useCallback, useMemo } from "react";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { BucketSize, DashboardFilters, MetricKey, RangePreset } from "@/lib/types";

const RANGE_PRESETS: RangePreset[] = ["7d", "30d", "90d", "180d"];
const METRICS: MetricKey[] = ["created", "merged", "duration"];
const BUCKETS: BucketSize[] = ["day", "week", "month"];

export function usePrIsmQueryState(defaultRange: RangePreset) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo<DashboardFilters>(() => {
    const range = searchParams.get("range");
    const metric = searchParams.get("metric");
    const bucket = searchParams.get("bucket");
    const users = searchParams.get("users");

    return {
      repoId: searchParams.get("repo"),
      range: RANGE_PRESETS.includes(range as RangePreset) ? (range as RangePreset) : defaultRange,
      metric: METRICS.includes(metric as MetricKey) ? (metric as MetricKey) : "created",
      bucket: BUCKETS.includes(bucket as BucketSize) ? (bucket as BucketSize) : inferBucket(range as RangePreset | null, defaultRange),
      users: users ? users.split(",").filter(Boolean) : []
    };
  }, [defaultRange, searchParams]);

  const setFilters = useCallback(
    (updates: Partial<DashboardFilters>) => {
      const next = new URLSearchParams(searchParams.toString());

      if (updates.repoId !== undefined) {
        updates.repoId ? next.set("repo", updates.repoId) : next.delete("repo");
      }

      if (updates.range) {
        next.set("range", updates.range);
        if (!searchParams.get("bucket")) {
          next.set("bucket", inferBucket(updates.range, defaultRange));
        }
      }

      if (updates.metric) {
        next.set("metric", updates.metric);
      }

      if (updates.bucket) {
        next.set("bucket", updates.bucket);
      }

      if (updates.users !== undefined) {
        updates.users.length ? next.set("users", updates.users.join(",")) : next.delete("users");
      }

      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}` as Route, { scroll: false });
      });
    },
    [defaultRange, pathname, router, searchParams]
  );

  return { filters, setFilters };
}

function inferBucket(range: RangePreset | null, fallback: RangePreset): BucketSize {
  const value = range ?? fallback;

  if (value === "7d" || value === "30d") {
    return "day";
  }

  if (value === "90d") {
    return "week";
  }

  return "month";
}
