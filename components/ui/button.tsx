import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-transparent font-body text-sm font-semibold tracking-[0.18em] uppercase transition duration-150 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-pr-ism-cta text-primary-foreground hover:brightness-105",
        secondary: "bg-surface-high text-foreground hover:bg-surface-bright",
        ghost: "bg-transparent text-primary hover:bg-surface-high/80",
        outline: "border border-border/20 bg-surface-low text-foreground hover:bg-surface-high"
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-5"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (
  <button ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />
));

Button.displayName = "Button";

export { Button, buttonVariants };
