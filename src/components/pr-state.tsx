import {
  CircleDot,
  GitMerge,
  GitPullRequestDraft,
  XCircle,
} from "lucide-react";
import type { PrRecord } from "@shared/types";
import { cn } from "@/lib/utils";

/** Icon + text for a PR's state; colour never carries it alone. */
export function PrState({
  pr,
  className,
}: {
  pr: PrRecord;
  className?: string;
}) {
  const spec =
    pr.state === "MERGED"
      ? { Icon: GitMerge, label: "Merged", color: "text-primary" }
      : pr.state === "CLOSED"
        ? { Icon: XCircle, label: "Closed", color: "text-muted-foreground" }
        : pr.isDraft
          ? {
              Icon: GitPullRequestDraft,
              label: "Draft",
              color: "text-muted-foreground",
            }
          : {
              Icon: CircleDot,
              label: "Open",
              color: "text-(--status-good-text)",
            };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        spec.color,
        className,
      )}
    >
      <spec.Icon aria-hidden className="size-3.5" />
      {spec.label}
    </span>
  );
}
