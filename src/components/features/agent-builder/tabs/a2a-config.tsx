import React, { Suspense, lazy } from 'react'; // Added Suspense and lazy
import { useFormContext, Controller, useFieldArray, useWatch } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
// Label will be replaced by FormLabel
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import JsonEditorField from '@/components/ui/JsonEditorField';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InfoIcon as InfoIconComponent } from '@/components/ui/InfoIcon';
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import {
  SavedAgentConfiguration,
  CommunicationChannel as CommunicationChannelNew, // Assuming type from agent-configs-new
  A2ASettings, // Import if A2ASettings is a distinct type, or use parts of SavedAgentConfiguration['config']['a2a']
  Agent, // Assuming Agent type is available for all agents
} from '@/types/agent-configs-new'; // Updated import
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import A2AGraphVisualizer from '../a2a-graph-visualizer';
// import A2ATestChannelDialog from '../a2a-test-channel-dialog'; // Lazy loaded
import { useAppContext } from '@/contexts/app-context';

interface A2AConfigTabProps {
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
  PlusIcon: React.ElementType;
  Trash2Icon: React.ElementType;
}

type FormContextType = SavedAgentConfiguration;

// Assuming CommunicationChannelNew is the correct type from agent-configs-new
const messageFormatOptions: Array<{value: CommunicationChannelNew['messageFormat'], label: string}> = [
    {value: 'json', label: 'JSON'},
    {value: 'text', label: 'Plain Text'},
    {value: 'binary', label: 'Binary'},
];

const syncModeOptions: Array<{value: CommunicationChannelNew['syncMode'], label: string}> = [
    {value: 'sync', label: 'Synchronous'},
    {value: 'async', label: 'Asynchronous'},
];

const directionOptions: Array<{value: CommunicationChannelNew['direction'], label: string}> = [
    {value: 'inbound', label: 'Inbound'},
    {value: 'outbound', label: 'Outbound'},
];

// Assuming config.a2a.securityPolicy is a string union
const securityPolicyOptions: Array<{value: string, label: string}> = [
    {value: 'none', label: 'None'},
    {value: 'jwt', label: 'JWT Verification'},
    {value: 'api_key', label: 'API Key Authentication'},
];


export default function A2AConfigTab({ showHelpModal, PlusIcon, Trash2Icon }: A2AConfigTabProps) {
  const { control, watch, getValues, formState: { errors } } = useFormContext<FormContextType>();
  const { allAgents } = useAppContext(); // Get all saved agents

  const [isTestDialogOpen, setIsTestDialogOpen] = React.useState(false);
  const [selectedChannelForTest, setSelectedChannelForTest] = React.useState<CommunicationChannelNew | null>(null);

  const A2ATestChannelDialog = lazy(() => import('../a2a-test-channel-dialog'));

  const a2aEnabled = watch('config.a2a.enabled');
  const communicationChannels = watch('config.a2a.communicationChannels');
  const securityPolicy = watch('config.a2a.securityPolicy');

  const { fields: channelFields, append: appendChannel, remove: removeChannel } = useFieldArray({
    control,
    name: "config.a2a.communicationChannels",
  });

  const currentAgentFormValues = getValues(); // This is SavedAgentConfiguration

  // Data for Graph Visualizer
  const currentAgentForGraph: Agent = { // This Agent type might be different from SavedAgentConfiguration
    id: currentAgentFormValues.id || 'current_agent',
    name: currentAgentFormValues.name || 'Current Agent',
  };
  const subAgentsForGraph: Agent[] = []; // Placeholder
  const a2aChannelsForGraph = (communicationChannels || []).map(channel => ({
    ...channel,
    sourceAgentId: channel.direction === 'inbound' ? channel.targetAgentId || 'unknown_source' : currentAgentForGraph.id,
    targetAgentId: channel.direction === 'outbound' ? channel.targetAgentId || 'unknown_target' : currentAgentForGraph.id,
  })).filter(c => c.sourceAgentId && c.targetAgentId);

  const isRootAgent = !allAgents.some(agent => agent.config?.subAgents?.includes(currentAgentFormValues.id || ''));
  const shouldShowVisualizer = a2aEnabled && (isRootAgent || (communicationChannels && communicationChannels.length > 0));

  // Data for Test Dialog
  const currentAgentForTestDialog: Pick<SavedAgentConfiguration, 'id' | 'name'> = {
    id: currentAgentFormValues.id,
    name: currentAgentFormValues.name,
  };

  const handleOpenTestDialog = (channelData: CommunicationChannelNew) => {
    setSelectedChannelForTest(channelData);
    setIsTestDialogOpen(true);
  };

  const targetAgentForTestDialog = selectedChannelForTest?.targetAgentId
    ? allAgents.find(agent => agent.id === selectedChannelForTest.targetAgentId) || null
    : null;

  return (
    <div className="space-y-6">
      {shouldShowVisualizer && (
        <A2AGraphVisualizer
          currentAgent={currentAgentForGraph}
          subAgents={subAgentsForGraph}
          a2aChannels={a2aChannelsForGraph}
        />
      )}
      <Suspense fallback={<div>Carregando diálogo de teste...</div>}>
        {isTestDialogOpen && selectedChannelForTest && (
          <A2ATestChannelDialog
            isOpen={isTestDialogOpen}
            onOpenChange={setIsTestDialogOpen}
            channel={selectedChannelForTest}
            currentAgent={currentAgentForTestDialog}
            targetAgent={targetAgentForTestDialog}
          />
        )}
      </Suspense>
      <FormItem className="flex flex-row items-center space-x-2">
        <FormControl>
          <Controller
            name="config.a2a.enabled"
            control={control}
            render={({ field }) => (
              <Switch
                id="a2a-enabled"
                checked={field.value || false}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </FormControl>
        <FormLabel htmlFor="a2a-enabled" className="!mt-0 flex items-center">
          Enable Agent-to-Agent (A2A) Communication Features
           <InfoIconComponent
            tooltipText={agentBuilderHelpContent.a2aTab.enableA2A.tooltip}
            onClick={() => showHelpModal({ tab: 'a2aTab', field: 'enableA2A' })}
            className="ml-2"
          />
        </FormLabel>
      </FormItem>

      {a2aEnabled && (
        <Card className="p-4 md:p-6">
          <CardContent className="space-y-6 pt-6">
            <div>
              <h4 className="text-lg font-medium mb-3 flex items-center">
                Communication Channels
                <InfoIconComponent tooltipText={agentBuilderHelpContent.a2aTab.communicationChannels.tooltip} onClick={() => showHelpModal({ tab: 'a2aTab', field: 'communicationChannels' })} className="ml-2" />
              </h4>
              <div className="space-y-3">
                {channelFields.map((item, index) => (
                  <Card key={item.id} className="p-3 bg-muted/30 space-y-3">
                    <FormField
                      control={control}
                      name={`config.a2a.communicationChannels.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Channel Name</FormLabel>
                          <FormControl><Input {...field} placeholder="e.g., order_updates_topic" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name={`config.a2a.communicationChannels.${index}.direction`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Direction</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Direction (In/Out)" /></SelectTrigger></FormControl>
                              <SelectContent>{directionOptions.map(opt=><SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`config.a2a.communicationChannels.${index}.messageFormat`}
                        render={({ field }) => (
                           <FormItem>
                            <FormLabel>Message Format</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Message Format" /></SelectTrigger></FormControl>
                              <SelectContent>{messageFormatOptions.map(opt=><SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`config.a2a.communicationChannels.${index}.syncMode`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sync Mode</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                             <FormControl><SelectTrigger><SelectValue placeholder="Sync Mode" /></SelectTrigger></FormControl>
                              <SelectContent>{syncModeOptions.map(opt=><SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`config.a2a.communicationChannels.${index}.timeout`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timeout (ms, optional)</FormLabel>
                            <FormControl><Input type="number" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseInt(e.target.value,10) || undefined)} placeholder="e.g., 5000" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {watch(`config.a2a.communicationChannels.${index}.direction`) === 'outbound' && (
                       <FormField
                        control={control}
                        name={`config.a2a.communicationChannels.${index}.targetAgentId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Agent ID (for outbound)</FormLabel>
                            <FormControl><Input {...field} value={field.value ?? ''} placeholder="Target Agent ID" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={control}
                      name={`config.a2a.communicationChannels.${index}.schema`}
                      render={({ field, fieldState }) => (
                        <FormItem>
                          <FormLabel>Message Schema (JSON Schema string or URL, optional)</FormLabel>
                          <FormControl>
                            <JsonEditorField
                              id={field.name} // Keep id for JsonEditorField if it uses it internally
                              value={field.value || ""}
                              onChange={field.onChange}
                              placeholder="Paste JSON schema or URL..."
                              height="150px"
                              // error={fieldState.error?.message} // Error display handled by FormMessage
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2 mt-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenTestDialog(item as any as CommunicationChannelNew)} // item is a FieldArrayWithId
                      >
                        Testar Canal
                      </Button>
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeChannel(index)}>
                        <Trash2Icon className="mr-2 h-4 w-4" />Remove Channel
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendChannel({
                  id: `chan_${Date.now()}`,
                  name: '',
                  direction: 'outbound',
                  messageFormat: 'json',
                  syncMode: 'async',
                  // Ensure all required fields by CommunicationChannelNew are present
                  targetAgentId: '',
                  schema: '',
                  timeout: 5000, // Default timeout
                } as CommunicationChannelNew)}
                className="mt-3"
              >
                <PlusIcon className="mr-2 h-4 w-4" />Add Channel
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={control}
                  name="config.a2a.defaultResponseFormat"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="flex items-center">Default Response Format <InfoIconComponent tooltipText={agentBuilderHelpContent.a2aTab.defaultResponseFormat.tooltip} onClick={() => showHelpModal({ tab: 'a2aTab', field: 'defaultResponseFormat' })} className="ml-2" /></FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select format"/></SelectTrigger></FormControl>
                          <SelectContent>{messageFormatOptions.slice(0,2).map(opt=><SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="config.a2a.maxMessageSize"
                  render={({field}) => (
                    <FormItem>
                      <FormLabel className="flex items-center">Max Message Size (KB) <InfoIconComponent tooltipText={agentBuilderHelpContent.a2aTab.maxMessageSize.tooltip} onClick={() => showHelpModal({ tab: 'a2aTab', field: 'maxMessageSize' })} className="ml-2" /></FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 1024" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <FormField
              control={control}
              name="config.a2a.securityPolicy"
              render={({field}) => (
                <FormItem>
                  <FormLabel className="flex items-center">Security Policy <InfoIconComponent tooltipText={agentBuilderHelpContent.a2aTab.securityPolicy.tooltip} onClick={() => showHelpModal({ tab: 'a2aTab', field: 'securityPolicy' })} className="ml-2" /></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'none'}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select security policy"/></SelectTrigger></FormControl>
                      <SelectContent>{securityPolicyOptions.map(opt=><SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {securityPolicy === 'api_key' && (
              <FormField
                control={control}
                name="config.a2a.apiKeyHeaderName" // Corrected: This was outside CardContent, moved for layout consistency
                render={({field}) => (
                  <FormItem>
                    <FormLabel className="flex items-center">API Key Header Name <InfoIconComponent tooltipText={agentBuilderHelpContent.a2aTab.apiKeyHeaderName.tooltip} onClick={() => showHelpModal({ tab: 'a2aTab', field: 'apiKeyHeaderName' })} className="ml-2" /></FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} placeholder="e.g., X-Agent-API-Key" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
             {/* Moved from outside CardContent to inside for proper structure */}
            <FormItem className="flex flex-row items-center space-x-2 pt-2">
              <FormControl>
                <Controller name="config.a2a.loggingEnabled" control={control} render={({field}) => <Switch id="a2a-logging-enabled" checked={field.value || false} onCheckedChange={field.onChange} />} />
              </FormControl>
              <FormLabel htmlFor="a2a-logging-enabled" className="!mt-0 flex items-center">Enable A2A Logging <InfoIconComponent tooltipText={agentBuilderHelpContent.a2aTab.loggingEnabled.tooltip} onClick={() => showHelpModal({ tab: 'a2aTab', field: 'loggingEnabled' })} className="ml-2" /></FormLabel>
            </FormItem>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
