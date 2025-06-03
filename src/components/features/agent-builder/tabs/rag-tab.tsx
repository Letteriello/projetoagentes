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
import { SavedAgentConfiguration, RagMemoryConfig, KnowledgeSource } from '@/types/agent-configs-fixed';

// Props passed from AgentBuilderDialog
interface RagTabProps {
  SearchIcon: React.ElementType;
  UploadCloudIcon: React.ElementType;
  FileTextIcon: React.ElementType;
  PlusIcon: React.ElementType;
  Trash2Icon: React.ElementType;
  InfoIcon: React.ElementType; // This is the InfoIcon component passed as a prop
  showHelpModal: (contentKey: { tab: keyof typeof agentBuilderHelpContent; field: string }) => void;
}

type FormContextType = SavedAgentConfiguration;

const knowledgeSourceTypeOptions: Array<{value: KnowledgeSource['type'], label: string}> = [
  { value: 'file', label: 'File Upload' },
  { value: 'url', label: 'URL' },
  { value: 'text_chunk', label: 'Text Chunk' },
  { value: 'google_drive', label: 'Google Drive' },
];

const ragServiceTypeOptions: Array<{value: RagMemoryConfig['serviceType'], label: string}> = [
    { value: 'in-memory', label: 'In-Memory Vector Store (Testing)'},
    { value: 'vertex_ai_rag', label: 'Vertex AI RAG API'},
    // { value: 'custom_vector_db', label: 'Custom Vector DB (Not Implemented)'}
];


export default function RagTab({
  SearchIcon, UploadCloudIcon, FileTextIcon, PlusIcon, Trash2Icon, InfoIcon, showHelpModal
}: RagTabProps) {
  const { control, watch, register, setValue } = useFormContext<FormContextType>();
  const ragEnabled = watch('config.rag.enabled');
  const serviceType = watch('config.rag.serviceType');
  const persistentMemoryEnabled = watch('config.rag.persistentMemory.enabled');

  const { fields: ksFields, append: appendKs, remove: removeKs } = useFieldArray({
    control,
    name: "config.rag.knowledgeSources",
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Controller
          name="config.rag.enabled"
          control={control}
          render={({ field }) => (
            <Switch
              id="rag-enabled"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Label htmlFor="rag-enabled" className="flex items-center">
          Enable RAG (Retrieval Augmented Generation)
          <InfoIconComponent
            tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.enableRAG.tooltip}
            onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'enableRAG' })}
            className="ml-2"
          />
        </Label>
      </div>

      {ragEnabled && (
        <Card className="p-4 md:p-6">
          <CardContent className="space-y-6 pt-6">
            {/* RAG Service Type */}
            <div className="space-y-2">
              <Label htmlFor="config.rag.serviceType" className="flex items-center">
                RAG Service Type
                <InfoIconComponent /* TODO: Add help content */ tooltipText="Select the RAG service provider." onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'ragServiceType' })} className="ml-2" />
              </Label>
              <Controller
                name="config.rag.serviceType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="config.rag.serviceType">
                      <SelectValue placeholder="Select RAG service type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ragServiceTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Knowledge Sources */}
            <div>
              <h4 className="text-lg font-medium mb-3 flex items-center">
                Knowledge Sources
                <InfoIconComponent tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.knowledgeSources.tooltip} onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'knowledgeSources' })} className="ml-2" />
              </h4>
              <div className="space-y-3">
                {ksFields.map((field, index) => (
                  <Card key={field.id} className="p-3 bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
                      <Input {...register(`config.rag.knowledgeSources.${index}.name`)} placeholder="Source Name (e.g., Product Docs)" />
                      <Controller
                        name={`config.rag.knowledgeSources.${index}.type`}
                        control={control}
                        render={({ field: typeField }) => (
                          <Select onValueChange={typeField.onChange} value={typeField.value}>
                            <SelectTrigger><SelectValue placeholder="Select source type" /></SelectTrigger>
                            <SelectContent>
                              {knowledgeSourceTypeOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                    {watch(`config.rag.knowledgeSources.${index}.type`) === 'file' && (
                        <Input type="file" {...register(`config.rag.knowledgeSources.${index}.path`)} className="mt-2" />
                    )}
                    {watch(`config.rag.knowledgeSources.${index}.type`) === 'url' && (
                        <Input {...register(`config.rag.knowledgeSources.${index}.path`)} placeholder="https://example.com/docs" className="mt-2" />
                    )}
                    {watch(`config.rag.knowledgeSources.${index}.type`) === 'text_chunk' && (
                        <Textarea {...register(`config.rag.knowledgeSources.${index}.content`)} placeholder="Paste text content here..." rows={3} className="mt-2" />
                    )}
                     {watch(`config.rag.knowledgeSources.${index}.type`) === 'google_drive' && (
                        <Input {...register(`config.rag.knowledgeSources.${index}.path`)} placeholder="Google Drive Folder/File ID or URL" className="mt-2" />
                    )}
                    {/* TODO: Add metadata field (e.g. simple key-value or JSON) */}
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
                onClick={() => appendKs({ id: `ks_${Date.now()}`, name: '', type: 'file', path: '', content: '', status: 'pending', metadata: {} })}
                className="mt-3"
              >
                <PlusIcon className="mr-2 h-4 w-4" />Add Knowledge Source
              </Button>
            </div>

            <Separator />

            {/* Retrieval Parameters */}
            <h4 className="text-lg font-medium pt-2 flex items-center">
              Retrieval Parameters
              <InfoIconComponent tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.retrievalParameters.tooltip} onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'retrievalParameters' })} className="ml-2" />
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor="config.rag.retrievalParameters.topK">Top K</Label>
                <Controller
                  name="config.rag.retrievalParameters.topK"
                  control={control}
                  render={({ field }) => <Input id="config.rag.retrievalParameters.topK" type="number" placeholder="e.g., 5" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || undefined)} />}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="config.rag.retrievalParameters.similarityThreshold">Similarity Threshold</Label>
                 <Controller
                  name="config.rag.retrievalParameters.similarityThreshold"
                  control={control}
                  render={({ field }) => <Input id="config.rag.retrievalParameters.similarityThreshold" type="number" step="0.01" placeholder="e.g., 0.75" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} />}
                />
              </div>
            </div>

            {/* Embedding Model */}
             <div className="space-y-2 pt-2">
              <Label htmlFor="config.rag.embeddingModel" className="flex items-center">
                Embedding Model Override (Optional)
                <InfoIconComponent tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.embeddingModel.tooltip} onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'embeddingModel' })} className="ml-2" />
              </Label>
              <Input id="config.rag.embeddingModel" {...register('config.rag.embeddingModel')} placeholder="e.g., text-embedding-004" />
            </div>


            {/* Include Conversation Context */}
            <div className="flex items-center space-x-2 pt-2">
              <Controller
                name="config.rag.includeConversationContext"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="rag-include-context"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="rag-include-context" className="flex items-center">
                Include Conversation Context in Queries
                <InfoIconComponent tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.includeConversationContext.tooltip} onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'includeConversationContext' })} className="ml-2" />
              </Label>
            </div>

            {/* Persistent Memory */}
            <div className="flex items-center space-x-2 pt-2">
               <Controller
                name="config.rag.persistentMemory.enabled"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="rag-persistent-memory-enabled"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="rag-persistent-memory-enabled" className="flex items-center">
                Enable Persistent Memory for RAG
                <InfoIconComponent tooltipText={agentBuilderHelpContent.memoryKnowledgeTab.persistentMemory.tooltip} onClick={() => showHelpModal({ tab: 'memoryKnowledgeTab', field: 'persistentMemory' })} className="ml-2" />
              </Label>
            </div>
            {persistentMemoryEnabled && (
              <div className="space-y-2 pl-6">
                <Label htmlFor="config.rag.persistentMemory.storagePath">Storage Path (Optional)</Label>
                <Input id="config.rag.persistentMemory.storagePath" {...register('config.rag.persistentMemory.storagePath')} placeholder="e.g., /path/to/vectorstore or specific DB identifier" />
              </div>
            )}

          </CardContent>
        </Card>
      )}
    </div>
  );
}
