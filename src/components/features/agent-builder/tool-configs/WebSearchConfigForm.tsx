import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"; // Assuming these are used

interface WebSearchConfigFormProps {
  basePath: string; // e.g., "toolConfigsApplied.webSearch"
}

const WebSearchConfigForm: React.FC<WebSearchConfigFormProps> = ({ basePath }) => {
  const { control } = useFormContext(); // Get control from context

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={`${basePath}.googleApiKey`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Google API Key</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter Google API Key" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${basePath}.googleCseId`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Google Custom Search Engine ID</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter CSE ID" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default WebSearchConfigForm;
