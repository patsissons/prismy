import { ArrowRight, Flame } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { PullRequestRecord } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

const accentByPriority = {
  critical: "bg-[#ff716c]",
  high: "bg-tertiary",
  normal: "bg-primary"
};

export function PriorityReviews({ items }: { items: PullRequestRecord[] }) {
  return (
    <div>
      <h3 className="font-display text-2xl font-bold tracking-[-0.04em]">Priority Reviews</h3>
      <div className="mt-4 space-y-1">
        {items.length ? (
          items.map((item) => (
            <Card key={item.id} className="flex items-center gap-4 p-4">
              <div className={`h-16 w-1 rounded-sm ${accentByPriority[item.reviewPriority]}`} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-2xl font-semibold tracking-[-0.04em]">{item.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  #{item.number} opened {formatRelativeTime(item.createdAt)} by {item.authorName}
                </div>
              </div>
              <a href={item.htmlUrl} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-sm bg-surface-high">
                <ArrowRight className="h-5 w-5" />
              </a>
            </Card>
          ))
        ) : (
          <Card className="flex items-center gap-3 p-5 text-muted-foreground">
            <Flame className="h-5 w-5 text-primary" />
            No open pull requests in the current filter window.
          </Card>
        )}
      </div>
    </div>
  );
}
