import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import type { PeriodPoint } from "@shared/metrics/launchpad";
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
import { formatCompact } from "@/lib/utils";

const CONFIG: ChartConfig = {
  additions: { label: "Added", color: "var(--chart-1)" },
  deletions: { label: "Deleted", color: "var(--chart-2)" },
};

/** Lines added above the baseline and deleted below it, per week or day of merges. */
export function LinesChart({
  activity,
  stale,
}: {
  activity: Record<Granularity, PeriodPoint[]>;
  stale?: boolean;
}) {
  const [granularity, setGranularity] = useState<Granularity>("week");
  const points = activity[granularity];
  const data = points.map((point) => ({
    label: point.label,
    additions: point.additions,
    deletions: -point.deletions,
  }));
  return (
    <ChartCard
      title="Code volume"
      description={`Lines added and deleted in merged pull requests, per ${granularity}`}
      stale={stale}
      action={
        <GranularityToggle value={granularity} onChange={setGranularity} />
      }
      table={{
        head: [granularity === "week" ? "Week" : "Day", "Added", "Deleted"],
        rows: points.map((point) => [
          point.label,
          point.additions,
          point.deletions,
        ]),
      }}
    >
      <ChartContainer
        config={CONFIG}
        className="aspect-[2.2/1] w-full min-h-56"
      >
        <BarChart
          accessibilityLayer
          data={data}
          stackOffset="sign"
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
            tickLine={false}
            axisLine={false}
            width={44}
            tickFormatter={(value: number) => formatCompact(Math.abs(value))}
          />
          <ReferenceLine y={0} stroke="var(--chart-muted)" />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
            content={
              <ChartTooltipContent
                formatter={(value, name, item) => (
                  <>
                    <span
                      className="size-2.5 shrink-0 rounded-[2px]"
                      style={{ background: item.color }}
                    />
                    <span className="flex-1 text-muted-foreground">
                      {CONFIG[name as string]?.label ?? name}
                    </span>
                    <span className="tabular font-medium">
                      {formatCompact(Math.abs(Number(value)))}
                    </span>
                  </>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar
            dataKey="additions"
            stackId="lines"
            fill="var(--color-additions)"
            maxBarSize={24}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="deletions"
            stackId="lines"
            fill="var(--color-deletions)"
            maxBarSize={24}
            radius={[0, 0, 4, 4]}
          />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
