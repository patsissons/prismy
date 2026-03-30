import { Card } from "@/components/ui/card";
import type { UserSummary } from "@/lib/types";
import { formatDurationDays, getGitHubPullListUrl, getGitHubUserUrl, initialsFromName } from "@/lib/utils";

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
          <div className="flex items-start gap-4">
            <div
              className="grid h-14 w-14 place-items-center rounded-sm text-lg font-semibold"
              style={{ backgroundColor: `${summary.color}20`, color: summary.color }}
            >
              {initialsFromName(summary.name)}
            </div>
            <div className="flex-1">
              <a href={getGitHubUserUrl(summary.login)} target="_blank" rel="noreferrer" className="block hover:text-primary">
                <div className="text-2xl font-semibold tracking-[-0.04em]">{summary.name}</div>
              </a>
              <a
                href={getGitHubUserUrl(summary.login)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-sm uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
              >
                @{summary.login}
              </a>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <Stat
              label="Created"
              value={summary.created.toString()}
              href={getGitHubPullListUrl(repository, { authorLogin: summary.login, metric: "created", window: timeWindow })}
            />
            <Stat
              label="Merged"
              value={summary.merged.toString()}
              href={getGitHubPullListUrl(repository, { authorLogin: summary.login, metric: "merged", window: timeWindow })}
            />
            <Stat
              label="Avg. Time"
              value={formatDurationDays(summary.averageDurationHours)}
              href={getGitHubPullListUrl(repository, { authorLogin: summary.login, metric: "duration", window: timeWindow })}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block rounded-sm bg-surface-high p-3 transition hover:bg-surface-bright focus:bg-surface-bright focus:outline-none"
    >
      <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-[-0.04em]">{value}</div>
    </a>
  );
}
