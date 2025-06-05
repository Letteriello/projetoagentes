import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

interface DatabaseAccessConfigFormProps {
  basePath: string;
}

const DatabaseAccessConfigForm: React.FC<DatabaseAccessConfigFormProps> = ({ basePath }) => {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={`${basePath}.dbType`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Database Type</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select database type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
                <SelectItem value="sqlite">SQLite</SelectItem>
                <SelectItem value="mongodb">MongoDB</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${basePath}.dbConnectionString`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Connection String (Optional)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., postgresql://user:pass@host:port/dbname" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${basePath}.dbHost`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Host</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., localhost or IP address" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${basePath}.dbPort`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Port</FormLabel>
            <FormControl>
              <Input type="number" {...field} placeholder="e.g., 5432" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${basePath}.dbName`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Database Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., my_database" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${basePath}.dbUser`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>User (Optional)</FormLabel>
            <FormControl>
              <Input {...field} placeholder="e.g., admin_user" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${basePath}.dbPassword`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Password (Optional)</FormLabel>
            <FormControl>
              <Input type="password" {...field} placeholder="Enter database password" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name={`${basePath}.dbDescription`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description/Purpose (Optional)</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Describe the purpose or schema of this database connection" />
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
                <Textarea {...field} placeholder="e.g., ^/api/v1/users/.* or ^SELECT .* FROM customers" rows={2} />
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
                <Textarea {...field} placeholder="e.g., DELETE.* or /admin.*" rows={2} />
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
                <Textarea {...field} placeholder='e.g., { "max_rows": 100 } or "PROHIBIT_FILE_WRITE"' rows={2} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default DatabaseAccessConfigForm;
