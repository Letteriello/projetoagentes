import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type ArtifactConfig = {
  storageType: 'local' | 'cloud';
  localStoragePath?: string;
  cloudStorageBucket?: string;
  definitions: string[];
};

export default function ArtifactsTab() {
  const { register, watch } = useFormContext();
  const artifactConfig: ArtifactConfig = watch('config.artifacts') || {};

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Storage Type</Label>
        <Select name="config.artifacts.storageType">
          <SelectTrigger>
            <SelectValue placeholder="Select storage type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="local">Local Storage</SelectItem>
            <SelectItem value="cloud">Cloud Storage</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {artifactConfig.storageType === 'local' && (
        <div className="space-y-2">
          <Label>Local Storage Path</Label>
          <Input 
            {...register('config.artifacts.localStoragePath')}
            placeholder="/path/to/artifacts"
          />
        </div>
      )}

      {artifactConfig.storageType === 'cloud' && (
        <div className="space-y-2">
          <Label>Cloud Storage Bucket</Label>
          <Input 
            {...register('config.artifacts.cloudStorageBucket')}
            placeholder="my-bucket-name"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Artifact Definitions (JSON array)</Label>
        <Textarea
          {...register('config.artifacts.definitions')}
          placeholder="[\"artifact1\", \"artifact2\"]"
          rows={4}
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}
