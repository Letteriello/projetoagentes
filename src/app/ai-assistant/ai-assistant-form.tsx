
"use client";

import { useActionState } from "react"; // Changed from useFormState and useFormStatus
import { getAgentConfigurationSuggestion } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef } from "react"; // Removed useFormState, useFormStatus. Kept useEffect, useRef. Added useActionState above.
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initialState = {
  message: "",
};

function SubmitButton({ isPending }: { isPending: boolean }) { // Accept isPending as a prop
  return (
    <Button type="submit" disabled={isPending} aria-disabled={isPending}>
      {isPending ? "Obtendo Sugestão..." : "Obter Sugestão"}
    </Button>
  );
}

export function AiAssistantForm() {
  const [state, formAction, isPending] = useActionState(getAgentConfigurationSuggestion, initialState); // Changed to useActionState
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.suggestedConfiguration || state.message === "Sugestão recebida com sucesso!") {
         if (formRef.current && !state.errors) { // Only show toast and reset if successful
          toast({
            title: "Sucesso!",
            description: state.message,
            variant: "default",
            action: <CheckCircle2 className="text-green-500" />,
          });
          // formRef.current.reset(); // Optional: reset form on success
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
          <SubmitButton isPending={isPending} /> {/* Pass isPending to SubmitButton */}
        </CardFooter>
      </Card>

      {state.suggestedConfiguration && (
        <Card>
          <CardHeader>
            <CardTitle>Configuração Sugerida</CardTitle>
            <CardDescription>Com base no seu objetivo de tarefa, aqui está uma configuração sugerida usando componentes do Google ADK.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={state.suggestedConfiguration}
              rows={10}
              className="font-mono text-sm bg-muted/50"
            />
          </CardContent>
          <CardFooter>
             <Button variant="outline" onClick={() => navigator.clipboard.writeText(state.suggestedConfiguration || '')}>
              Copiar Configuração
            </Button>
          </CardFooter>
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
