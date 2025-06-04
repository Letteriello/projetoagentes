// CustomBehaviorForm: Componente para o formulário de comportamento específico de agentes Customizados.
// Inclui um campo para a descrição da lógica customizada.

import * as React from "react";
import { useFormContext, Controller } from "react-hook-form"; // MODIFIED
// import { Label } from "@/components/ui/label"; // No longer directly used if FormLabel is used consistently
import { Input } from "@/components/ui/input"; // Added Input import
import { Textarea } from "@/components/ui/textarea"; // Textarea IS needed for customLogicDescription
import JsonEditorField from '@/components/ui/JsonEditorField'; // IMPORTED JsonEditorField
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SavedAgentConfiguration } from '@/types/agent-configs-fixed'; // MODIFIED
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

        <FormField
          control={control}
          name="config.genkitFlowName"
          render={({ field }) => (
            <FormItem>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild><FormLabel htmlFor="config.genkitFlowName" className="cursor-help">Genkit Flow Name (Optional)</FormLabel></TooltipTrigger>
                  <TooltipContent className="w-80"><p>If this agent is implemented as a Genkit flow, specify the flow name here. This allows the system to directly invoke it.</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <FormControl><Input id="config.genkitFlowName" placeholder="e.g., myCustomSummarizationFlow" {...field} /></FormControl>
              <FormDescription className="pt-2">The registered name of the Genkit flow this agent executes.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="config.inputSchema"
          render={({ field, fieldState }) => (
            <FormItem>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild><FormLabel htmlFor={field.name} className="cursor-help">Input Schema (Optional)</FormLabel></TooltipTrigger>
                  <TooltipContent className="w-80"><p>Define the JSON schema for the expected input of this agent or Genkit flow. This helps with validation and documentation.</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <FormControl>
                <JsonEditorField
                  id={field.name}
                  value={field.value || ""}
                  onChange={field.onChange}
                  // onBlur={field.onBlur} // JsonEditorField does not currently use onBlur
                  placeholder={'{\n  "type": "object",\n  "properties": {\n    "query": { "type": "string" }\n  },\n  "required": ["query"]\n}'}
                  height="200px"
                  error={fieldState.error?.message}
                />
              </FormControl>
              <FormDescription className="pt-2">JSON schema for the agent's input. Leave blank if not applicable.</FormDescription>
              {/* <FormMessage /> FormMessage can be kept if Zod errors are distinct from JSON syntax errors */}
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="config.outputSchema"
          render={({ field, fieldState }) => (
            <FormItem>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild><FormLabel htmlFor={field.name} className="cursor-help">Output Schema (Optional)</FormLabel></TooltipTrigger>
                  <TooltipContent className="w-80"><p>Define the JSON schema for the expected output of this agent or Genkit flow. This helps with validation and data handling.</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <FormControl>
                <JsonEditorField
                  id={field.name}
                  value={field.value || ""}
                  onChange={field.onChange}
                  // onBlur={field.onBlur} // JsonEditorField does not currently use onBlur
                  placeholder={'{\n  "type": "object",\n  "properties": {\n    "summary": { "type": "string" }\n  },\n  "required": ["summary"]\n}'}
                  height="200px"
                  error={fieldState.error?.message}
                />
              </FormControl>
              <FormDescription className="pt-2">JSON schema for the agent's output. Leave blank if not applicable.</FormDescription>
              {/* <FormMessage /> */}
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
};
export default CustomBehaviorForm;
