import { Card } from "@/components/ui/card";
import type { UserSummary } from "@/lib/types";
import { formatDurationDays, initialsFromName } from "@/lib/utils";

export function TeamSummary({ summaries }: { summaries: UserSummary[] }) {
  return (
    <div className="grid gap-px bg-background/60 lg:grid-cols-2 xl:grid-cols-3">
      {summaries.map((summary) => (
        <Card key={summary.login} className="p-5">
          <div className="flex items-start gap-4">
            <div
              className="grid h-14 w-14 place-items-center rounded-sm text-lg font-semibold"
              style={{ backgroundColor: `${summary.color}20`, color: summary.color }}
            >
              {initialsFromName(summary.name)}
            </div>
            <div className="flex-1">
              <div className="text-2xl font-semibold tracking-[-0.04em]">{summary.name}</div>
              <div className="mt-1 text-sm uppercase tracking-[0.18em] text-muted-foreground">@{summary.login}</div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Stat label="Created" value={summary.created.toString()} />
            <Stat label="Merged" value={summary.merged.toString()} />
            <Stat label="Avg. Time" value={formatDurationDays(summary.averageDurationHours)} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-surface-high p-3">
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</div>
    </div>
  );
}
