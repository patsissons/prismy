import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartCard } from "@/components/chart-card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const CONFIG: ChartConfig = {
  count: { label: "Pull requests", color: "var(--chart-accent)" },
};

/** Counts over ordered buckets (cycle time, PR size): one series, no legend. */
export function HistogramChart({
  title,
  description,
  bucketLabel,
  data,
  stale,
}: {
  title: string;
  description?: ReactNode;
  bucketLabel: string;
  data: { bucket: string; count: number }[];
  stale?: boolean;
}) {
  return (
    <ChartCard
      title={title}
      description={description}
      stale={stale}
      table={{
        head: [bucketLabel, "Pull requests"],
        rows: data.map((d) => [d.bucket, d.count]),
      }}
    >
      <ChartContainer
        config={CONFIG}
        className="aspect-[2.2/1] w-full min-h-56"
      >
        <BarChart
          accessibilityLayer
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="bucket"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={32}
          />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
            content={<ChartTooltipContent hideIndicator />}
          />
          <Bar
            dataKey="count"
            fill="var(--color-count)"
            maxBarSize={24}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ChartContainer>
    </ChartCard>
  );
}
