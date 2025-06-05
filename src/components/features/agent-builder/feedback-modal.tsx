"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FeedbackModalProps {
  name: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function FeedbackModal({
  name,
  isOpen,
  onOpenChange
}: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = React.useState("suggestion");
  const [feedbackText, setFeedbackText] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!feedbackText.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simulação de envio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Limpar formulário e fechar modal
      setFeedbackText("");
      setFeedbackType("suggestion");
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="feedbackType" className="text-right">
              Tipo
            </Label>
            <Select
              value={feedbackType}
              onValueChange={setFeedbackType}
            >
              <SelectTrigger className="col-span-3" id="feedbackType">
                <SelectValue placeholder="Selecione o tipo de feedback" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="suggestion">Sugestão</SelectItem>
                <SelectItem value="bug">Problema</SelectItem>
                <SelectItem value="question">Pergunta</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="feedback" className="text-right">
              Mensagem
            </Label>
            <Textarea
              id="feedback"
              placeholder="Descreva seu feedback em detalhes..."
              className="col-span-3 min-h-[120px]"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !feedbackText.trim()}>
            {isSubmitting ? "Enviando..." : "Enviar Feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}