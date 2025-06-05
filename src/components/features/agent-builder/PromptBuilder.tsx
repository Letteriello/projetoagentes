import React from 'react';
import { Control, UseFormWatch, Controller, useFormContext } from 'react-hook-form';
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AISuggestionOutput } from '@/ai/flows/aiConfigurationAssistantFlow'; // Assuming this type exists
import { AvailableTool, LLMAgentConfig, WorkflowAgentConfig, AgentConfig as AgentConfigUnion } from '@/types/agent-types'; // Adjusted import
import { pageAgentToneOptions } from '@/app/agent-builder/page'; // Assuming this is the correct path
import {
  Target,
  ListChecks,
  Smile,
  Ban,
  Brain,
  Settings,
} from "lucide-react";

// Helper function to generate a tool usage snippet from JSON schema
const generateToolSnippet = (toolName: string, jsonSchemaString: string | undefined): string => {
  if (!jsonSchemaString) {
    return `${toolName}(...args)`; // Fallback if no schema
  }
  try {
    const schema = JSON.parse(jsonSchemaString);
    if (schema.type !== 'object' || !schema.properties) {
      return `${toolName}(...args)`; // Fallback if schema is not an object with properties
    }
    const params = Object.entries(schema.properties).map(([name, propDetails]) => {
      const type = (propDetails as any).type || 'any';
      const isRequired = schema.required && schema.required.includes(name);
      return `${name}${isRequired ? '' : '?'}: ${type}`;
    });
    return `${toolName}(${params.join(', ')})`;
  } catch (error) {
    console.warn(`Failed to parse JSON schema for tool ${toolName}:`, error);
    return `${toolName}(...args)`; // Fallback on parsing error
  }
};

export const constructSystemPrompt = (
  config: AgentConfigUnion | null | undefined,
  availableAgents: Array<{ id: string; agentName: string }>,
  aiSuggestions?: AISuggestionOutput | null, // Ensure this type is correct
  allAvailableTools?: AvailableTool[],
  selectedToolsDetails?: Array<{ id: string; name: string; description: string; inputSchema?: string }>
): string => {
  if (!config) return "No configuration provided.";

  let promptParts: string[] = [];

  if (config.type === 'llm') {
    const llmConfig = config as LLMAgentConfig;

    const personality = aiSuggestions?.suggestedPersonality || llmConfig.agentPersonality;
    promptParts.push(`You are an AI agent${personality ? ` with the personality of a ${personality}` : ''}.`);

    if (llmConfig.agentGoal) {
      promptParts.push(`Your primary goal is: ${llmConfig.agentGoal}.`);
    }

    const tasksToUse = (aiSuggestions?.suggestedTasks && aiSuggestions.suggestedTasks.length > 0)
      ? aiSuggestions.suggestedTasks
      : llmConfig.agentTasks;
    if (tasksToUse && tasksToUse.length > 0) {
      promptParts.push("To achieve this goal, you must perform the following tasks:");
      tasksToUse.forEach(task => promptParts.push(`- ${task}`));
    }

    const restrictionsToUse = (aiSuggestions?.suggestedRestrictions && aiSuggestions.suggestedRestrictions.length > 0)
      ? aiSuggestions.suggestedRestrictions
      : llmConfig.agentRestrictions;
    if (restrictionsToUse && restrictionsToUse.length > 0) {
      promptParts.push("\nYou must adhere to the following restrictions:");
      restrictionsToUse.forEach(restriction => promptParts.push(`- ${restriction}`));
    }

    if (allAvailableTools && selectedToolsDetails && selectedToolsDetails.length > 0) {
      promptParts.push("\nFerramentas Disponíveis:");
      selectedToolsDetails.forEach(selectedToolInfo => {
        const fullToolDetail = allAvailableTools.find(t => t.id === selectedToolInfo.id);
        if (fullToolDetail) {
          promptParts.push(`- Nome: ${fullToolDetail.name}`);
          promptParts.push(`  Descrição: ${fullToolDetail.description}`);
          const snippet = generateToolSnippet(fullToolDetail.name, fullToolDetail.inputSchema);
          if (snippet) {
            promptParts.push(`  Uso: ${snippet}`);
          }
        }
      });
    }
    return promptParts.join('\n');

  } else if (config.type === 'workflow') {
    const wfConfig = config as WorkflowAgentConfig;
    promptParts.push("You are a workflow orchestrator agent.");
    if (wfConfig.agentGoal) { // Assuming WorkflowAgentConfig can have an agentGoal
      promptParts.push(`Your primary goal is: ${wfConfig.agentGoal}.`);
    }
    if (wfConfig.workflowType) {
      promptParts.push(`This is a '${wfConfig.workflowType}' workflow, executing the following steps:`);
    }
    if (wfConfig.workflowSteps && wfConfig.workflowSteps.length > 0) {
      const stepDescriptions = wfConfig.workflowSteps.map((step, index) => {
        const agentName = availableAgents.find(a => a.id === step.agentId)?.agentName || step.agentId || "Unknown Agent";
        let inputMappingStr = typeof step.inputMapping === 'string' ? step.inputMapping : JSON.stringify(step.inputMapping);
        try {
          inputMappingStr = JSON.stringify(JSON.parse(inputMappingStr), null, 2);
        } catch (e) {
          // If not a valid JSON string, use as is
        }
        return `\nStep ${index + 1}: ${step.name || 'Unnamed Step'}
  Description: ${step.description || 'N/A'}
  Agent: ${agentName}
  Input Mapping: ${inputMappingStr}
  Output Key: ${step.outputKey || 'N/A'}`;
      });
      promptParts.push(...stepDescriptions);
    } else {
      promptParts.push("No workflow steps defined.");
    }
    return promptParts.join('\n');
  }

  return "System prompt generation for this agent type is not yet configured.";
};


interface PromptBuilderProps {
  control: Control<any>;
  watch: UseFormWatch<any>;
  // Add any other specific props this component might need, e.g., agentToneOptions
  // For now, assuming agentToneOptions are globally available or passed via context/FormProvider
}

const PromptBuilder: React.FC<PromptBuilderProps> = ({ control, watch }) => {
  const { getValues } = useFormContext(); // To get values for constructSystemPrompt

  // Watch relevant fields for the prompt preview
  const agentGoal = watch("config.agentGoal");
  const agentTasks = watch("config.agentTasks");
  const agentPersonality = watch("config.agentPersonality");
  const agentRestrictions = watch("config.agentRestrictions");
  const agentModel = watch("config.agentModel"); // Watch model for display if needed
  const agentTemperature = watch("config.agentTemperature"); // Watch temp for display if needed

  const systemPromptPreview = React.useMemo(() => {
    const currentFullConfig = getValues();
    const currentAgentConfig = currentFullConfig.config;
    // TODO: Ensure availableAgents, aiSuggestions, availableTools, toolsDetails are correctly passed or accessed
    // For now, passing empty/undefined for simplicity of moving the code.
    // These will need to be properly plumbed from AgentBuilderDialog or context.
    return constructSystemPrompt(
      currentAgentConfig,
      [], // availableAgents - placeholder
      null, // aiSuggestions - placeholder
      [], // allAvailableTools - placeholder
      []  // selectedToolsDetails - placeholder
    );
  }, [agentGoal, agentTasks, agentPersonality, agentRestrictions, getValues, watch('config.type'), watch('config.workflowSteps'), watch('toolsDetails')]);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary/80" /> Comportamento e Instruções
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
            <Label htmlFor="agentGoal" className="text-left flex items-center gap-1.5">
              <Target size={16} />Objetivo
            </Label>
            <Controller
              name="config.agentGoal"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  id="agentGoal"
                  placeholder="ex: Ajudar usuários a encontrar informações sobre produtos."
                  className="h-10"
                />
              )}
            />
          </div>
          <div className="grid grid-cols-[200px_1fr] items-start gap-x-4">
            <Label htmlFor="agentTasks" className="text-left flex items-center gap-1.5 pt-2.5">
              <ListChecks size={16} />Tarefas
            </Label>
            <Controller
              name="config.agentTasks"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="agentTasks"
                  placeholder="ex: 1. Saudar o usuário. 2. Perguntar sobre o produto desejado..."
                  rows={3}
                  // Assuming agentTasks is an array of strings, adjust if it's a single string
                  value={Array.isArray(field.value) ? field.value.join('\n') : field.value || ''}
                  onChange={(e) => field.onChange(e.target.value.split('\n'))}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-[200px_1fr] items-center gap-x-4">
            <Label htmlFor="agentPersonality" className="text-left flex items-center gap-1.5">
              <Smile size={16} />Personalidade
            </Label>
            <Controller
              name="config.agentPersonality"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="agentPersonality" className="h-10">
                    <SelectValue placeholder="Selecione um tom" />
                  </SelectTrigger>
                  <SelectContent>
                    {pageAgentToneOptions.map((option) => (
                      <SelectItem key={option.id} value={option.label}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="grid grid-cols-[200px_1fr] items-start gap-x-4">
            <Label htmlFor="agentRestrictions" className="text-left flex items-center gap-1.5 pt-2.5">
              <Ban size={16} />Restrições
            </Label>
            <Controller
              name="config.agentRestrictions"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="agentRestrictions"
                  placeholder="ex: Nunca fornecer informações pessoais. Não usar linguagem ofensiva."
                  rows={3}
                  value={Array.isArray(field.value) ? field.value.join('\n') : field.value || ''}
                  onChange={(e) => field.onChange(e.target.value.split('\n'))}
                />
              )}
            />
          </div>
        </div>
      </div>

      <Separator className="my-6" />

      {/* Prompt Previewer - Basic version for now */}
      <Card>
        <CardHeader>
          <CardTitle>Preview do Prompt do Sistema</CardTitle>
          <CardDescription>
            Esta é uma prévia de como o prompt do sistema será construído com base nas configurações atuais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            readOnly
            value={systemPromptPreview}
            className="h-64 bg-muted/30"
            placeholder="O prompt do sistema aparecerá aqui..."
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PromptBuilder;
