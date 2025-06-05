import React from 'react';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
// Label will be replaced by FormLabel
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { InfoIcon as InfoIconComponent } from '@/components/ui/InfoIcon';
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import {
  SavedAgentConfiguration,
  StatePersistenceType,
  StateScope,
  // InitialStateValue, // Type for items in useFieldArray will be inferred or use Controller's render prop
  // StateValidationRule // Same as above
} from '@/types/agent-core'; // Updated path
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

// Props passed from AgentBuilderDialog
interface StateMemoryTabProps {
  SaveIcon: React.ElementType;
  ListChecksIcon: React.ElementType;
  PlusIcon: React.ElementType;
  Trash2Icon: React.ElementType;
  InfoIcon: React.ElementType;
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
}

type FormContextType = SavedAgentConfiguration;

export default function StateMemoryTab({
  SaveIcon, ListChecksIcon, PlusIcon, Trash2Icon, InfoIcon, showHelpModal
}: StateMemoryTabProps) {
  const { control, watch, setValue, formState: { errors } } = useFormContext<FormContextType>(); // Removed register, added errors
  const statePersistenceEnabled = watch('config.statePersistence.enabled');
  const defaultScopeWatched = watch('config.statePersistence.defaultScope'); // Renamed to avoid conflict

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

  // Make sure these enum values are from your types, e.g. StateValidationRule['type']
  const validationRuleTypeOptions: Array<{value: "JSON_SCHEMA" | "REGEX", label: string}> = [
    { value: 'JSON_SCHEMA', label: 'JSON Schema' },
    { value: 'REGEX', label: 'Regular Expression' },
  ];


  return (
    <div className="space-y-6">
      <FormItem className="flex flex-row items-center space-x-2">
        <FormControl>
          <Controller
            name="config.statePersistence.enabled"
            control={control}
            render={({ field }) => (
              <Switch
                id="state-persistence-enabled"
                checked={field.value || false}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </FormControl>
        <FormLabel htmlFor="state-persistence-enabled" className="!mt-0 flex items-center"> {/* !mt-0 to override default FormItem label spacing */}
          Enable State Persistence
          <InfoIconComponent
            tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.enableStatePersistence.tooltip}
            onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'enableStatePersistence' })}
            className="ml-2"
          />
        </FormLabel>
      </FormItem>

      {statePersistenceEnabled && (
        <Card className="p-4 md:p-6">
          <CardContent className="space-y-6 pt-6">
            <FormField
              control={control}
              name="config.statePersistence.type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Persistence Type
                    <InfoIconComponent
                      tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.statePersistenceType.tooltip}
                      onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'statePersistenceType' })}
                      className="ml-2"
                    />
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select persistence type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statePersistenceTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="config.statePersistence.defaultScope"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Default State Scope
                    <InfoIconComponent
                      tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.defaultStateScope.tooltip}
                      onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'defaultStateScope' })}
                      className="ml-2"
                    />
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select default scope" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {stateScopeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {defaultScopeWatched === 'TEMPORARY' && (
              <FormField
                control={control}
                name="config.statePersistence.timeToLiveSeconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      TTL for Temporary Scope (seconds)
                      <InfoIconComponent
                        tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.timeToLiveSeconds.tooltip}
                        onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'timeToLiveSeconds' })}
                        className="ml-2"
                      />
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 3600 (1 hour)"
                        value={field.value || ''}
                        onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            <div>
              <h4 className="text-lg font-medium mb-3 flex items-center">
                Initial State Values
                <InfoIconComponent
                  tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.initialStateValues.tooltip}
                  onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'initialStateValues' })}
                  className="ml-2"
                />
              </h4>
              {initialValueFields.map((item, index) => (
                <Card key={item.id} className="p-3 mb-3 space-y-3">
                  <FormField
                    control={control}
                    name={`config.statePersistence.initialStateValues.${index}.key`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g., userRole" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`config.statePersistence.initialStateValues.${index}.value`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value (JSON string)</FormLabel>
                        <FormControl><Textarea {...field} placeholder='"admin" or {"theme":"dark"}' rows={2} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`config.statePersistence.initialStateValues.${index}.scope`}
                    defaultValue={item.scope || defaultScopeWatched || 'AGENT'}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scope</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select scope" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {stateScopeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`config.statePersistence.initialStateValues.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl><Input {...field} placeholder="Describe this initial value" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeInitialValue(index)} className="mt-1">
                    <Trash2Icon className="mr-2 h-4 w-4" />Remove Value
                  </Button>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendInitialValue({ key: '', value: '', scope: defaultScopeWatched || 'AGENT', description: '' })}
                className="mt-2"
              >
                <PlusIcon className="mr-2 h-4 w-4" />Add Initial Value
              </Button>
            </div>

            <Separator />

            <div>
              <h4 className="text-lg font-medium mb-3 flex items-center">
                State Validation Rules
                 <InfoIconComponent
                  tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.validationRules.tooltip}
                  onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'validationRules' })}
                  className="ml-2"
                />
              </h4>
              {validationRuleFields.map((item, index) => (
                <Card key={item.id} className="p-3 mb-3 space-y-3">
                  <FormField
                    control={control}
                    name={`config.statePersistence.validationRules.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rule Name</FormLabel>
                        <FormControl><Input {...field} placeholder="e.g., UserInputSchema" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`config.statePersistence.validationRules.${index}.type`}
                    defaultValue={item.type || 'JSON_SCHEMA'}
                    render={({ field }) => (
                     <FormItem>
                        <FormLabel>Rule Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select rule type" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {validationRuleTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`config.statePersistence.validationRules.${index}.rule`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rule Definition</FormLabel>
                        <FormControl><Textarea {...field} placeholder={watch(`config.statePersistence.validationRules.${index}.type`) === 'JSON_SCHEMA' ? "JSON Schema definition..." : "Regular expression..."} rows={3} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="destructive" size="sm" onClick={() => removeValidationRule(index)} className="mt-1">
                    <Trash2Icon className="mr-2 h-4 w-4" />Remove Rule
                  </Button>
                </Card>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendValidationRule({ id: `rule_${Date.now()}`, name: '', type: 'JSON_SCHEMA', rule: '' } as any)} // Added `as any` to satisfy stricter type check if `id` is not in defaultValues of Zod schema.
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
