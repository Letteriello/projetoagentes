import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", // Adjusted padding and text size class
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: // Changed to use muted colors for less visual weight
          "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: // Softened border and text color
          "border-border/75 text-muted-foreground",
        minimal: // New minimal variant
          "border-transparent bg-muted/50 text-muted-foreground hover:bg-muted/70",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

// To maintain consistency with font size class name if it's a custom one:
// Original: text-font-size-xs. New: text-xs.
// If text-font-size-xs is different from Tailwind's text-xs, that needs to be considered.
// For this refactor, assuming text-xs is the intended standard small size.

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
