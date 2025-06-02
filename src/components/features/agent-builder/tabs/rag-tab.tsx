import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type RagConfig = {
  enabled: boolean;
  vectorStoreUrl: string;
  collectionName: string;
  queryParams: string;
};

export default function RagTab() {
  const { register, watch } = useFormContext();
  const ragConfig: RagConfig = watch('config.rag') || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Switch id="rag-enabled" checked={ragConfig.enabled} />
        <Label htmlFor="rag-enabled">Enable RAG Integration</Label>
      </div>

      {ragConfig.enabled && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Vector Store URL</Label>
            <Input 
              {...register('config.rag.vectorStoreUrl')}
              placeholder="https://your-vector-store.com/api"
            />
          </div>

          <div className="space-y-2">
            <Label>Collection Name</Label>
            <Input 
              {...register('config.rag.collectionName')}
              placeholder="Enter collection name"
            />
          </div>

          <div className="space-y-2">
            <Label>Query Parameters (JSON)</Label>
            <Textarea 
              {...register('config.rag.queryParams')}
              placeholder="Additional query parameters as JSON"
              rows={3}
            />
          </div>
        </div>
      )}
    </div>
  );
}
