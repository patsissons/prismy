import { Card } from "@/components/ui/card";
import type { PullRequestRecord } from "@/lib/types";
import { formatDurationDays, formatRelativeTime, getGitHubPullListUrl, getGitHubUserUrl } from "@/lib/utils";

export function HistoryFeed({
  records,
  repository,
  timeWindow
}: {
  records: PullRequestRecord[];
  repository: { url: string };
  timeWindow: { start: Date; end: Date };
}) {
  return (
    <div>
      <h3 className="font-display text-2xl font-bold tracking-[-0.04em]">Recent Pull Requests</h3>
      <div className="mt-4 overflow-hidden rounded bg-surface-low">
        <div className="hidden grid-cols-[1.6fr_0.7fr_0.7fr_0.6fr] gap-px bg-background/60 px-4 py-3 text-xs uppercase tracking-[0.22em] text-muted-foreground md:grid">
          <div>Pull Request</div>
          <div>Author</div>
          <div>State</div>
          <div>Cycle Time</div>
        </div>
        <div className="space-y-px bg-background/40">
          {records.length ? (
            records.map((record) => (
              <Card key={record.id} className="grid gap-4 p-4 md:grid-cols-[1.6fr_0.7fr_0.7fr_0.6fr] md:items-center">
                <div>
                  <a href={record.htmlUrl} target="_blank" rel="noreferrer" className="text-xl font-semibold tracking-[-0.04em] hover:text-primary">
                    {record.title}
                  </a>
                  <div className="mt-1 text-sm text-muted-foreground">
                    #{record.number} opened {formatRelativeTime(record.createdAt)}
                  </div>
                </div>
                <div>
                  <a
                    href={getGitHubUserUrl(record.authorLogin)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm uppercase tracking-[0.18em] text-muted-foreground hover:text-primary"
                  >
                    {record.authorName}
                  </a>
                </div>
                <div>
                  <a
                    href={getGitHubPullListUrl(repository, { state: record.state === "open" ? "inReview" : record.state })}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm uppercase tracking-[0.18em] text-foreground/82 hover:text-primary"
                  >
                    {record.state}
                  </a>
                </div>
                <div className="text-sm uppercase tracking-[0.18em] text-foreground/82">
                  {formatDurationDays(getDuration(record))}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-5 text-muted-foreground">No pull requests available for the current filters.</Card>
          )}
        </div>
      </div>
    </div>
  );
}

function getDuration(record: PullRequestRecord) {
  const end = record.mergedAt ?? record.closedAt ?? record.createdAt;
  return (new Date(end).getTime() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60);
}
