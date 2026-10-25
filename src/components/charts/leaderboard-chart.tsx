import { useState } from "react";
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from "recharts";
import type { ContributorRow } from "@shared/metrics/repo";
import { ChartCard } from "@/components/chart-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn, formatCompact, formatHours } from "@/lib/utils";

type Metric = "merged" | "lines" | "cycle";

const METRICS: { key: Metric; label: string; description: string }[] = [
  { key: "merged", label: "Merged", description: "Merged pull requests" },
  {
    key: "lines",
    label: "Lines",
    description: "Lines changed in merged pull requests",
  },
  {
    key: "cycle",
    label: "Cycle",
    description: "Median hours from open to merge (shorter is faster)",
  },
];

const TOP = 15;

function value(row: ContributorRow, metric: Metric): number | null {
  if (metric === "merged") return row.merged || null;
  if (metric === "lines") return row.lines || null;
  return row.medianCycleHours;
}

/** Top contributors on one metric; the viewer is highlighted and always shown. */
export function LeaderboardChart({
  contributors,
  stale,
}: {
  contributors: ContributorRow[];
  stale?: boolean;
}) {
  const [metric, setMetric] = useState<Metric>("merged");
  const scored = contributors
    .map((row) => ({ ...row, value: value(row, metric) }))
    .filter(
      (row): row is ContributorRow & { value: number } => row.value !== null,
    )
    .sort((a, b) =>
      metric === "cycle" ? a.value - b.value : b.value - a.value,
    );
  const top = scored.slice(0, TOP);
  const viewer = scored.find((row) => row.isViewer);
  if (viewer && !top.includes(viewer)) top.push(viewer);
  const rows = top.map((row) => ({ ...row, rank: scored.indexOf(row) + 1 }));
  const format = (v: number) =>
    metric === "cycle" ? formatHours(v) : formatCompact(v);
  const config: ChartConfig = {
    value: { label: METRICS.find((m) => m.key === metric)!.label },
  };

  return (
    <ChartCard
      title="Contributors"
      description={METRICS.find((m) => m.key === metric)!.description}
      stale={stale}
      action={
        <div
          role="group"
          aria-label="Metric"
          className="inline-flex rounded-md border p-0.5"
        >
          {METRICS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={metric === option.key}
              onClick={() => setMetric(option.key)}
              className={cn(
                "h-7 cursor-pointer rounded px-2 text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                metric === option.key && "bg-muted text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
      table={{
        head: ["#", "Contributor", "Merged", "Lines", "Median cycle"],
        rows: scored.map((row, index) => [
          index + 1,
          row.isViewer ? `${row.login} (you)` : row.login,
          row.merged,
          row.lines,
          formatHours(row.medianCycleHours),
        ]),
      }}
    >
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No merged pull requests in this window.
        </p>
      ) : (
        <ChartContainer
          config={config}
          className="w-full"
          style={{ height: rows.length * 28 + 16, aspectRatio: "auto" }}
        >
          <BarChart
            accessibilityLayer
            data={rows}
            layout="vertical"
            margin={{ top: 0, right: 56, left: 0, bottom: 0 }}
            barCategoryGap={4}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="login"
              width={128}
              tickLine={false}
              axisLine={false}
              tick={({ x, y, payload }) => {
                const row = rows.find((r) => r.login === payload.value);
                return (
                  <text
                    x={x}
                    y={y}
                    dy={4}
                    textAnchor="end"
                    className={cn(
                      "text-xs",
                      row?.isViewer
                        ? "fill-foreground font-semibold"
                        : "fill-muted-foreground",
                    )}
                  >
                    {`${row?.rank}. ${payload.value}`}
                  </text>
                );
              }}
            />
            <ChartTooltip
              cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
              content={
                <ChartTooltipContent
                  hideIndicator
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as
                      (typeof rows)[number] | undefined;
                    return row
                      ? `${row.login}${row.isViewer ? " (you)" : ""}`
                      : "";
                  }}
                  formatter={(v) => (
                    <span className="tabular ml-auto font-medium">
                      {format(Number(v))}
                    </span>
                  )}
                />
              }
            />
            <Bar dataKey="value" maxBarSize={18} radius={[0, 4, 4, 0]}>
              {rows.map((row) => (
                <Cell
                  key={row.login}
                  fill={
                    row.isViewer ? "var(--chart-accent)" : "var(--chart-muted)"
                  }
                />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                offset={8}
                className="fill-muted-foreground"
                fontSize={11}
                formatter={(v: unknown) => format(Number(v))}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </ChartCard>
  );
}
