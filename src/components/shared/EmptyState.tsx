import * as React from 'react';
import { Button, ButtonProps } from '@/components/ui/button'; // Assuming ButtonProps is exported
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  title: string;
  description: React.ReactNode;
  icon?: React.ReactNode;
  actionButton?: {
    text: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: ButtonProps['variant'];
    size?: ButtonProps['size'];
    className?: string; // Allow custom className for the button
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionButton,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-6 rounded-lg border border-dashed shadow-sm", // Added border and shadow for better distinction
        "max-w-md mx-auto min-h-[300px]", // Example sizing, adjust as needed
        className,
      )}
    >
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {/* Ensure icon has appropriate size, e.g., by applying classes to it when passed */}
          {/* Or define a standard size here, e.g., className="h-16 w-16" */}
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: cn("h-16 w-16 text-gray-400", (icon.props as any)?.className) }) : icon}
        </div>
      )}
      <h2 className="text-xl font-semibold mb-2 text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground mb-6">
        {typeof description === 'string' ? <p>{description}</p> : description}
      </div>
      {actionButton && (
        <Button
          variant={actionButton.variant || 'default'}
          size={actionButton.size || 'default'}
          onClick={actionButton.onClick}
          className={cn(actionButton.className)}
        >
          {actionButton.icon && <span className="mr-2">{actionButton.icon}</span>}
          {actionButton.text}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
