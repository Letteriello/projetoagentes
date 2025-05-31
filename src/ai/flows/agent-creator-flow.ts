/**
 * @fileOverview Manages the conversational flow for creating new AI agents.
 * This flow guides the user through defining an agent's configuration via conversation,
 * and aims to extract a structured JSON configuration once the user confirms the details.
 * It supports streaming responses for a more interactive experience.
 */
import { defineFlow } from '@genkit-ai/core';
import { z } from 'zod';
import { ai, generate, type MessageData, type Part } from '@genkit-ai/ai'; // For history type, added Part
import { gemini15Pro } from '@genkit-ai/googleai'; // Using Gemini 1.5 Pro, removed unused gemini10Pro
import { logger } from '@/lib/logger'; // Assuming a logger

// Define the output schema for the agent creator flow stream
import { SavedAgentConfiguration } from '@/types/agent-configs'; // Import for precise typing
export const AgentCreatorFlowStreamOutputSchema = z.object({
  agentResponseChunk: z.string().optional(),
  suggestedConfig: z.custom<SavedAgentConfiguration>().optional(),
  error: z.string().optional(),
  rawJsonForDebug: z.string().optional()
});
export type AgentCreatorFlowStreamOutput = z.infer<typeof AgentCreatorFlowStreamOutputSchema>;


// 2. System Prompt - REFINED
export const SYSTEM_PROMPT_AGENT_CREATOR = `
You are an expert AI Agent Creation Assistant. Your primary goal is to help users design and configure new AI agents by conversing with them.

Your tasks are:
1.  Understand the user's initial request for a new agent.
2.  Ask clarifying questions to gather all necessary details for the new agent's configuration. These details include, but are not limited to:
    *   **Name:** A unique and descriptive name for the agent.
    *   **Description:** A brief explanation of what the agent does.
    *   **Type:** Whether it's an 'llm' agent (driven by a language model), a 'workflow' agent (follows predefined steps), or a 'custom' agent (complex custom logic). (Default to 'llm' if unsure)
    *   **Goal:** The primary objective or purpose of the agent. (Mainly for 'llm' type)
    *   **Tasks:** A list of specific tasks the agent should perform. (Mainly for 'llm' type, can be a bulleted or numbered list string)
    *   **Personality/Tone:** (For LLM agents) How the agent should behave (e.g., friendly, professional, witty, concise, verbose).
    *   **Tools:** What tools the agent needs. Available tools are: Web Search, Calculator, Knowledge Base (RAG), Calendar Access, Custom API Integration, Database Access, Code Executor. Ask about tools specifically if relevant to the agent's purpose.
    *   **Model Preferences:** (For LLM agents) Any preferred AI model (e.g., Gemini, GPT) or specific version. Default to a capable model like 'googleai/gemini-1.5-flash-latest'.
    *   **Temperature:** (For LLM agents) A number between 0.0 and 1.0. Default to 0.7.
    *   **Workflow Details:** (For 'workflow' type) Ask for \`detailedWorkflowType\` (e.g., 'sequential', 'graph') and \`workflowDescription\`.
    *   **Version:** Default to '1.0.0'.
    *   **Framework:** Default to 'genkit'.
3.  Guide the user through these options patiently. You can suggest options or ask direct questions.
4.  Once you believe you have a complete set of details, summarize the proposed agent configuration for the user in a clear, itemized list. Ask for their explicit confirmation before proceeding.
5.  If the user asks to create the agent after confirmation, or if they confirm your summary, your *very next response* must be ONLY a JSON object representing the agent's configuration. This JSON object should be enclosed in triple backticks (e.g., \`\`\`json\n{...}\n\`\`\`). Do not add any conversational text or explanations before or after this JSON block in that specific response.
    The JSON structure should include these fields at a minimum (fill with sensible defaults if some details were not explicitly provided by the user):
    \`agentName: string\`
    \`agentDescription: string\`
    \`agentType: 'llm' | 'workflow' | 'custom'\` (Default to 'llm' if unsure)
    \`agentGoal: string\` (For LLM type)
    \`agentTasks: string\` (For LLM type, as a numbered or bulleted list string)
    \`agentPersonality: string\` (For LLM type, e.g., 'Friendly and Helpful')
    \`agentModel: string\` (For LLM type, e.g., 'googleai/gemini-1.5-flash-latest')
    \`agentTemperature: number\` (For LLM type, e.g., 0.7)
    \`agentTools: string[]\` (Array of tool IDs, e.g., ['webSearch', 'calculator'])
    \`agentVersion: string\` (Default to '1.0.0')
    \`agentFramework: 'genkit'\` (Default)
    Example for an LLM agent:
    \`\`\`json
    {
      "agentName": "Weather Reporter",
      "agentDescription": "Provides current weather information.",
      "agentType": "llm",
      "agentGoal": "To give users accurate and concise weather updates.",
      "agentTasks": "1. Ask the user for a location. 2. Use the webSearch tool to find weather for that location. 3. Report the weather.",
      "agentPersonality": "Clear and informative",
      "agentModel": "googleai/gemini-1.5-flash-latest",
      "agentTemperature": 0.5,
      "agentTools": ["webSearch"],
      "agentVersion": "1.0.0",
      "agentFramework": "genkit"
    }
    \`\`\`
    Only include fields relevant to the chosen \`agentType\`. For 'workflow' type, include \`detailedWorkflowType\` and \`workflowDescription\` and omit LLM-specific fields like \`agentGoal\`, \`agentPersonality\`, \`agentModel\`, \`agentTemperature\`.
6.  If the user asks for changes *after* you've proposed the JSON, acknowledge the change request and continue the conversation. Then, when they confirm again, provide the updated JSON block as your sole response.
Be helpful, thorough, and conversational.
`.trim();


// 1. Input and Output Schemas
export const AgentCreatorFlowInputSchema = z.object({
  userId: z.string().optional().describe("User ID for context, if available."),
  userMessage: z.string().describe("The user's current message."),
  history: z.array(z.object({
    role: z.enum(['user', 'model', 'system']),
    content: z.array(z.object({text: z.string()})),
  })).optional().describe("Conversation history."),
  stream: z.boolean().optional().default(true).describe("Whether to stream the response."),
});



// 3. Agent Creator Flow Definition
export const agentCreatorFlow = defineFlow(
  {
    name: 'agentCreatorFlow',
    inputSchema: AgentCreatorFlowInputSchema,
    outputSchema: z.void(), // Output is handled via streamCallback
  } as const,
  async (input: AgentCreatorFlowInput, streamCallback?: (chunk: any) => void | Promise<void>) => {
    const { userMessage, history = [], stream = true } = input;

    if (!streamCallback && stream) {
        logger.error("[AgentCreatorFlow] Stream mode is true but no streamCallback was provided.");
        throw new Error("streamCallback is required for streaming in agentCreatorFlow.");
    }

    const messages: MessageData[] = [
      { role: 'system', content: [{ text: SYSTEM_PROMPT_AGENT_CREATOR }] },
    ];

    history.forEach((h: MessageData) => {
        // Ensure content is an array of Parts and all parts are text.
        if (h.role && h.content && Array.isArray(h.content) && h.content.every((c: Part) => typeof c.text === 'string')) {
            messages.push(h as MessageData); // Cast is okay if structure aligns, which it does due to the check.
        }
    });
    messages.push({ role: 'user', content: [{ text: userMessage }] });

    try {
      const llmResponse = await generate({
        model: gemini15Pro,
        messages: messages,
        stream: stream,
        config: { temperature: 0.5 },
      });

      let accumulatedText = "";
      let jsonProcessedMidStream = false; // Flag to track if JSON was handled mid-stream

      for await (const chunk of llmResponse.stream()) {
        const textContent = chunk.text();
        if (!textContent) continue;

        accumulatedText += textContent;

        // Optimistic mid-stream parsing for early preview
        if (accumulatedText.includes("```json") && accumulatedText.trim().endsWith("```")) {
          const jsonRegex = /```json\n([\s\S]*?)\n```/;
          const match = accumulatedText.match(jsonRegex);

          if (match && match[1]) {
            const jsonString = match[1];
            try {
              const parsedConfig = JSON.parse(jsonString);
              logger.info("[AgentCreatorFlow] Successfully parsed suggestedConfig JSON mid-stream (optimistic).");

              const textBeforeJson = accumulatedText.substring(0, match.index!).trim();
              if (textBeforeJson) {
                streamCallback?.({ agentResponseChunk: textBeforeJson });
              }

              streamCallback?.({
                agentResponseChunk: "I've drafted the agent configuration based on our conversation. Please review it below. You can then save it or ask for more changes.",
                suggestedConfig: parsedConfig
              });

              // Clear the processed part from accumulatedText
              accumulatedText = accumulatedText.substring(match.index! + match[0].length);
              jsonProcessedMidStream = true; // Mark that we've processed JSON

            } catch (e: any) {
              // Parsing failed mid-stream, could be incomplete JSON.
              // Log and continue accumulating. The robust post-loop parsing will handle it.
              logger.debug('[AgentCreatorFlow] Optimistic JSON parsing failed mid-stream, continuing accumulation. Error details:', e);
            }
          }
        }
      } // End of for-await loop

      // Robust post-loop processing for any remaining accumulatedText
      if (accumulatedText.trim()) {
        const jsonRegex = /```json\n([\s\S]*?)\n```/;
        const match = accumulatedText.match(jsonRegex);

        if (match && match[1]) {
          const jsonString = match[1];
          try {
            const parsedConfig = JSON.parse(jsonString);
            logger.info("[AgentCreatorFlow] Successfully parsed suggestedConfig JSON from final accumulated text.");

            // Stream text before JSON, if any, and if JSON wasn't already handled mid-stream
            const textBeforeJson = accumulatedText.substring(0, match.index!).trim();
            if (textBeforeJson) {
                streamCallback?.({ agentResponseChunk: textBeforeJson });
            }

            // Send the suggested config. If it was already sent mid-stream, this might be redundant
            // or could be a corrected version if the LLM sent more data.
            // UI should ideally handle duplicate `suggestedConfig` if states are the same.
            streamCallback?.({
              agentResponseChunk: !jsonProcessedMidStream ? "I've drafted the agent configuration based on our conversation. Please review it below. You can then save it or ask for more changes." : "",
              suggestedConfig: parsedConfig
            });

            const textAfterJson = accumulatedText.substring(match.index! + match[0].length).trim();
            if (textAfterJson) {
                streamCallback?.({ agentResponseChunk: textAfterJson });
            }
          } catch (e: any) {
            logger.warn('[AgentCreatorFlow] Failed to parse JSON from final accumulated text. Error details:', e);
            // Send the conversational part that might have preceded the malformed JSON.
            const textBeforePotentialJson = match.index! > 0 ? accumulatedText.substring(0, match.index!).trim() : "";

            // If JSON was processed mid-stream, we might have already sent the text before it.
            // Only send textBeforePotentialJson if it's different from what might have been part of mid-stream processing.
            // However, accumulatedText here is *only* what remained *after* mid-stream processing. So this is fine.
            if (textBeforePotentialJson) {
                 streamCallback?.({ agentResponseChunk: textBeforePotentialJson });
            }
            streamCallback?.({
              agentResponseChunk: "\n\nI attempted to provide a configuration, but it seems to be malformed.",
              error: `Malformed configuration JSON. Please review the raw output. Error: ${e instanceof Error ? e.message : String(e)}`,
              rawJsonForDebug: jsonString
            });
          }
        } else {
          // No JSON block found in the remaining accumulated text.
          // If JSON was already processed mid-stream, this is just trailing text.
          // If no JSON was ever processed, this is the full conversational response.
          streamCallback?.({ agentResponseChunk: accumulatedText });
        }
      } else if (jsonProcessedMidStream && !accumulatedText.trim()) {
        // This case means JSON was processed mid-stream and there was no trailing text.
        // We might want to send a confirmation or ensure the UI knows the stream ended.
        // For now, this is implicitly handled as the loop ends and no more chunks are sent.
        logger.info("[AgentCreatorFlow] JSON processed mid-stream and no further text followed.");
      }

    } catch (err: unknown) {
      logger.error('[AgentCreatorFlow] Error in generate call or streaming loop. Error details:', err);
      if (streamCallback) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during agent creation LLM call.';
        streamCallback({ error: errorMessage });
      }
    }
  }
);
