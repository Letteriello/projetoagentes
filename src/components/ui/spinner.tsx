import * as React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "small" | "medium" | "large";
}

export function Spinner({ className, size = "medium", ...props }: SpinnerProps) { // Default to medium
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-5 w-5 border-2",
    large: "h-8 w-8 border-[3px]", // Example: larger spinner with thicker border
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-current border-t-transparent",
        sizeClasses[size], // Apply size class
        className,
      )}
      {...props}
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
