import * as React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle } from 'lucide-react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import type { SavedAgentConfiguration } from '@/types/agent-configs-new';

// Define props if any are needed, e.g., showHelpModal
// interface CallbacksTabProps {
//   showHelpModal?: (contentKey: any) => void;
// }

const CallbacksTab: React.FC = (/*props: CallbacksTabProps*/) => {
  const { control } = useFormContext<SavedAgentConfiguration>();

  return (
    <div className="space-y-6">
      <Alert variant="warning" className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Performance Considerations</AlertTitle>
        <AlertDescription>
          Operações longas dentro de callbacks podem impactar a performance do agente, seguindo a documentação do ADK.
        </AlertDescription>
      </Alert>
      <Card>
        <CardHeader>
          <CardTitle>Model Callbacks</CardTitle>
          <CardDescription>
            Define snippets of logic to be executed before and after model calls.
            These will be stored in the new `callbacks` field in the agent configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Before Model Callback Section */}
          <div className="space-y-2">
            <FormLabel>Before Model Callback</FormLabel>
            <FormField
              control={control}
              name="config.callbacks.beforeModelLogic"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter logic for Before Model callback (e.g., modify request object)"
                      rows={3}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="config.callbacks.beforeModelEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 mt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Enable Before Model Callback
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* After Model Callback Section */}
          <div className="space-y-2">
            <FormLabel>After Model Callback</FormLabel>
            <FormField
              control={control}
              name="config.callbacks.afterModelLogic"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter logic for After Model callback (e.g., log response or modify it)"
                      rows={3}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="config.callbacks.afterModelEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 mt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Enable After Model Callback
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tool Callbacks Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tool Callbacks</CardTitle>
          <CardDescription>
            Define snippets of logic to be executed before and after tool calls.
            These will also be stored in the `callbacks` field.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Before Tool Callback Section */}
          <div className="space-y-2">
            <FormLabel>Before Tool Callback</FormLabel>
            <FormField
              control={control}
              name="config.callbacks.beforeToolLogic"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter logic for Before Tool callback (e.g., validate tool input)"
                      rows={3}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="config.callbacks.beforeToolEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 mt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Enable Before Tool Callback
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* After Tool Callback Section */}
          <div className="space-y-2">
            <FormLabel>After Tool Callback</FormLabel>
            <FormField
              control={control}
              name="config.callbacks.afterToolLogic"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter logic for After Tool callback (e.g., process tool output)"
                      rows={3}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="config.callbacks.afterToolEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-2 mt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Enable After Tool Callback
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CallbacksTab;
