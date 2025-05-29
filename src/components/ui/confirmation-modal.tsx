"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: React.ReactNode; // Allow ReactNode for more flexible descriptions
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmButtonVariant?: ButtonProps["variant"];
  isConfirmDisabled?: boolean;
  isConfirmLoading?: boolean; // Added for loading state
  children?: React.ReactNode; // Optional trigger
}

// Minimal ButtonProps type to get variant
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: | "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | null;
  // Add other props if needed, like size
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmButtonVariant = "default",
  isConfirmDisabled = false,
  isConfirmLoading = false,
  children,
}) => {
  const handleConfirm = () => {
    if (isConfirmLoading) return;
    onConfirm();
    // Optionally close on confirm, or let parent decide by not calling onOpenChange(false) here
    // For now, let's assume parent handles closing if needed after onConfirm completes.
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>} {/* Optional trigger if not controlled externally */}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>
            {typeof description === "string" ? <p>{description}</p> : description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={isConfirmLoading}>{cancelText}</Button>
          </DialogClose>
          <Button
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={isConfirmDisabled || isConfirmLoading}
          >
            {isConfirmLoading ? "Processando..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
