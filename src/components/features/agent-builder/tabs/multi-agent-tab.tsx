import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { InfoIcon as InfoIconComponent } from '@/components/ui/InfoIcon';
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import { SavedAgentConfiguration } from '@/types/agent-configs';

// Assuming SubAgentSelector is imported correctly if used directly
// For this refactor, we assume SubAgentSelectorComponent is passed as a prop
// and can handle RHF's Controller render props or similar integration.

interface MultiAgentTabProps {
  availableAgentsForSubSelector: Array<{ id: string; agentName: string }>;
  SubAgentSelectorComponent: React.ElementType; // Component type for SubAgentSelector
  // Icons
  UsersIcon: React.ElementType;
  LayersIcon: React.ElementType;
  InfoIcon: React.ElementType; // This is the InfoIcon component passed as a prop
  ChevronsUpDownIcon: React.ElementType;
  PlusCircleIcon: React.ElementType;
  Trash2Icon: React.ElementType;
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
}

type FormContextType = SavedAgentConfiguration;

export default function MultiAgentTab({
  availableAgentsForSubSelector,
  SubAgentSelectorComponent,
  UsersIcon, LayersIcon, InfoIcon, ChevronsUpDownIcon, PlusCircleIcon, Trash2Icon, // Icons destructured
  showHelpModal
}: MultiAgentTabProps) {
  const { control, watch, setValue } = useFormContext<FormContextType>();
  const isRootAgent = watch('config.isRootAgent');

  return (
    <div className="space-y-6">
      {/* Is Root Agent Switch */}
      <div className="flex items-center space-x-2">
        <Controller
          name="config.isRootAgent"
          control={control}
          render={({ field }) => (
            <Switch
              id="is-root-agent"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="is-root-agent" className="flex items-center">
          Is Root Agent
          <InfoIconComponent
            tooltipText={agentBuilderHelpContent.multiAgentAdvancedTab.isRootAgent.tooltip}
            onClick={() => showHelpModal({ tab: 'multiAgentAdvancedTab', field: 'isRootAgent' })}
            className="ml-2"
          />
        </Label>
      </div>

      {/* Conditional section for Root Agent settings */}
      {isRootAgent && (
        <div className="pl-2 space-y-6 border-l-2 border-muted ml-2.5"> {/* Indent styling */}
          {/* Sub-Agents Selector */}
          <div className="space-y-2 pt-3"> {/* Added pt-3 for spacing after indent line starts */}
            <Label htmlFor="config.subAgentIds" className="flex items-center">
              Orchestrated Sub-Agents
              <InfoIconComponent
                tooltipText={agentBuilderHelpContent.multiAgentAdvancedTab.subAgentIds.tooltip}
                onClick={() => showHelpModal({ tab: 'multiAgentAdvancedTab', field: 'subAgentIds' })}
                className="ml-2"
              />
            </Label>
            <Controller
              name="config.subAgentIds"
              control={control}
              render={({ field }) => (
                <SubAgentSelectorComponent
                  availableAgents={availableAgentsForSubSelector}
                  selectedAgents={field.value || []}
                  onChange={(newSelection: string[]) => field.onChange(newSelection)}
                  // Pass necessary icons to SubAgentSelectorComponent if it expects them
                  UsersIcon={UsersIcon}
                  LayersIcon={LayersIcon}
                  ChevronsUpDownIcon={ChevronsUpDownIcon}
                  PlusCircleIcon={PlusCircleIcon}
                  Trash2Icon={Trash2Icon}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              Select other agents that this root agent will orchestrate.
            </p>
          </div>

          {/* Global Instruction for Sub-Agents */}
          <div className="space-y-2">
            <Label htmlFor="config.globalInstruction" className="flex items-center">
              Global Instruction for Sub-Agents
              <InfoIconComponent
                tooltipText={agentBuilderHelpContent.multiAgentAdvancedTab.globalInstruction.tooltip}
                onClick={() => showHelpModal({ tab: 'multiAgentAdvancedTab', field: 'globalInstruction' })}
                className="ml-2"
              />
            </Label>
            <Controller
              name="config.globalInstruction"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="config.globalInstruction"
                  placeholder="Enter specific instructions for this agent..."
                  value={field.value || ""}
                  onChange={field.onChange}
                  rows={4}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              This instruction will be applied to all sub-agents orchestrated by this root agent.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
