import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { InfoIcon } from '@/components/ui/InfoIcon'; // Assuming InfoIcon is a standard component
import { Settings, Check, PlusCircle, Trash2, AlertTriangle } from 'lucide-react'; // Example icons

import { SavedAgentConfiguration, AvailableTool, ToolConfigData } from '@/types/agent-configs';
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';

interface ToolsTabProps {
  availableTools: AvailableTool[];
  // Props for icons and help modal, passed from AgentBuilderDialog
  iconComponents: Record<string, React.ComponentType<{ className?: string }>>;
  InfoIconComponent: React.ElementType; // Renamed to avoid conflict with local InfoIcon
  SettingsIcon: React.ElementType;
  CheckIcon: React.ElementType;
  PlusCircleIcon: React.ElementType;
  Trash2Icon: React.ElementType;
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
  onToolConfigure: (toolId: string) => void; // Function to open configuration modal for a tool
}

type FormContextType = SavedAgentConfiguration;

export default function ToolsTab({
  availableTools,
  iconComponents,
  InfoIconComponent,
  SettingsIcon,
  CheckIcon,
  showHelpModal,
  onToolConfigure,
}: ToolsTabProps) {
  const { control, watch, setValue, getValues } = useFormContext<FormContextType>();
  const selectedToolIds = watch('tools') || [];
  const toolConfigsApplied = watch('toolConfigsApplied') || {};

  const handleToolSelectionChange = (toolId: string, isSelected: boolean) => {
    const currentToolIds = getValues('tools') || [];
    let newToolIds: string[];
    if (isSelected) {
      if (!currentToolIds.includes(toolId)) {
        newToolIds = [...currentToolIds, toolId];
      } else {
        newToolIds = currentToolIds;
      }
    } else {
      newToolIds = currentToolIds.filter(id => id !== toolId);
      // Optionally remove configuration when a tool is deselected
      const currentConfigs = getValues('toolConfigsApplied') || {};
      if (currentConfigs[toolId]) {
        const { [toolId]: _, ...remainingConfigs } = currentConfigs;
        setValue('toolConfigsApplied', remainingConfigs);
      }
    }
    setValue('tools', newToolIds, { shouldDirty: true, shouldValidate: true });
  };

  const getToolIcon = (tool: AvailableTool) => {
    const IconComponent = iconComponents[tool.icon as string || tool.id] || iconComponents.default || Settings;
    return <IconComponent className="w-5 h-5 mr-3 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Agent Tools</CardTitle>
          <CardDescription>
            Select and configure the tools this agent can use.
            <InfoIconComponent
                tooltipText={agentBuilderHelpContent.toolsTab.main.tooltip}
                onClick={() => showHelpModal({ tab: 'toolsTab', field: 'main' })}
                className="ml-2"
            />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4"> {/* Added ScrollArea */}
            <div className="space-y-4">
              {availableTools.map((tool) => {
                const isSelected = selectedToolIds.includes(tool.id);
                const hasConfig = tool.hasConfig; // From AvailableTool definition
                const isConfigured = hasConfig && toolConfigsApplied[tool.id] && Object.keys(toolConfigsApplied[tool.id]).length > 0;

                return (
                  <Card key={tool.id} className="p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center flex-grow">
                        {getToolIcon(tool)}
                        <div className="flex-grow">
                          <Label htmlFor={`tool-select-${tool.id}`} className="text-base font-semibold">{tool.label}</Label>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {hasConfig && isSelected && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onToolConfigure(tool.id)}
                            className="flex items-center"
                          >
                            <SettingsIcon className={`w-4 h-4 mr-2 ${isConfigured ? 'text-green-500' : 'text-orange-500'}`} />
                            {isConfigured ? 'Configured' : 'Configure'}
                            {isConfigured && <CheckIcon className="w-4 h-4 ml-2 text-green-500" />}
                            {!isConfigured && <AlertTriangle className="w-4 h-4 ml-2 text-orange-500" />}
                          </Button>
                        )}
                         <Controller
                            name={`tools`} // This controller is for the switch state, actual array update is manual
                            control={control}
                            render={({ field }) // field here isn't directly used for array, but for triggering re-renders if needed
                            }) => (
                              <Switch
                                id={`tool-select-${tool.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => handleToolSelectionChange(tool.id, checked)}
                              />
                            )}
                          />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
