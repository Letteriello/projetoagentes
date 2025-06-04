import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  // DialogClose, // Not explicitly needed if default X button in DialogContent is used
} from '@/components/ui/dialog'; // Corrected import path
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
// X icon might not be needed if Shadcn DialogContent's default X is used
// import { X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
  size = 'md',
  isTutorial,
  currentStep,
  totalSteps,
  onNextStep,
  onPrevStep,
}) => {
  // No need for `if (!isOpen) return null;` as Dialog handles visibility via its `open` prop.

  const sizeClasses = {
    sm: 'max-w-lg', // Shadcn default is max-w-lg, so 'sm' might be redundant or adjust as needed
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        className={sizeClasses[size]}
        onEscapeKeyDown={onClose} // Keep escape key behavior
        // onClick={(e) => e.stopPropagation()} // DialogContent already handles this
      >
        {/* Header */}
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {/* The X button is part of DialogContent by default in Shadcn
              If a custom X button placement or style was critical,
              we might need DialogClose and custom styling here.
              For now, relying on default Shadcn X button.
          */}
        </DialogHeader>

        {/* Body with ScrollArea */}
        {/*
          Shadcn DialogContent usually has its own padding (p-6 in default).
          The ScrollArea might need adjustment if padding is conflicting.
          The original HelpModal had p-4/p-6 on ScrollArea's parent and then on ScrollArea itself.
          Let's assume DialogContent's padding is sufficient for the outer spacing.
          The `prose` div should be inside ScrollArea for text styling.
        */}
        <ScrollArea className="max-h-[60vh] md:max-h-[70vh] pr-6"> {/* Added pr-6 to account for scrollbar with DialogContent padding */}
          <div className="prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-none dark:prose-invert">
            {children}
          </div>
        </ScrollArea>

        {/* Footer (Optional) */}
        {(footerContent || isTutorial) && ( // Simplified condition: if either exists, render footer
          <DialogFooter className="pt-4"> {/* Added pt-4 for spacing from scrollarea */}
            {isTutorial ? (
              <>
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
              </>
            ) : (
              footerContent // Render generic footer content if not a tutorial
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
