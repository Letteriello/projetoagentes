import React from 'react';
import { Wand2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  // TooltipProvider, // Ensure this is used by parent, typically at a higher level
} from '@/components/ui/tooltip';

interface AISuggestionIconProps {
  onClick: () => void;
  isLoading: boolean;
  tooltipText?: string;
  size?: number;
  className?: string;
}

const AISuggestionIcon: React.FC<AISuggestionIconProps> = ({
  onClick,
  isLoading,
  tooltipText = "Obter sugestão da IA", // Default tooltip
  size = 16,
  className,
}) => {
  // If isLoading, show Loader2, otherwise Wand2.
  const icon = isLoading ? (
    <Loader2 className="animate-spin" style={{ width: size, height: size }} />
  ) : (
    <Wand2 style={{ width: size, height: size }} />
  );

  const buttonContent = (
    <Button
      type="button" // Important to prevent form submission if it's inside a form
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={isLoading}
      className={className} // Apply any additional class names
    >
      {icon}
      <span className="sr-only">{tooltipText}</span> {/* For screen readers */}
    </Button>
  );

  if (tooltipText) {
    // TooltipProvider should be present at a higher level in the component tree.
    // It's generally not recommended to nest TooltipProviders.
    // AgentBuilderDialog or a similar parent should wrap content with TooltipProvider.
    return (
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return buttonContent; // Return button without tooltip if no tooltipText is provided
};

export default AISuggestionIcon;
