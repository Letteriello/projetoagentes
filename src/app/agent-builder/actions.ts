"use server";

import { generate } from "@genkit-ai/ai";
import { gemini15Pro } from "@genkit-ai/googleai"; // Ensure this is the correct model
import { runFlow } from "@genkit-ai/flow";
import {
  AgentNameDescriptionSuggesterInputSchema,
  agentNameDescriptionSuggesterFlow,
} from "@/ai/flows/agentNameDescriptionSuggesterFlow";
import { z } from "zod";

// Assuming aiConfigurationAssistantFlow is correctly defined and exported
import {
  aiConfigurationAssistantFlow,
  AiConfigurationAssistantInputSchema,
  AiConfigurationAssistantOutputSchema
} from "@/ai/flows/aiConfigurationAssistantFlow"; // Added OutputSchema import

// Action for suggesting agent name and description
export async function suggestAgentNameAndDescriptionAction(
  input: z.infer<typeof AgentNameDescriptionSuggesterInputSchema>
): Promise<
  | { success: true; suggestedName: string; suggestedDescription: string }
  | { success: false; error: string }
> {
  try {
    // Validate input (optional, as flow itself validates, but good for early exit)
    const parsedInput = AgentNameDescriptionSuggesterInputSchema.safeParse(input);
    if (!parsedInput.success) {
      return { success: false, error: "Invalid input: " + parsedInput.error.flatten().fieldErrors };
    }

    const result = await runFlow(agentNameDescriptionSuggesterFlow, parsedInput.data);
    return {
      success: true,
      suggestedName: result.suggestedName,
      suggestedDescription: result.suggestedDescription,
    };
  } catch (e: any) {
    console.error("Error in suggestAgentNameAndDescriptionAction:", e);
    return {
      success: false,
      error: e.message || "An unexpected error occurred while fetching suggestions.",
    };
  }
}

// New action for AI Configuration Assistant
export async function getAiConfigurationSuggestionsAction(
  input: z.infer<typeof AiConfigurationAssistantInputSchema>
): Promise<
  | { success: true; suggestions: z.infer<typeof AiConfigurationAssistantOutputSchema> }
  | { success: false; error: string }
> {
  try {
    // Validate input
    const parsedInput = AiConfigurationAssistantInputSchema.safeParse(input);
    if (!parsedInput.success) {
      return { success: false, error: "Invalid input: " + JSON.stringify(parsedInput.error.flatten().fieldErrors) };
    }

    const suggestions = await runFlow(aiConfigurationAssistantFlow, parsedInput.data);

    // Ensure the output from the flow matches the schema (it should, as flow validates its own output)
    // This is an additional check for robustness before sending to client.
    const parsedSuggestions = AiConfigurationAssistantOutputSchema.safeParse(suggestions);
    if (!parsedSuggestions.success) {
        console.error("Flow output validation failed in action:", parsedSuggestions.error);
        return { success: false, error: "Flow returned data in an unexpected format." };
    }

    return {
      success: true,
      suggestions: parsedSuggestions.data,
    };
  } catch (e: any) {
    console.error("Error in getAiConfigurationSuggestionsAction:", e);
    return {
      success: false,
      error: e.message || "An unexpected error occurred while fetching AI configuration suggestions.",
    };
  }
}

// Placeholder for a more specific action if needed for LLM Behavior suggestions
// This can be expanded or used by a more specific UI component later.
// For now, the AiConfigurationAssistantOutputSchema includes personality and restrictions.
/*
import {
  llmBehaviorSuggesterFlow,
  LlmBehaviorSuggesterInputSchema,
  LlmBehaviorSuggesterOutputSchema
} from "@/ai/flows/llmBehaviorSuggesterFlow";

export async function suggestLlmBehaviorAction(
  input: z.infer<typeof LlmBehaviorSuggesterInputSchema>
): Promise<
  | { success: true; suggestions: z.infer<typeof LlmBehaviorSuggesterOutputSchema> }
  | { success: false; error: string }
> {
  try {
    const parsedInput = LlmBehaviorSuggesterInputSchema.safeParse(input);
    if (!parsedInput.success) {
      return { success: false, error: "Invalid input for LLM behavior suggester." };
    }
    const result = await runFlow(llmBehaviorSuggesterFlow, parsedInput.data);
    return { success: true, suggestions: result };
  } catch (e: any) {
    console.error("Error in suggestLlmBehaviorAction:", e);
    return { success: false, error: e.message || "Failed to fetch LLM behavior suggestions." };
  }
}
*/
