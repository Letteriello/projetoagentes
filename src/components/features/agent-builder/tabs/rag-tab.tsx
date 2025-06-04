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
  RagMemoryConfig, // Assuming this type is defined in agent-configs-new
  KnowledgeSource // Assuming this type is defined in agent-configs-new
} from '@/types/agent-configs-new'; // Updated import
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';

// Props passed from AgentBuilderDialog
interface RagTabProps {
  SearchIcon: React.ElementType;
  UploadCloudIcon: React.ElementType;
  FileTextIcon: React.ElementType;
  PlusIcon: React.ElementType;
  Trash2Icon: React.ElementType;
  InfoIcon: React.ElementType;
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
}

type FormContextType = SavedAgentConfiguration;

// Assuming KnowledgeSource['type'] is a string union. If it's an enum, use as appropriate.
const knowledgeSourceTypeOptions: Array<{value: string, label: string}> = [
  { value: 'file', label: 'File Upload' },
  { value: 'url', label: 'URL' },
  { value: 'text_chunk', label: 'Text Chunk' },
  { value: 'google_drive', label: 'Google Drive' },
];

// Assuming RagMemoryConfig['serviceType'] is a string union.
const ragServiceTypeOptions: Array<{value: string, label: string}> = [
    { value: 'in-memory', label: 'In-Memory Vector Store (Testing)'},
    { value: 'vertex_ai_rag', label: 'Vertex AI RAG API'},
    // { value: 'custom_vector_db', label: 'Custom Vector DB (Not Implemented)'}
];


export default function RagTab({
  SearchIcon, UploadCloudIcon, FileTextIcon, PlusIcon, Trash2Icon, InfoIcon, showHelpModal
}: RagTabProps) {
  const { control, watch, setValue, formState: { errors } } = useFormContext<FormContextType>(); // Removed register
  const ragEnabled = watch('config.rag.enabled');
  const serviceType = watch('config.rag.serviceType'); // Keep for conditional logic if any
  const persistentMemoryEnabled = watch('config.rag.persistentMemory.enabled');

  const { fields: ksFields, append: appendKs, remove: removeKs } = useFieldArray({
    control,
    name: "config.rag.knowledgeSources",
  });

  return (
    <div className="space-y-6">
      <FormItem className="flex flex-row items-center space-x-2">
        <FormControl>
          <Controller
            name="config.rag.enabled"
            control={control}
            render={({ field }) => (
              <Switch
                id="rag-enabled"
                checked={field.value || false}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </FormControl>
        <FormLabel htmlFor="rag-enabled" className="!mt-0 flex items-center">
          Enable RAG (Retrieval Augmented Generation)
          <InfoIconComponent
            tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.enableRAG.tooltip}
            onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'enableRAG' })}
            className="ml-2"
          />
        </FormLabel>
      </FormItem>

      {ragEnabled && (
        <Card className="p-4 md:p-6">
          <CardContent className="space-y-6 pt-6">
            <FormField
              control={control}
              name="config.rag.serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    RAG Service Type
                    <InfoIconComponent tooltipText="Select the RAG service provider." onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'ragServiceType' })} className="ml-2" />
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select RAG service type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ragServiceTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <h4 className="text-lg font-medium mb-3 flex items-center">
                Knowledge Sources
                <InfoIconComponent tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.knowledgeSources.tooltip} onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'knowledgeSources' })} className="ml-2" />
              </h4>
              <div className="space-y-3">
                {ksFields.map((item, index) => (
                  <Card key={item.id} className="p-3 bg-muted/30 space-y-3">
                    <FormField
                      control={control}
                      name={`config.rag.knowledgeSources.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Name</FormLabel>
                          <FormControl><Input {...field} placeholder="e.g., Product Docs" /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={control}
                      name={`config.rag.knowledgeSources.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select source type" /></SelectTrigger></FormControl>
                            <SelectContent>
                              {knowledgeSourceTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watch(`config.rag.knowledgeSources.${index}.type`) === 'file' && (
                       <FormField
                        control={control}
                        name={`config.rag.knowledgeSources.${index}.path`} // Assuming 'path' stores file name or temp path
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>File</FormLabel>
                            <FormControl><Input type="file" onChange={(e) => field.onChange(e.target.files?.[0])} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {watch(`config.rag.knowledgeSources.${index}.type`) === 'url' && (
                       <FormField
                        control={control}
                        name={`config.rag.knowledgeSources.${index}.path`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl><Input {...field} placeholder="https://example.com/docs" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                     {watch(`config.rag.knowledgeSources.${index}.type`) === 'google_drive' && (
                       <FormField
                        control={control}
                        name={`config.rag.knowledgeSources.${index}.path`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Drive Folder/File ID or URL</FormLabel>
                            <FormControl><Input {...field} placeholder="Google Drive Folder/File ID or URL" /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    {watch(`config.rag.knowledgeSources.${index}.type`) === 'text_chunk' && (
                      <FormField
                        control={control}
                        name={`config.rag.knowledgeSources.${index}.content`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Text Content</FormLabel>
                            <FormControl><Textarea {...field} placeholder="Paste text content here..." rows={3} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeKs(index)} className="mt-2">
                      <Trash2Icon className="mr-2 h-4 w-4" />Remove Source
                    </Button>
                  </Card>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendKs({ id: `ks_${Date.now()}`, name: '', type: 'file', path: '', content: '' } as any)} // Added 'as any' for missing fields if not all are optional in Zod
                className="mt-3"
              >
                <PlusIcon className="mr-2 h-4 w-4" />Add Knowledge Source
              </Button>
            </div>

            <Separator />

            <h4 className="text-lg font-medium pt-2 flex items-center">
              Retrieval Parameters
              <InfoIconComponent tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.retrievalParameters.tooltip} onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'retrievalParameters' })} className="ml-2" />
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <FormField
                control={control}
                name="config.rag.retrievalParameters.topK"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Top K</FormLabel>
                    <FormControl><Input type="number" placeholder="e.g., 5" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseInt(e.target.value,10) || undefined)} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="config.rag.retrievalParameters.similarityThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Similarity Threshold</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="e.g., 0.75" {...field} value={field.value ?? ''} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)}/></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={control}
              name="config.rag.embeddingModel"
              render={({ field }) => (
                <FormItem className="pt-2">
                  <FormLabel className="flex items-center">
                    Embedding Model Override (Optional)
                    <InfoIconComponent tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.embeddingModel.tooltip} onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'embeddingModel' })} className="ml-2" />
                  </FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ''} placeholder="e.g., text-embedding-004" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem className="flex flex-row items-center space-x-2 pt-2">
              <FormControl>
                <Controller
                  name="config.rag.includeConversationContext"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="rag-include-context"
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </FormControl>
              <FormLabel htmlFor="rag-include-context" className="!mt-0 flex items-center">
                Include Conversation Context in Queries
                <InfoIconComponent tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.includeConversationContext.tooltip} onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'includeConversationContext' })} className="ml-2" />
              </FormLabel>
            </FormItem>

            <FormItem className="flex flex-row items-center space-x-2 pt-2">
              <FormControl>
                 <Controller
                  name="config.rag.persistentMemory.enabled"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="rag-persistent-memory-enabled"
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </FormControl>
              <FormLabel htmlFor="rag-persistent-memory-enabled" className="!mt-0 flex items-center">
                Enable Persistent Memory for RAG
                <InfoIconComponent tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.persistentMemory.tooltip} onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'persistentMemory' })} className="ml-2" />
              </FormLabel>
            </FormItem>

            {persistentMemoryEnabled && (
              <FormField
                control={control}
                name="config.rag.persistentMemory.storagePath"
                render={({ field }) => (
                  <FormItem className="pl-6">
                    <FormLabel>Storage Path (Optional)</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ''} placeholder="e.g., /path/to/vectorstore or specific DB identifier" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
