import { Card } from "@/components/ui/card";
import { cn, getGitHubPullListUrl } from "@/lib/utils";

interface StatusData {
  inReview: number;
  draft: number;
  merged: number;
}

export function StatusComposition({
  current,
  previous,
  repository,
  timeWindow
}: {
  current: StatusData;
  previous: StatusData;
  repository: { url: string };
  timeWindow: { start: Date; end: Date };
}) {
  const blocks = [
    { label: "In Review", value: current.inReview, prev: previous.inReview, color: "bg-primary", state: "inReview" as const },
    { label: "Draft", value: current.draft, prev: previous.draft, color: "bg-secondary", state: "draft" as const },
    { label: "Merged", value: current.merged, prev: previous.merged, color: "bg-tertiary", state: "merged" as const }
  ];

  return (
    <div className="min-w-0">
      <h3 className="font-display text-2xl font-bold tracking-[-0.04em]">Status Composition</h3>
      <div className="mt-4 grid gap-px bg-background/60 md:grid-cols-3">
        {blocks.map((block) => {
          const diff = block.value - block.prev;

          return (
            <Card key={block.label} className="min-w-0 p-6 text-center">
              <a
                href={getGitHubPullListUrl(repository, { state: block.state, window: timeWindow })}
                target="_blank"
                rel="noreferrer"
                className="block rounded-sm transition hover:bg-surface-high/20"
              >
                <div className={`mx-auto h-2 w-20 rounded-sm ${block.color}`} />
                <div className="mt-6 font-display text-5xl font-extrabold tracking-[-0.04em]">{block.value}%</div>
                <div className="mt-2 text-sm uppercase tracking-[0.2em] text-muted-foreground">{block.label}</div>
                {diff !== 0 && (
                  <div
                    className={cn(
                      "mt-3 text-xs font-medium",
                      diff > 0 ? "text-muted-foreground" : "text-muted-foreground"
                    )}
                  >
                    {diff > 0 ? "+" : "−"}{Math.abs(diff)}pp vs prev
                  </div>
                )}
              </a>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
