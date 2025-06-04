"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface FeedbackModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

type FeedbackType = "bug" | "suggestion" | "comment";

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const [feedbackText, setFeedbackText] = React.useState("");
  const [feedbackType, setFeedbackType] = React.useState<FeedbackType>("comment");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Feedback Vazio",
        description: "Por favor, escreva seu feedback antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback: feedbackText,
          type: feedbackType,
          timestamp: new Date().toISOString(),
          context: {
            page: window.location.pathname,
            // You could add more context here, like user agent, screen size, etc.
          },
        }),
      });

      if (response.ok) {
        toast({
          title: "Feedback Enviado!",
          description: "Obrigado pelo seu feedback.",
        });
        setFeedbackText("");
        setFeedbackType("comment");
        onOpenChange(false); // Close the modal
      } else {
        const errorData = await response.json();
        toast({
          title: "Erro ao Enviar Feedback",
          description: `Ocorreu um problema: ${errorData.message || response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast({
        title: "Erro ao Enviar Feedback",
        description: "Não foi possível conectar ao servidor. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="feedback-type" className="text-right">
              Tipo
            </Label>
            <Select
              value={feedbackType}
              onValueChange={(value) => setFeedbackType(value as FeedbackType)}
            >
              <SelectTrigger id="feedback-type" className="col-span-3">
                <SelectValue placeholder="Selecione o tipo de feedback" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comment">Comentário Geral</SelectItem>
                <SelectItem value="suggestion">Sugestão</SelectItem>
                <SelectItem value="bug">Relatar Problema</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="feedback-text" className="text-right pt-2 self-start">
              Feedback
            </Label>
            <Textarea
              id="feedback-text"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Descreva seu problema, sugestão ou comentário..."
              className="col-span-3 min-h-[100px]"
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>
              Cancelar
            </Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
