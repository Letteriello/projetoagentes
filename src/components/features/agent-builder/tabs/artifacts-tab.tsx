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
  ArtifactStorageType,
  // ArtifactDefinition // Type for items in useFieldArray will be inferred
} from '@/types/agent-configs-new'; // Updated import
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

// Props passed from AgentBuilderDialog
interface ArtifactsTabProps {
  FileJsonIcon: React.ElementType;
  UploadCloudIcon: React.ElementType;
  BinaryIcon: React.ElementType;
  PlusIcon: React.ElementType;
  Trash2Icon: React.ElementType;
  InfoIcon: React.ElementType;
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
}

type FormContextType = SavedAgentConfiguration;

// Assuming ArtifactStorageType is a string union as defined in agent-configs-new
const artifactStorageTypeOptions: Array<{value: ArtifactStorageType, label: string}> = [
    { value: 'memory', label: 'Memory (In-memory, temporary)' },
    { value: 'filesystem', label: 'Local Filesystem' },
    { value: 'cloud', label: 'Cloud Storage (e.g., GCS, S3)' },
];

// Assuming ArtifactDefinition['accessPermissions'] is a string union: 'read' | 'write' | 'read_write'
const artifactAccessOptions: Array<{value: 'read' | 'write' | 'read_write', label: string}> = [
    { value: 'read', label: 'Read-Only'},
    { value: 'write', label: 'Write-Only'},
    { value: 'read_write', label: 'Read-Write'},
];

export default function ArtifactsTab({
  FileJsonIcon, UploadCloudIcon, BinaryIcon, PlusIcon, Trash2Icon, InfoIcon, showHelpModal
}: ArtifactsTabProps) {
  const { control, watch, formState: { errors } } = useFormContext<FormContextType>(); // Removed register
  const artifactsEnabled = watch('config.artifacts.enabled');
  const storageType = watch('config.artifacts.storageType');

  const { fields: definitionFields, append: appendDefinition, remove: removeDefinition } = useFieldArray({
    control,
    name: "config.artifacts.definitions",
  });

  return (
    <div className="space-y-6">
      <FormItem className="flex flex-row items-center space-x-2">
        <FormControl>
          <Controller
            name="config.artifacts.enabled"
            control={control}
            render={({ field }) => (
              <Switch
                id="artifacts-enabled"
                checked={field.value || false}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </FormControl>
        <FormLabel htmlFor="artifacts-enabled" className="!mt-0 flex items-center">
          Enable Artifact Management
          <InfoIconComponent
            tooltipText={agentBuilderHelpContent.artifactsTab.enableArtifacts.tooltip}
            onClick={() => showHelpModal({ tab: 'artifactsTab', field: 'enableArtifacts' })}
            className="ml-2"
          />
        </FormLabel>
      </FormItem>

      {artifactsEnabled && (
        <Card className="p-4 md:p-6">
          <CardContent className="space-y-6 pt-6">
            <FormField
              control={control}
              name="config.artifacts.storageType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    Artifact Storage Type
                    <InfoIconComponent tooltipText={agentBuilderHelpContent.artifactsTab.storageType.tooltip} onClick={() => showHelpModal({ tab: 'artifactsTab', field: 'storageType' })} className="ml-2" />
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select storage type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {artifactStorageTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {storageType === 'cloud' && (
              <FormField
                control={control}
                name="config.artifacts.cloudStorageBucket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Cloud Storage Bucket Name
                      <InfoIconComponent tooltipText={agentBuilderHelpContent.artifactsTab.cloudStorageBucket.tooltip} onClick={() => showHelpModal({ tab: 'artifactsTab', field: 'cloudStorageBucket' })} className="ml-2" />
                    </FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} placeholder="your-cloud-storage-bucket-name" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {storageType === 'filesystem' && (
              <FormField
                control={control}
                name="config.artifacts.localStoragePath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Local Filesystem Path
                      <InfoIconComponent tooltipText={agentBuilderHelpContent.artifactsTab.localStoragePath.tooltip} onClick={() => showHelpModal({ tab: 'artifactsTab', field: 'localStoragePath' })} className="ml-2" />
                    </FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} placeholder="/path/to/agent/artifacts" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Separator />

            <div>
              <h4 className="text-lg font-medium mb-3 flex items-center">
                Artifact Definitions
                <InfoIconComponent tooltipText={agentBuilderHelpContent.artifactsTab.definitions.tooltip} onClick={() => showHelpModal({ tab: 'artifactsTab', field: 'definitions' })} className="ml-2" />
              </h4>
              <div className="space-y-3">
                {definitionFields.map((item, index) => (
                  <Card key={item.id} className="p-3 bg-muted/30 space-y-3">
                    <FormField
                      control={control}
                      name={`config.artifacts.definitions.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Artifact Name</FormLabel>
                          <FormControl><Input {...field} placeholder="e.g., generated_report.pdf" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`config.artifacts.definitions.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Textarea {...field} placeholder="Description of the artifact" rows={2} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`config.artifacts.definitions.${index}.mimeType`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>MIME Type</FormLabel>
                          <FormControl><Input {...field} placeholder="e.g., application/pdf" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`config.artifacts.definitions.${index}.required`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                           <FormControl>
                            <Switch
                              id={`artifact-def-${index}-required`}
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel htmlFor={`artifact-def-${index}-required`} className="!mt-0">Required Artifact</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`config.artifacts.definitions.${index}.accessPermissions`}
                      defaultValue={item.accessPermissions || 'read_write'}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Access Permissions</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Access Permissions" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {artifactAccessOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`config.artifacts.definitions.${index}.versioningEnabled`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2">
                          <FormControl>
                            <Switch
                              id={`artifact-def-${index}-versioning`}
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel htmlFor={`artifact-def-${index}-versioning`} className="!mt-0">Enable Versioning</FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeDefinition(index)} className="mt-2">
                      <Trash2Icon className="mr-2 h-4 w-4" />Remove Definition
                    </Button>
                  </Card>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendDefinition({ id: `art_def_${Date.now()}`, name: '', description: '', mimeType: '', required: false, accessPermissions: 'read_write', versioningEnabled: false } as any)}
                className="mt-3"
              >
                <PlusIcon className="mr-2 h-4 w-4" />Add Artifact Definition
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
