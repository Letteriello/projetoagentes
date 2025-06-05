import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';

interface CustomApiIntegrationConfigFormProps {
  basePath: string;
}

const CustomApiIntegrationConfigForm: React.FC<CustomApiIntegrationConfigFormProps> = ({ basePath }) => {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={`${basePath}.openapiSpecUrl`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>OpenAPI Spec URL</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter OpenAPI Specification URL (.json or .yaml)" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${basePath}.openapiApiKey`} // This field might need to be stored securely or handled via a vault
        render={({ field }) => (
          <FormItem>
            <FormLabel>API Key (Optional)</FormLabel>
            <FormControl>
              <Input type="password" {...field} placeholder="Enter API Key if required by the OpenAPI spec" />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground mt-1">
              Note: API key handling should ideally use a secure vault system.
            </p>
          </FormItem>
        )}
      />
      {/* Consider adding a Textarea for a description or notes about the API integration */}
      <FormField
        control={control}
        name={`${basePath}.description`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description (Optional)</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Describe this custom API integration, e.g., what it connects to, its purpose." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Guardrail Fields */}
      <div className="mt-4 pt-4 border-t">
        <h4 className="text-md font-semibold mb-2">Guardrail Settings (Optional)</h4>
        <FormField
          control={control}
          name={`${basePath}.allowedPatterns`}
          render={({ field }) => (
            <FormItem className="mb-2">
              <FormLabel>Allowed Patterns (Regex)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="e.g., ^/api/v1/users/.*" rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`${basePath}.deniedPatterns`}
          render={({ field }) => (
            <FormItem className="mb-2">
              <FormLabel>Denied Patterns (Regex)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="e.g., /admin.*" rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`${basePath}.customRules`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Rules (Text/JSON)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder='e.g., { "max_requests_per_minute": 10 }"' rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default CustomApiIntegrationConfigForm;
