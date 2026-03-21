"use client";

import { ChevronDown, Filter, Layers3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BucketSize, DashboardFilters as DashboardFilterState, MetricKey, RangePreset, RepositoryConnection } from "@/lib/types";
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
  availableUsers,
  onChange
}: {
  repositories: RepositoryConnection[];
  filters: DashboardFilterState;
  availableUsers: { login: string; name: string; color: string }[];
  onChange: (updates: Partial<DashboardFilterState>) => void;
}) {
  return (
    <Card className="overflow-hidden bg-surface-low">
      <div className="grid gap-px bg-background/50 lg:grid-cols-[1.1fr_1.2fr_0.85fr]">
        <div className="space-y-4 bg-surface-low p-5">
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

        <div className="space-y-4 bg-surface-low p-5">
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

        <div className="space-y-4 bg-surface-low p-5">
          <div className="font-body text-xs uppercase tracking-[0.24em] text-muted-foreground">People Filter</div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onChange({ users: [] })}
              className={cn(
                "rounded-sm border border-border/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition",
                filters.users.length === 0 && "bg-primary/12 text-primary"
              )}
            >
              All users
            </button>
            {availableUsers.map((user) => {
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
                    "rounded-sm border border-border/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-muted-foreground transition",
                    selected && "bg-surface-high text-foreground"
                  )}
                >
                  <span className="mr-2 inline-block h-2.5 w-2.5 rounded-[2px]" style={{ backgroundColor: user.color }} />
                  {user.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
