import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
// Label will be replaced by FormLabel
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { InfoIcon as InfoIconComponent } from '@/components/ui/InfoIcon';
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import { SavedAgentConfiguration } from '@/types/agent-configs-new'; // Updated import
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

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
  UsersIcon, LayersIcon, InfoIcon, ChevronsUpDownIcon, PlusCircleIcon, Trash2Icon,
  showHelpModal
}: MultiAgentTabProps) {
  const { control, watch, formState: { errors } } = useFormContext<FormContextType>();
  const isRootAgent = watch('config.isRootAgent');

  return (
    <div className="space-y-6">
      <FormItem className="flex flex-row items-center space-x-2">
        <FormControl>
          <Controller
            name="config.isRootAgent"
            control={control}
            render={({ field }) => (
              <Switch
                id="is-root-agent"
                checked={field.value || false} // Ensure value is boolean
                onCheckedChange={field.onChange}
              />
            )}
          />
        </FormControl>
        <FormLabel htmlFor="is-root-agent" className="!mt-0 flex items-center">
          Is Root Agent
          <InfoIconComponent
            tooltipText={agentBuilderHelpContent.multiAgentAdvancedTab.isRootAgent.tooltip}
            onClick={() => showHelpModal({ tab: 'multiAgentAdvancedTab', field: 'isRootAgent' })}
            className="ml-2"
          />
        </FormLabel>
        {/* No FormMessage needed for a standalone switch usually, unless there's a specific validation rule for it */}
      </FormItem>

      {isRootAgent && (
        <div className="pl-2 space-y-6 border-l-2 border-muted ml-2.5">
          <FormField
            control={control}
            name="config.subAgentIds"
            render={({ field }) => (
              <FormItem className="pt-3">
                <FormLabel className="flex items-center">
                  Orchestrated Sub-Agents
                  <InfoIconComponent
                    tooltipText={agentBuilderHelpContent.multiAgentAdvancedTab.subAgentIds.tooltip}
                    onClick={() => showHelpModal({ tab: 'multiAgentAdvancedTab', field: 'subAgentIds' })}
                    className="ml-2"
                  />
                </FormLabel>
                <FormControl>
                  <SubAgentSelectorComponent
                    availableAgents={availableAgentsForSubSelector}
                    selectedAgents={(field.value || []).filter(id => typeof id === 'string') as string[]}
                    onChange={(newSelection: string[]) => field.onChange(newSelection)}
                    UsersIcon={UsersIcon}
                    LayersIcon={LayersIcon}
                    ChevronsUpDownIcon={ChevronsUpDownIcon}
                    PlusCircleIcon={PlusCircleIcon}
                    Trash2Icon={Trash2Icon}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground pt-1">
                  Select other agents that this root agent will orchestrate.
                </p>
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="config.globalInstruction"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  Global Instruction for Sub-Agents
                  <InfoIconComponent
                    tooltipText={agentBuilderHelpContent.multiAgentAdvancedTab.globalInstruction.tooltip}
                    onClick={() => showHelpModal({ tab: 'multiAgentAdvancedTab', field: 'globalInstruction' })}
                    className="ml-2"
                  />
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter global instructions for sub-agents..."
                    value={field.value || ""}
                    onChange={field.onChange}
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground pt-1">
                  This instruction will be applied to all sub-agents orchestrated by this root agent.
                </p>
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
