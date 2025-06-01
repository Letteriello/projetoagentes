/**
 * @fileOverview Fluxo de chat básico para interagir com um modelo de IA, com suporte a histórico, envio de imagens e ferramentas dinâmicas.
 *
 * - basicChatFlow - Uma função que lida com uma única troca de chat, considerando o histórico, possível imagem e ferramentas.
 * - BasicChatInput - O tipo de entrada para basicChatFlow.
 * - BasicChatOutput - O tipo de retorno para basicChatFlow.
 */

import { ai } from '@/ai/genkit'; 
// Import factory functions for refactored tools
import { createPerformWebSearchTool } from '@/ai/tools/web-search-tool';
import { createKnowledgeBaseTool } from '@/ai/tools/knowledge-base-tool';
import { createCustomApiTool } from '@/ai/tools/custom-api-tool';
import { createCalendarAccessTool } from '@/ai/tools/calendar-access-tool';
import { createDatabaseAccessTool } from '@/ai/tools/database-access-tool';
// Import static tools
import { calculatorTool } from '@/ai/tools/calculator-tool';
import { codeExecutorTool } from '@/ai/tools/code-executor-tool';

import process from 'node:process';
import { ReadableStream } from 'node:stream/web'; 
import { Tool } from '@genkit-ai/sdk'; // Import Tool type for casting

// Mapa de todas as ferramentas Genkit disponíveis na aplicação
// Stores factory functions for configurable tools and direct tool objects for static ones.
const allAvailableTools: Record<string, (() => Tool) | Tool | any> = { // Added 'any' for factory signatures
  performWebSearch: createPerformWebSearchTool,
  calculator: calculatorTool, // Static tool
  knowledgeBase: createKnowledgeBaseTool,
  customApiIntegration: createCustomApiTool,
  calendarAccess: createCalendarAccessTool,
  databaseAccess: createDatabaseAccessTool,
  codeExecutor: codeExecutorTool, // Static tool
};

export interface BasicChatInput {
  userMessage: string;
  history?: Array<{role: string; content: any}>;
  fileDataUri?: string;
  modelName?: string;
  systemPrompt?: string;
  temperature?: number;
  agentToolsDetails?: { id: string; name: string; description: string; enabled: boolean }[];
  toolConfigsApplied?: Record<string, any>; // Added for dynamic tool configuration
}

export interface BasicChatOutput {
  outputMessage?: string;
  stream?: ReadableStream<any>;
  error?: string;
  toolRequests?: any[]; 
  toolResults?: any[];
}

// Configure the model and tools for the request
function configureModel(input: BasicChatInput) {
  const modelId = input.modelName || process.env.GENKIT_MODEL_NAME || 'googleai/gemini-1.5-flash-latest';
  const activeTools: Tool[] = [];

  if (input.agentToolsDetails && input.toolConfigsApplied) {
    input.agentToolsDetails.forEach(toolDetail => {
      if (toolDetail.enabled) {
        const toolProvider = allAvailableTools[toolDetail.id as keyof typeof allAvailableTools];
        if (toolProvider) {
          if (typeof toolProvider === 'function') {
            // It's a factory function, call it with config
            const toolConfig = input.toolConfigsApplied![toolDetail.id] || {};
            try {
              activeTools.push(toolProvider(toolConfig));
            } catch (e: any) {
              console.error(`Error instantiating tool '${toolDetail.id}' with factory:`, e);
            }
          } else {
            // It's a static tool object
            activeTools.push(toolProvider as Tool);
          }
        } else {
          console.warn(`Tool ID '${toolDetail.id}' not found in allAvailableTools map.`);
        }
      }
    });
  }

  return {
    modelId,
    tools: activeTools.length > 0 ? activeTools : undefined,
    config: input.temperature ? { temperature: input.temperature } : undefined,
    systemPrompt: input.systemPrompt, // Directly use the systemPrompt from input
  };
}

// Main chat function - simplified without flow definitions
export async function basicChatFlow(input: BasicChatInput, streamingCallback?: (chunk: any) => void): Promise<BasicChatOutput> {
  try {
    // Ensure toolConfigsApplied is initialized if not provided, for configureModel
    const fullInput = {
      ...input,
      toolConfigsApplied: input.toolConfigsApplied || {},
    };
    const { modelId, tools, config, systemPrompt } = configureModel(fullInput);

    const history = input.history ? [...input.history] : [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      // Check if the last system message is already the one we want to set.
      // Avoids adding duplicate system prompts if history is re-sent.
      const lastSystemMessageIndex = history.findLastIndex(m => m.role === 'system');
      if (lastSystemMessageIndex !== -1 && history[lastSystemMessageIndex].content &&
          typeof history[lastSystemMessageIndex].content[0]?.text === 'string' &&
          history[lastSystemMessageIndex].content[0].text === systemPrompt) {
        // System prompt is already correctly set as the last system message.
      } else {
         // Remove any previous system message to ensure the new one is the definitive one.
         const filteredHistory = history.filter(m => m.role !== 'system');
         history.length = 0; // Clear original history
         history.push(...filteredHistory); // Push back non-system messages
         history.unshift({ role: 'system', content: [{text: systemPrompt}] }); // Add new system prompt at the beginning
      }
    }


    // Prepare user message with any attachments
    let userMessageContent: any[] = [{ text: input.userMessage }];
    if (input.fileDataUri) {
      // This parsing logic might need adjustment based on actual DataURI format from frontend
      const [header, base64Data] = input.fileDataUri.split(',');
      const mimeTypeMatch = header?.match(/:(.*?);/);
      const mimeType = mimeTypeMatch?.[1];
      if (mimeType && base64Data) {
        userMessageContent = [
          { text: input.userMessage },
          // Genkit expects inlineData: { mimeType, data } for file inputs.
          { inlineData: { mimeType, data: base64Data } }
        ];
      } else {
        console.warn("Could not parse fileDataUri correctly. Sending only text message.");
      }
    }
    history.push({ role: 'user', content: userMessageContent });
    
    console.log('Generating content with model:', modelId, 'config:', config, 'tools:', tools ? tools.map(t => t.name) : 'none');

    // Call the AI generation
    const parts = history.map(msg => {
      return {
        role: msg.role as 'user' | 'model' | 'system' | 'tool', // Cast role to expected types
        parts: Array.isArray(msg.content) 
          ? msg.content.map(c => (c.text ? { text: c.text } : c.inlineData ? {inlineData: c.inlineData} : c )) // Handle text and inlineData
          : (typeof msg.content === 'string' ? [{ text: msg.content }] : []) // Handle simple string content
      };
    });
    
    const generateOptions = {
      model: modelId,
      prompt: { messages: parts }, // Use the new prompt structure with messages
      tools: tools,
      config: config, // Renamed from generationConfig to config
      stream: !!streamingCallback, // Simplified stream boolean
    };
    
    const response = await ai.generate(generateOptions); // ai.generate instead of ai.generateContent

    // Handle streaming response if callback provided
    if (streamingCallback && generateOptions.stream) {
      const outputStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response.stream()) { // Call stream() method
              if (chunk) {
                streamingCallback(chunk);
                controller.enqueue(chunk); // Enqueue the raw chunk
              }
            }
          } catch (e: any) {
            console.error('Streaming error:', e);
            controller.error(e);
          } finally {
            controller.close();
          }
        },
      });
      return { stream: outputStream };
    } 
    
    // Handle non-streaming response
    const responseText = response.text() ?? ''; // Use text() method
    
    const toolCalls = response.toolCalls() ?? []; // Use toolCalls() method
    const toolResults = response.toolResults() ?? []; // Not directly available, toolCalls implies requests
                                                      // toolResults are usually built from subsequent calls

    return {
      outputMessage: responseText,
      toolRequests: toolCalls.map(tc => ({ // Adapt to expected structure if necessary
        name: tc.name,
        args: tc.args
      })),
      // toolResults might need to be sourced differently if they represent executed tool responses
      // For now, assuming toolResults from input might be more relevant if this flow manages tool execution.
      // Or, if the model itself can return tool results (less common for initial request).
      toolResults: [], // Placeholder, as toolResults() is not standard on initial response
    };
  } catch (e: any) {
    console.error("Error in basicChatFlow:", e);
    return { error: e.message || 'An unexpected error occurred' };
  }
}