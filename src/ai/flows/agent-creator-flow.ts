/**
 * @fileOverview Manages the conversational flow for creating new AI agents.
 * This flow guides the user through defining an agent's configuration via conversation,
 * and aims to extract a structured JSON configuration once the user confirms the details.
 * It supports streaming responses for a more interactive experience.
 */
import { defineFlow } from '@genkit-ai/core';
import { z } from 'zod';
import { generate, generateStream, type MessageData, type Part } from '@genkit-ai/ai';
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
const RoleEnum = z.enum(["user", "model", "system"]); // Define Role enum for clarity

// Define a schema for individual message parts if not already available from Genkit
const MessagePartSchema = z.object({
  text: z.string().optional(),
  // Add other part types if necessary, e.g., toolRequest, toolResponse
});

// Define a schema for MessageData
const MessageDataSchema = z.object({
  role: RoleEnum,
  content: z.array(MessagePartSchema),
});

export const AgentCreatorFlowInputSchema = z.object({
  messages: z.array(MessageDataSchema), // Changed from userMessage to messages array
  stream: z.boolean().optional().default(true),
  userId: z.string().optional(),
  history: z.array(z.object({
    role: RoleEnum,
    content: z.array(z.object({ text: z.string() })),
  })).optional(),
  tools: z.any().optional(), // Placeholder for Genkit tools schema
  toolChoice: z.any().optional(), // Placeholder for Genkit toolChoice schema
});
export type AgentCreatorFlowInput = z.infer<typeof AgentCreatorFlowInputSchema>;


// 3. Agent Creator Flow Definition
export const agentCreatorFlow = defineFlow(
  'agentCreatorFlow', // name: string
  { // options: FlowDefinition<S, O, SC>
    inputSchema: AgentCreatorFlowInputSchema,
    outputSchema: AgentCreatorFlowStreamOutputSchema,
    streamSchema: AgentCreatorFlowStreamOutputSchema,
  },
  // handler: FlowHandler<S, O, SC>
  async (input: AgentCreatorFlowInput, { sendChunk }: { sendChunk: (chunk: AgentCreatorFlowStreamOutput) => void | Promise<void> }) => {
    // Variables defined at the top of the handler scope
    let accumulatedText: string = "";
    let jsonProcessedMidStream: boolean = false;
    // Destructure input with aliases for clarity and to match previous usage patterns
    const { messages: inputMessages, stream: inputStream, tools: inputTools, toolChoice: inputToolChoice } = input;
    const currentStreamSetting = inputStream ?? true; // Default to true

    // Helper function: extractJsonFromMarkdown - defined within handler scope
    const extractJsonFromMarkdown = (text: string): string | null => {
      const match = text.match(/```json\n([\s\S]*?)\n```/);
      return match ? match[1] : null;
    };

    // Helper function: tryParseFinalJson - defined within handler scope
    const tryParseFinalJson = async (text: string, isStreamingContext: boolean, chunkCallback: typeof sendChunk): Promise<SavedAgentConfiguration | null> => {
      logger.debug(`[tryParseFinalJson] Attempting to parse (isStreaming: ${isStreamingContext}): ${text.substring(0,100)}...`);
      if (!text.trim()) {
        return null;
      }
      try {
        const extracted = extractJsonFromMarkdown(text);
        if (extracted) {
          const config = JSON.parse(extracted) as SavedAgentConfiguration;
          // USER ACTION: Verify that 'name' and 'description' exist and are required on SavedAgentConfiguration type.
          // If they are optional or named differently, this check will need adjustment.
          if (config && config.agentName && config.agentDescription) { 
            logger.info(`[tryParseFinalJson] Successfully parsed JSON config for agent: ${config.agentName}`);
            await chunkCallback({ suggestedConfig: { ...config, agentName: config.agentName || 'Unnamed Agent' }, agentResponseChunk: isStreamingContext ? undefined : "Final configuration extracted." });
            return config;
          }
        }
      } catch (e) {
        logger.warn('[tryParseFinalJson] Failed to parse JSON from text.', e);
        if (!isStreamingContext) {
          // Only send error if not streaming, as streaming might recover or send text later
          await chunkCallback({ error: 'Failed to extract valid JSON configuration from the response.' });
        }
      }
      // If not streaming and no JSON found (or parsing failed), send the raw text as a response chunk
      if (!isStreamingContext && text.trim()) {
          await chunkCallback({ agentResponseChunk: text }); // Send raw text if no JSON and not streaming context
      }
      return null;
    };

    // Main try-catch for the flow logic
    try {
      if (!currentStreamSetting) {
        logger.info('[AgentCreatorFlow] Using non-streaming generate.');
        // Switched to multi-argument generate, as per Genkit documentation patterns
        const finalModelResponse = await generate({
          model: gemini15Pro,
          messages: inputMessages,
          config: {
            temperature: 0.5,
          },
          tools: inputTools,
          toolChoice: inputToolChoice,
        });
        accumulatedText = finalModelResponse.text ?? "";
        logger.info(`[AgentCreatorFlow] Non-streaming generation complete. Accumulated text length: ${accumulatedText.length}`);
      } else {
        logger.info('[AgentCreatorFlow] Using streaming generateStream.');
        // Switched to multi-argument generateStream, as per Genkit documentation patterns
        const currentModel = gemini15Pro; // Or determine from context if applicable
        const genkitMessages = inputMessages.map(msg => ({
          role: msg.role,
          content: msg.content.map(part => ({ text: part.text || '' })),
        }));

        const { stream: conversationModelStream, response: conversationModelResponsePromise } = await generateStream({
          model: currentModel,
          messages: genkitMessages,
          prompt: SYSTEM_PROMPT_AGENT_CREATOR, // System prompt is still relevant for context
          config: {
            temperature: 0.6, // Or use a dynamic temperature if needed
          },
          streamingCallback: async (chunk: Part) => {
            if (chunk.content && typeof chunk.content === 'string') {
              accumulatedText += chunk.content;
              await sendChunk({ agentResponseChunk: chunk.content });
              // Attempt to parse JSON mid-stream if a complete block is detected
              if (accumulatedText.includes('```json') && accumulatedText.trim().endsWith('```')) {
                const extracted = extractJsonFromMarkdown(accumulatedText);
                if (extracted) {
                  try {
                    const parsedConfig = JSON.parse(extracted) as SavedAgentConfiguration;
                    if (parsedConfig && parsedConfig.agentName) { 
                      await sendChunk({ suggestedConfig: parsedConfig });
                      jsonProcessedMidStream = true;
                      logger.info('[AgentCreatorFlow] Successfully parsed and sent config mid-stream.');
                    }
                  } catch (e) {
                    logger.debug('[AgentCreatorFlow] Mid-stream JSON block detected but failed to parse, continuing stream.', e);
                  }
                }
              }
            }
          }
        });

        for await (const part of conversationModelStream) {
          if (part.text) {
            const textContent = part.text;
            accumulatedText += textContent;
            await sendChunk({ agentResponseChunk: textContent });

            // Mid-stream JSON parsing attempt
            if (accumulatedText.includes('```json') && accumulatedText.trim().endsWith('```')) {
              const extracted = extractJsonFromMarkdown(accumulatedText);
              if (extracted) {
                try {
                  const config = JSON.parse(extracted) as SavedAgentConfiguration;
                  if (config && config.agentName) { 
                    await sendChunk({ suggestedConfig: config });
                    jsonProcessedMidStream = true;
                    logger.info('[AgentCreatorFlow] Successfully parsed and sent config mid-stream.');
                  }
                } catch (e) {
                  logger.debug('[AgentCreatorFlow] Mid-stream JSON block detected but failed to parse, continuing stream.', e);
                }
              }
            }
          } else if (part.toolRequests && part.toolRequests.length > 0) {
            logger.warn('[AgentCreatorFlow] Received tool requests, but not processing them in this version.', part.toolRequests);
            await sendChunk({ error: "Tool requests are not handled in this agent creator version.", rawJsonForDebug: JSON.stringify(part.toolRequests) });
          }
        }
        logger.info(`[AgentCreatorFlow] Streaming generation complete. Accumulated text length: ${accumulatedText.length}`);
        
        const finalModelResponse = await conversationModelResponsePromise;
        // .candidates() access removed as it was causing errors and its utility here was minor.
        // logger.info(`[AgentCreatorFlow] Stream finished. Finish reason: ${finalModelResponse.candidates()?.[0]?.finishReason}`);
        
        // If no text was accumulated during streaming but the final response has text (e.g., non-streaming part of a stream)
        if (!accumulatedText && finalModelResponse.text) {
            accumulatedText = finalModelResponse.text;
            if (accumulatedText) {
              await sendChunk({ agentResponseChunk: accumulatedText });
            }
        }
      }

      // Final attempt to parse JSON from the full accumulated text if not done mid-stream
      if (!jsonProcessedMidStream && accumulatedText.trim()) {
        await tryParseFinalJson(accumulatedText, currentStreamSetting, sendChunk);
      } else if (jsonProcessedMidStream) {
        logger.info('[AgentCreatorFlow] JSON was processed and sent mid-stream.');
      } else if (!accumulatedText.trim()) {
        logger.warn('[AgentCreatorFlow] No text accumulated for final JSON parsing. LLM might have returned empty content.');
      }

    } catch (err: unknown) {
      logger.error('[AgentCreatorFlow] Error in flow handler try block. Error details:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during agent creation.';
      try {
        await sendChunk({ error: errorMessage });
      } catch (sendChunkError) {
        logger.error('[AgentCreatorFlow] Critical: Failed to send error chunk via sendChunk:', sendChunkError);
      }
    } 
  } // End of async handler function
); // End of defineFlow call
