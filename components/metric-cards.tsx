import { ArrowDownRight, ArrowUpRight, CheckCircle2, Clock3, Minus } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDurationDays } from "@/lib/utils";

interface Kpis {
  totalPrs: number;
  mergedPrs: number;
  averageDurationHours: number;
  mergeRate: number;
}

export function MetricCards({ current, previous }: { current: Kpis; previous: Kpis }) {
  return (
    <div className="grid gap-px bg-background/60 lg:grid-cols-3">
      <Card className="p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.34em] text-muted-foreground">Total PRs</div>
        <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.05em]">{current.totalPrs.toLocaleString()}</div>
        <div className="mt-4">
          <ComparisonBadge current={current.totalPrs} previous={previous.totalPrs} higherIsBetter />
        </div>
      </Card>

      <Card className="p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.34em] text-muted-foreground">Merged PRs</div>
        <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.05em]">{current.mergedPrs.toLocaleString()}</div>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-secondary">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-sm font-semibold">{current.mergeRate.toFixed(1)}%</span>
          </span>
          <ComparisonBadge current={current.mergedPrs} previous={previous.mergedPrs} higherIsBetter />
        </div>
      </Card>

      <Card className="p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.34em] text-muted-foreground">Avg. Duration</div>
        <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.05em]">{formatDurationDays(current.averageDurationHours)}</div>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-tertiary">
            <Clock3 className="h-4 w-4" />
            <span className="text-sm font-semibold">Cycle time</span>
          </span>
          <ComparisonBadge
            current={current.averageDurationHours}
            previous={previous.averageDurationHours}
            higherIsBetter={false}
            formatDiff={(diff) => `${formatDurationDays(Math.abs(diff))}`}
          />
        </div>
      </Card>
    </div>
  );
}

function ComparisonBadge({
  current,
  previous,
  higherIsBetter,
  formatDiff
}: {
  current: number;
  previous: number;
  higherIsBetter: boolean;
  formatDiff?: (diff: number) => string;
}) {
  const diff = current - previous;
  const pctChange = previous !== 0 ? (diff / previous) * 100 : 0;

  if (previous === 0 && current === 0) {
    return null;
  }

  const isPositive = diff > 0;
  const isNeutral = diff === 0;
  const isGood = isNeutral ? true : higherIsBetter ? isPositive : !isPositive;

  const formattedDiff = formatDiff ? formatDiff(diff) : Math.abs(diff).toLocaleString();
  const sign = isPositive ? "+" : diff < 0 ? "−" : "";

  const Icon = isNeutral ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium",
        isNeutral && "bg-muted/50 text-muted-foreground",
        !isNeutral && isGood && "bg-emerald-500/10 text-emerald-400",
        !isNeutral && !isGood && "bg-red-500/10 text-red-400"
      )}
    >
      <Icon className="h-3 w-3" />
      {sign}{formattedDiff}
      {!isNeutral && previous !== 0 && (
        <span className="opacity-70">({Math.abs(pctChange).toFixed(0)}%)</span>
      )}
    </span>
  );
}
