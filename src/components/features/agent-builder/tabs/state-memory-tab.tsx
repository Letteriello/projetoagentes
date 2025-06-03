import React from 'react';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InfoIcon as InfoIconComponent } from '@/components/ui/InfoIcon'; // Renamed to avoid conflict
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import { SavedAgentConfiguration, StatePersistenceType, StateScope, InitialStateValue, StateValidationRule } from '@/types/agent-configs-fixed';

// Props passed from AgentBuilderDialog
interface StateMemoryTabProps {
  SaveIcon: React.ElementType;
  ListChecksIcon: React.ElementType;
  PlusIcon: React.ElementType;
  Trash2Icon: React.ElementType;
  InfoIcon: React.ElementType; // This is the InfoIcon component passed as a prop
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
}

type FormContextType = SavedAgentConfiguration;

export default function StateMemoryTab({
  SaveIcon, ListChecksIcon, PlusIcon, Trash2Icon, InfoIcon, showHelpModal
}: StateMemoryTabProps) {
  const { control, watch, register, setValue } = useFormContext<FormContextType>();
  const statePersistenceEnabled = watch('config.statePersistence.enabled');
  const defaultScope = watch('config.statePersistence.defaultScope');

  const { fields: initialValueFields, append: appendInitialValue, remove: removeInitialValue } = useFieldArray({
    control,
    name: "config.statePersistence.initialStateValues",
  });

  const { fields: validationRuleFields, append: appendValidationRule, remove: removeValidationRule } = useFieldArray({
    control,
    name: "config.statePersistence.validationRules",
  });

  const statePersistenceTypeOptions: Array<{value: StatePersistenceType, label: string}> = [
    { value: 'session', label: 'Session (Browser-based)' },
    { value: 'memory', label: 'Memory (Short-term, Server-side)' },
    { value: 'database', label: 'Database (Long-term)' },
  ];

  const stateScopeOptions: Array<{value: StateScope, label: string}> = [
    { value: 'AGENT', label: 'Agent (Default for this instance)' },
    { value: 'GLOBAL', label: 'Global (Shared across agents)' },
    { value: 'TEMPORARY', label: 'Temporary (Time-limited)' },
  ];

  const validationRuleTypeOptions: Array<{value: 'JSON_SCHEMA' | 'REGEX', label: string}> = [
    { value: 'JSON_SCHEMA', label: 'JSON Schema' },
    { value: 'REGEX', label: 'Regular Expression' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Controller
          name="config.statePersistence.enabled"
          control={control}
          render={({ field }) => (
            <Switch
              id="state-persistence-enabled"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="state-persistence-enabled" className="flex items-center">
          Enable State Persistence
          <InfoIconComponent
            tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.enableStatePersistence.tooltip}
            onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'enableStatePersistence' })}
            className="ml-2"
          />
        </Label>
      </div>

      {statePersistenceEnabled && (
        <Card className="p-4 md:p-6">
          <CardContent className="space-y-6 pt-6"> {/* Added pt-6 for padding after header removed */}
            {/* Persistence Type */}
            <div className="space-y-2">
              <Label htmlFor="config.statePersistence.type" className="flex items-center">
                Persistence Type
                <InfoIconComponent
                  tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.statePersistenceType.tooltip}
                  onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'statePersistenceType' })}
                  className="ml-2"
                />
              </Label>
              <Controller
                name="config.statePersistence.type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="config.statePersistence.type">
                      <SelectValue placeholder="Select persistence type" />
                    </SelectTrigger>
                    <SelectContent>
                      {statePersistenceTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Default State Scope */}
            <div className="space-y-2">
              <Label htmlFor="config.statePersistence.defaultScope" className="flex items-center">
                Default State Scope
                <InfoIconComponent
                  tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.defaultStateScope.tooltip}
                  onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'defaultStateScope' })}
                  className="ml-2"
                />
              </Label>
              <Controller
                name="config.statePersistence.defaultScope"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="config.statePersistence.defaultScope">
                      <SelectValue placeholder="Select default scope" />
                    </SelectTrigger>
                    <SelectContent>
                      {stateScopeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Time To Live (TTL) - Conditional */}
            {defaultScope === 'TEMPORARY' && (
              <div className="space-y-2">
                <Label htmlFor="config.statePersistence.timeToLiveSeconds" className="flex items-center">
                  TTL for Temporary Scope (seconds)
                  <InfoIconComponent
                    tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.timeToLiveSeconds.tooltip}
                    onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'timeToLiveSeconds' })}
                    className="ml-2"
                  />
                </Label>
                <Controller
                  name="config.statePersistence.timeToLiveSeconds"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="config.statePersistence.timeToLiveSeconds"
                      type="number"
                      placeholder="e.g., 3600 (1 hour)"
                      value={field.value || ''}
                      onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)}
                    />
                  )}
                />
              </div>
            )}

            <Separator />

            {/* Initial State Values */}
            <div>
              <h4 className="text-lg font-medium mb-2 flex items-center">
                Initial State Values
                <InfoIconComponent
                  tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.initialStateValues.tooltip}
                  onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'initialStateValues' })}
                  className="ml-2"
                />
              </h4>
              {initialValueFields.map((field, index) => (
                <Card key={field.id} className="p-3 mb-3 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    <Input {...register(`config.statePersistence.initialStateValues.${index}.key`)} placeholder="Key (e.g., userRole)" />
                    <Select
                      onValueChange={(value) => setValue(`config.statePersistence.initialStateValues.${index}.scope`, value as StateScope)}
                      defaultValue={field.scope || defaultScope || 'AGENT'}
                    >
                      <SelectTrigger><SelectValue placeholder="Select scope" /></SelectTrigger>
                      <SelectContent>
                        {stateScopeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Textarea {...register(`config.statePersistence.initialStateValues.${index}.value`)} placeholder='Value (JSON string, e.g., "admin" or {"theme":"dark"})' rows={2} />
                  <Input {...register(`config.statePersistence.initialStateValues.${index}.description`)} placeholder="Description (optional)" />
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeInitialValue(index)} className="mt-1">
                    <Trash2Icon className="mr-2 h-4 w-4" />Remove Value
                  </Button>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendInitialValue({ key: '', value: '', scope: defaultScope || 'AGENT', description: '' })}
                className="mt-2"
              >
                <PlusIcon className="mr-2 h-4 w-4" />Add Initial Value
              </Button>
            </div>

            <Separator />

            {/* State Validation Rules */}
            <div>
              <h4 className="text-lg font-medium mb-2 flex items-center">
                State Validation Rules
                 <InfoIconComponent
                  tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.validationRules.tooltip}
                  onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'validationRules' })}
                  className="ml-2"
                />
              </h4>
              {validationRuleFields.map((field, index) => (
                <Card key={field.id} className="p-3 mb-3 space-y-2">
                   <Input {...register(`config.statePersistence.validationRules.${index}.name`)} placeholder="Rule Name (e.g., UserInputSchema)" />
                   <Controller
                      name={`config.statePersistence.validationRules.${index}.type`}
                      control={control}
                      defaultValue={field.type || 'JSON_SCHEMA'}
                      render={({ field: typeField }) => (
                        <Select onValueChange={typeField.onChange} value={typeField.value}>
                          <SelectTrigger><SelectValue placeholder="Select rule type" /></SelectTrigger>
                          <SelectContent>
                            {validationRuleTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  <Textarea {...register(`config.statePersistence.validationRules.${index}.rule`)} placeholder={watch(`config.statePersistence.validationRules.${index}.type`) === 'JSON_SCHEMA' ? "JSON Schema definition..." : "Regular expression..."} rows={3} />
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeValidationRule(index)} className="mt-1">
                    <Trash2Icon className="mr-2 h-4 w-4" />Remove Rule
                  </Button>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendValidationRule({ id: `rule_${Date.now()}`, name: '', type: 'JSON_SCHEMA', rule: '' })}
                className="mt-2"
              >
                <PlusIcon className="mr-2 h-4 w-4" />Add Validation Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
