import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { SavedAgentConfiguration } from '@/types/agent-configs'; // Import the main type

interface BehaviorTabProps {
  agentToneOptions: string[]; // Assuming these are simple strings like 'professional', 'friendly'
  showHelpModal: (contentKey: { tab: string; field: string }) => void; // Or the correct type
}

// It's good practice to type the context, especially when dealing with nested paths.
type FormContextType = SavedAgentConfiguration;

export default function BehaviorTab({ agentToneOptions, showHelpModal }: BehaviorTabProps) {
  const { control, watch } = useFormContext<FormContextType>();

  // Watch the agent type to conditionally render LLM-specific behavior settings
  const agentType = watch('config.type');

  if (agentType !== 'llm') {
    return (
      <div className="text-sm text-muted-foreground">
        Behavior settings are applicable to LLM-based agents.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="agent-personality">Agent Personality/Tone</Label>
        <Controller
          name="config.agentPersonality"
          control={control}
          defaultValue="" // Default from SavedAgentConfiguration will be used
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="agent-personality">
                <SelectValue placeholder="Select personality" />
              </SelectTrigger>
              <SelectContent>
                {agentToneOptions.map(tone => (
                  <SelectItem key={tone} value={tone.toLowerCase()}> {/* Assuming options are like 'Professional', value 'professional' */}
                    {tone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {/* Add Help Icon/Button for showHelpModal here if needed */}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="agent-temperature">Agent Temperature (Creativity)</Label>
        <Controller
          name="config.agentTemperature"
          control={control}
          defaultValue={0.7} // Default from SavedAgentConfiguration will be used
          render={({ field }) => (
            <div className="flex flex-col space-y-2">
              <Slider
                id="agent-temperature"
                min={0}
                max={1} // Standard range for temperature
                step={0.01} // Finer control for temperature
                value={[field.value]}
                onValueChange={(value) => field.onChange(value[0])}
              />
              <div className="text-center text-sm text-muted-foreground">
                Value: {field.value.toFixed(2)} (0: Precise, 1: Creative)
              </div>
            </div>
          )}
        />
        {/* Add Help Icon/Button for showHelpModal here if needed */}
      </div>
      {/* TODO: Add fields for agentGoal, agentTasks, agentRestrictions if they belong in this tab */}
      {/* These are also under config for LLM agents */}
    </div>
  );
}
