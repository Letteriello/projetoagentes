import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SavedAgentConfiguration, WorkflowDetailedType } from '@/types/agent-configs-new'; // Updated import
import { InfoIcon } from '@/components/ui/InfoIcon'; // Assuming InfoIcon is available
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content'; // For tooltips

interface BehaviorTabProps {
  agentToneOptions: string[];
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
}

type FormContextType = SavedAgentConfiguration;

// Enum values for WorkflowDetailedType - ensure this matches your type definition
const workflowDetailedTypeOptions: { label: string; value: WorkflowDetailedType }[] = [
  { label: "Sequential", value: "sequential" },
  { label: "Parallel", value: "parallel" },
  { label: "Loop", value: "loop" },
  { label: "Graph", value: "graph" },
  { label: "State Machine", value: "stateMachine" },
];

export default function BehaviorTab({ agentToneOptions, showHelpModal }: BehaviorTabProps) {
  const { control, watch, formState: { errors } } = useFormContext<FormContextType>();
  const agentType = watch('config.type');

  return (
    <div className="space-y-6">
      {/* Common Fields: agentGoal and agentTasks */}
      <FormField
        control={control}
        name="config.agentGoal"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center space-x-2">
              <FormLabel>Agent Goal</FormLabel>
              <InfoIcon
                tooltipText={agentBuilderHelpContent.behaviorTab.agentGoal.tooltip}
                onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'agentGoal' })}
              />
            </div>
            <FormControl>
              <Textarea {...field} placeholder="Define the primary goal for this agent..." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="config.agentTasks" // This will be a string from textarea, Zod schema expects string[]
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center space-x-2">
              <FormLabel>Agent Tasks (one per line)</FormLabel>
               <InfoIcon
                tooltipText={agentBuilderHelpContent.behaviorTab.agentTasks.tooltip}
                onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'agentTasks' })}
              />
            </div>
            <FormControl>
              <Textarea
                {...field}
                placeholder="List the specific tasks the agent needs to perform, one per line."
                rows={4}
                // Convert array to string for display, and string to array on change if needed by schema
                // For now, Zod schema for agentTasks: z.array(z.string()) will likely fail for a direct string.
                // This would require a .transform in Zod or a custom component.
                // Or, change Zod schema for agentTasks to z.string() for this simple case.
                // For this iteration, we pass the raw string value.
                value={Array.isArray(field.value) ? field.value.join('\n') : field.value || ''}
                onChange={(e) => {
                  // field.onChange(e.target.value.split('\n').filter(task => task.trim() !== '')); // Example to send array
                  field.onChange(e.target.value); // Send string for now
                }}
              />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground">
              Note: Validation for tasks currently expects a direct string. Array conversion is illustrative.
            </p>
          </FormItem>
        )}
      />

      {/* LLM Specific Fields */}
      {agentType === 'llm' && (
        <>
          <FormField
            control={control}
            name="config.agentModel"
            render={({ field }) => (
              <FormItem>
                 <div className="flex items-center space-x-2">
                  <FormLabel>Agent Model</FormLabel>
                  <InfoIcon
                    tooltipText={agentBuilderHelpContent.behaviorTab.agentModel.tooltip}
                    onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'agentModel' })}
                  />
                </div>
                <FormControl>
                  <Input {...field} placeholder="e.g., gemini-1.5-flash-latest" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="config.agentPersonality"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Agent Personality/Tone</FormLabel>
                  <InfoIcon
                    tooltipText={agentBuilderHelpContent.behaviorTab.agentPersonality.tooltip}
                    onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'agentPersonality' })}
                  />
                </div>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select personality" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {agentToneOptions.map(tone => (
                      <SelectItem key={tone} value={tone.toLowerCase()}>
                        {tone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="config.agentTemperature"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Agent Temperature (Creativity)</FormLabel>
                  <InfoIcon
                    tooltipText={agentBuilderHelpContent.behaviorTab.agentTemperature.tooltip}
                    onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'agentTemperature' })}
                  />
                </div>
                <FormControl>
                  <div className="flex flex-col space-y-2 pt-2"> {/* Added pt-2 for spacing */}
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[typeof field.value === 'number' ? field.value : 0.7]} // Ensure value is number
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                    <div className="text-center text-sm text-muted-foreground">
                      Value: {(typeof field.value === 'number' ? field.value : 0.7).toFixed(2)} (0: Precise, 1: Creative)
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* TODO: Add fields for agentRestrictions, modelSafetySettings, maxHistoryTokens, maxTokensPerResponse */}
        </>
      )}

      {/* Workflow Specific Fields */}
      {agentType === 'workflow' && (
        <>
          <FormField
            control={control}
            name="config.workflowType"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Workflow Type</FormLabel>
                  <InfoIcon
                    tooltipText={agentBuilderHelpContent.behaviorTab.workflowType.tooltip}
                    onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'workflowType' })}
                  />
                </div>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {workflowDetailedTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="config.workflowDescription"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center space-x-2">
                  <FormLabel>Workflow Description</FormLabel>
                  <InfoIcon
                    tooltipText={agentBuilderHelpContent.behaviorTab.workflowDescription.tooltip}
                    onClick={() => showHelpModal({ tab: 'behaviorTab', field: 'workflowDescription' })}
                  />
                </div>
                <FormControl>
                  <Textarea {...field} placeholder="Describe the workflow..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* TODO: Add fields for subAgents, workflowConfig */}
        </>
      )}

      {/* Message for other agent types */}
      {agentType !== 'llm' && agentType !== 'workflow' && (
        <div className="text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">
          Behavior settings beyond common Goal and Tasks are specific to LLM or Workflow agent types.
          For 'Custom' agents, define behavior within the custom logic.
          For 'A2A Specialist' agents, core behavior is defined by their specialized role and skills.
        </div>
      )}
    </div>
  );
}
