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
import { GenerateRequest, Part, ToolRequest, ToolResponse, Tool } from '@genkit-ai/ai';
import type { MessageData } from '@/types/chat-types';
import { createLoggableFlow } from '@/lib/logger'; // Import the wrapper
import { enhancedLogger } from '@/lib/logger'; // For manual logging if needed within
import { winstonLogger } from '../../lib/winston-logger';
import { z } from 'zod';
import { ActionContext } from 'genkit';

// Mapa de todas as ferramentas Genkit disponíveis na aplicação
// Stores factory functions for configurable tools and direct tool objects for static ones.
interface AppTool extends Tool {
  func: (input: any) => Promise<any>;
  inputSchema?: z.ZodSchema;
  description?: string;
  metadata?: Record<string, any>;
}

// Definir tipo explícito para tool requests
type ChatToolRequest = {
  name: string;
  input?: Record<string, unknown>;
  output?: unknown;
  ref?: string;
};

interface ToolResponsePart {
  toolRequest: ToolRequest;
  output: unknown;
}

// Interface for structured tool execution results
// Defines structured error details that tools can return or the flow can generate.
interface ErrorDetails {
  code?: string;
  message: string;
  details?: any;
}

interface ToolExecutionResult {
  name: string;
  input?: Record<string, unknown>;
  output?: any; // Holds successful output if status is 'success'
  errorDetails?: ErrorDetails; // Holds structured error if status is 'error'
  status: 'success' | 'error';
  ref?: string; // from the original toolRequest for matching
}

const allAvailableTools: Record<string, AppTool> = { 
  performWebSearch: createPerformWebSearchTool({
    apiKey: process.env.SEARCH_API_KEY
  }),
  calculator: calculatorTool(),
  knowledgeBase: createKnowledgeBaseTool({
    serviceEndpoint: process.env.KB_ENDPOINT,
    knowledgeBaseId: process.env.KB_ID || 'default'
  }),
  customApiIntegration: createCustomApiTool({
    baseUrl: process.env.API_BASE_URL
  }),
  calendarAccess: createCalendarAccessTool({
    apiKey: process.env.CALENDAR_TOKEN
  }),
  databaseAccess: createDatabaseAccessTool({
    dbConnectionString: process.env.DB_CONNECTION,
    dbType: 'postgresql' // Definindo um tipo padrão, ajuste conforme necessário
  }),
  codeExecutor: codeExecutorTool()
};

/**
 * Detailed configuration for agent tools
 */
interface ToolDetail {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  config?: Record<string, unknown>; // Mais seguro que 'any'
}

/**
 * Parameters for the chat flow
 */
interface ChatFlowParams {
  fileDataUri?: string;
  history?: MessageData[];
  modelName: 'geminiPro' | 'gemini15Pro' | string;
  systemPrompt?: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  stopSequences?: string[];
  agentToolsDetails?: ToolDetail[];
}

// Zod validation schemas
const ToolDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  enabled: z.boolean(),
  config: z.record(z.unknown()).optional()
});

const ChatFlowParamsSchema = z.object({
  fileDataUri: z.string().optional(),
  history: z.array(z.unknown()).optional(),
  modelName: z.string(),
  systemPrompt: z.string().optional(),
  temperature: z.number().optional(),
  topK: z.number().optional(),
  topP: z.number().optional(),
  maxOutputTokens: z.number().optional(),
  stopSequences: z.array(z.string()).optional(),
  agentToolsDetails: z.array(ToolDetailSchema).optional()
});

/**
 * Entrada para o fluxo de chat básico
 */
export interface BasicChatInput extends ChatFlowParams {
  agentId?: string; // Optional agentId for logging/context
  userMessage: string;
}

/**
 * Saída do fluxo de chat básico
 */
export interface BasicChatOutput {
  outputMessage?: string;
  stream?: ReadableStream<any>;
  toolRequests?: ChatToolRequest[];
  toolResults?: ToolExecutionResult[]; // Updated to use ToolExecutionResult
  error?: string;
}

// Definir tipo completo para mensagens
type ChatMessage = {
  role: 'system' | 'user' | 'model' | 'tool';
  content: Part[];
  metadata?: Record<string, unknown>;
};

// Internal function that contains the core logic
async function basicChatFlowInternal(
  input: BasicChatInput,
  flowContext: ActionContext
): Promise<BasicChatOutput> {
  const flowName = 'basicChatFlowInternal'; // For logging context
  const agentId = input.agentId || 'unknown_agent'; // For logging context

  try {
    const messages: ChatMessage[] = [];
    if (input.systemPrompt) {
      messages.push({ role: 'system', content: [{ text: input.systemPrompt }] });
    }
    if (input.history) {
      messages.push(...input.history.map(msg => ({
        role: msg.role as ChatMessage['role'],
        content: Array.isArray(msg.content) ? 
          msg.content.map(c => typeof c === 'string' ? {text: c} : c) : 
          [{text: String(msg.content)}],
        ...('metadata' in msg && {metadata: msg.metadata as Record<string, unknown>})
      })));
    }
    const userMessageContent: Part[] = [{ text: input.userMessage }];
    if (input.fileDataUri) {
      userMessageContent.push({
        media: {
          url: input.fileDataUri,
          contentType: 'auto'
        }
      });
    }
    messages.push({ role: 'user', content: userMessageContent });

    // Dynamically prepare tools for the current agent based on agentToolsDetails
    const genkitTools: AppTool[] = [];
    if (input.agentToolsDetails && input.agentToolsDetails.length > 0) {
      input.agentToolsDetails.forEach(toolDetail => {
        if (toolDetail.enabled) {
          const toolObj = allAvailableTools[toolDetail.id];
          if (toolObj) {
            // Todas as ferramentas já são instâncias de AppTool
            genkitTools.push(toolObj);
          }
        }
      });
    }

    const request: GenerateRequest = {
      messages: messages,
      config: {
        temperature: input.temperature,
        topK: input.topK,
        topP: input.topP,
        maxOutputTokens: input.maxOutputTokens,
        stopSequences: input.stopSequences
      },
      tools: genkitTools.length > 0 ? genkitTools.map(tool => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema ? tool.inputSchema : null,
        outputSchema: null,
        metadata: tool.metadata
      })) : undefined, // Only pass tools if there are any
    };
    // Loop for handling tool requests and responses
    let finalOutputText = '';
    let executedToolRequests: ChatToolRequest[] = [];
    let executedToolResults: ToolExecutionResult[] = []; // Updated type
    let currentMessages = [...messages]; // Start with the initial set of messages

    const MAX_TOOL_ITERATIONS = 5; // Prevent infinite loops
    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      const llmResponse = await ai.generate({
        ...request,
        messages: currentMessages, // Use updated messages in each iteration
      });

      const choice = llmResponse.candidates[0];
      if (!choice || !choice.message || !choice.message.content) {
        // No response or empty content, break or handle as error
        finalOutputText = choice?.finishReason === 'stop' ? finalOutputText : 'No response from model.';
        break;
      }

      const contentParts = choice.message.content;
      let hasToolRequest = false;

      for (const part of contentParts) {
        if (part.text) {
          finalOutputText += part.text; // Accumulate text parts
        }
        if (part.toolRequest) {
          hasToolRequest = true;
          executedToolRequests.push(part.toolRequest); // Store for output
          // The actual tool execution will happen outside this loop based on these requests
          // For simplicity in this example, we'll assume Genkit's `generate` handles the tool execution
          // if the tool is defined and its `func` is called by Genkit internally.
          // If Genkit `generate` doesn't auto-execute and just returns requests,
          // then explicit tool execution logic would be needed here.
          // However, standard Genkit flow with tools in `generateOptions` implies Genkit handles this.
        }
      }

      if (!hasToolRequest || choice.finishReason === 'stop') {
        // If no tool requests in this response, or if LLM decided to stop, then we are done.
        break; 
      }

      // If there were tool requests, Genkit's `generate` (when tools are provided)
      // should ideally return tool responses if it executed them.
      // If `generate` only returns requests, we'd need to simulate or call tools here.
      // For this example, we'll assume `generate` returns responses if tools were called.
      // Let's check if the response contains tool_response parts (this part is tricky as Genkit might handle it)

      // This part needs to align with how Genkit actually processes tools.
      // If Genkit's `generate` with `tools` parameter automatically handles the execution and
      // provides `tool_response` parts in a subsequent call or within the same response,
      // this loop structure might need adjustment.

      // Let's assume for now that if `toolRequest` was present, we need to construct `tool_response` parts
      // and send them back to the LLM in the next iteration.
      // This requires actually calling the tools.

      const toolResponseParts: ToolResponsePart[] = [];
      // Process only new tool requests from the current LLM response
      const newToolRequests = choice.message.content.filter((p: Part) => p.toolRequest).map(p => p.toolRequest as ToolRequest);

      for (const toolRequest of newToolRequests) {
        let toolExecutionFailed = false;
        let resultOutput: any; // Can be success output or error information for the LLM
        let errorMessage: string | undefined;

        try {
          const toolToRun = genkitTools.find(t => t.name === toolRequest.name) as AppTool | undefined;

          if (!toolToRun) {
            toolExecutionFailed = true;
            errorMessage = `Ferramenta ${toolRequest.name} não encontrada`;
            resultOutput = { error: errorMessage, code: 'TOOL_NOT_FOUND' }; // Structure for LLM
            executedToolResults.push({
              name: toolRequest.name,
              input: toolRequest.input as Record<string, unknown>,
              errorDetails: { message: errorMessage, code: 'TOOL_NOT_FOUND' },
              status: 'error',
              ref: toolRequest.ref,
            });
            // Continue to next tool request if this one not found
            // but still add a response part so LLM knows it was attempted
            toolResponseParts.push({ toolRequest, output: resultOutput });
            continue;
          }

          let validatedInput = toolRequest.input;
          if (toolToRun.inputSchema) {
            const validation = toolToRun.inputSchema.safeParse(toolRequest.input);
            if (!validation.success) {
              toolExecutionFailed = true;
              errorMessage = `Input inválido para ${toolRequest.name}: ${validation.error.toString()}`;
              resultOutput = { error: errorMessage, code: 'INPUT_VALIDATION_ERROR', details: validation.error.issues }; // Structure for LLM
              executedToolResults.push({
                name: toolRequest.name,
                input: toolRequest.input as Record<string, unknown>,
                errorDetails: { message: errorMessage, code: 'INPUT_VALIDATION_ERROR', details: validation.error.issues },
                status: 'error',
                ref: toolRequest.ref,
              });
              toolResponseParts.push({ toolRequest, output: resultOutput });
              continue; // Skip execution if validation fails
            }
            validatedInput = validation.data;
          }

          if (typeof toolToRun.func !== 'function') {
            toolExecutionFailed = true;
            errorMessage = `Ferramenta ${toolRequest.name} não possui função executável.`;
            resultOutput = { error: errorMessage, code: 'TOOL_NOT_EXECUTABLE' }; // Structure for LLM
            executedToolResults.push({
              name: toolRequest.name,
              input: toolRequest.input as Record<string, unknown>,
              errorDetails: { message: errorMessage, code: 'TOOL_NOT_EXECUTABLE' },
              status: 'error',
              ref: toolRequest.ref,
            });
            toolResponseParts.push({ toolRequest, output: resultOutput });
            continue;
          }

          // Execute the tool function
          const toolRawOutput = await toolToRun.func(validatedInput);

          // Check if the tool returned structured errorDetails itself
          if (toolRawOutput && typeof toolRawOutput === 'object' && 'errorDetails' in toolRawOutput && toolRawOutput.errorDetails) {
            toolExecutionFailed = true;
            const toolErrorDetails = toolRawOutput.errorDetails as ErrorDetails;
            executedToolResults.push({
              name: toolRequest.name,
              input: toolRequest.input as Record<string, unknown>,
              errorDetails: toolErrorDetails,
              status: 'error',
              ref: toolRequest.ref,
            });
            // For LLM: send the structured error from the tool
            resultOutput = { error: toolErrorDetails.message, code: toolErrorDetails.code, details: toolErrorDetails.details };
            toolResponseParts.push({ toolRequest, output: resultOutput });
          } else {
            // Tool executed successfully and returned direct output
            resultOutput = toolRawOutput;
            executedToolResults.push({
              name: toolRequest.name,
              input: toolRequest.input as Record<string, unknown>,
              output: resultOutput,
              status: 'success',
              ref: toolRequest.ref,
            });
            toolResponseParts.push({ toolRequest, output: resultOutput });
          }

        } catch (e: any) {
          toolExecutionFailed = true;
          const toolCrashError: ErrorDetails = {
            message: e.message || 'Tool crashed during execution',
            code: 'TOOL_CRASH',
            details: e.stack
          };
          resultOutput = { error: toolCrashError.message, code: toolCrashError.code }; // Structure for LLM

          // Ensure we record the error for the specific tool
          executedToolResults.push({
            name: toolRequest.name,
            input: toolRequest.input as Record<string, unknown>,
            errorDetails: toolCrashError,
            status: 'error',
            ref: toolRequest.ref,
          });
          // Also add a response part for the LLM to know about the error
          toolResponseParts.push({ toolRequest, output: resultOutput });
          // Depending on desired behavior, you might choose to 'continue' or 'break' here.
          // For now, it continues to process other tools if any.
        }
      }

      // Add tool responses to messages for the next iteration
      // Only add if there were actual tool responses generated.
      if (toolResponseParts.length > 0) {
        currentMessages.push({
          role: 'tool',
          content: toolResponseParts.map(part => {
            // Ensure that the 'output' being stringified is appropriate,
            // especially if it's an error object.
            // For Genkit, the 'output' in ToolResponsePart is what's sent to the LLM.
            // If 'part.output' is an error, it should be represented in a way the LLM can understand.
            // For now, we assume JSON.stringify will handle it, but this might need refinement
            // based on how the LLM expects tool error messages.
            return {
              text: JSON.stringify({ // This structure might need to align with Genkit's expected ToolResponse format if not using `Part.toolResponse`
                name: part.toolRequest.name,
                output: part.output, // This could be a success result or an error message/object
                ref: part.toolRequest.ref
              }),
              // Ideally, Genkit's ToolResponsePart should be used directly if possible,
              // which might involve structuring 'output' as { error: string } or similar for errors.
              // Example: content: toolResponseParts (if toolResponseParts are already ToolResponse[])
            };
          })
        });
      }
    } // End of while loop

    // const stream = llmResponse.stream ? llmResponse.stream() : null; // Stream handling would need rework with this loop
    // if (stream) { return { stream }; }

    return {
      outputMessage: finalOutputText,
      toolRequests: executedToolRequests, 
      toolResults: executedToolResults, 
    };
  } catch (e: any) {
    winstonLogger.error(`Error in ${flowName} (Agent: ${agentId})`, {
      error: e instanceof Error ? { message: e.message, stack: e.stack, name: e.name } : String(e),
      agentId: agentId,
      flowName: flowName
    });
    // enhancedLogger.logError is good here if createLoggableFlow doesn't capture enough detail or if error is caught before re-throwing
    // For now, createLoggableFlow will handle the primary error logging.
    return { error: e.message || 'An unexpected error occurred' };
  }
}

// Wrap the internal function with createLoggableFlow
export const basicChatFlow = createLoggableFlow(
  "basicChatFlow", // Flow name
  {
    flow: basicChatFlowInternal, // The actual function to wrap
    inputTransformer: (input: BasicChatInput) => ({
      agentId: input.agentId || "unknown_agent",
      userMessageLength: input.userMessage.length,
      hasFileDataUri: !!input.fileDataUri,
      modelName: input.modelName,
      systemPromptLength: input.systemPrompt?.length,
      temperature: input.temperature,
      toolCount: input.agentToolsDetails?.filter(t => t.enabled).length || 0,
    }),
    outputTransformer: (output: BasicChatOutput) => ({
      hasOutputMessage: !!output.outputMessage,
      hasStream: !!output.stream,
      hasError: !!output.error,
      toolRequestCount: output.toolRequests?.length || 0,
    }),
    agentIdExtractor: (input: BasicChatInput) => input.agentId || "unknown_agent"
  }
);

// Definir tipo extendido para MessageData
interface ChatMessageData extends MessageData {
  metadata?: Record<string, unknown>;
}
