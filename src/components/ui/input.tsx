import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  actionIcon?: React.ReactNode;
  onActionClick?: React.MouseEventHandler<HTMLButtonElement>;
  actionButtonAriaLabel?: string;
  actionButtonClassName?: string;
  inputWrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      actionIcon,
      onActionClick,
      actionButtonAriaLabel,
      actionButtonClassName,
      inputWrapperClassName,
      ...props
    },
    ref,
  ) => {
    const hasAction = actionIcon && onActionClick;

    return (
      <div
        className={cn(
          "relative flex items-center w-full",
          inputWrapperClassName,
        )}
      >
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            hasAction ? "pr-10" : "", // Add padding-right if action button is present
            className,
          )}
          ref={ref}
          {...props}
        />
        {hasAction && (
          <button
            type="button"
            onClick={onActionClick}
            aria-label={actionButtonAriaLabel}
            className={cn(
              "absolute right-0 top-0 flex items-center justify-center h-full w-10 text-muted-foreground hover:text-foreground",
              actionButtonClassName,
            )}
          >
            {actionIcon}
          </button>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
