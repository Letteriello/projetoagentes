import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-spacing-sm whitespace-nowrap rounded-md text-font-size-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-spacing-md [&_svg]:shrink-0 focus-visible:animate-pulse-button-glow",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-spacing-2xl px-spacing-md py-spacing-sm",
        sm: "h-spacing-xl-plus rounded-md px-spacing-sm-plus-plus",
        lg: "h-spacing-3xl rounded-md px-spacing-lg py-spacing-sm-plus-plus",
        icon: "h-spacing-2xl w-spacing-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

import { Loader2 } from "lucide-react"; // Assuming Loader2 is available for loading spinner

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  loading?: boolean;
  loadingText?: string; // Optional text to show when loading
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      startIcon,
      endIcon,
      loading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    const iconBaseClasses = "size-spacing-md shrink-0"; // Consistent icon sizing

    // Determine what content to show based on loading state
    let buttonContent;
    if (loading) {
      buttonContent = (
        <>
          <Loader2 className={cn(iconBaseClasses, "animate-spin")} />
          {loadingText && <span>{loadingText}</span>}
          {!loadingText && children && typeof children === 'string' && <span>{children}</span>}
          {/* If children is not a string (e.g. complex ReactNode) and no loadingText, it might be hidden or handled differently */}
        </>
      );
    } else {
      buttonContent = (
        <>
          {startIcon && <span className={iconBaseClasses}>{startIcon}</span>}
          {/* Render children only if it's not just whitespace or empty, or if icons are not present (to allow empty buttons if needed) */}
          {(typeof children === 'string' && children.trim() !== '') || (typeof children !== 'string' && children) || (!startIcon && !endIcon) ? (
            <span>{children}</span>
          ) : null}
          {endIcon && <span className={iconBaseClasses}>{endIcon}</span>}
        </>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }), "active:animate-press-down")}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
