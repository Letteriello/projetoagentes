/**
 * @fileOverview Manages the conversational flow for creating new AI agents.
 * This flow guides the user through defining an agent's configuration via conversation,
 * and aims to extract a structured JSON configuration once the user confirms the details.
 * It supports streaming responses for a more interactive experience.
 */
import { defineFlow, ai, generate } from 'genkit/flow';
import { z } from 'zod';
import { type MessageData } from 'genkit/ai'; // For history type
import { geminiPro, gemini15Pro } from 'genkitx-googleai'; // Assuming specific model import
import { logger } from '@/lib/logger'; // Assuming a logger

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

// Output schema for each streamed chunk
export const AgentCreatorFlowStreamOutputSchema = z.object({
  agentResponseChunk: z.string().optional(),
  suggestedConfig: z.any().optional().describe("The structured agent configuration, sent as the final part of a successful design session."),
  error: z.string().optional(),
  rawJsonForDebug: z.string().optional().describe("Raw JSON string if parsing failed, for debugging.")
});


// 3. Agent Creator Flow Definition
export const agentCreatorFlow = defineFlow(
  {
    name: 'agentCreatorFlow',
    inputSchema: AgentCreatorFlowInputSchema,
    outputSchema: z.void(), // Output is handled via streamCallback
  },
  async (input, streamCallback) => {
    const { userMessage, history = [], stream = true } = input;

    if (!streamCallback && stream) {
        logger.error("[AgentCreatorFlow] Stream mode is true but no streamCallback was provided.");
        throw new Error("streamCallback is required for streaming in agentCreatorFlow.");
    }

    const messages: MessageData[] = [
      { role: 'system', content: [{ text: SYSTEM_PROMPT_AGENT_CREATOR }] },
    ];

    history.forEach(h => {
        if (h.role && h.content && Array.isArray(h.content) && h.content.every(c => typeof c.text === 'string')) {
            messages.push(h as MessageData);
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

      let accumulatedText = ""; // Accumulate text if JSON block might span chunks

      for await (const chunk of llmResponse.stream()) {
        const textContent = chunk.text();
        if (!textContent) continue;

        accumulatedText += textContent;

        // Try to find JSON block in the accumulated text
        const jsonRegex = /```json\n([\s\S]*?)\n```/;
        const match = accumulatedText.match(jsonRegex);

        if (match && match[1]) {
          const jsonString = match[1];
          // Potential JSON block found. We need to ensure it's complete.
          // This simple check assumes the JSON block, once started with ```json, will end with ```.
          // A more robust solution might involve checking for balanced braces or using a streaming JSON parser.

          try {
            const parsedConfig = JSON.parse(jsonString);
            logger.info("[AgentCreatorFlow] Successfully parsed suggestedConfig JSON.");

            // What was before the JSON block? Stream it if it exists and wasn't just whitespace.
            const textBeforeJson = accumulatedText.substring(0, match.index).trim();
            if (textBeforeJson) {
              streamCallback({ agentResponseChunk: textBeforeJson });
            }

            streamCallback({
              agentResponseChunk: "I've drafted the agent configuration based on our conversation. Please review it below. You can then save it or ask for more changes.",
              suggestedConfig: parsedConfig
            });

            // What was after the JSON block? Stream it.
            const textAfterJson = accumulatedText.substring(match.index! + match[0].length).trim();
            if (textAfterJson) {
              streamCallback({ agentResponseChunk: textAfterJson });
            }
            accumulatedText = ""; // Clear buffer as JSON part is handled
            return; // End processing for this flow after successfully sending config.
          } catch (e: any) {
            // JSON parsing error. This could mean the JSON is incomplete in this chunk.
            // Or it's genuinely malformed. For now, we'll assume it might be incomplete and continue accumulating.
            // If it's the *very end* of the stream and it's still broken, then it's an error.
            if (!llmResponse.stream().readable) { // Approximating end of stream
                logger.warn('[AgentCreatorFlow] Failed to parse agent configuration JSON at end of stream:', e);
                streamCallback({
                    agentResponseChunk: "I tried to generate the agent configuration as JSON, but there was an issue with its format. Raw data: \n" + jsonString,
                    error: `Failed to parse agent configuration JSON. Error: ${e.message}`,
                    rawJsonForDebug: jsonString
                });
                accumulatedText = ""; // Clear buffer
            }
            // else, continue accumulating, assuming JSON might be split across chunks
          }
        }
      } // End of for-await loop

      // If loop finishes and there's accumulated text without recognized/parsed JSON
      if (accumulatedText.trim()) {
        // Check one last time for JSON, in case it was the entire accumulated text
        const jsonRegex = /```json\n([\s\S]*?)\n```/;
        const match = accumulatedText.match(jsonRegex);
        if (match && match[1]) {
            const jsonString = match[1];
            try {
                const parsedConfig = JSON.parse(jsonString);
                logger.info("[AgentCreatorFlow] Successfully parsed suggestedConfig JSON from final accumulated text.");
                streamCallback({
                  agentResponseChunk: "I've drafted the agent configuration. Please review it.",
                  suggestedConfig: parsedConfig
                });
            } catch (e:any) {
                logger.warn('[AgentCreatorFlow] Failed to parse JSON from final accumulated text:', e);
                streamCallback({
                    agentResponseChunk: "I attempted to provide a configuration, but it seems to be malformed. Accumulated text: " + accumulatedText,
                    error: `Malformed configuration JSON in final accumulated text. Error: ${e.message}`,
                    rawJsonForDebug: jsonString
                });
            }
        } else {
            // No JSON found, just stream the remaining text
            streamCallback({ agentResponseChunk: accumulatedText });
        }
      }

    } catch (err: any) {
      logger.error('[AgentCreatorFlow] Error in generate call or streaming loop:', err);
      if (streamCallback) { // Ensure streamCallback is defined before using
        streamCallback({ error: err.message || 'An unexpected error occurred during agent creation LLM call.' });
      }
    }
  }
);
