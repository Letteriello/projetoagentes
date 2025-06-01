// CustomBehaviorForm: Componente para o formulário de comportamento específico de agentes Customizados.
// Inclui um campo para a descrição da lógica customizada.

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form"; // MODIFIED
// import { Label } from "@/components/ui/label"; // No longer directly used if FormLabel is used consistently
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SavedAgentConfiguration } from "@/types/agent-configs"; // MODIFIED
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"; // MODIFIED
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"; // Added Card components

// MODIFIED: No props needed
interface CustomBehaviorFormProps {}

const CustomBehaviorForm: React.FC<CustomBehaviorFormProps> = () => {
  const { control, formState: { errors } } = useFormContext<SavedAgentConfiguration>(); // MODIFIED

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Logic Configuration</CardTitle>
        <CardDescription>
          Define the specific implemented behavior and, if applicable, the Genkit flow this agent utilizes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={control}
          name="config.customLogicDescription"
          render={({ field }) => (
            <FormItem> {/* Removed space-y-2, relying on CardContent padding */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild><FormLabel htmlFor="config.customLogicDescription" className="cursor-help">Custom Logic Description</FormLabel></TooltipTrigger>
                  <TooltipContent className="w-80"><p>Describe the main functionality. If this agent invokes a specific Genkit flow, mention the flow name. Detail how it orchestrates other agents or tools, if applicable.</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <FormControl><Textarea id="config.customLogicDescription" placeholder="Describe the custom logic..." {...field} rows={5}/></FormControl>
              <FormDescription className="pt-2">Detail the specific behavior implemented.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* TODO: Consider adding a field for config.genkitFlowName if it's intended to be user-editable here */}
        {/* For example:
        <FormField
          control={control}
          name="config.genkitFlowName"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="config.genkitFlowName">Genkit Flow Name (Optional)</FormLabel>
              <FormControl><Input id="config.genkitFlowName" placeholder="Ex: myCustomFlow" {...field} /></FormControl>
              <FormDescription>The specific Genkit flow this agent executes.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        */}
      </CardContent>
    </Card>
  );
};
export default CustomBehaviorForm;
