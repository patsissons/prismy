import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import type { LaunchpadSummary } from "@shared/metrics/launchpad";
import type { Granularity } from "@shared/metrics/window";
import { ChartCard } from "@/components/chart-card";
import { GranularityToggle } from "@/components/charts/granularity-toggle";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { useState } from "react";

const PLAIN: ChartConfig = {
  opened: { label: "Opened", color: "var(--chart-muted)" },
  merged: { label: "Merged", color: "var(--chart-accent)" },
};

/** Opened vs merged per week or day, or merged stacked by repo (top repos + Other). */
export function ThroughputChart({
  summary,
  stale,
}: {
  summary: LaunchpadSummary;
  stale?: boolean;
}) {
  const [byRepo, setByRepo] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>("week");
  const { mergedByRepo } = summary;
  const activity = summary.activity[granularity];
  const stackedPoints = mergedByRepo.points[granularity];
  const canStack = mergedByRepo.series.length > 1;
  const stacked = byRepo && canStack;
  const data = (stacked ? stackedPoints : activity) as unknown as Record<
    string,
    string | number
  >[];
  const period = granularity === "week" ? "Week" : "Day";

  const repoConfig: ChartConfig = Object.fromEntries(
    mergedByRepo.series.map((repo, index) => [
      repo,
      { label: repo, color: `var(--chart-${Math.min(index + 1, 8)})` },
    ]),
  );

  const table = stacked
    ? {
        head: [period, ...mergedByRepo.series],
        rows: stackedPoints.map((point) => [
          point.label,
          ...mergedByRepo.series.map((repo) => point[repo] as number),
        ]),
      }
    : {
        head: [period, "Opened", "Merged"],
        rows: activity.map((point) => [
          point.label,
          point.opened,
          point.merged,
        ]),
      };

  return (
    <ChartCard
      title="Throughput"
      description={
        stacked
          ? `Merged pull requests per ${granularity} by repository`
          : `Pull requests opened and merged per ${granularity}`
      }
      table={table}
      stale={stale}
      action={
        <>
          <GranularityToggle value={granularity} onChange={setGranularity} />
          {canStack ? (
            <button
              type="button"
              aria-pressed={byRepo}
              onClick={() => setByRepo((value) => !value)}
              className={cn(
                "h-7 cursor-pointer rounded-md border px-2 text-xs font-medium text-muted-foreground transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                byRepo && "bg-muted text-foreground",
              )}
            >
              By repo
            </button>
          ) : null}
        </>
      }
    >
      <ChartContainer
        config={stacked ? repoConfig : PLAIN}
        className="aspect-[2.2/1] w-full min-h-56"
      >
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          barCategoryGap="25%"
          barGap={2}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
            content={<ChartTooltipContent />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          {stacked
            ? mergedByRepo.series.map((repo, index) => (
                <Bar
                  key={repo}
                  dataKey={repo}
                  stackId="merged"
                  fill={`var(--color-${repo})`}
                  stroke="var(--card)"
                  strokeWidth={2}
                  maxBarSize={24}
                  radius={
                    index === mergedByRepo.series.length - 1 ? [4, 4, 0, 0] : 0
                  }
                />
              ))
            : [
                <Bar
                  key="opened"
                  dataKey="opened"
                  fill="var(--color-opened)"
                  maxBarSize={24}
                  radius={[4, 4, 0, 0]}
                />,
                <Bar
                  key="merged"
                  dataKey="merged"
                  fill="var(--color-merged)"
                  maxBarSize={24}
                  radius={[4, 4, 0, 0]}
                />,
              ]}
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
