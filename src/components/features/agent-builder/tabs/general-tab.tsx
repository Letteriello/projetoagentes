import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function GeneralTab() {
  const { register } = useFormContext();
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="agentName">Agent Name</Label>
        <Input 
          id="agentName" 
          {...register('agentName')} 
          placeholder="Enter agent name"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description"
          {...register('description')} 
          placeholder="Describe your agent's purpose"
          rows={3}
        />
      </div>
    </div>
  );
}
