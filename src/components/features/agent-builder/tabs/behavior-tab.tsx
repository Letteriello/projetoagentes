import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

export default function BehaviorTab() {
  const { control, watch } = useFormContext();
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Agent Tone</Label>
        <Select name="agentTone">
          <SelectTrigger>
            <SelectValue placeholder="Select tone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="friendly">Friendly</SelectItem>
            <SelectItem value="technical">Technical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>Creativity Level</Label>
        <Slider 
          defaultValue={[50]} 
          min={0} 
          max={100} 
          step={1}
          name="creativityLevel"
        />
      </div>
    </div>
  );
}
