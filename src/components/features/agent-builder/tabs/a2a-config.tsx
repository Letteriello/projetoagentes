import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SubAgentSelector } from '../sub-agent-selector';

type A2AConfig = {
  enabled: boolean;
  subAgentIds: string[];
};

export default function A2AConfig({ savedAgents }: { savedAgents: any[] }) {
  const { watch, setValue } = useFormContext();
  const a2aConfig: A2AConfig = watch('config.a2a') || {};

  const handleSubAgentChange = (subAgentIds: string[]) => {
    setValue('config.a2a.subAgentIds', subAgentIds);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Switch 
          id="a2a-enabled" 
          checked={a2aConfig.enabled} 
          onCheckedChange={(val) => setValue('config.a2a.enabled', val)}
        />
        <Label htmlFor="a2a-enabled">Enable Agent-to-Agent Communication</Label>
      </div>

      {a2aConfig.enabled && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Sub-Agents</Label>
            <SubAgentSelector 
              availableAgents={savedAgents}
              selectedAgents={a2aConfig.subAgentIds || []}
              onChange={handleSubAgentChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
