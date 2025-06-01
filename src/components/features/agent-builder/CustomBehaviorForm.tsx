// CustomBehaviorForm: Componente para o formulário de comportamento específico de agentes Customizados.
// Inclui um campo para a descrição da lógica customizada.

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form"; // MODIFIED
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SavedAgentConfiguration } from "@/types/agent-configs"; // MODIFIED
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"; // MODIFIED

// MODIFIED: No props needed
interface CustomBehaviorFormProps {}

const CustomBehaviorForm: React.FC<CustomBehaviorFormProps> = () => {
  const { control, formState: { errors } } = useFormContext<SavedAgentConfiguration>(); // MODIFIED

  return (
    <FormField
      control={control}
      name="config.customLogicDescription"
      render={({ field }) => (
        <FormItem className="space-y-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild><FormLabel htmlFor="config.customLogicDescription" className="cursor-help">Descrição da Lógica Customizada</FormLabel></TooltipTrigger>
              <TooltipContent className="w-80"><p>Descreva a funcionalidade principal. Se este agente invoca um fluxo Genkit específico, mencione o nome do fluxo. Detalhe como ele orquestra outros agentes ou ferramentas, se aplicável.</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <FormControl><Textarea id="config.customLogicDescription" placeholder="Descreva a lógica customizada..." {...field} rows={5}/></FormControl>
          <FormDescription>Detalhe o comportamento específico implementado.</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
export default CustomBehaviorForm;
