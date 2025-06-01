// src/app/agent-builder/actions.ts
"use server";

import { agentCreatorChatFlow } from "@/ai/flows/agent-creator-flow";
import { SavedAgentConfiguration } from "@/types/agent-configs";
// Removed incorrect import for runFlow as we'll use the flow directly
import { runFlow } from '@genkit-ai/flow';
import { agentNameDescriptionSuggesterFlow, AgentNameDescriptionSuggesterInputSchema, AgentNameDescriptionSuggesterOutputSchema } from '@/ai/flows/agentNameDescriptionSuggesterFlow';
import { z } from 'zod';

interface CreatorChatActionInput {
  userNaturalLanguageInput: string;
  currentAgentConfigJson?: string;
  chatHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

// Schema for the new action's input, reusing the flow's Zod schema
const SuggestActionInputSchema = AgentNameDescriptionSuggesterInputSchema;

interface SuggestionResult {
  success: boolean;
  suggestedName?: string;
  suggestedDescription?: string;
  error?: string;
}

export async function suggestAgentNameAndDescriptionAction(
  input: z.infer<typeof SuggestActionInputSchema>
): Promise<SuggestionResult> {
  try {
    // Input is already expected to be structured according to AgentNameDescriptionSuggesterInputSchema
    // If additional server-side validation is desired before hitting the flow, it can be done here.
    // For example, SuggestActionInputSchema.parse(input); can be called explicitly.
    // However, runFlow will also validate against the flow's inputSchema.

    const result = await runFlow(agentNameDescriptionSuggesterFlow, input);

    // Ensure the result matches the expected output schema (optional, as runFlow should also handle this)
    // const validatedResult = AgentNameDescriptionSuggesterOutputSchema.parse(result);

    return {
      success: true,
      suggestedName: result.suggestedName,
      suggestedDescription: result.suggestedDescription,
    };
  } catch (e: any) {
    console.error('Error in suggestAgentNameAndDescriptionAction:', e);
    // Check if the error is a ZodError for more specific messages, or handle other error types
    if (e instanceof z.ZodError) {
      return {
        success: false,
        error: `Input validation failed: ${e.errors.map(err => `${err.path.join('.')} - ${err.message}`).join(', ')}`,
      };
    }
    return {
      success: false,
      error: e.message || 'Failed to get suggestions from AI.',
    };
  }
}

// Added for LLM Behavior Suggestions
import {
  llmBehaviorSuggesterFlow,
  LlmBehaviorSuggesterInputSchema
} from '@/ai/flows/llmBehaviorSuggesterFlow';

interface BehaviorSuggestionResult {
  success: boolean;
  suggestions?: string[];
  error?: string;
}

export async function suggestLlmBehaviorAction(
  input: z.infer<typeof LlmBehaviorSuggesterInputSchema>
): Promise<BehaviorSuggestionResult> {
  try {
    // runFlow will validate input against LlmBehaviorSuggesterInputSchema
    const result = await runFlow(llmBehaviorSuggesterFlow, input);

    return {
      success: true,
      suggestions: result.suggestions,
    };
  } catch (e: any) {
    console.error('Error in suggestLlmBehaviorAction:', e);
    let errorMessage = 'Failed to get behavior suggestions from AI.';
    if (e instanceof z.ZodError) {
      // More detailed error message for Zod validation errors from the flow itself or runFlow
      errorMessage = 'Data validation error: ' + e.errors.map(err => `${err.path.join('.')} - ${err.message}`).join(', ');
    } else if (e.message) {
      errorMessage = e.message;
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}

interface CreatorChatActionResult {
  updatedAgentConfigJson?: string;
  assistantResponse?: string;
  error?: string;
}

export async function invokeAgentCreatorChatFlow(
  input: CreatorChatActionInput
): Promise<CreatorChatActionResult> {
  try {
    // Invoke the flow directly without using runFlow
    const flowResult = await agentCreatorChatFlow({
      userNaturalLanguageInput: input.userNaturalLanguageInput,
      currentAgentConfigJson: input.currentAgentConfigJson,
      chatHistory: input.chatHistory,
    });

    return {
      updatedAgentConfigJson: flowResult.updatedAgentConfigJson,
      assistantResponse: flowResult.assistantResponse,
    };
  } catch (e: any) {
    console.error("Error invoking agentCreatorChatFlow:", e);
    return {
      error: e.message || "Failed to run agent creator flow.",
    };
  }
}
