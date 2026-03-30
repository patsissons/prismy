import { Card } from "@/components/ui/card";
import type { UserSummary } from "@/lib/types";
import { formatDurationDays, getGitHubPullListUrl, initialsFromName } from "@/lib/utils";

export function TeamSummary({
  summaries,
  repository,
  metric,
  timeWindow
}: {
  summaries: UserSummary[];
  repository: { url: string };
  metric: "created" | "merged" | "duration";
  timeWindow: { start: Date; end: Date };
}) {
  return (
    <div className="grid gap-px bg-background/60 lg:grid-cols-2 xl:grid-cols-3">
      {summaries.map((summary) => (
        <Card key={summary.login} className="p-5">
          <a
            href={getGitHubPullListUrl(repository, { authorLogin: summary.login, metric, window: timeWindow })}
            target="_blank"
            rel="noreferrer"
            className="block h-full rounded-sm transition hover:bg-surface-high/30 focus:bg-surface-high/30 focus:outline-none"
          >
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
          </a>
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
