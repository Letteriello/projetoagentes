import React from 'react';
import { useFormContext, Controller, useFieldArray, useWatch, setValue as setFormValue } from 'react-hook-form'; // Added useWatch and setValue
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
  ArtifactDefinition // Explicitly import ArtifactDefinition
} from '@/types/agent-configs-new'; // Updated import
import { FileUploader } from '@/components/ui/file-uploader'; // Import FileUploader
import { useToast } from "@/components/ui/use-toast"; // Import useToast
import { useRunFlow } from '@/hooks/useRunFlow'; // Import useRunFlow
import { artifactManagementFlow } from '@/ai/flows/artifact-management-flow'; // Import the flow
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
  const { control, watch, setValue, formState: { errors } } = useFormContext<FormContextType>(); // Added setValue, Removed register
  const artifactsEnabled = watch('config.artifacts.enabled');
  const globalStorageType = watch('config.artifacts.storageType'); // Renamed for clarity as it's global
  const globalCloudStorageBucket = watch('config.artifacts.cloudStorageBucket');
  const globalLocalStoragePath = watch('config.artifacts.localStoragePath');

  const { toast } = useToast();
  const { runFlow, isLoading } = useRunFlow(artifactManagementFlow); // Removed error as it's handled in catch

  const { fields: definitionFields, append: appendDefinition, remove: removeDefinition } = useFieldArray({
    control,
    name: "config.artifacts.definitions",
  });

  const handleFileSelectedForArtifact = async (files: File[], artifactIndex: number) => {
    if (files.length === 0) return;
    const file = files[0];

    // Ensure globalStorageType is valid before proceeding
    if (!globalStorageType) {
      toast({
        variant: "destructive",
        title: "Configuration Error",
        description: "Global artifact storage type is not selected. Please configure it first.",
      });
      return;
    }

    try {
      const result = await runFlow({
        fileName: file.name,
        storageType: globalStorageType,
        fileData: "simulated_file_content_placeholder", // Placeholder for content
        cloudStorageBucket: globalCloudStorageBucket,
        localStoragePath: globalLocalStoragePath,
      });

      if (result && result.filePath) {
        setValue(`config.artifacts.definitions.${artifactIndex}.storagePath`, result.filePath, { shouldValidate: true });
        setValue(`config.artifacts.definitions.${artifactIndex}.fileName`, file.name, { shouldValidate: true });
        toast({ title: "Artifact Uploaded", description: result.message });
      } else {
        // This case might occur if runFlow resolves but with no result or filePath
        throw new Error("Flow completed but returned no file path or an unexpected result.");
      }
    } catch (err: any) {
      console.error("Artifact upload error:", err);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: err.message || "An unexpected error occurred during upload.",
      });
      // Optionally clear fields if upload fails, depending on desired UX
      // setValue(`config.artifacts.definitions.${artifactIndex}.storagePath`, '', { shouldValidate: true });
      // setValue(`config.artifacts.definitions.${artifactIndex}.fileName`, '', { shouldValidate: true });
    }
  };

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
                  <Select onValueChange={field.onChange} value={field.value || undefined} disabled={isLoading}>
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

            {globalStorageType === 'cloud' && (
              <FormField
                control={control}
                name="config.artifacts.cloudStorageBucket"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Cloud Storage Bucket Name
                      <InfoIconComponent tooltipText={agentBuilderHelpContent.artifactsTab.cloudStorageBucket.tooltip} onClick={() => showHelpModal({ tab: 'artifactsTab', field: 'cloudStorageBucket' })} className="ml-2" />
                    </FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} placeholder="your-cloud-storage-bucket-name" disabled={isLoading} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {globalStorageType === 'filesystem' && (
              <FormField
                control={control}
                name="config.artifacts.localStoragePath"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Local Filesystem Path
                      <InfoIconComponent tooltipText={agentBuilderHelpContent.artifactsTab.localStoragePath.tooltip} onClick={() => showHelpModal({ tab: 'artifactsTab', field: 'localStoragePath' })} className="ml-2" />
                    </FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} placeholder="/path/to/agent/artifacts" disabled={isLoading} /></FormControl>
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
                  <Card key={item.id} className="p-3 bg-muted/30 space-y-4"> {/* Increased card spacing slightly */}
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

                    {/* File Uploader Integration */}
                    <FormItem>
                      <FormLabel>Upload File (Optional)</FormLabel>
                      <FileUploader
                        maxFiles={1}
                        onFilesSelected={(selectedFiles) => handleFileSelectedForArtifact(selectedFiles, index)}
                        className="w-full"
                        disabled={isLoading || !globalStorageType} // Disable if loading or no storage type selected
                      />
                       {!globalStorageType && (
                        <p className="text-xs text-destructive mt-1">
                          Please select an Artifact Storage Type above to enable uploads.
                        </p>
                      )}
                    </FormItem>

                    {/* Display Uploaded File Info & Remove Button */}
                    {(() => { // IIFE to use useWatch inside map for fileName
                      const currentFileName = watch(`config.artifacts.definitions.${index}.fileName`);
                      if (currentFileName) {
                        return (
                          <div className="text-sm mt-2 p-2 border border-dashed rounded-md bg-background">
                            <p className="font-medium">Uploaded: {currentFileName}</p>
                            <Button
                              type="button"
                              variant="link"
                              size="sm"
                              className="text-red-500 p-0 h-auto"
                              onClick={() => {
                                setValue(`config.artifacts.definitions.${index}.storagePath`, '', { shouldValidate: true });
                                setValue(`config.artifacts.definitions.${index}.fileName`, '', { shouldValidate: true });
                              }}
                              disabled={isLoading} // Disable remove if an upload is in progress
                            >
                              Remove File
                            </Button>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeDefinition(index)}
                      className="mt-2"
                      disabled={isLoading} // Disable remove definition if an upload is in progress
                    >
                      <Trash2Icon className="mr-2 h-4 w-4" />Remove Definition
                    </Button>
                  </Card>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendDefinition({
                  id: `art_def_${Date.now()}`,
                  name: '',
                  description: '',
                  mimeType: '',
                  required: false,
                  accessPermissions: 'read_write',
                  versioningEnabled: false,
                  storagePath: '',
                  fileName: ''
                } as ArtifactDefinition)}
                className="mt-3"
                disabled={isLoading} // Disable add definition if an upload is in progress
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
