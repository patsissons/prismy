"use client";

import { ArrowDownAZ, ArrowUpAZ, ChevronDown, ChevronLeft, ChevronRight, Filter, Layers3 } from "lucide-react";

import { getVisibleWindow } from "@/lib/analytics";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BucketSize, DashboardFilters as DashboardFilterState, MetricKey, RangePreset, RepositoryConnection, UserSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

const ranges: { label: string; value: RangePreset }[] = [
  { label: "7 Days", value: "7d" },
  { label: "30 Days", value: "30d" },
  { label: "90 Days", value: "90d" },
  { label: "180 Days", value: "180d" }
];

const metrics: { label: string; value: MetricKey }[] = [
  { label: "Created", value: "created" },
  { label: "Merged", value: "merged" },
  { label: "Duration", value: "duration" }
];

const buckets: { label: string; value: BucketSize }[] = [
  { label: "Day", value: "day" },
  { label: "Week", value: "week" },
  { label: "Month", value: "month" }
];

export function DashboardFilters({
  repositories,
  filters,
  peopleOptions,
  onChange
}: {
  repositories: RepositoryConnection[];
  filters: DashboardFilterState;
  peopleOptions: UserSummary[];
  onChange: (updates: Partial<DashboardFilterState>) => void;
}) {
  return (
    <Card className="overflow-hidden bg-surface-low">
      <div className="grid gap-px bg-background/50 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.15fr)_minmax(280px,0.95fr)]">
        <div className="min-w-0 space-y-4 bg-surface-low p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="font-body text-xs uppercase tracking-[0.24em]">Repository Context</span>
          </div>

          <label className="flex items-center gap-3 rounded-sm bg-surface-high px-4 py-3">
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
            <select
              aria-label="Select repository"
              value={filters.repoId ?? ""}
              onChange={(event) => onChange({ repoId: event.target.value || null })}
              className="w-full bg-transparent text-sm outline-none"
            >
              <option value="">Select repository</option>
              {repositories.map((repository) => (
                <option key={repository.id} value={repository.id}>
                  {repository.owner}/{repository.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="min-w-0 space-y-4 bg-surface-low p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers3 className="h-4 w-4" />
            <span className="font-body text-xs uppercase tracking-[0.24em]">Metrics & Window</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {metrics.map((metric) => (
              <Button
                key={metric.value}
                variant={filters.metric === metric.value ? "default" : "outline"}
                size="sm"
                onClick={() => onChange({ metric: metric.value })}
              >
                {metric.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {ranges.map((range) => (
              <Button
                key={range.value}
                variant={filters.range === range.value ? "secondary" : "outline"}
                size="sm"
                onClick={() => onChange({ range: range.value })}
              >
                {range.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8"
              onClick={() => onChange({ offset: filters.offset - 1 })}
              aria-label="Previous period"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <button
              onClick={() => onChange({ offset: 0 })}
              disabled={filters.offset === 0}
              className={cn(
                "min-w-[7rem] rounded-sm px-3 py-1.5 text-center font-body text-xs tracking-wide transition",
                filters.offset === 0
                  ? "text-muted-foreground"
                  : "text-foreground hover:bg-surface-high cursor-pointer"
              )}
            >
              {formatWindowLabel(filters.range, filters.offset)}
            </button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8"
              disabled={filters.offset >= 0}
              onClick={() => onChange({ offset: filters.offset + 1 })}
              aria-label="Next period"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {buckets.map((bucket) => (
              <button
                key={bucket.value}
                onClick={() => onChange({ bucket: bucket.value })}
                className={cn(
                  "rounded-sm px-3 py-2 font-body text-xs uppercase tracking-[0.22em] text-muted-foreground transition",
                  filters.bucket === bucket.value && "bg-surface-high text-foreground"
                )}
              >
                {bucket.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0 space-y-4 bg-surface-low p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="font-body text-xs uppercase tracking-[0.24em] text-muted-foreground">People Filter</div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5"
              onClick={() => onChange({ peopleSort: filters.peopleSort === "desc" ? "asc" : "desc" })}
              aria-label={`Sort people ${filters.peopleSort === "desc" ? "ascending" : "descending"} by ${filters.metric}`}
            >
              {filters.peopleSort === "desc" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
            </Button>
          </div>
          <div className="max-h-72 space-y-2 overflow-y-auto pr-2">
            <button
              onClick={() => onChange({ users: [] })}
              className={cn(
                "flex w-full items-center rounded-sm border border-border/20 px-3 py-2 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground transition",
                filters.users.length === 0 && "bg-primary/12 text-primary"
              )}
            >
              All users
            </button>
            {peopleOptions.map((user) => {
              const selected = filters.users.includes(user.login);

              return (
                <button
                  key={user.login}
                  onClick={() =>
                    onChange({
                      users: selected
                        ? filters.users.filter((login) => login !== user.login)
                        : [...filters.users, user.login]
                    })
                  }
                  className={cn(
                    "flex w-full items-center rounded-sm border border-border/20 px-3 py-2 text-left text-xs uppercase tracking-[0.2em] text-muted-foreground transition",
                    selected && "bg-surface-high text-foreground"
                  )}
                >
                  <span className="mr-3 inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: user.color }} />
                  <span className="truncate">{user.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" });

function formatWindowLabel(range: RangePreset, offset: number): string {
  if (offset === 0) {
    return "Current";
  }

  const { start, end } = getVisibleWindow(range, offset);
  return `${dateFormat.format(start)} – ${dateFormat.format(end)}`;
}
