// src/components/features/agent-builder/tabs/evaluation-security-tab.tsx
import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea'; // Using Textarea for keywords for simplicity
import { InfoIcon } from '@/components/ui/InfoIcon';
import { type SavedAgentConfiguration } from '@/types/agent-configs'; // Updated import path
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck } from "lucide-react";


const EvaluationSecurityTab: React.FC = () => {
  const { control, watch } = useFormContext<SavedAgentConfiguration>();

  // const currentGuardrails = watch('config.evaluationGuardrails'); // Can be used for conditional rendering if needed

  return (
    <div className="space-y-6">
       <Alert variant="default" className="mt-2">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>Segurança e Avaliação</AlertTitle>
        <AlertDescription>
          Defina "guardrails" para guiar o comportamento do agente durante as avaliações e garantir a segurança.
          Estas configurações serão usadas por um serviço de avaliação (simulado) para verificar a conformidade do agente.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Guardrails de Avaliação</CardTitle>
          <CardDescription>Configure regras para o comportamento do agente durante a avaliação.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormField
            control={control}
            name="config.evaluationGuardrails.checkForToxicity"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Verificar Conteúdo Tóxico (Simulado)</FormLabel>
                  <FormDescription>
                    Habilita uma verificação simulada por IA para conteúdo prejudicial ou tóxico nas respostas do agente.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value || false}
                    onCheckedChange={field.onChange}
                    id="checkForToxicitySwitch" // Added id for label association if needed by testing library
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="config.evaluationGuardrails.maxResponseLength"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  Comprimento Máximo da Resposta
                  <InfoIcon
                    className="ml-2"
                    tooltip="Define o número máximo de caracteres que uma resposta do agente pode ter durante a avaliação."
                  />
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 500"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                  />
                </FormControl>
                <FormDescription>
                  Deixe em branco para não impor um limite de comprimento.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="config.evaluationGuardrails.prohibitedKeywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  Palavras-chave Proibidas na Resposta
                  <InfoIcon
                    className="ml-2"
                    tooltip="Lista de palavras ou frases que não devem aparecer nas respostas do agente. Separe por vírgulas."
                  />
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: confidencial, segredo, não posso dizer"
                    value={Array.isArray(field.value) ? field.value.join(', ') : ''}
                    onChange={(e) => {
                      const keywords = e.target.value.split(',').map(kw => kw.trim()).filter(kw => kw !== '');
                      field.onChange(keywords);
                    }}
                    rows={3}
                  />
                </FormControl>
                <FormDescription>
                  Separe as palavras-chave ou frases por vírgula. A verificação não diferencia maiúsculas de minúsculas.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationSecurityTab;
