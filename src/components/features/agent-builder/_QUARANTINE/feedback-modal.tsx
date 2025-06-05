"use client";

import * as React from "react";
import { toast } from "@/hooks/use-toast";
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
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: feedbackType,
          feedback: feedbackText,
          timestamp: new Date().toISOString(),
          context: { agentName: name }
        }),
      });

      // Try to parse JSON regardless of response.ok, as server might send error details in JSON
      let jsonResponse;
      try {
        jsonResponse = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, and response was not ok, it's likely a server error not sending JSON
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        // If response was ok but JSON parsing failed, this is unexpected.
        jsonResponse = { success: false, error: "Falha ao processar a resposta do servidor." };
      }

      if (response.ok && jsonResponse.success) {
        toast({
          variant: "success",
          title: "Feedback Enviado!",
          description: "Obrigado pelo seu feedback.",
        });
        setFeedbackText("");
        setFeedbackType("suggestion"); // Reset to default
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao Enviar Feedback",
          description: jsonResponse?.error || "Não foi possível enviar seu feedback. Tente novamente mais tarde.",
        });
      }
    } catch (error: any) { // Added type assertion for error
      console.error("Erro ao enviar feedback:", error);
      toast({
        variant: "destructive",
        title: error.message?.includes("Server error") ? "Erro no Servidor" : "Erro de Rede",
        description: error.message?.includes("Server error") ? error.message : "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
      });
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