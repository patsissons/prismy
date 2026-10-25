import { Info } from "lucide-react";
import type { SyncState } from "@shared/types";
import { Button } from "@/components/ui/button";
import { formatDate, formatInt } from "@/lib/utils";

/** Explains partial data: a cap or a day with too many PRs for search. */
export function CoverageBanner({
  state,
  windowFrom,
  onLoadMore,
  canLoadMore,
}: {
  state: SyncState | undefined;
  windowFrom: string;
  onLoadMore?: () => void;
  canLoadMore?: boolean;
}) {
  if (!state || !state.truncated) return null;
  const capped =
    state.cap > 0 &&
    state.coveredFrom !== null &&
    state.coveredFrom > windowFrom.slice(0, 10);
  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-(--status-warning)/40 bg-(--status-warning)/10 px-4 py-3 text-sm sm:flex-row sm:items-center"
    >
      <Info aria-hidden className="size-4 shrink-0 text-(--status-warning)" />
      <p className="flex-1">
        {capped ? (
          <>
            Showing the newest {formatInt(state.cap)} pull requests, back to{" "}
            {formatDate(state.coveredFrom!)}. Everyone's numbers cover the same
            shorter span, so comparisons stay fair.
          </>
        ) : (
          <>
            GitHub search returns at most 1,000 results per day, so some days
            are incomplete.
          </>
        )}
      </p>
      {capped && onLoadMore ? (
        <Button
          variant="outline"
          size="sm"
          onClick={onLoadMore}
          disabled={!canLoadMore}
        >
          Load 1,000 more
        </Button>
      ) : null}
    </div>
  );
}
