"use client";

import { useFormState, useFormStatus } from "react-dom";
import { getAgentConfigurationSuggestion } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const initialState = {
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? "Getting Suggestion..." : "Get Suggestion"}
    </Button>
  );
}

export function AiAssistantForm() {
  const [state, formAction] = useFormState(getAgentConfigurationSuggestion, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.suggestedConfiguration || state.message === "Suggestion received successfully!") {
         if (formRef.current && !state.errors) { // Only show toast and reset if successful
          toast({
            title: "Success!",
            description: state.message,
            variant: "default",
            action: <CheckCircle2 className="text-green-500" />,
          });
          // formRef.current.reset(); // Optional: reset form on success
        }
      } else if (state.errors || state.message !== "Suggestion received successfully!") {
         toast({
          title: "Error",
          description: state.message,
          variant: "destructive",
          action: <AlertCircle className="text-white" />,
        });
      }
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Describe Your Agent's Goal</CardTitle>
          <CardDescription>
            Provide a detailed description of the task your agent needs to accomplish. The more specific you are, the better the AI can assist with configuration suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="taskGoal">Task Goal</Label>
            <Textarea
              id="taskGoal"
              name="taskGoal"
              placeholder="e.g., 'Create an agent that automatically responds to customer inquiries about order status via email, looking up information in our Shopify store.'"
              rows={5}
              required
              className="mt-1"
            />
            {state.errors?.taskGoal && (
              <p className="text-sm text-destructive mt-1">{state.errors.taskGoal.join(", ")}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </Card>

      {state.suggestedConfiguration && (
        <Card>
          <CardHeader>
            <CardTitle>Suggested Configuration</CardTitle>
            <CardDescription>Based on your task goal, here's a suggested configuration using Google ADK components.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={state.suggestedConfiguration}
              rows={10}
              className="font-mono text-sm bg-muted/50"
            />
          </CardContent>
          <CardFooter>
             <Button variant="outline" onClick={() => navigator.clipboard.writeText(state.suggestedConfiguration || '')}>
              Copy Configuration
            </Button>
          </CardFooter>
        </Card>
      )}
       {state.message && !state.suggestedConfiguration && state.errors && (
         <Alert variant="destructive">
           <AlertCircle className="h-4 w-4" />
           <AlertTitle>Error</AlertTitle>
           <AlertDescription>{state.message}</AlertDescription>
         </Alert>
       )}
    </form>
  );
}
