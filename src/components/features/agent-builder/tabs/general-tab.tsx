import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { InfoIcon } from '@/components/ui/InfoIcon';
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';

interface GeneralTabProps {
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
  // Add other props that GeneralTab might receive, like agentTypeOptions, SparklesIcon, etc.
  // For now, focusing on showHelpModal as per the current subtask.
  agentTypeOptions?: string[]; // Example, add if used
  SparklesIcon?: React.ElementType; // Example, add if used
  availableTools?: any[]; // Example, add if used
}

export default function GeneralTab({ showHelpModal }: GeneralTabProps) {
  const { register } = useFormContext();
  
  return (
    <div className="space-y-4">
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
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label htmlFor="description">Description</Label>
          <InfoIcon
            tooltipText={agentBuilderHelpContent.generalTab.description.tooltip!}
            onClick={() => showHelpModal({ tab: 'generalTab', field: 'description' })}
          />
        </div>
        <Textarea 
          id="description"
          {...register('description')} 
          placeholder="Describe your agent's purpose"
          rows={3}
        />
      </div>
    </div>
  );
}
