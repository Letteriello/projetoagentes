
"use client";

import { useActionState } from "react";
import { getAgentConfigurationSuggestion } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2, ClipboardCopy } from "lucide-react"; // Adicionado ClipboardCopy
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initialState = {
  message: "",
};

function SubmitButton({ isPending }: { isPending: boolean }) {
  return (
    <Button type="submit" disabled={isPending} aria-disabled={isPending}>
      {isPending ? "Obtendo Sugestão..." : "Obter Sugestão"}
    </Button>
  );
}

export function AiAssistantForm() {
  const [state, formAction, isPending] = useActionState(getAgentConfigurationSuggestion, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.suggestedConfiguration || state.message === "Sugestão recebida com sucesso!") {
         if (formRef.current && !state.errors) { 
          toast({
            title: "Sucesso!",
            description: state.message,
            variant: "default",
            action: <CheckCircle2 className="text-green-500" />,
          });
        }
      } else if (state.errors || state.message !== "Sugestão recebida com sucesso!") {
         toast({
          title: "Erro",
          description: state.message,
          variant: "destructive",
          action: <AlertCircle className="text-white" />,
        });
      }
    }
  }, [state, toast]);

  const handleCopyConfiguration = () => {
    if (state.suggestedConfiguration) {
      navigator.clipboard.writeText(state.suggestedConfiguration)
        .then(() => {
          toast({ title: "Copiado!", description: "Configuração sugerida copiada para a área de transferência." });
        })
        .catch(err => {
          toast({ title: "Falha ao copiar", description: "Não foi possível copiar a configuração.", variant: "destructive" });
          console.error('Failed to copy: ', err);
        });
    }
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Descreva o Objetivo do Seu Agente</CardTitle>
          <CardDescription>
            Forneça uma descrição detalhada da tarefa que seu agente precisa realizar. Quanto mais específico você for, melhor a IA poderá ajudar com sugestões de configuração.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="taskGoal">Objetivo da Tarefa</Label>
            <Textarea
              id="taskGoal"
              name="taskGoal"
              placeholder="ex: 'Criar um agente que responda automaticamente a perguntas de clientes sobre o status de pedidos por e-mail, buscando informações em nossa loja Shopify.'"
              rows={5}
              required
              className="mt-1"
            />
            {state.errors?.taskGoal && (
              <p className="text-sm text-destructive mt-1">{state.errors.taskGoal.join(", ")}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton isPending={isPending} />
        </CardFooter>
      </Card>

      {state.suggestedConfiguration && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração Sugerida</CardTitle>
            <CardDescription>Com base no seu objetivo de tarefa, aqui está uma sugestão de configuração.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Textarea
                readOnly
                value={state.suggestedConfiguration}
                rows={10}
                className="font-mono text-sm bg-muted/40 p-4 rounded-md pr-12" // Added pr-12 for button space
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-7 w-7"
                onClick={handleCopyConfiguration}
                aria-label="Copiar configuração"
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
       {state.message && !state.suggestedConfiguration && state.errors && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Erro</AlertTitle>
           <AlertDescription>{state.message}</AlertDescription>
         </Alert>
       )}
    </form>
  );
}

    