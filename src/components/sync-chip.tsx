import {
  AlertTriangle,
  Check,
  Loader2,
  PauseCircle,
  RefreshCw,
} from "lucide-react";
import type { SyncHandle } from "@/hooks/use-sync";
import { cn, formatInt, formatRelative } from "@/lib/utils";

/** The sync status for the current source, with a retry when it failed. */
export function SyncChip({ sync, now }: { sync: SyncHandle; now: Date }) {
  const { state, progress, running, error } = sync;
  const base =
    "inline-flex h-9 max-w-full items-center gap-2 rounded-full border bg-card px-3 text-sm text-muted-foreground";

  if (error) {
    return (
      <div role="status" className={cn(base, "text-destructive")}>
        <AlertTriangle aria-hidden className="size-4 shrink-0" />
        <span className="truncate">{error}</span>
        <button
          type="button"
          onClick={sync.restart}
          className="inline-flex cursor-pointer items-center gap-1 rounded-full px-1.5 text-foreground hover:underline"
        >
          <RefreshCw aria-hidden className="size-3.5" />
          Retry
        </button>
      </div>
    );
  }

  if (progress?.phase === "paused" && progress.resumeAt) {
    return (
      <div role="status" className={base}>
        <PauseCircle aria-hidden className="size-4 shrink-0" />
        <span className="truncate">
          Rate limited, resuming {formatRelative(progress.resumeAt, now)}
        </span>
      </div>
    );
  }

  if (running) {
    const counted = progress && progress.expected > 0;
    return (
      <div role="status" aria-live="polite" className={base}>
        <Loader2
          aria-hidden
          className="size-4 shrink-0 animate-spin text-primary"
        />
        <span className="truncate">
          {counted
            ? `Syncing ${formatInt(progress.loaded)} of ${formatInt(progress.expected)}`
            : "Syncing…"}
        </span>
      </div>
    );
  }

  if (state?.lastSyncAt) {
    return (
      <div role="status" className={base}>
        <Check aria-hidden className="size-4 shrink-0 text-success" />
        <span className="truncate">
          Synced {formatRelative(state.lastSyncAt, now)}
        </span>
      </div>
    );
  }

  return null;
}
