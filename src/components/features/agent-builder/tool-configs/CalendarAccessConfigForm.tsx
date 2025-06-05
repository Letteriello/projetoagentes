import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';

interface CalendarAccessConfigFormProps {
  basePath: string;
}

const CalendarAccessConfigForm: React.FC<CalendarAccessConfigFormProps> = ({ basePath }) => {
  const { control } = useFormContext();

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={`${basePath}.calendarApiEndpoint`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Calendar API Endpoint</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter Calendar API Endpoint URL" />
            </FormControl>
            <FormMessage />
            <p className="text-xs text-muted-foreground mt-1">
              Typically, this would be a Google Calendar API endpoint or a similar service. Ensure authentication is handled appropriately.
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
              <Textarea {...field} placeholder="Describe this calendar integration (e.g., whose calendar, purpose)." />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};

export default CalendarAccessConfigForm;
