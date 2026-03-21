import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm bg-surface-high px-3 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.22em] text-foreground/88",
        className
      )}
    >
      {children}
    </span>
  );
}
