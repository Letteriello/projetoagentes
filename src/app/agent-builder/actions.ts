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
import { SavedAgentConfiguration } from '@/types/agent-configs';

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
  currentConfig: SavedAgentConfiguration,
  suggestionContext?: z.infer<typeof AiConfigurationAssistantInputSchema>['suggestionContext'] // Add optional context
): Promise<{ success: boolean; suggestions?: z.infer<typeof AiConfigurationAssistantOutputSchema>; error?: string }> {
  'use server';
  try {
    // Construct the input for the flow, including the context if provided
    const flowInput: z.infer<typeof AiConfigurationAssistantInputSchema> = {
      fullAgentConfig: currentConfig,
    };
    if (suggestionContext) {
      flowInput.suggestionContext = suggestionContext;
    }

    // Optional: Validate the constructed flowInput before calling the flow
    // This provides an early exit if the input is malformed.
    const parsedFlowInput = AiConfigurationAssistantInputSchema.safeParse(flowInput);
    if (!parsedFlowInput.success) {
      console.error("Invalid input for aiConfigurationAssistantFlow:", parsedFlowInput.error.flatten());
      return { success: false, error: "Invalid input data for AI suggestions: " + parsedFlowInput.error.message };
    }

    const suggestions = await runFlow(aiConfigurationAssistantFlow, parsedFlowInput.data);
    
    return { success: true, suggestions };
  } catch (e: any) {
    console.error("Error in getAiConfigurationSuggestionsAction:", e);
    return { success: false, error: e.message || "Failed to get suggestions from AI assistant." };
  }
}

// Placeholder for a more specific action if needed for LLM Behavior suggestions
// This can be expanded or used by a more specific UI component later.
// For now, the AiConfigurationAssistantOutputSchema includes personality and restrictions.
