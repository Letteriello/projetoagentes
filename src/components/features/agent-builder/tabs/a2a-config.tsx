import React from 'react';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Textarea } from '@/components/ui/textarea'; // Removed unnecessary import
import JsonEditorField from '@/components/ui/JsonEditorField'; // Added import for JsonEditorField
import { Card, CardContent } from '@/components/ui/card'; // Removed CardHeader, Title, Desc from here
import { Separator } from '@/components/ui/separator';
import { InfoIcon as InfoIconComponent } from '@/components/ui/InfoIcon'; // Renamed
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import { SavedAgentConfiguration, CommunicationChannel } from '@/types/agent-configs'; // Added CommunicationChannel
// SubAgentSelector is removed as subAgentIds are part of MultiAgentTab's scope (config.subAgentIds)

interface A2AConfigTabProps {
  // Props for icons if any, and showHelpModal
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
  // savedAgents is no longer needed here as subAgent selection is moved
  PlusIcon: React.ElementType;
  Trash2Icon: React.ElementType;
}

type FormContextType = SavedAgentConfiguration;

const messageFormatOptions: Array<{value: CommunicationChannel['messageFormat'], label: string}> = [
    {value: 'json', label: 'JSON'},
    {value: 'text', label: 'Plain Text'},
    {value: 'binary', label: 'Binary'},
];

const syncModeOptions: Array<{value: CommunicationChannel['syncMode'], label: string}> = [
    {value: 'sync', label: 'Synchronous'},
    {value: 'async', label: 'Asynchronous'},
];

const directionOptions: Array<{value: CommunicationChannel['direction'], label: string}> = [
    {value: 'inbound', label: 'Inbound'},
    {value: 'outbound', label: 'Outbound'},
];

const securityPolicyOptions: Array<{value: SavedAgentConfiguration['config']['a2a']['securityPolicy'], label: string}> = [
    {value: 'none', label: 'None'},
    {value: 'jwt', label: 'JWT Verification'},
    {value: 'api_key', label: 'API Key Authentication'},
];


export default function A2AConfigTab({ showHelpModal, PlusIcon, Trash2Icon }: A2AConfigTabProps) {
  const { control, watch, register } = useFormContext<FormContextType>();
  const a2aEnabled = watch('config.a2a.enabled');
  const securityPolicy = watch('config.a2a.securityPolicy');

  const { fields: channelFields, append: appendChannel, remove: removeChannel } = useFieldArray({
    control,
    name: "config.a2a.communicationChannels",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Controller
          name="config.a2a.enabled"
          control={control}
          render={({ field }) => (
            <Switch
              id="a2a-enabled"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="a2a-enabled" className="flex items-center">
          Enable Agent-to-Agent (A2A) Communication Features
           <InfoIconComponent
            tooltipText={agentBuilderHelpContent.a2aTab.enableA2A.tooltip}
            onClick={() => showHelpModal({ tab: 'a2aTab', field: 'enableA2A' })}
            className="ml-2"
          />
        </Label>
      </div>

      {a2aEnabled && (
        <Card className="p-4 md:p-6">
          <CardContent className="space-y-6 pt-6">
            {/* Communication Channels */}
            <div>
              <h4 className="text-lg font-medium mb-3 flex items-center">
                Communication Channels
                <InfoIconComponent tooltipText={agentBuilderHelpContent.a2aTab.communicationChannels.tooltip} onClick={() => showHelpModal({ tab: 'a2aTab', field: 'communicationChannels' })} className="ml-2" />
              </h4>
              <div className="space-y-3">
                {channelFields.map((field, index) => (
                  <Card key={field.id} className="p-3 bg-muted/30 space-y-2">
                    <Input {...register(`config.a2a.communicationChannels.${index}.name`)} placeholder="Channel Name (e.g., order_updates_topic)" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Controller
                          name={`config.a2a.communicationChannels.${index}.direction`}
                          control={control}
                          render={({ field: dirField }) => (
                            <Select onValueChange={dirField.onChange} value={dirField.value}>
                              <SelectTrigger><SelectValue placeholder="Direction (In/Out)" /></SelectTrigger>
                              <SelectContent>{directionOptions.map(opt=><SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        />
                        <Controller
                          name={`config.a2a.communicationChannels.${index}.messageFormat`}
                          control={control}
                          render={({ field: formatField }) => (
                            <Select onValueChange={formatField.onChange} value={formatField.value}>
                              <SelectTrigger><SelectValue placeholder="Message Format" /></SelectTrigger>
                              <SelectContent>{messageFormatOptions.map(opt=><SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        />
                        <Controller
                          name={`config.a2a.communicationChannels.${index}.syncMode`}
                          control={control}
                          render={({ field: syncField }) => (
                            <Select onValueChange={syncField.onChange} value={syncField.value}>
                              <SelectTrigger><SelectValue placeholder="Sync Mode" /></SelectTrigger>
                              <SelectContent>{syncModeOptions.map(opt=><SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                            </Select>
                          )}
                        />
                        <Input type="number" {...register(`config.a2a.communicationChannels.${index}.timeout`)} placeholder="Timeout (ms, optional)" />
                    </div>
                    {watch(`config.a2a.communicationChannels.${index}.direction`) === 'outbound' && (
                         <Input {...register(`config.a2a.communicationChannels.${index}.targetAgentId`)} placeholder="Target Agent ID (for outbound)" />
                    )}
                    <Controller
                      name={`config.a2a.communicationChannels.${index}.schema`}
                      control={control}
                      render={({ field, fieldState }) => (
                        <JsonEditorField
                          id={field.name}
                          value={field.value || ""}
                          onChange={field.onChange}
                          placeholder="Message Schema (JSON Schema string or URL, optional)"
                          height="150px"
                          error={fieldState.error?.message}
                        />
                      )}
                    />
                    {/* TODO: Retry Policy fields if needed */}
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeChannel(index)} className="mt-2">
                      <Trash2Icon className="mr-2 h-4 w-4" />Remove Channel
                    </Button>
                  </Card>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => appendChannel({ id: `chan_${Date.now()}`, name: '', direction: 'outbound', messageFormat: 'json', syncMode: 'async' })} className="mt-3">
                <PlusIcon className="mr-2 h-4 w-4" />Add Channel
              </Button>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Default Response Format */}
                <div className="space-y-2">
                    <Label htmlFor="config.a2a.defaultResponseFormat" className="flex items-center">Default Response Format <InfoIconComponent tooltipText={agentBuilderHelpContent.a2aTab.defaultResponseFormat.tooltip} onClick={() => showHelpModal({ tab: 'a2aTab', field: 'defaultResponseFormat' })} className="ml-2" /></Label>
                    <Controller name="config.a2a.defaultResponseFormat" control={control} render={({field}) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                            <SelectTrigger><SelectValue placeholder="Select format"/></SelectTrigger>
                            <SelectContent>{messageFormatOptions.slice(0,2).map(opt=><SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                        </Select>
                    )} />
                </div>

                {/* Max Message Size */}
                <div className="space-y-2">
                    <Label htmlFor="config.a2a.maxMessageSize" className="flex items-center">Max Message Size (KB) <InfoIconComponent tooltipText={agentBuilderHelpContent.a2aTab.maxMessageSize.tooltip} onClick={() => showHelpModal({ tab: 'a2aTab', field: 'maxMessageSize' })} className="ml-2" /></Label>
                    <Controller name="config.a2a.maxMessageSize" control={control} render={({field}) => <Input id="config.a2a.maxMessageSize" type="number" placeholder="e.g., 1024" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)} />} />
                </div>
            </div>

            {/* Security Policy */}
            <div className="space-y-2">
                <Label htmlFor="config.a2a.securityPolicy" className="flex items-center">Security Policy <InfoIconComponent tooltipText={agentBuilderHelpContent.a2aTab.securityPolicy.tooltip} onClick={() => showHelpModal({ tab: 'a2aTab', field: 'securityPolicy' })} className="ml-2" /></Label>
                <Controller name="config.a2a.securityPolicy" control={control} render={({field}) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select security policy"/></SelectTrigger>
                        <SelectContent>{securityPolicyOptions.map(opt=><SelectItem key={opt.value} value={opt.value!}>{opt.label}</SelectItem>)}</SelectContent>
                    </Select>
                )} />
            </div>

            {securityPolicy === 'api_key' && (
                 <div className="space-y-2">
                    <Label htmlFor="config.a2a.apiKeyHeaderName" className="flex items-center">API Key Header Name <InfoIconComponent tooltipText={agentBuilderHelpContent.a2aTab.apiKeyHeaderName.tooltip} onClick={() => showHelpModal({ tab: 'a2aTab', field: 'apiKeyHeaderName' })} className="ml-2" /></Label>
                    <Input id="config.a2a.apiKeyHeaderName" {...register('config.a2a.apiKeyHeaderName')} placeholder="e.g., X-Agent-API-Key" />
                </div>
            )}

            {/* Logging Enabled */}
            <div className="flex items-center space-x-2 pt-2">
                <Controller name="config.a2a.loggingEnabled" control={control} render={({field}) => <Switch id="a2a-logging-enabled" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="a2a-logging-enabled" className="flex items-center">Enable A2A Logging <InfoIconComponent tooltipText={agentBuilderHelpContent.a2aTab.loggingEnabled.tooltip} onClick={() => showHelpModal({ tab: 'a2aTab', field: 'loggingEnabled' })} className="ml-2" /></Label>
            </div>

          </CardContent>
        </Card>
      )}
    </div>
  );
}
