import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming ScrollArea is available

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode; // For rich content
  footerContent?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Optional size prop
  isTutorial?: boolean;
  currentStep?: number;
  totalSteps?: number;
  onNextStep?: () => void;
  onPrevStep?: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerContent,
  size = 'md', // Default size
  isTutorial,
  currentStep,
  totalSteps,
  onNextStep,
  onPrevStep,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-lg',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`bg-card text-card-foreground rounded-lg shadow-2xl flex flex-col overflow-hidden m-4 ${sizeClasses[size]} w-full`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body with ScrollArea */}
        <ScrollArea className="flex-grow p-4 md:p-6 max-h-[70vh]">
          <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert">
            {children}
          </div>
        </ScrollArea>

        {/* Footer (Optional) */}
        {footerContent && !isTutorial && (
          <div className="flex justify-end space-x-3 p-4 md:p-6 border-t border-border bg-muted/50">
            {footerContent}
          </div>
        )}
        {isTutorial && (
          <div className="flex justify-between items-center p-4 md:p-6 border-t border-border bg-muted/50">
            <div>
              {typeof currentStep === 'number' && typeof totalSteps === 'number' && (
                <p className="text-sm text-muted-foreground">
                  Step {currentStep + 1} of {totalSteps}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onPrevStep} disabled={currentStep === 0}>
                Previous
              </Button>
              <Button onClick={onNextStep} disabled={currentStep === (totalSteps || 0) - 1}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
