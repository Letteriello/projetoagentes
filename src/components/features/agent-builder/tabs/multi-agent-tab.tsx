import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Input } from '@/components/ui/input';

type OrchestrationMode = 'sequential' | 'parallel' | 'hierarchical';

export default function MultiAgentTab() {
  const { register, watch } = useFormContext();
  const orchestrationMode: OrchestrationMode = watch('config.multiAgent.orchestrationMode') || 'sequential';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Orchestration Mode</Label>
        <RadioGroup defaultValue="sequential" className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sequential" id="sequential" />
            <Label htmlFor="sequential">Sequential</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="parallel" id="parallel" />
            <Label htmlFor="parallel">Parallel</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hierarchical" id="hierarchical" />
            <Label htmlFor="hierarchical">Hierarchical</Label>
          </div>
        </RadioGroup>
      </div>

      {orchestrationMode === 'sequential' && (
        <div className="space-y-2">
          <Label>Execution Order</Label>
          <Input 
            {...register('config.multiAgent.executionOrder')}
            placeholder="Comma-separated agent IDs"
          />
        </div>
      )}

      {orchestrationMode === 'hierarchical' && (
        <div className="space-y-2">
          <Label>Parent Agent ID</Label>
          <Input 
            {...register('config.multiAgent.parentAgentId')}
            placeholder="Enter parent agent ID"
          />
        </div>
      )}
    </div>
  );
}
