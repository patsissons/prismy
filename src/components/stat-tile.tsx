import {
  ArrowDownRight,
  ArrowUpRight,
  ExternalLink,
  Minus,
} from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn, type Delta } from "@/lib/utils";

/**
 * A headline number with an optional change vs the prior period. The delta's
 * colour follows whether up is good, and an arrow carries the direction so
 * colour is never alone.
 */
export function StatTile({
  label,
  value,
  detail,
  delta,
  higherIsBetter = true,
  href,
  children,
}: {
  label: string;
  value: string;
  detail?: ReactNode;
  delta?: Delta | null;
  higherIsBetter?: boolean;
  /** Opens the PRs behind the number on GitHub. */
  href?: string;
  children?: ReactNode;
}) {
  const good =
    delta && delta.direction !== "flat"
      ? (delta.direction === "up") === higherIsBetter
      : null;
  const Arrow =
    delta?.direction === "up"
      ? ArrowUpRight
      : delta?.direction === "down"
        ? ArrowDownRight
        : Minus;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {href ? (
          <ExternalLink
            aria-hidden
            className="size-3.5 shrink-0 text-muted-foreground/60 transition group-hover/tile:text-foreground"
          />
        ) : null}
      </div>
      <div className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
        {value}
      </div>
      <div className="mt-2 flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {delta ? (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              good === true && "text-(--status-good-text)",
              good === false && "text-destructive",
              good === null && "text-muted-foreground",
            )}
          >
            <Arrow aria-hidden className="size-4" />
            {delta.text}
            <span className="sr-only"> vs prior period</span>
          </span>
        ) : null}
        {detail ? (
          <span className="text-muted-foreground">{detail}</span>
        ) : null}
      </div>
      {children}
    </>
  );

  return (
    <Card size="sm" className="group/tile px-4 py-4">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="-m-4 block rounded-xl p-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          aria-label={`${label}: ${value}. Open on GitHub`}
        >
          {body}
        </a>
      ) : (
        body
      )}
    </Card>
  );
}
