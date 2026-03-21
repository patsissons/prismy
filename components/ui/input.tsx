import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-12 w-full rounded-sm border-0 border-b-2 border-transparent bg-input px-4 py-3 font-body text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:bg-surface-bright",
      className
    )}
    {...props}
  />
));

Input.displayName = "Input";

export { Input };
