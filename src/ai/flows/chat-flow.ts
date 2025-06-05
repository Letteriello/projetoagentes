/**
 * @fileOverview Fluxo de chat básico para interagir com um modelo de IA, com suporte a histórico, envio de imagens e ferramentas dinâmicas.
 *
 * - basicChatFlow - Uma função que lida com uma única troca de chat, considerando o histórico, possível imagem e ferramentas.
 * - BasicChatInput - O tipo de entrada para basicChatFlow.
 * - BasicChatOutput - O tipo de retorno para basicChatFlow.
 */

import { ai } from '@/ai/genkit'; 
import { performWebSearchTool } from '@/ai/tools/web-search-tool';
import { dateTimeTool } from '../tools/date-time-tool'; // Import dateTimeTool
import { petStoreTool } from '../tools/openapi-tool'; // Import petStoreTool
import { fileIoTool } from '../tools/file-io-tool'; // Import fileIoTool
// Import factory functions for refactored tools
import { createPerformWebSearchTool } from '@/ai/tools/web-search-tool';
import { createKnowledgeBaseTool } from '@/ai/tools/knowledge-base-tool';
import { createCustomApiTool } from '@/ai/tools/custom-api-tool';
import { createCalendarAccessTool } from '@/ai/tools/calendar-access-tool';
import { createDatabaseAccessTool } from '@/ai/tools/database-access-tool';
// Import static tools
import { calculatorTool } from '@/ai/tools/calculator-tool';
import { codeExecutorTool } from '@/ai/tools/code-executor-tool';
import { imageClassifierTool } from '../tools/image-classifier-tool'; // Added Image Classifier Tool
import { textSummarizerTool } from '../tools/text-summarizer-tool'; // Added Text Summarizer Tool
import { sentimentAnalyzerTool } from '../tools/sentiment-analyzer-tool'; // Added Sentiment Analyzer Tool
import { aiFeedbackTool } from '../tools/ai-feedback-tool'; // Added AI Feedback Tool
import { videoStreamMonitorTool, GENKIT_TOOL_NAME_VIDEO_STREAM_MONITOR } from '@/ai/tools/video-stream-tool'; // Added videoStreamMonitorTool
import { stringReverserTool } from '@/ai/tools/example-tdd-tool'; // Added for Task 9.7

import process from 'node:process';
import { ReadableStream } from 'node:stream/web'; 
import { GenerateRequest, Part, ToolRequest, ToolResponse, Tool } from '@genkit-ai/ai';
import type { MessageData } from '@/types/chat-types';
import type { ChatRunConfig } from '@/types/chat';
import { createLoggableFlow } from '@/lib/logger'; // Import the wrapper
import { enhancedLogger } from '@/lib/logger'; // For manual logging if needed within
import { winstonLogger } from '../../lib/winston-logger';
import { z } from 'zod';
import { ActionContext } from 'genkit';
import { LRUCache } from 'lru-cache';
import { GenerateResponse } from '@genkit-ai/ai';
import { AgentConfig, KnowledgeSource, RagMemoryConfig, LLMModelDetails } from '../../types/agent-configs-new'; // Adjust path as needed
import { llmModels } from '../../data/llm-models'; // Adjust path from src/ai/flows to src/data

// Import new flows and their schemas
import { langchainAgentFlow, LangchainAgentFlowInputSchema, LangchainAgentFlowOutputSchema } from './langchain-agent-flow';
import { crewAIAgentFlow, CrewAIAgentFlowInputSchema, CrewAIAgentFlowOutputSchema } from './crewai-agent-flow';
import { runFlow } from 'genkit/flow';


const MAX_HISTORY_MESSAGES_TO_SEND = 20;

// Initialize LRU Cache for LLM responses
const llmCache = new LRUCache<string, GenerateResponse>({
  max: 500, // Max 500 items
  ttl: 1000 * 60 * 5, // 5 minutes TTL
});

// Define sensitive keywords for guardrails
const SENSITIVE_KEYWORDS = ["conteúdo sensível", "excluir dados", "informação confidencial", "apagar tudo", "dados pessoais", "senha", "segredo"];

// Mapa de todas as ferramentas Genkit disponíveis na aplicação
const allAvailableToolsMap = { // Renamed to avoid conflict later if needed
  performWebSearch: performWebSearchTool,
  dateTimeTool: dateTimeTool,
  petStoreTool: petStoreTool,
  fileIoTool: fileIoTool,
};

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
  codeExecutor: codeExecutorTool(),
  [GENKIT_TOOL_NAME_VIDEO_STREAM_MONITOR]: videoStreamMonitorTool, // Added videoStreamMonitorTool
  imageClassifier: imageClassifierTool, // Added Image Classifier Tool
  textSummarizer: textSummarizerTool, // Added Text Summarizer Tool
  sentimentAnalyzer: sentimentAnalyzerTool, // Added Sentiment Analyzer Tool
  aiFeedback: aiFeedbackTool, // Added AI Feedback Tool
};
allAvailableTools['stringReverser'] = stringReverserTool; // Task 9.7

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
 * Information about an artifact generated by a tool.
 */
interface GeneratedArtifactInfo {
  fileName: string;
  fileType: string; // MIME type
  fileDataUri?: string; // For inline data
  fileUrl?: string;     // For external URLs
}

/**
 * Parameters for the chat flow
 */
interface ChatFlowParams {
  fileDataUri?: string;
  audioDataUri?: string; // Added for audio data
  history?: MessageData[];
  modelName: 'geminiPro' | 'gemini15Pro' | string;
  systemPrompt?: string;
  temperature?: number;
  stopSequences?: string[];
  agentToolsDetails?: ToolDetail[];
  ragMemoryConfig?: RagMemoryConfig;
  knowledgeSources?: KnowledgeSource[];
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  forceToolUsage?: boolean;
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
  stopSequences: z.array(z.string()).optional(),
  agentToolsDetails: z.array(ToolDetailSchema).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().int().min(1).optional(),
  maxOutputTokens: z.number().int().min(1).optional(),
  forceToolUsage: z.boolean().optional(),
  audioDataUri: z.string().optional(),
  ragMemoryConfig: z.any().optional(),
  knowledgeSources: z.array(z.any()).optional()
});

/**
 * Entrada para o fluxo de chat básico
 */
export interface BasicChatInput extends ChatFlowParams {
  agentId?: string; // Optional agentId for logging/context
  userMessage: string;
  callbacks?: Record<string, string>; // Added for callback configuration
  runConfig?: ChatRunConfig;
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
  chatEvents?: Partial<{
    id: string;
    timestamp: Date;
    eventType: 'TOOL_CALL_PENDING' | 'TOOL_CALL' | 'TOOL_ERROR' | 'AGENT_CONTROL' | 'CALLBACK_SIMULATION';
    eventTitle: string;
    eventDetails?: string;
    toolName?: string;
    callbackType?: 'beforeModel' | 'afterModel' | 'beforeTool' | 'afterTool';
    callbackAction?: string;
    originalData?: string;
    modifiedData?: string;
  }>[];
  generatedArtifact?: GeneratedArtifactInfo;
  retrievedContextForDisplay?: string;
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
  const { runConfig = {} } = input; // Destructure with default
  const flowName = 'basicChatFlowInternal';
  const agentId = input.agentId || 'unknown_agent';
  const callbacks = input.callbacks || {};

  const selectedModelDetails = llmModels.find(m => m.id === input.modelName);
  winstonLogger.info(`Chat Flow: Model selected - Name: ${selectedModelDetails?.name}, ID: ${input.modelName}, Tools Capability: ${selectedModelDetails?.capabilities?.tools}`, { agentId, flowName });

  const getCallbackConfig = (callbackName: 'beforeModel' | 'afterModel' | 'beforeTool' | 'afterTool') => {
    const logic = callbacks[`${callbackName}Logic`];
    const enabled = callbacks[`${callbackName}Enabled`] === 'true';
    if (enabled && logic) {
      winstonLogger.info(`[CallbackSim] ${callbackName} callback is enabled with logic: "${logic}"`, { agentId, flowName });
    } else if (enabled && !logic) {
      winstonLogger.info(`[CallbackSim] ${callbackName} callback is enabled but no logic is defined.`, { agentId, flowName });
    }
    return { logic, enabled };
  };

  const chatEvents: BasicChatOutput['chatEvents'] = [];

  try {
    // Log RunConfig settings
    winstonLogger.info(`[RunConfig] Received runConfig: max_llm_calls=${runConfig.max_llm_calls}, stream_response=${runConfig.stream_response}, speech_config=${JSON.stringify(runConfig.speech_config)}`, { agentId, flowName, runConfig });

    if (runConfig.stream_response === false) {
      winstonLogger.info(`[RunConfig] stream_response is false. Ideally, response would be buffered and sent at once. Current flow primarily streams.`, { agentId, flowName });
      chatEvents.push({
        id: `evt-stream-cfg-${Date.now()}`,
        timestamp: new Date(),
        eventType: 'AGENT_CONTROL',
        eventTitle: 'Streaming Configuration',
        eventDetails: 'stream_response is false. Standard flow behavior is streaming; full buffering would require structural changes to response handling.',
      });
    } else {
      winstonLogger.info(`[RunConfig] stream_response is true or undefined. Default streaming behavior will apply.`, { agentId, flowName });
    }

    if (runConfig.speech_config) {
      winstonLogger.info(`[RunConfig] speech_config found: ${JSON.stringify(runConfig.speech_config)}. This would be passed to a TTS service if integrated.`, { agentId, flowName });
      chatEvents.push({
        id: `evt-speech-cfg-${Date.now()}`,
        timestamp: new Date(),
        eventType: 'AGENT_CONTROL',
        eventTitle: 'Speech Configuration Received',
        eventDetails: `Speech config: ${JSON.stringify(runConfig.speech_config)}. Would be used by TTS.`,
      });
    }

    const messages: ChatMessage[] = [];
    if (input.systemPrompt) {
      messages.push({ role: 'system', content: [{ text: input.systemPrompt }] });
    }

    let processedHistory = input.history || [];
    if (processedHistory.length > MAX_HISTORY_MESSAGES_TO_SEND) {
      processedHistory = processedHistory.slice(-MAX_HISTORY_MESSAGES_TO_SEND);
    }

    if (processedHistory.length > 0) {
      messages.push(...processedHistory.map(msg => ({
        role: msg.role as ChatMessage['role'],
        content: Array.isArray(msg.content) ?
          msg.content.map(c => typeof c === 'string' ? { text: c } : c) :
          [{ text: String(msg.content) }],
        ...('metadata' in msg && { metadata: msg.metadata as Record<string, unknown> })
      })));
    }

    let retrievedContextForLLM = "";
    let retrievedContextForDisplay: string | undefined = undefined;
    const agentConfigFromInput = input as Partial<AgentConfig & ChatFlowParams & { config?: { framework?: string, subAgents?: string[] }, toolsDetails?: any[] }>;


    if (agentConfigFromInput.ragMemoryConfig?.enabled && agentConfigFromInput.knowledgeSources && agentConfigFromInput.knowledgeSources.length > 0) {
      const simulatedRAGContextParts: string[] = [];
      agentConfigFromInput.knowledgeSources.forEach(ks => {
        if (ks.enabled) {
          simulatedRAGContextParts.push(`Source: ${ks.name}${ks.description ? ' - ' + ks.description : ''}`);
        }
      });

      if (simulatedRAGContextParts.length > 0) {
        retrievedContextForDisplay = "Simulated RAG Context:\n" + simulatedRAGContextParts.join("\n");
        retrievedContextForLLM = `\n\n[Retrieved Context from Knowledge Sources]:\n${retrievedContextForDisplay}\n\n`;
        winstonLogger.info(`Chat Flow: RAG enabled. Simulated context: ${retrievedContextForDisplay}`, { agentId });
      } else {
        winstonLogger.info("Chat Flow: RAG enabled, but no enabled knowledge sources found or they produced no context.", { agentId });
        retrievedContextForDisplay = "RAG enabled, but no relevant context found from knowledge sources.";
      }
    }

    let userMessageText = retrievedContextForLLM ? `${retrievedContextForLLM}${input.userMessage}` : input.userMessage;


    // Framework-specific flow invocation
    const framework = agentConfigFromInput?.config?.framework;
    winstonLogger.info(`[FrameworkDispatch] Detected framework: ${framework}`, { agentId, framework, flowName });

    if (framework === 'langchain') {
      winstonLogger.info(`[FrameworkDispatch] Invoking Langchain simulation flow for agent: ${agentConfigFromInput?.agentName}`, { agentId, flowName });
      const langchainInput: z.infer<typeof LangchainAgentFlowInputSchema> = {
        agentConfig: agentConfigFromInput,
        userMessage: userMessageText,
        // history: processedHistory, // Assuming Langchain flow can handle history if needed
      };
      try {
        const langchainFlowOutput = await runFlow(langchainAgentFlow, langchainInput);
        winstonLogger.info(`[FrameworkDispatch] Langchain flow completed. Simulated response: ${langchainFlowOutput.simulatedResponse.substring(0, 100)}...`, { agentId, flowName });

        const langChainToolResults: ToolExecutionResult[] = (langchainFlowOutput.toolEvents || []).map(event => ({
          name: event.toolName,
          input: event.input,
          output: event.output,
          status: event.status === 'simulated_success' ? 'success' : 'error',
          ref: `lc-sim-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          errorDetails: event.status === 'simulated_failure' ? { message: 'Simulated tool failure in Langchain flow' } : undefined,
        }));

        chatEvents.push({
          id: `evt-lc-flow-${Date.now()}`, timestamp: new Date(), eventType: 'AGENT_CONTROL',
          eventTitle: 'Langchain Flow Simulation',
          eventDetails: `Langchain flow executed. Output: ${langchainFlowOutput.simulatedResponse.substring(0, 100)}... Tools simulated: ${langchainFlowOutput.toolEvents?.length || 0}`
        });
        (langchainFlowOutput.toolEvents || []).forEach(toolEvent => {
          chatEvents.push({
            id: `evt-lc-tool-${toolEvent.toolName}-${Date.now()}`,
            timestamp: new Date(),
            eventType: toolEvent.status === 'simulated_success' ? 'TOOL_CALL' : 'TOOL_ERROR',
            toolName: toolEvent.toolName,
            eventTitle: `Langchain Tool: ${toolEvent.toolName} (${toolEvent.status})`,
            eventDetails: `Input: ${JSON.stringify(toolEvent.input).substring(0,50)}... Output: ${JSON.stringify(toolEvent.output).substring(0,50)}...`
          });
        });

        return {
          outputMessage: langchainFlowOutput.simulatedResponse,
          toolRequests: (langchainFlowOutput.toolEvents || []).map(event => ({ name: event.toolName, input: event.input as Record<string, unknown> })),
          toolResults: langChainToolResults,
          chatEvents,
          retrievedContextForDisplay,
        };
      } catch (e: any) {
        winstonLogger.error(`[FrameworkDispatch] Error running Langchain flow for agent ${agentConfigFromInput?.agentName}: ${e.message}`, { agentId, flowName, error: e });
        return { error: `Error in Langchain simulation: ${e.message}`, chatEvents, retrievedContextForDisplay };
      }
    } else if (framework === 'crewai') {
      winstonLogger.info(`[FrameworkDispatch] Invoking CrewAI simulation flow for agent: ${agentConfigFromInput?.agentName}`, { agentId, flowName });
      const crewaiInput: z.infer<typeof CrewAIAgentFlowInputSchema> = {
        agentConfig: agentConfigFromInput,
        userMessage: userMessageText,
        // history: processedHistory, // Assuming CrewAI flow can handle history
      };
      try {
        const crewaiFlowOutput = await runFlow(crewAIAgentFlow, crewaiInput);
        winstonLogger.info(`[FrameworkDispatch] CrewAI flow completed. Simulated response: ${crewaiFlowOutput.simulatedResponse.substring(0,100)}...`, { agentId, flowName });

        const crewAIToolResults: ToolExecutionResult[] = (crewaiFlowOutput.simulatedTasks || []).flatMap(task =>
          (task.toolEvents || []).map(event => ({
            name: event.toolName,
            input: event.input,
            output: event.output,
            status: event.status === 'simulated_success' ? 'success' : 'error',
            ref: `crew-sim-${task.taskName}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            errorDetails: event.status === 'simulated_failure' ? { message: `Simulated tool failure in CrewAI task '${task.taskName}'` } : undefined,
          }))
        );

        chatEvents.push({
          id: `evt-crew-flow-${Date.now()}`, timestamp: new Date(), eventType: 'AGENT_CONTROL',
          eventTitle: 'CrewAI Flow Simulation',
          eventDetails: `CrewAI flow executed. Output: ${crewaiFlowOutput.simulatedResponse.substring(0,100)}... Tasks simulated: ${crewaiFlowOutput.simulatedTasks?.length || 0}`
        });
        (crewaiFlowOutput.simulatedTasks || []).forEach(task => {
           chatEvents.push({
            id: `evt-crew-task-${task.taskName}-${Date.now()}`,
            timestamp: new Date(),
            eventType: 'AGENT_CONTROL', // Or a more specific CrewAI task event type
            eventTitle: `CrewAI Task: ${task.taskName} (${task.status})`,
            eventDetails: `Assigned to: ${task.assignedTo}. Tools used: ${task.toolEvents?.length || 0}`
          });
          (task.toolEvents || []).forEach(toolEvent => {
            chatEvents.push({
              id: `evt-crew-tool-${task.taskName}-${toolEvent.toolName}-${Date.now()}`,
              timestamp: new Date(),
              eventType: toolEvent.status === 'simulated_success' ? 'TOOL_CALL' : 'TOOL_ERROR',
              toolName: toolEvent.toolName,
              eventTitle: `CrewAI Task '${task.taskName}' Tool: ${toolEvent.toolName} (${toolEvent.status})`,
              eventDetails: `Input: ${JSON.stringify(toolEvent.input).substring(0,50)}... Output: ${JSON.stringify(toolEvent.output).substring(0,50)}...`
            });
          });
        });


        return {
          outputMessage: crewaiFlowOutput.simulatedResponse,
          toolRequests: (crewaiFlowOutput.simulatedTasks || []).flatMap(task => (task.toolEvents || []).map(event => ({ name: event.toolName, input: event.input as Record<string, unknown> }))),
          toolResults: crewAIToolResults,
          chatEvents,
          retrievedContextForDisplay,
        };
      } catch (e: any) {
        winstonLogger.error(`[FrameworkDispatch] Error running CrewAI flow for agent ${agentConfigFromInput?.agentName}: ${e.message}`, { agentId, flowName, error: e });
        return { error: `Error in CrewAI simulation: ${e.message}`, chatEvents, retrievedContextForDisplay };
      }
    } else {
      winstonLogger.info(`[FrameworkDispatch] Proceeding with default Genkit LLM/tool processing for framework: ${framework || 'genkit/custom/none'}`, { agentId, flowName });
    }

    // Fallthrough to existing Genkit LLM and tool processing logic if not Langchain or CrewAI
    const userMessageContent: Part[] = [{ text: userMessageText }];

    if (input.audioDataUri) {
      winstonLogger.info(`Chat Flow: Received audioDataUri (first 30 chars): ${input.audioDataUri.substring(0, 30)}`, { agentId, flowName });
      chatEvents.push({
        id: `evt-audio-${Date.now()}`,
        timestamp: new Date(),
        eventType: 'AGENT_CONTROL',
        eventTitle: 'Audio Data Received',
        eventDetails: `Processed mock audio: ${input.audioDataUri.substring(0, 30)}...`
      });
    }

    const { logic: beforeModelLogic, enabled: beforeModelEnabled } = getCallbackConfig('beforeModel');
    if (beforeModelEnabled && beforeModelLogic) {
      winstonLogger.info(`[CallbackSim] Processing beforeModel: "${beforeModelLogic}"`, { agentId, flowName });
      if (beforeModelLogic === "BLOCK_IF_PROMPT_CONTAINS_XYZ") {
        let combinedPromptText = "";
        messages.forEach(msg => msg.content.forEach(part => { if (part.text) combinedPromptText += part.text + " ";}));
        combinedPromptText += userMessageText;

        if (combinedPromptText.toUpperCase().includes("XYZ")) {
          winstonLogger.warn(`[CallbackSim] Executing beforeModel: BLOCK_IF_PROMPT_CONTAINS_XYZ. Blocking request.`, { agentId, flowName });
          chatEvents.push({
            id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
            callbackType: 'beforeModel', callbackAction: 'BLOCKED',
            eventTitle: `BeforeModel: ${beforeModelLogic}`,
            eventDetails: `Request blocked because prompt contained "XYZ". Original combined prompt (part): "${combinedPromptText.substring(0, 100)}..."`
          });
          return {
            error: 'Blocked by beforeModel XYZ policy. Request not sent to LLM.',
            chatEvents,
            retrievedContextForDisplay
          };
        }
        winstonLogger.info(`[CallbackSim] beforeModel: BLOCK_IF_PROMPT_CONTAINS_XYZ did not find "XYZ". Proceeding.`, { agentId, flowName });
        chatEvents.push({
          id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
          callbackType: 'beforeModel', callbackAction: 'PASSED_CHECK',
          eventTitle: `BeforeModel: ${beforeModelLogic}`,
          eventDetails: `Prompt did not contain "XYZ". Proceeding.`
        });
      } else if (beforeModelLogic === "ADD_SUFFIX_ABC_TO_PROMPT") {
        const suffix = " ABC_SUFFIX";
        const originalUserMessageForEvent = userMessageText;
        let newTextForUserMessageContent = "";
        let textPartFoundAndModified = false;
        for (let i = 0; i < userMessageContent.length; i++) {
          if (userMessageContent[i].text) {
            newTextForUserMessageContent = (userMessageContent[i].text || "") + suffix;
            userMessageContent[i].text = newTextForUserMessageContent;
            textPartFoundAndModified = true;
            break;
          }
        }
        if (!textPartFoundAndModified) {
            newTextForUserMessageContent = suffix;
            userMessageContent.push({text: newTextForUserMessageContent});
        }

        winstonLogger.info(`[CallbackSim] Executing beforeModel: ADD_SUFFIX_ABC_TO_PROMPT. Prompt modified.`, { agentId, flowName });
        chatEvents.push({
          id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
          callbackType: 'beforeModel', callbackAction: 'MODIFIED',
          eventTitle: `BeforeModel: ${beforeModelLogic}`,
          eventDetails: `Prompt (user message part) modified. Suffix "${suffix}" added.`,
          originalData: `Original User Message (part for LLM): "${originalUserMessageForEvent.substring(0,100)}..."`,
          modifiedData: `Modified User Message (part for LLM): "${newTextForUserMessageContent.substring(0,100)}..."`
        });
      } else {
        winstonLogger.info(`[CallbackSim] beforeModel logic "${beforeModelLogic}" is enabled but not a recognized simulation.`, { agentId, flowName });
        chatEvents.push({
          id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
          callbackType: 'beforeModel', callbackAction: 'UNRECOGNIZED_LOGIC',
          eventTitle: `BeforeModel: ${beforeModelLogic}`,
          eventDetails: `Logic "${beforeModelLogic}" enabled but not a recognized simulation.`
        });
      }
    }

    if (input.fileDataUri) {
      userMessageContent.push({
        media: {
          url: input.fileDataUri,
          contentType: 'auto'
        }
      });
    }
    // messages.push({ role: 'user', content: userMessageContent }); // User message is added to messagesForThisIteration later

    const genkitTools: AppTool[] = [];
    if (input.agentToolsDetails && input.agentToolsDetails.length > 0) {
      input.agentToolsDetails.forEach(toolDetail => {
        if (toolDetail.enabled) {
          const toolObj = allAvailableTools[toolDetail.id];
          if (toolObj) {
            genkitTools.push(toolObj);
          }
        }
      });
    }

    const request: GenerateRequest = {
      messages: [], // Will be set per iteration
      config: {
        temperature: input.temperature,
        ...(input.topP !== undefined && { topP: input.topP }),
        ...(input.topK !== undefined && { topK: input.topK }),
        ...(input.maxOutputTokens !== undefined && { maxOutputTokens: input.maxOutputTokens }),
        stopSequences: input.stopSequences
      },
      tools: genkitTools.length > 0 ? genkitTools.map(tool => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema ? tool.inputSchema : null,
        outputSchema: null,
        metadata: tool.metadata
      })) : undefined,
    };

    let finalOutputText = '';
    let executedToolRequests: ChatToolRequest[] = [];
    let executedToolResults: ToolExecutionResult[] = [];
    let currentMessagesForLLM = [...messages, { role: 'user', content: userMessageContent }]; // Initial messages for the first LLM call

    const MAX_TOOL_ITERATIONS = 5;
    let llmCallCount = 0; // Initialize before the tool processing loop

    let fullPromptTextForGuardrailCheck = "";
    currentMessagesForLLM.forEach(msg => { // Use currentMessagesForLLM for guardrail check
      msg.content.forEach(part => {
        if (part.text) {
          fullPromptTextForGuardrailCheck += part.text.toLowerCase() + " ";
        }
      });
    });

    for (const keyword of SENSITIVE_KEYWORDS) {
      if (fullPromptTextForGuardrailCheck.includes(keyword.toLowerCase())) {
        const errorMessage = `Guardrail ativado: Prompt bloqueado devido a conteúdo potencialmente sensível (palavra-chave: "${keyword}").`;
        winstonLogger.warn(`Guardrail (Model Prompt) triggered for Agent ${agentId}: ${errorMessage}`);
        chatEvents.push({
          id: `evt-${Date.now()}-guardrail-prompt`,
          timestamp: new Date(),
          eventType: 'AGENT_CONTROL',
          eventTitle: 'Guardrail: Prompt Bloqueado',
          eventDetails: errorMessage,
        });
        return { error: errorMessage, chatEvents };
      }
    }

    for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
      llmCallCount++; // Increment for each potential LLM call in the loop
      if (runConfig.max_llm_calls !== undefined && runConfig.max_llm_calls > 0 && llmCallCount > runConfig.max_llm_calls) {
        const errorMessage = `LLM call limit (${runConfig.max_llm_calls}) reached. Aborting further LLM calls for this turn.`;
        winstonLogger.warn(errorMessage, { agentId, flowName, llmCallCount, maxLlmCalls: runConfig.max_llm_calls });
        chatEvents.push({
          id: `evt-llm-limit-${Date.now()}`,
          timestamp: new Date(),
          eventType: 'AGENT_CONTROL',
          eventTitle: 'LLM Call Limit Reached',
          eventDetails: errorMessage,
        });
        finalOutputText += (finalOutputText ? "\n" : "") + "[LLM Call Limit Reached]"; // Append to any existing text
        break; // Exit the tool processing loop
      }
      winstonLogger.info(`[RunConfig] LLM call ${llmCallCount} of ${runConfig.max_llm_calls === undefined || runConfig.max_llm_calls === 0 ? 'unlimited' : runConfig.max_llm_calls}`, { agentId, flowName });

      let llmResponse: GenerateResponse;
      const currentRequestCacheKeyPayload = {
        messages: currentMessagesForLLM, // Use currentMessagesForLLM
        modelName: input.modelName,
        tools: request.tools,
        temperature: request.config?.temperature,
        topP: request.config?.topP,
        topK: request.config?.topK,
        maxOutputTokens: request.config?.maxOutputTokens,
        stopSequences: request.config?.stopSequences,
      };
      const currentRequestCacheKey = JSON.stringify(currentRequestCacheKeyPayload);

      if (llmCache.has(currentRequestCacheKey)) {
        winstonLogger.info(`[Chat Flow Cache] HIT for iteration key: ${currentRequestCacheKey.substring(0, 50)}...`, { agentId, flowName });
        llmResponse = llmCache.get(currentRequestCacheKey)!;
      } else {
        winstonLogger.info(`[Chat Flow Cache] MISS for iteration key: ${currentRequestCacheKey.substring(0, 50)}...`, { agentId, flowName });
        llmResponse = await ai.generate({
          ...request,
          messages: currentMessagesForLLM, // Use currentMessagesForLLM
        });
        if (llmResponse && llmResponse.candidates && llmResponse.candidates.length > 0) {
          llmCache.set(currentRequestCacheKey, llmResponse);
        }
      }

      // LLM Token Simulation - Task 9.6
      if (llmResponse.usage?.promptTokens || llmResponse.usage?.completionTokens || llmResponse.candidates[0]?.message.content) {
        const promptTokens = llmResponse.usage?.promptTokens || (currentMessagesForLLM.reduce((acc, curr) => acc + JSON.stringify(curr.content).length, 0) / 4);
        const completionTokensLLM = llmResponse.usage?.completionTokens || (llmResponse.candidates[0]?.message.content.reduce((acc, part) => acc + (part.text?.length || 0), 0) / 4);
        const totalTokensLLM = promptTokens + completionTokensLLM;

        if (flowContext?.trace && totalTokensLLM > 0) {
          flowContext.trace({
            type: 'custom_event',
            name: 'performance_metrics_event',
            data: {
              id: `token-llm-${Date.now()}`,
              timestamp: new Date().toISOString(),
              agentId: agentId,
              traceId: flowContext.traceId,
              eventType: 'performance_metrics',
              metricName: 'token_usage',
              value: totalTokensLLM,
              unit: 'tokens',
              details: {
                source: 'llm',
                model: input.modelName,
                promptTokens: promptTokens,
                completionTokens: completionTokensLLM,
              }
            }
          });
          winstonLogger.info(`[TokenUsage] LLM Token Usage: ${totalTokensLLM} for agent ${agentId}`, { agentId, flowName, totalTokens: totalTokensLLM, model: input.modelName });
        }
      }


      const choice = llmResponse.candidates[0];
      if (!choice || !choice.message || !choice.message.content) {
        finalOutputText = (choice?.finishReason === 'stop' && finalOutputText) ? finalOutputText : 'No response or empty content from model.';
        break;
      }

      const contentParts = choice.message.content;
      let hasToolRequestInThisResponse = false;
      let textFromThisResponse = "";
      let toolRequestsFromCurrentLLMResponse: ToolRequest[] = [];

      for (const part of contentParts) {
        if (part.text) {
          textFromThisResponse += part.text;
        }
        if (part.toolRequest) {
          hasToolRequestInThisResponse = true;
          toolRequestsFromCurrentLLMResponse.push(part.toolRequest);
        }
      }

      if (hasToolRequestInThisResponse && selectedModelDetails?.capabilities?.tools === false) {
        winstonLogger.warn(`[Simulation] Model ${selectedModelDetails.name} attempted to use tools but is not capable. Simulating tool usage failure.`, { agentId, flowName });
        const originalToolNames = toolRequestsFromCurrentLLMResponse.map(tr => tr.name).join(', ');
        finalOutputText = `This model (${selectedModelDetails.name}) attempted to use a tool(s) (${originalToolNames}) but is not configured to do so.`;

        toolRequestsFromCurrentLLMResponse.forEach(tr => {
          executedToolResults.push({
            name: tr.name,
            input: tr.input as Record<string, unknown>,
            errorDetails: { message: `Simulated: Model ${selectedModelDetails.name} cannot use tools.`, code: 'SIMULATED_TOOL_CAPABILITY_FAILURE' },
            status: 'error',
            ref: tr.ref,
          });
        });

        chatEvents.push({
          id: `evt-sim-${Date.now()}`, timestamp: new Date(), eventType: 'TOOL_ERROR',
          eventTitle: `Simulated Tool Failure: ${selectedModelDetails.name}`,
          eventDetails: `Model attempted to use tool(s) '${originalToolNames}' but capabilities.tools is false.`,
          toolName: originalToolNames
        });

        hasToolRequestInThisResponse = false;
        toolRequestsFromCurrentLLMResponse = [];
        if (choice.finishReason !== 'stop') choice.finishReason = 'stop';
      }

      if (toolRequestsFromCurrentLLMResponse.length > 0) {
        executedToolRequests.push(...toolRequestsFromCurrentLLMResponse);
      }

      if (
        input.forceToolUsage === true &&
        selectedModelDetails?.capabilities?.tools === true &&
        genkitTools.length > 0 &&
        toolRequestsFromCurrentLLMResponse.length === 0 &&
        choice.finishReason !== 'stop'
      ) {
        const firstTool = genkitTools[0];
        let fabricatedInput: any = {};

        if (firstTool.inputSchema && firstTool.inputSchema.isZod) {
            const schemaShape = (firstTool.inputSchema as z.ZodObject<any,any,any>).shape;
            if (schemaShape) {
                Object.keys(schemaShape).forEach(key => {
                    if (key.toLowerCase().includes('query') || key.toLowerCase().includes('text') || key.toLowerCase().includes('message')) {
                        fabricatedInput[key] = input.userMessage.substring(0, 50);
                    } else if (key.toLowerCase().includes('num')) {
                        fabricatedInput[key] = Math.floor(Math.random() * 10) + 1;
                    } else {
                         fabricatedInput[key] = "simulated_value";
                    }
                });
            } else {
                 fabricatedInput = { query: input.userMessage.substring(0,50) };
            }
        } else if (firstTool.name.toLowerCase().includes('search') || firstTool.name.toLowerCase().includes('query')) {
          fabricatedInput = { query: input.userMessage.substring(0,50) };
        } else {
          fabricatedInput = { text: "Forced tool execution with default input" };
        }

        const fabricatedToolRequest: ToolRequest = {
          name: firstTool.name,
          input: fabricatedInput,
          ref: `sim_force_${Date.now()}`
        };

        winstonLogger.info(`[Simulation] Forcing tool usage. Fabricated request for tool: ${firstTool.name} with input: ${JSON.stringify(fabricatedInput)}`, { agentId, flowName });
        toolRequestsFromCurrentLLMResponse.push(fabricatedToolRequest);
        executedToolRequests.push(fabricatedToolRequest);
        hasToolRequestInThisResponse = true;

        chatEvents.push({
          id: `evt-sim-force-${Date.now()}`, timestamp: new Date(), eventType: 'AGENT_CONTROL',
          eventTitle: `Simulated Force Tool Usage`,
          eventDetails: `Agent forced to use tool: ${firstTool.name} with input ${JSON.stringify(fabricatedInput)}.`,
          toolName: firstTool.name
        });
        textFromThisResponse = "";
      }

      currentMessagesForLLM.push(choice.message); // Add LLM's response (text and/or tool requests)

      if (!hasToolRequestInThisResponse || choice.finishReason === 'stop') {
        finalOutputText += textFromThisResponse;

        const { logic: afterModelLogic, enabled: afterModelEnabled } = getCallbackConfig('afterModel');
        if (afterModelEnabled && afterModelLogic && finalOutputText) {
          winstonLogger.info(`[CallbackSim] Processing afterModel: "${afterModelLogic}" on final LLM response.`, { agentId, flowName });
          const originalResponseForEvent = finalOutputText;
          let actionDescription = `Logic "${afterModelLogic}" processed.`;
          let eventAction: string = 'PROCESSED';

          if (afterModelLogic === "REPLACE_BAD_WORD_WITH_GOOD_WORD") {
            finalOutputText = finalOutputText.replace(/bad/gi, 'good');
            if (originalResponseForEvent !== finalOutputText) {
              winstonLogger.info(`[CallbackSim] Executing afterModel: REPLACE_BAD_WORD_WITH_GOOD_WORD. Response modified.`, { agentId, flowName });
              actionDescription = `Replaced "bad" with "good" in response.`;
              eventAction = 'MODIFIED';
            } else {
              actionDescription = `No "bad" words found to replace.`;
              eventAction = 'NO_CHANGE';
            }
          } else if (afterModelLogic === "LOG_MODEL_RESPONSE") {
            winstonLogger.info(`[CallbackSim] Executing afterModel: LOG_MODEL_RESPONSE. Final Response: ${finalOutputText}`, { agentId, flowName });
            actionDescription = `Logged final model response.`;
            eventAction = 'LOGGED';
          } else {
            winstonLogger.info(`[CallbackSim] afterModel logic "${afterModelLogic}" is enabled but not a recognized simulation.`, { agentId, flowName });
            actionDescription = `Logic "${afterModelLogic}" is enabled but not a recognized simulation.`;
            eventAction = 'UNRECOGNIZED_LOGIC';
          }
          chatEvents.push({
            id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
            callbackType: 'afterModel', callbackAction: eventAction,
            eventTitle: `AfterModel: ${afterModelLogic}`, eventDetails: actionDescription,
            originalData: eventAction === 'MODIFIED' ? `Original: "${originalResponseForEvent.substring(0,100)}..."` : undefined,
            modifiedData: eventAction === 'MODIFIED' ? `Modified: "${finalOutputText.substring(0,100)}..."` : undefined,
          });
        }
        break;
      } else {
        let potentiallyModifiedTextFromThisResponse = textFromThisResponse;
        const { logic: afterModelLogic, enabled: afterModelEnabled } = getCallbackConfig('afterModel');
        if (afterModelEnabled && afterModelLogic && potentiallyModifiedTextFromThisResponse) {
          winstonLogger.info(`[CallbackSim] Processing afterModel: "${afterModelLogic}" on partial LLM response text.`, { agentId, flowName });
          const originalPartialResponseForEvent = potentiallyModifiedTextFromThisResponse;
          let actionDescription = `Logic "${afterModelLogic}" processed on partial text.`;
          let eventAction: string = 'PROCESSED_PARTIAL';

          if (afterModelLogic === "REPLACE_BAD_WORD_WITH_GOOD_WORD") {
            potentiallyModifiedTextFromThisResponse = potentiallyModifiedTextFromThisResponse.replace(/bad/gi, 'good');
            if (originalPartialResponseForEvent !== potentiallyModifiedTextFromThisResponse) {
              winstonLogger.info(`[CallbackSim] Executing afterModel: REPLACE_BAD_WORD_WITH_GOOD_WORD. Partial response text modified.`, { agentId, flowName });
              actionDescription = `Replaced "bad" with "good" in partial response text.`;
              eventAction = 'MODIFIED_PARTIAL';
            } else {
              actionDescription = `No "bad" words found to replace in partial text.`;
              eventAction = 'NO_CHANGE_PARTIAL';
            }
          } else if (afterModelLogic === "LOG_MODEL_RESPONSE") {
            winstonLogger.info(`[CallbackSim] Executing afterModel: LOG_MODEL_RESPONSE. Partial Response text: ${potentiallyModifiedTextFromThisResponse}`, { agentId, flowName });
            actionDescription = `Logged partial model response text.`;
            eventAction = 'LOGGED_PARTIAL';
          } else {
            winstonLogger.info(`[CallbackSim] afterModel logic "${afterModelLogic}" (on partial text) is enabled but not a recognized simulation.`, { agentId, flowName });
            actionDescription = `Logic "${afterModelLogic}" on partial text is enabled but not a recognized simulation.`;
            eventAction = 'UNRECOGNIZED_LOGIC_PARTIAL';
          }
          chatEvents.push({
            id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
            callbackType: 'afterModel', callbackAction: eventAction,
            eventTitle: `AfterModel (Partial): ${afterModelLogic}`, eventDetails: actionDescription,
            originalData: eventAction === 'MODIFIED_PARTIAL' ? `Original: "${originalPartialResponseForEvent.substring(0,100)}..."` : undefined,
            modifiedData: eventAction === 'MODIFIED_PARTIAL' ? `Modified: "${potentiallyModifiedTextFromThisResponse.substring(0,100)}..."` : undefined,
          });
        }
        finalOutputText += potentiallyModifiedTextFromThisResponse;
      }

      const toolResponsePartsForNextIteration: ToolResponsePart[] = [];
      let numToolsSuccessfullyProcessedInCurrentBatch = 0;

      for (let toolIdx = 0; toolIdx < toolRequestsFromCurrentLLMResponse.length; toolIdx++) {
        const toolRequest = toolRequestsFromCurrentLLMResponse[toolIdx];
        let toolExecutionFailed = false;
        let resultOutput: any;
        let errorMessage: string | undefined;

        const pendingEventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        chatEvents.push({
          id: pendingEventId,
          timestamp: new Date(),
          eventType: 'TOOL_CALL_PENDING',
          toolName: toolRequest.name,
          eventTitle: `Chamando ferramenta ${toolRequest.name}...`,
          eventDetails: JSON.stringify(toolRequest.input)
        });

        try {
          const { logic: beforeToolLogic, enabled: beforeToolEnabled } = getCallbackConfig('beforeTool');
          let modifiedToolInput = toolRequest.input;

          if (beforeToolEnabled && beforeToolLogic) {
            winstonLogger.info(`[CallbackSim] Processing beforeTool for "${toolRequest.name}": "${beforeToolLogic}"`, { agentId, flowName });
            if (beforeToolLogic.startsWith("BLOCK_TOOL_") && toolRequest.name.toUpperCase() === beforeToolLogic.substring("BLOCK_TOOL_".length).toUpperCase()) {
              winstonLogger.warn(`[CallbackSim] Executing beforeTool: ${beforeToolLogic}. Blocking tool ${toolRequest.name}.`, { agentId, flowName });
              toolExecutionFailed = true;
              errorMessage = `Execution of tool ${toolRequest.name} blocked by beforeTool callback.`;
              resultOutput = { error: errorMessage, code: 'CALLBACK_BLOCKED_TOOL_EXECUTION' };
              chatEvents.push({
                id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
                toolName: toolRequest.name, callbackType: 'beforeTool', callbackAction: 'BLOCKED',
                eventTitle: `BeforeTool: ${beforeToolLogic} for ${toolRequest.name}`,
                eventDetails: `Tool execution blocked. Input: ${JSON.stringify(modifiedToolInput).substring(0,100)}...`
              });
            } else if (beforeToolLogic === "ADD_TOOL_INPUT_PREFIX") {
              const originalInputForEvent = JSON.stringify(modifiedToolInput);
              if (typeof modifiedToolInput === 'object' && modifiedToolInput !== null) {
                const prefix = "simulatedPrefix_";
                const newModifiedInput: Record<string, any> = {};
                Object.keys(modifiedToolInput).forEach(key => {
                    newModifiedInput[key] = prefix + (modifiedToolInput as Record<string,any>)[key];
                });
                modifiedToolInput = newModifiedInput;
                winstonLogger.info(`[CallbackSim] Executing beforeTool: ADD_TOOL_INPUT_PREFIX for "${toolRequest.name}". Input modified.`, { agentId, flowName });
                chatEvents.push({
                  id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
                  toolName: toolRequest.name, callbackType: 'beforeTool', callbackAction: 'MODIFIED',
                  eventTitle: `BeforeTool: ${beforeToolLogic} for ${toolRequest.name}`,
                  eventDetails: `Tool input modified with prefix "${prefix}".`,
                  originalData: `Original input: ${originalInputForEvent.substring(0,100)}...`,
                  modifiedData: `Modified input: ${JSON.stringify(modifiedToolInput).substring(0,100)}...`
                });
              } else {
                winstonLogger.warn(`[CallbackSim] beforeTool: ADD_TOOL_INPUT_PREFIX for "${toolRequest.name}" - input is not an object, skipping modification.`, { agentId, flowName });
                 chatEvents.push({
                  id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
                  toolName: toolRequest.name, callbackType: 'beforeTool', callbackAction: 'NO_CHANGE',
                  eventTitle: `BeforeTool: ${beforeToolLogic} for ${toolRequest.name}`,
                  eventDetails: `Input was not an object, skipping modification.`
                });
              }
            } else {
              winstonLogger.info(`[CallbackSim] beforeTool logic "${beforeToolLogic}" for tool "${toolRequest.name}" is enabled but not a recognized simulation.`, { agentId, flowName });
              chatEvents.push({
                id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
                toolName: toolRequest.name, callbackType: 'beforeTool', callbackAction: 'UNRECOGNIZED_LOGIC',
                eventTitle: `BeforeTool: ${beforeToolLogic} for ${toolRequest.name}`,
                eventDetails: `Logic "${beforeToolLogic}" for tool "${toolRequest.name}" is enabled but not a recognized simulation.`
              });
            }
          }

          if (toolExecutionFailed) {
            // This block is for tools that failed due to callback blocking, before attempting to find/run the tool.
            executedToolResults.push({ name: toolRequest.name, input: modifiedToolInput as Record<string, unknown>, errorDetails: { message: errorMessage!, code: (resultOutput as any).code }, status: 'error', ref: toolRequest.ref });
            toolResponsePartsForNextIteration.push({ toolRequest, output: resultOutput });
            // Tool Token Simulation for failed/blocked tool (callback blocked)
            const toolInputTokens = JSON.stringify(modifiedToolInput || {}).length / 4;
            const toolOutputTokens = JSON.stringify(resultOutput || {}).length / 4; // Output contains error
            const toolExecutionTokens = 1; // Minimal cost for blocked/failed execution attempt
            const totalToolTokens = toolInputTokens + toolOutputTokens + toolExecutionTokens;
            if (flowContext?.trace && totalToolTokens > 0) {
              flowContext.trace({
                type: 'custom_event', name: 'performance_metrics_event',
                data: {
                  id: `token-tool-${toolRequest.name}-failed-${Date.now()}`, timestamp: new Date().toISOString(), agentId: agentId, traceId: flowContext.traceId,
                  eventType: 'performance_metrics', metricName: 'token_usage', value: totalToolTokens, unit: 'tokens',
                  details: { source: 'tool', toolName: toolRequest.name, inputTokens: toolInputTokens, outputTokens: toolOutputTokens, executionTokens: toolExecutionTokens, status: 'failed_or_blocked' }
                }
              });
              winstonLogger.info(`[TokenUsage] Tool (Failed/Blocked) Token Usage: ${totalToolTokens} for tool ${toolRequest.name}, agent ${agentId}`, { agentId, flowName, totalToolTokens, toolName: toolRequest.name });
            }
            continue;
          }

          // MCP Tool Simulation Logic
          const currentToolDetail = input.agentToolsDetails?.find(td => td.id === toolRequest.name || td.name === toolRequest.name);
          const isMCP = currentToolDetail?.config?.isMCPTool === true;
          const mcpServerId = currentToolDetail?.config?.selectedMcpServerId as string | undefined;

          if (isMCP && mcpServerId) {
            winstonLogger.info(`[MCP Simulation] Simulating call for MCP tool "${toolRequest.name}" to server "${mcpServerId}" with input: ${JSON.stringify(toolRequest.input)}`, { agentId, flowName });

            resultOutput = {
              simulatedMcpResponse: true,
              message: `Successfully simulated call to MCP tool '${toolRequest.name}' on server '${mcpServerId}'.`,
              receivedInput: toolRequest.input,
              mockData: { result: "some mock value from " + mcpServerId }
            };
            toolExecutionFailed = false; // Mark as success for simulation purposes

            executedToolResults.push({
              name: toolRequest.name,
              input: toolRequest.input as Record<string, unknown>,
              output: resultOutput,
              status: 'success',
              ref: toolRequest.ref
            });

            chatEvents.push({
              id: `evt-mcp-sim-${toolRequest.name}-${Date.now()}`,
              timestamp: new Date(),
              eventType: 'TOOL_CALL',
              toolName: toolRequest.name,
              eventTitle: `Simulated MCP Tool Call: ${toolRequest.name}`,
              eventDetails: `Simulated call to server '${mcpServerId}'. Output: ${JSON.stringify(resultOutput)}`
            });

            toolResponsePartsForNextIteration.push({ toolRequest, output: resultOutput });

            // Tool Token Simulation for simulated MCP tool
            const mcpToolInputTokens = JSON.stringify(toolRequest.input || {}).length / 4;
            const mcpToolOutputTokens = JSON.stringify(resultOutput || {}).length / 4;
            const mcpToolExecutionTokens = 3; // Slightly different cost for simulated MCP
            const totalMcpToolTokens = mcpToolInputTokens + mcpToolOutputTokens + mcpToolExecutionTokens;
            if (flowContext?.trace && totalMcpToolTokens > 0) {
              flowContext.trace({
                type: 'custom_event', name: 'performance_metrics_event',
                data: {
                  id: `token-tool-${toolRequest.name}-mcp-sim-${Date.now()}`, timestamp: new Date().toISOString(), agentId: agentId, traceId: flowContext.traceId,
                  eventType: 'performance_metrics', metricName: 'token_usage', value: totalMcpToolTokens, unit: 'tokens',
                  details: { source: 'tool', toolName: toolRequest.name, inputTokens: mcpToolInputTokens, outputTokens: mcpToolOutputTokens, executionTokens: mcpToolExecutionTokens, status: 'mcp_simulated_success' }
                }
              });
              winstonLogger.info(`[TokenUsage] Tool (MCP Simulated) Token Usage: ${totalMcpToolTokens} for tool ${toolRequest.name}, agent ${agentId}`, { agentId, flowName, totalToolTokens, toolName: toolRequest.name });
            }

            // Remove the pending event for this tool as we've added a specific MCP event
            const pendingEventIndex = chatEvents.findIndex(event => event.id === pendingEventId);
            if (pendingEventIndex > -1) {
                chatEvents.splice(pendingEventIndex, 1);
            }

            continue; // Skip normal tool execution
          }
          // End of MCP Tool Simulation Logic

          const toolToRun = genkitTools.find(t => t.name === toolRequest.name) as AppTool | undefined;

          if (!toolToRun) {
            toolExecutionFailed = true;
            errorMessage = `Ferramenta ${toolRequest.name} não encontrada`;
            resultOutput = { error: errorMessage, code: 'TOOL_NOT_FOUND' };
            // ... (rest of error handling for TOOL_NOT_FOUND)
            toolResponsePartsForNextIteration.push({ toolRequest, output: resultOutput });
            continue;
          }

          let validatedInput = toolRequest.input; // Use original input for MCP tools if they bypass schema validation here
          if (toolToRun.inputSchema) { // This validation might be skipped for already simulated MCP tools if `continue` was hit
            const validation = toolToRun.inputSchema.safeParse(toolRequest.input);
            if (!validation.success) {
              toolExecutionFailed = true;
              errorMessage = `Input inválido para ${toolRequest.name}: ${validation.error.issues.map(i => i.path.join('.') + ': ' + i.message).join(', ')}`;
              resultOutput = { error: errorMessage, code: 'INPUT_VALIDATION_ERROR', details: validation.error.issues };
              toolResponsePartsForNextIteration.push({ toolRequest, output: resultOutput });
              continue;
            }
            validatedInput = validation.data;
          }

          if (typeof toolToRun.func !== 'function') {
            toolExecutionFailed = true;
            errorMessage = `Ferramenta ${toolRequest.name} não possui função executável.`;
            resultOutput = { error: errorMessage, code: 'TOOL_NOT_EXECUTABLE' };
            toolResponsePartsForNextIteration.push({ toolRequest, output: resultOutput });
            continue;
          }

          const stringifiedToolInput = JSON.stringify(modifiedToolInput).toLowerCase();
          let toolBlockedByGuardrail = false;
          for (const keyword of SENSITIVE_KEYWORDS) {
            if (stringifiedToolInput.includes(keyword.toLowerCase())) {
              toolExecutionFailed = true;
              errorMessage = `Guardrail ativado: Execução de ferramenta '${toolRequest.name}' bloqueada devido a parâmetros potencialmente sensíveis (palavra-chave: "${keyword}").`;
              winstonLogger.warn(`Guardrail (Tool Input) triggered for Agent ${agentId}, Tool ${toolRequest.name}: ${errorMessage}`);
              resultOutput = { error: errorMessage, code: 'GUARDRAIL_TOOL_BLOCKED' };
              // ... (rest of error handling for GUARDRAIL_TOOL_BLOCKED)
              toolResponsePartsForNextIteration.push({ toolRequest, output: resultOutput }); // Changed from toolResponseParts
              toolBlockedByGuardrail = true;
              break;
            }
          }

          if (toolBlockedByGuardrail) {
            // Tool Token Simulation for guardrail blocked tool
            const toolInputTokens = JSON.stringify(modifiedToolInput || {}).length / 4;
            const toolOutputTokens = JSON.stringify(resultOutput || {}).length / 4;
            const toolExecutionTokens = 1;
            const totalToolTokens = toolInputTokens + toolOutputTokens + toolExecutionTokens;
            if (flowContext?.trace && totalToolTokens > 0) {
              flowContext.trace({
                type: 'custom_event', name: 'performance_metrics_event',
                data: {
                  id: `token-tool-${toolRequest.name}-guardrail-${Date.now()}`, timestamp: new Date().toISOString(), agentId: agentId, traceId: flowContext.traceId,
                  eventType: 'performance_metrics', metricName: 'token_usage', value: totalToolTokens, unit: 'tokens',
                  details: { source: 'tool', toolName: toolRequest.name, inputTokens: toolInputTokens, outputTokens: toolOutputTokens, executionTokens: toolExecutionTokens, status: 'guardrail_blocked' }
                }
              });
               winstonLogger.info(`[TokenUsage] Tool (Guardrail Blocked) Token Usage: ${totalToolTokens} for tool ${toolRequest.name}, agent ${agentId}`, { agentId, flowName, totalToolTokens, toolName: toolRequest.name });
            }
            continue;
          }

          const toolRawOutput = await toolToRun.func(validatedInput);

          let finalToolOutput = toolRawOutput;
          const { logic: afterToolLogic, enabled: afterToolEnabled } = getCallbackConfig('afterTool');
          if (afterToolEnabled && afterToolLogic && !toolExecutionFailed) {
            winstonLogger.info(`[CallbackSim] Processing afterTool for "${toolRequest.name}": "${afterToolLogic}"`, { agentId, flowName });
            if (afterToolLogic === "REPLACE_TOOL_OUTPUT_BAD_WITH_GOOD" && typeof finalToolOutput === 'string') {
              const originalToolOutputForEvent = finalToolOutput;
              finalToolOutput = finalToolOutput.replace(/bad/gi, 'good');
              if (originalToolOutputForEvent !== finalToolOutput) {
                winstonLogger.info(`[CallbackSim] Executing afterTool: REPLACE_TOOL_OUTPUT_BAD_WITH_GOOD for "${toolRequest.name}". Output modified.`, { agentId, flowName });
                chatEvents.push({
                  id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
                  toolName: toolRequest.name, callbackType: 'afterTool', callbackAction: 'MODIFIED',
                  eventTitle: `AfterTool: ${afterToolLogic} for ${toolRequest.name}`, eventDetails: `Tool output modified.`,
                  originalData: `Original: "${originalToolOutputForEvent.substring(0,100)}..."`, modifiedData: `Modified: "${finalToolOutput.substring(0,100)}..."`
                });
              } else {
                 chatEvents.push({
                  id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
                  toolName: toolRequest.name, callbackType: 'afterTool', callbackAction: 'NO_CHANGE',
                  eventTitle: `AfterTool: ${afterToolLogic} for ${toolRequest.name}`, eventDetails: `No "bad" words found to replace in tool output.`
                });
              }
            } else if (afterToolLogic === "LOG_TOOL_OUTPUT") {
              winstonLogger.info(`[CallbackSim] Executing afterTool: LOG_TOOL_OUTPUT for "${toolRequest.name}". Output: ${JSON.stringify(finalToolOutput)}`, { agentId, flowName });
              chatEvents.push({
                id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
                toolName: toolRequest.name, callbackType: 'afterTool', callbackAction: 'LOGGED',
                eventTitle: `AfterTool: ${afterToolLogic} for ${toolRequest.name}`, eventDetails: `Logged tool output: ${JSON.stringify(finalToolOutput).substring(0,100)}...`
              });
            } else {
              winstonLogger.info(`[CallbackSim] afterTool logic "${afterToolLogic}" for tool "${toolRequest.name}" is enabled but not a recognized simulation.`, { agentId, flowName });
              chatEvents.push({
                id: `evt-cb-${Date.now()}`, timestamp: new Date(), eventType: 'CALLBACK_SIMULATION',
                toolName: toolRequest.name, callbackType: 'afterTool', callbackAction: 'UNRECOGNIZED_LOGIC',
                eventTitle: `AfterTool: ${afterToolLogic} for ${toolRequest.name}`,
                eventDetails: `Logic "${afterToolLogic}" for tool "${toolRequest.name}" is enabled but not a recognized simulation.`
              });
            }
          }

          resultOutput = finalToolOutput; // Use potentially modified output

          // Tool Token Simulation for successful execution - Task 9.6
          const toolInputTokensSuccess = JSON.stringify(validatedInput || {}).length / 4;
          const toolOutputTokensSuccess = JSON.stringify(resultOutput || {}).length / 4;
          const toolExecutionTokensSuccess = 5; // Base cost for successful tool call
          const totalToolTokensSuccess = toolInputTokensSuccess + toolOutputTokensSuccess + toolExecutionTokensSuccess;

          if (flowContext?.trace && totalToolTokensSuccess > 0) {
             flowContext.trace({
               type: 'custom_event',
               name: 'performance_metrics_event',
               data: {
                 id: `token-tool-${toolRequest.name}-success-${Date.now()}`,
                 timestamp: new Date().toISOString(),
                 agentId: agentId,
                 traceId: flowContext.traceId,
                 eventType: 'performance_metrics',
                 metricName: 'token_usage',
                 value: totalToolTokensSuccess,
                 unit: 'tokens',
                 details: {
                   source: 'tool',
                   toolName: toolRequest.name,
                   inputTokens: toolInputTokensSuccess,
                   outputTokens: toolOutputTokensSuccess,
                   executionTokens: toolExecutionTokensSuccess,
                   status: 'success'
                 }
               }
             });
             winstonLogger.info(`[TokenUsage] Tool (Success) Token Usage: ${totalToolTokensSuccess} for tool ${toolRequest.name}, agent ${agentId}`, { agentId, flowName, totalToolTokens: totalToolTokensSuccess, toolName: toolRequest.name });
          }


          if (resultOutput && typeof resultOutput === 'object' && 'errorDetails' in resultOutput && (resultOutput as any).errorDetails) {
            toolExecutionFailed = true;
            const toolErrorDetails = resultOutput.errorDetails as ErrorDetails;
            errorMessage = toolErrorDetails.message;
            // ... (rest of error handling for tool-reported error)
          } else {
            // ... (success path)
            numToolsSuccessfullyProcessedInCurrentBatch++;
            // ... (chained call simulation logic as before)
          }

        } catch (e: any) {
          toolExecutionFailed = true;
          errorMessage = e.message || 'Tool crashed during execution';
          // ... (crash handling)
          // Tool Token Simulation for crashed tool
          const toolInputTokensCrash = JSON.stringify(toolRequest.input || {}).length / 4;
          const toolOutputTokensCrash = 0; // No output if crashed
          const toolExecutionTokensCrash = 2; // Cost for crash attempt
          const totalToolTokensCrash = toolInputTokensCrash + toolOutputTokensCrash + toolExecutionTokensCrash;
           if (flowContext?.trace && totalToolTokensCrash > 0) {
              flowContext.trace({
                type: 'custom_event', name: 'performance_metrics_event',
                data: {
                  id: `token-tool-${toolRequest.name}-crash-${Date.now()}`, timestamp: new Date().toISOString(), agentId: agentId, traceId: flowContext.traceId,
                  eventType: 'performance_metrics', metricName: 'token_usage', value: totalToolTokensCrash, unit: 'tokens',
                  details: { source: 'tool', toolName: toolRequest.name, inputTokens: toolInputTokensCrash, outputTokens: toolOutputTokensCrash, executionTokens: toolExecutionTokensCrash, status: 'crashed' }
                }
              });
              winstonLogger.info(`[TokenUsage] Tool (Crash) Token Usage: ${totalToolTokensCrash} for tool ${toolRequest.name}, agent ${agentId}`, { agentId, flowName, totalToolTokens: totalToolTokensCrash, toolName: toolRequest.name });
           }
        }
        // Common logic for both successful and failed tool executions within the try-catch for a single tool
        if (toolExecutionFailed) {
            executedToolResults.push({ name: toolRequest.name, input: toolRequest.input as Record<string, unknown>, errorDetails: {message: errorMessage!, code: (resultOutput as any)?.code || 'TOOL_EXECUTION_FAILED' }, status: 'error', ref: toolRequest.ref });
            chatEvents.push({ id: `evt-tool-err-${toolRequest.name}-${Date.now()}`, timestamp: new Date(), eventType: 'TOOL_ERROR', toolName: toolRequest.name, eventTitle: `Erro em ${toolRequest.name}`, eventDetails: errorMessage });
        } else {
             executedToolResults.push({ name: toolRequest.name, input: toolRequest.input as Record<string, unknown>, output: resultOutput, status: 'success', ref: toolRequest.ref });
             chatEvents.push({ id: `evt-tool-ok-${toolRequest.name}-${Date.now()}`, timestamp: new Date(), eventType: 'TOOL_CALL', toolName: toolRequest.name, eventTitle: `Ferramenta ${toolRequest.name} executada`, eventDetails: typeof resultOutput === 'string' ? resultOutput : JSON.stringify(resultOutput) });
        }
        toolResponsePartsForNextIteration.push({ toolRequest, output: resultOutput });

      }

      if (toolResponsePartsForNextIteration.length > 0) {
        currentMessagesForLLM.push({ // Add tool responses for the next LLM call
          role: 'tool',
          content: toolResponsePartsForNextIteration.map(tr => ({
            toolResponse: {
              name: tr.toolRequest.name,
              ref: tr.toolRequest.ref || '',
              output: tr.output,
            }
          }))
        });
      } else {
        // This case should ideally not be hit if the loop broke due to no tool requests.
        // If it is, it implies an issue with loop condition or logic.
        winstonLogger.warn("Tool processing loop ended without new tool responses to add, but didn't break earlier. Check logic.", {agentId, flowName, iteration});
        break;
      }
    }

    const SIMULATED_INSECURE_PHRASE = "resposta insegura simulada";
    if (finalOutputText.toLowerCase().includes(SIMULATED_INSECURE_PHRASE.toLowerCase())) {
      winstonLogger.warn(`Simulated Safety Alert triggered for Agent ${agentId}. Original response: "${finalOutputText}"`);
      finalOutputText = "Não posso responder a isso.";
      chatEvents.push({
        id: `evt-${Date.now()}-safety-alert`,
        timestamp: new Date(),
        eventType: 'AGENT_CONTROL',
        eventTitle: 'Alerta de Segurança Simulado',
        eventDetails: 'A resposta original foi substituída por uma mensagem padrão devido a preocupações de segurança simuladas.',
      });
    }

    let foundArtifact: GeneratedArtifactInfo | undefined = undefined;
    if (executedToolResults) {
      for (const toolResult of executedToolResults) {
        if (toolResult.status === 'success' && toolResult.output && typeof toolResult.output === 'object') {
          const output = toolResult.output as any;
          if (
            output.artifact &&
            typeof output.artifact.fileName === 'string' &&
            typeof output.artifact.fileType === 'string' &&
            (typeof output.artifact.fileDataUri === 'string' || typeof output.artifact.fileUrl === 'string')
          ) {
            foundArtifact = {
              fileName: output.artifact.fileName,
              fileType: output.artifact.fileType,
              fileDataUri: output.artifact.fileDataUri,
              fileUrl: output.artifact.fileUrl,
            };
            break;
          }
        }
      }
    }

    return {
      outputMessage: finalOutputText,
      toolRequests: executedToolRequests,
      toolResults: executedToolResults,
      chatEvents: chatEvents,
      generatedArtifact: foundArtifact,
      retrievedContextForDisplay: retrievedContextForDisplay,
    };
  } catch (e: any) {
    winstonLogger.error(`Error in ${flowName} (Agent: ${agentId})`, {
      error: e instanceof Error ? { message: e.message, stack: e.stack, name: e.name } : String(e),
      agentId: agentId,
      flowName: flowName
    });
    return { error: e.message || 'An unexpected error occurred', chatEvents, retrievedContextForDisplay };
  }
}

export const basicChatFlow = createLoggableFlow(
  "basicChatFlow",
  {
    flow: basicChatFlowInternal,
    inputTransformer: (input: BasicChatInput) => ({
      agentId: input.agentId || "unknown_agent",
      userMessageLength: input.userMessage.length,
      hasFileDataUri: !!input.fileDataUri,
      hasAudioDataUri: !!input.audioDataUri,
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
      chatEventCount: output.chatEvents?.length || 0,
    }),
    agentIdExtractor: (input: BasicChatInput) => input.agentId || "unknown_agent"
  }
);

interface ChatMessageData extends MessageData {
  metadata?: Record<string, unknown>;
}
