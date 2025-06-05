"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface HelpModalProps {
  name: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "full";
  isTutorial?: boolean;
  currentStep?: number;
  totalSteps?: number;
  onNextStep?: () => void;
  onPrevStep?: () => void;
}

export default function HelpModal({
  name,
  title,
  onClose,
  children,
  size = "md",
  isTutorial = false,
  currentStep = 0,
  totalSteps = 0,
  onNextStep,
  onPrevStep
}: HelpModalProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  // Mapear o tamanho para classes específicas
  const sizeClasses = {
    sm: "sm:max-w-[500px]",
    md: "sm:max-w-[650px]",
    lg: "sm:max-w-[800px]",
    full: "sm:max-w-[95vw] sm:h-[90vh]"
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      onClose();
    }
  };

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={`${sizeClasses[size]} overflow-y-auto max-h-[90vh]`}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="py-4">
          {children}
        </div>
        
        {isTutorial && (
          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-500">
              Passo {currentStep + 1} de {totalSteps}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onPrevStep}
                disabled={currentStep === 0}
              >
                Anterior
              </Button>
              <Button
                onClick={isLastStep ? onClose : onNextStep}
              >
                {isLastStep ? "Concluir" : "Próximo"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}