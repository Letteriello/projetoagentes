/**
 * @fileOverview Fluxo de chat básico para interagir com um modelo de IA, com suporte a histórico, envio de imagens e ferramentas dinâmicas.
 *
 * - basicChatFlow - Uma função que lida com uma única troca de chat, considerando o histórico, possível imagem e ferramentas.
 * - BasicChatInput - O tipo de entrada para basicChatFlow.
 * - BasicChatOutput - O tipo de retorno para basicChatFlow.
 */

import { ai } from '@/ai/genkit'; 
import { performWebSearchTool } from '@/ai/tools/web-search-tool';

import process from 'node:process';
import { ReadableStream } from 'node:stream/web'; 

// Mapa de todas as ferramentas Genkit disponíveis na aplicação
const allAvailableTools = {
  performWebSearch: performWebSearchTool,
};

export interface BasicChatInput {
  userMessage: string;
  history?: Array<{role: string; content: any}>;  // Simplified message data type
  fileDataUri?: string;
  modelName?: string;
  systemPrompt?: string;
  temperature?: number;
  agentToolsDetails?: { id: string; name: string; description: string; enabled: boolean }[];
}

export interface BasicChatOutput {
  outputMessage?: string;
  stream?: ReadableStream<any>; // Generic stream type
  error?: string;
  toolRequests?: any[]; 
  toolResults?: any[];
}

// Configure the model and tools for the request
function configureModel(input: BasicChatInput) {
  const modelId = input.modelName || process.env.GENKIT_MODEL_NAME || 'googleai/gemini-1.5-flash-latest';

  const activeTools = input.agentToolsDetails
    ?.filter(tool => tool.enabled && allAvailableTools[tool.id as keyof typeof allAvailableTools])
    .map(tool => allAvailableTools[tool.id as keyof typeof allAvailableTools]);

  return {
    modelId,
    tools: activeTools && activeTools.length > 0 ? activeTools : undefined,
    config: input.temperature ? { temperature: input.temperature } : undefined,
    systemPrompt: input.systemPrompt,
  };
}

// Main chat function - simplified without flow definitions
export async function basicChatFlow(input: BasicChatInput, streamingCallback?: (chunk: any) => void): Promise<BasicChatOutput> {
  try {
    const { modelId, tools, config, systemPrompt } = configureModel(input);

    const history = input.history ? [...input.history] : [];
    
    // Add system prompt if provided
    if (systemPrompt) {
      const lastSystemMessageIndex = history.findLastIndex(m => m.role === 'system');
      if (lastSystemMessageIndex === -1 || !history[lastSystemMessageIndex].content[0]?.text || 
          history[lastSystemMessageIndex].content[0].text !== systemPrompt) {
        history.push({ role: 'system', content: [{text: systemPrompt}] });
      }
    }

    // Prepare user message with any attachments
    const userMessageContent = [{ text: input.userMessage }];
    if (input.fileDataUri) {
      const [header, base64Data] = input.fileDataUri.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1];
      if (mimeType && base64Data) {
        userMessageContent.push({ media: { url: input.fileDataUri, contentType: mimeType } });
      }
    }
    history.push({ role: 'user', content: userMessageContent });
    
    console.log('Generating content with model:', modelId, 'config:', config, 'tools:', tools ? tools.map(t => t.name) : 'none');

    // Call the AI generation
    const response = await ai.generate({
      model: modelId,
      messages: history,
      tools,
      config,
      stream: !!streamingCallback,
    });

    // Handle streaming response if callback provided
    if (streamingCallback && response.stream) {
      const outputStream = new ReadableStream({
        async start(controller) {
          const reader = response.stream.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              streamingCallback(value);
              controller.enqueue(value);
            }
          } catch (e: any) {
            console.error('Streaming error:', e);
            controller.error(e);
          } finally {
            controller.close();
            reader.releaseLock();
          }
        },
      });

      return { stream: outputStream };
    } 
    
    // Handle non-streaming response
    return {
      outputMessage: response.text,
      toolRequests: response.toolRequests || [],
      toolResults: response.toolResponses || [],
    };
  } catch (e: any) {
    console.error("Error in basicChatFlow:", e);
    return { error: e.message || 'An unexpected error occurred' };
  }
}