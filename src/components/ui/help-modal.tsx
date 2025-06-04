import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

interface HelpModalProps {
  title?: string;
  children: React.ReactNode;
  triggerText?: string;
  triggerVariant?: "default" | "ghost" | "link" | "outline" | "secondary" | "destructive" | null | undefined;
  triggerClassName?: string;
}

export function HelpModal({
  title = "Ajuda",
  children,
  triggerText,
  triggerVariant = "ghost",
  triggerClassName = "",
}: HelpModalProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerText ? (
          <Button variant={triggerVariant} className={triggerClassName}>
            {triggerText}
          </Button>
        ) : (
          <Button variant={triggerVariant} size="icon" className={triggerClassName}>
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">Ajuda</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
