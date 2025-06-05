import * as React from "react";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormFieldWithTooltipProps {
  label: string;
  tooltipText: string;
  htmlFor?: string;
  labelClassName?: string;
  children: React.ReactNode;
}

export function FormFieldWithTooltip({
  label,
  tooltipText,
  htmlFor,
  labelClassName = "text-xs", // Default class for label
  children,
}: FormFieldWithTooltipProps) {
  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Label htmlFor={htmlFor} className={labelClassName}>
              {label}
            </Label>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {children}
    </div>
  );
}
