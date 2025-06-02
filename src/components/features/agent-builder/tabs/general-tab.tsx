import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InfoIcon } from '@/components/ui/InfoIcon';
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import { SavedAgentConfiguration } from '@/types/agent-configs'; // Import the main type

interface GeneralTabProps {
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
  agentTypeOptions: Array<{ value: string; label: string }>; // Assuming this structure
  agentFrameworkOptions: Array<{ value: string; label: string }>; // Assuming this structure
  // SparklesIcon?: React.ElementType; // Keep if used for other things
  // availableTools?: any[]; // Keep if used for other things
}

// It's good practice to type the context, especially when dealing with nested paths.
type FormContextType = SavedAgentConfiguration;

export default function GeneralTab({
  showHelpModal,
  agentTypeOptions,
  agentFrameworkOptions
}: GeneralTabProps) {
  const { register, control, watch } = useFormContext<FormContextType>();

  const agentType = watch('config.type');
  
  return (
    <div className="space-y-6"> {/* Increased spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Grid layout */}
        {/* Agent Name */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="agentName">Agent Name</Label>
            <InfoIcon
              tooltipText={agentBuilderHelpContent.generalTab.agentName.tooltip!}
              onClick={() => showHelpModal({ tab: 'generalTab', field: 'agentName' })}
            />
          </div>
          <Input
            id="agentName"
            {...register('agentName')}
            placeholder="Enter agent name"
          />
        </div>

        {/* Agent Version */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="agentVersion">Agent Version</Label>
            <InfoIcon /* TODO: Add help content for agentVersion */
              tooltipText="Version of the agent (e.g., 1.0.0)"
              onClick={() => showHelpModal({ tab: 'generalTab', field: 'agentVersion' })}
            />
          </div>
          <Input
            id="agentVersion"
            {...register('agentVersion')}
            placeholder="e.g., 1.0.0"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="agentDescription">Description</Label>
          <InfoIcon
            tooltipText={agentBuilderHelpContent.generalTab.description.tooltip!}
            onClick={() => showHelpModal({ tab: 'generalTab', field: 'description' })}
          />
        </div>
        <Textarea 
          id="agentDescription" // Changed from "description" to match label htmlFor
          {...register('agentDescription')}
          placeholder="Describe your agent's purpose"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Agent Type */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="config.type">Agent Type</Label>
            <InfoIcon /* TODO: Add help content for agentType */
              tooltipText="Defines the agent's core capability (e.g., LLM, Workflow)."
              onClick={() => showHelpModal({ tab: 'generalTab', field: 'agentType' })}
            />
          </div>
          <Controller
            name="config.type"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="config.type">
                  <SelectValue placeholder="Select agent type" />
                </SelectTrigger>
                <SelectContent>
                  {agentTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* Agent Framework */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="config.framework">Agent Framework</Label>
            <InfoIcon /* TODO: Add help content for agentFramework */
              tooltipText="The underlying framework used by the agent (e.g., Genkit, CrewAI)."
              onClick={() => showHelpModal({ tab: 'generalTab', field: 'agentFramework' })}
            />
          </div>
          <Controller
            name="config.framework"
            control={control}
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger id="config.framework">
                  <SelectValue placeholder="Select framework" />
                </SelectTrigger>
                <SelectContent>
                  {agentFrameworkOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      {/* Genkit Flow Name (Conditional) */}
      {agentType === 'custom' && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="config.genkitFlowName">Genkit Flow Name (for Custom Agent)</Label>
            <InfoIcon /* TODO: Add help content for genkitFlowName */
              tooltipText="The name of the Genkit flow to execute for this custom agent."
              onClick={() => showHelpModal({ tab: 'generalTab', field: 'genkitFlowName' })}
            />
          </div>
          <Input
            id="config.genkitFlowName"
            {...register('config.genkitFlowName')}
            placeholder="Enter Genkit flow name"
          />
        </div>
      )}
    </div>
  );
}
