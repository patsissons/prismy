import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function Card({
  className,
  children
}: {
  className?: string;
  children: ReactNode;
}) {
  return <section className={cn("rounded bg-surface-low", className)}>{children}</section>;
}
