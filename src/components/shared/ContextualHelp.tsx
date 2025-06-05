"use client";

import * as React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { LucideProps } from 'lucide-react'; // For icon type

interface ContextualHelpProps {
  type: 'tooltip' | 'alert';
  content: React.ReactNode;
  show: boolean;
  tooltipTrigger?: React.ReactNode;
  tooltipSide?: "top" | "right" | "bottom" | "left";
  alertTitle?: string;
  alertVariant?: 'default' | 'destructive';
  icon?: React.ReactNode; // React.ReactElement<LucideProps> or similar
}

const ContextualHelp: React.FC<ContextualHelpProps> = ({
  type,
  content,
  show,
  tooltipTrigger,
  tooltipSide,
  alertTitle,
  alertVariant = 'default',
  icon,
}) => {
  if (!show) {
    return null;
  }

  if (type === 'tooltip') {
    if (!tooltipTrigger) {
      console.warn("ContextualHelp: tooltipTrigger is required when type is 'tooltip'.");
      return null;
    }
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{tooltipTrigger}</TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            {content}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (type === 'alert') {
    return (
      <Alert variant={alertVariant} className="mt-4">
        {icon && <span className="mr-2 h-4 w-4">{icon}</span>}
        {alertTitle && <AlertTitle>{alertTitle}</AlertTitle>}
        <AlertDescription>{content}</AlertDescription>
      </Alert>
    );
  }

  return null;
};

export default ContextualHelp;
