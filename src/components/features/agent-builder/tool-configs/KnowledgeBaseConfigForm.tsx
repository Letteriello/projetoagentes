import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';

interface KnowledgeBaseConfigFormProps {
  basePath: string;
}

const KnowledgeBaseConfigForm: React.FC<KnowledgeBaseConfigFormProps> = ({ basePath }) => {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={`${basePath}.knowledgeBaseId`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Knowledge Base ID</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter Knowledge Base ID" />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground mt-1">
              This ID typically refers to a configured knowledge base in Vertex AI Search or a similar system.
            </p>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${basePath}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (Optional)</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Describe this knowledge base integration." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default KnowledgeBaseConfigForm;
