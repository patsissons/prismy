import { ArrowUpRight, CheckCircle2, Clock3 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatDurationDays } from "@/lib/utils";

export function MetricCards({
  totalPrs,
  mergedPrs,
  averageDurationHours,
  mergeRate
}: {
  totalPrs: number;
  mergedPrs: number;
  averageDurationHours: number;
  mergeRate: number;
}) {
  return (
    <div className="grid gap-px bg-background/60 lg:grid-cols-3">
      <Card className="p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.34em] text-muted-foreground">Total PRs</div>
        <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.05em]">{totalPrs.toLocaleString()}</div>
        <div className="mt-4 flex items-center gap-2 text-primary">
          <ArrowUpRight className="h-4 w-4" />
          <span className="text-lg font-semibold">Measured in selected window</span>
        </div>
      </Card>

      <Card className="p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.34em] text-muted-foreground">Merged PRs</div>
        <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.05em]">{mergedPrs.toLocaleString()}</div>
        <div className="mt-4 flex items-center gap-2 text-secondary">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-lg font-semibold">{mergeRate.toFixed(1)}% success rate</span>
        </div>
      </Card>

      <Card className="p-6 md:p-8">
        <div className="text-xs uppercase tracking-[0.34em] text-muted-foreground">Avg. Duration</div>
        <div className="mt-4 font-display text-5xl font-extrabold tracking-[-0.05em]">{formatDurationDays(averageDurationHours)}</div>
        <div className="mt-4 flex items-center gap-2 text-tertiary">
          <Clock3 className="h-4 w-4" />
          <span className="text-lg font-semibold">Cycle time from open to merge</span>
        </div>
      </Card>
    </div>
  );
}
