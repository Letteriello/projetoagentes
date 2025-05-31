/**
 * @fileOverview Fluxo de chat básico para interagir com um modelo de IA, com suporte a histórico, envio de imagens e ferramentas dinâmicas.
 *
 * - basicChatFlow - Uma função que lida com uma única troca de chat, considerando o histórico, possível imagem e ferramentas.
 * - BasicChatInput - O tipo de entrada para basicChatFlow.
 * - BasicChatOutput - O tipo de retorno para basicChatFlow.
 */

import { ai } from '@/ai/genkit'; 
// Adjusted import path assuming tools/index.ts exports all tools from the tools directory
// If performWebSearchTool and calculatorTool are directly exported from their files:
import { performWebSearchTool } from '@/ai/tools/web-search-tool';
import { calculatorTool } from '@/ai/tools/calculator-tool';
import { knowledgeBaseTool } from '@/ai/tools/knowledge-base-tool';
import { customApiTool } from '@/ai/tools/custom-api-tool';
import { calendarAccessTool } from '@/ai/tools/calendar-access-tool';
import { databaseAccessTool } from '@/ai/tools/database-access-tool';
import { codeExecutorTool } from '@/ai/tools/code-executor-tool'; // Added import

import process from 'node:process';
import { ReadableStream } from 'node:stream/web'; 

// Mapa de todas as ferramentas Genkit disponíveis na aplicação
const allAvailableTools = {
  performWebSearch: performWebSearchTool,
  calculator: calculatorTool,
  knowledgeBase: knowledgeBaseTool,
  customApiIntegration: customApiTool,
  calendarAccess: calendarAccessTool,
  databaseAccess: databaseAccessTool,
  codeExecutor: codeExecutorTool, // Added codeExecutor tool
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
    let userMessageContent: any[] = [{ text: input.userMessage }];
    if (input.fileDataUri) {
      const [header, base64Data] = input.fileDataUri.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1];
      if (mimeType && base64Data) {
        // Use a estrutura correta para mídia conforme esperado pela API
        userMessageContent = [
          { text: input.userMessage },
          { data: { mimeType, data: input.fileDataUri } }
        ];
      }
    }
    history.push({ role: 'user', content: userMessageContent });
    
    console.log('Generating content with model:', modelId, 'config:', config, 'tools:', tools ? tools.map(t => t.name) : 'none');

    // Call the AI generation
    const parts = history.map(msg => {
      return {
        role: msg.role,
        parts: Array.isArray(msg.content) 
          ? msg.content.map(c => c.text ? { text: c.text } : c) 
          : [{ text: msg.content }]
      };
    });
    
    // Configuração para gerar conteúdo
    const generateOptions = {
      model: modelId,
      parts,
      tools: tools,
      generationConfig: config,
      streamMode: !!streamingCallback ? 'streaming' : 'standard',
    };
    
    const response = await ai.generateContent(generateOptions);

    // Handle streaming response if callback provided
    if (streamingCallback && generateOptions.streamMode === 'streaming') {
      const outputStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response.stream) {
              if (chunk) {
                streamingCallback(chunk);
                controller.enqueue(chunk);
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
    // Extrair o texto da resposta
    const responseText = response.response?.text?.toString() || '';
    
    // Extrair informações de ferramentas, se disponíveis
    const toolCalls = response.response?.candidates?.[0]?.content?.parts
      ?.filter(part => part.functionCall)
      .map(part => part.functionCall) || [];
      
    const toolResults = response.response?.candidates?.[0]?.content?.parts
      ?.filter(part => part.functionResponse)
      .map(part => part.functionResponse) || [];
    
    return {
      outputMessage: responseText,
      toolRequests: toolCalls,
      toolResults: toolResults,
    };
  } catch (e: any) {
    console.error("Error in basicChatFlow:", e);
    return { error: e.message || 'An unexpected error occurred' };
  }
}