import React from 'react';
import { Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InfoIconProps {
  tooltipText: string;
  onClick?: () => void;
  iconSize?: number;
  className?: string;
}

export const InfoIcon: React.FC<InfoIconProps> = ({ tooltipText, onClick, iconSize = 16, className }) => {
  const icon = <Info size={iconSize} className={className} />;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          {onClick ? (
            <button
              type="button"
              onClick={onClick}
              className="p-0.5 rounded-full hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
              aria-label="More info"
            >
              {icon}
            </button>
          ) : (
            <span className="inline-flex items-center p-0.5">{icon}</span>
          )}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs bg-background text-foreground border-border">
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
