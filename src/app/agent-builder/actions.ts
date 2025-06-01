// src/app/agent-builder/actions.ts
"use server";

import { agentCreatorChatFlow } from "@/ai/flows/agent-creator-flow";
import { SavedAgentConfiguration } from "@/types/agent-configs";
import { runFlow } from "@genkit-ai/flow/lib/run"; // Corrigir import se necessário

interface CreatorChatActionInput {
  userNaturalLanguageInput: string;
  currentAgentConfigJson?: string;
  chatHistory?: Array<{ role: "user" | "assistant"; content: string }>;
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
    const flowResult = await runFlow(agentCreatorChatFlow, {
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
