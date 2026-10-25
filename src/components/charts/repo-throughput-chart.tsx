import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";
import type { RepoWeekPoint } from "@shared/metrics/repo";
import { ChartCard } from "@/components/chart-card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const CONFIG: ChartConfig = {
  repoMerged: { label: "Everyone", color: "var(--chart-muted)" },
  youMerged: { label: "You", color: "var(--chart-accent)" },
};

/** Weekly merges: the repo as a muted area, you as the accent line. */
export function RepoThroughputChart({
  weekly,
  stale,
}: {
  weekly: RepoWeekPoint[];
  stale?: boolean;
}) {
  return (
    <ChartCard
      title="Merged per week"
      description="Your merged pull requests against the whole repository"
      stale={stale}
      table={{
        head: ["Week", "You", "Everyone"],
        rows: weekly.map((point) => [
          point.label,
          point.youMerged,
          point.repoMerged,
        ]),
      }}
    >
      <ChartContainer
        config={CONFIG}
        className="aspect-[2.2/1] w-full min-h-56"
      >
        <ComposedChart
          accessibilityLayer
          data={weekly}
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
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <ChartTooltip
            cursor={{ stroke: "var(--chart-muted)" }}
            content={<ChartTooltipContent indicator="line" />}
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            dataKey="repoMerged"
            type="monotone"
            stroke="var(--color-repoMerged)"
            strokeWidth={2}
            fill="var(--color-repoMerged)"
            fillOpacity={0.12}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
          />
          <Line
            dataKey="youMerged"
            type="monotone"
            stroke="var(--color-youMerged)"
            strokeWidth={2}
            dot={{
              r: 3,
              strokeWidth: 2,
              stroke: "var(--card)",
              fill: "var(--color-youMerged)",
            }}
            activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--card)" }}
          />
        </ComposedChart>
      </ChartContainer>
    </ChartCard>
  );
}
