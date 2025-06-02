import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type MemoryConfig = {
  enabled: boolean;
  persistenceType: 'session' | 'local' | 'indexedDB';
  initialStateValues: string;
};

export default function StateMemoryTab() {
  const { register, watch } = useFormContext();
  const memoryConfig: MemoryConfig = watch('config.statePersistence') || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Switch id="memory-enabled" checked={memoryConfig.enabled} />
        <Label htmlFor="memory-enabled">Enable State Persistence</Label>
      </div>

      {memoryConfig.enabled && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Persistence Type</Label>
            <select className="w-full p-2 border rounded" {...register('config.statePersistence.persistenceType')}>
              <option value="session">Session Storage</option>
              <option value="local">Local Storage</option>
              <option value="indexedDB">IndexedDB</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Initial State Values (JSON)</Label>
            <Textarea 
              {...register('config.statePersistence.initialStateValues')}
              placeholder="Enter initial state as JSON"
              rows={4}
            />
          </div>
        </div>
      )}
    </div>
  );
}
