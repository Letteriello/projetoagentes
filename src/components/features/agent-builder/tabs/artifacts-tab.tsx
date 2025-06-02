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
import { InfoIcon as InfoIconComponent } from '@/components/ui/InfoIcon'; // Renamed
import { agentBuilderHelpContent } from '@/data/agent-builder-help-content';
import { SavedAgentConfiguration, ArtifactStorageType, ArtifactDefinition } from '@/types/agent-configs';

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

const artifactStorageTypeOptions: Array<{value: ArtifactStorageType, label: string}> = [
    { value: 'memory', label: 'Memory (In-memory, temporary)' },
    { value: 'filesystem', label: 'Local Filesystem' },
    { value: 'cloud', label: 'Cloud Storage (e.g., GCS, S3)' },
    // 'local' was in old UI, mapping to 'filesystem'. If browser local storage was meant, that's different.
];

const artifactAccessOptions: Array<{value: ArtifactDefinition['accessPermissions'], label: string}> = [
    { value: 'read', label: 'Read-Only'},
    { value: 'write', label: 'Write-Only'},
    { value: 'read_write', label: 'Read-Write'},
];

export default function ArtifactsTab({
  FileJsonIcon, UploadCloudIcon, BinaryIcon, PlusIcon, Trash2Icon, InfoIcon, showHelpModal
}: ArtifactsTabProps) {
  const { control, watch, register } = useFormContext<FormContextType>();
  const artifactsEnabled = watch('config.artifacts.enabled');
  const storageType = watch('config.artifacts.storageType');

  const { fields: definitionFields, append: appendDefinition, remove: removeDefinition } = useFieldArray({
    control,
    name: "config.artifacts.definitions",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Controller
          name="config.artifacts.enabled"
          control={control}
          render={({ field }) => (
            <Switch
              id="artifacts-enabled"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="artifacts-enabled" className="flex items-center">
          Enable Artifact Management
          <InfoIconComponent
            tooltipText={agentBuilderHelpContent.artifactsTab.enableArtifacts.tooltip}
            onClick={() => showHelpModal({ tab: 'artifactsTab', field: 'enableArtifacts' })}
            className="ml-2"
          />
        </Label>
      </div>

      {artifactsEnabled && (
        <Card className="p-4 md:p-6">
          <CardContent className="space-y-6 pt-6">
            {/* Storage Type */}
            <div className="space-y-2">
              <Label htmlFor="config.artifacts.storageType" className="flex items-center">
                Artifact Storage Type
                <InfoIconComponent tooltipText={agentBuilderHelpContent.artifactsTab.storageType.tooltip} onClick={() => showHelpModal({ tab: 'artifactsTab', field: 'storageType' })} className="ml-2" />
              </Label>
              <Controller
                name="config.artifacts.storageType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="config.artifacts.storageType">
                      <SelectValue placeholder="Select storage type" />
                    </SelectTrigger>
                    <SelectContent>
                      {artifactStorageTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Cloud Storage Bucket (Conditional) */}
            {storageType === 'cloud' && (
              <div className="space-y-2">
                <Label htmlFor="config.artifacts.cloudStorageBucket" className="flex items-center">
                  Cloud Storage Bucket Name
                  <InfoIconComponent tooltipText={agentBuilderHelpContent.artifactsTab.cloudStorageBucket.tooltip} onClick={() => showHelpModal({ tab: 'artifactsTab', field: 'cloudStorageBucket' })} className="ml-2" />
                </Label>
                <Input id="config.artifacts.cloudStorageBucket" {...register('config.artifacts.cloudStorageBucket')} placeholder="your-cloud-storage-bucket-name" />
              </div>
            )}

            {/* Local Filesystem Path (Conditional) */}
            {storageType === 'filesystem' && (
              <div className="space-y-2">
                <Label htmlFor="config.artifacts.localStoragePath" className="flex items-center">
                  Local Filesystem Path
                  <InfoIconComponent tooltipText={agentBuilderHelpContent.artifactsTab.localStoragePath.tooltip} onClick={() => showHelpModal({ tab: 'artifactsTab', field: 'localStoragePath' })} className="ml-2" />
                </Label>
                <Input id="config.artifacts.localStoragePath" {...register('config.artifacts.localStoragePath')} placeholder="/path/to/agent/artifacts" />
              </div>
            )}

            <Separator />

            {/* Artifact Definitions */}
            <div>
              <h4 className="text-lg font-medium mb-3 flex items-center">
                Artifact Definitions
                <InfoIconComponent tooltipText={agentBuilderHelpContent.artifactsTab.definitions.tooltip} onClick={() => showHelpModal({ tab: 'artifactsTab', field: 'definitions' })} className="ml-2" />
              </h4>
              <div className="space-y-3">
                {definitionFields.map((field, index) => (
                  <Card key={field.id} className="p-3 bg-muted/30 space-y-2">
                    <Input {...register(`config.artifacts.definitions.${index}.name`)} placeholder="Artifact Name (e.g., generated_report.pdf)" />
                    <Textarea {...register(`config.artifacts.definitions.${index}.description`)} placeholder="Description of the artifact" rows={2} />
                    <Input {...register(`config.artifacts.definitions.${index}.mimeType`)} placeholder="MIME Type (e.g., application/pdf)" />
                    <div className="flex items-center space-x-2">
                       <Controller
                          name={`config.artifacts.definitions.${index}.required`}
                          control={control}
                          render={({ field: requiredField }) => (
                            <Switch
                              id={`artifact-def-${index}-required`}
                              checked={requiredField.value}
                              onCheckedChange={requiredField.onChange}
                              className="mt-1"
                            />
                          )}
                        />
                      <Label htmlFor={`artifact-def-${index}-required`}>Required Artifact</Label>
                    </div>
                     <Controller
                        name={`config.artifacts.definitions.${index}.accessPermissions`}
                        control={control}
                        render={({ field: accessField }) => (
                          <Select onValueChange={accessField.onChange} value={accessField.value || 'read_write'}>
                            <SelectTrigger><SelectValue placeholder="Access Permissions" /></SelectTrigger>
                            <SelectContent>
                              {artifactAccessOptions.map(opt => <SelectItem key={opt.value} value={opt.value!}>{opt.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                     <div className="flex items-center space-x-2">
                       <Controller
                          name={`config.artifacts.definitions.${index}.versioningEnabled`}
                          control={control}
                          render={({ field: versionField }) => (
                            <Switch
                              id={`artifact-def-${index}-versioning`}
                              checked={versionField.value}
                              onCheckedChange={versionField.onChange}
                              className="mt-1"
                            />
                          )}
                        />
                      <Label htmlFor={`artifact-def-${index}-versioning`}>Enable Versioning</Label>
                    </div>
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
                onClick={() => appendDefinition({ id: `art_def_${Date.now()}`, name: '', description: '', mimeType: '', required: false, accessPermissions: 'read_write', versioningEnabled: false })}
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
