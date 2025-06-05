/**
 * @fileOverview Fluxo de chat básico para interagir com um modelo de IA, com suporte a histórico, envio de imagens e ferramentas dinâmicas.
 *
 * - basicChatFlow - Uma função que lida com uma única troca de chat, considerando o histórico, possível imagem e ferramentas.
 * - BasicChatInput - O tipo de entrada para basicChatFlow.
 * - BasicChatOutput - O tipo de retorno para basicChatFlow.
 */

import LRUCache from 'lru-cache';
import { defineFlow } from '@genkit-ai/flow';
import { createPerformWebSearchTool } from '@/ai/tools/web-search-tool';
import { ai } from '@/ai/genkit'; 
import { dateTimeTool } from '../tools/date-time-tool'; // Import dateTimeTool
import { petStoreTool } from '../tools/openapi-tool'; // Import petStoreTool
import { fileIoTool } from '../tools/file-io-tool'; // Import fileIoTool
// Import factory functions for refactored tools
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
import { speechToTextTool, textToSpeechTool } from '../tools/speech-tools'; // Added Speech Tools
import { videoSummarizerTool } from '../tools/video-summarizer-tool'; // Added Video Summarizer Tool
import { gcsListBucketsTool, gcsUploadFileTool } from '../tools/gcs-tool'; // Added GCS Tools
import { customFunctionInvokerTool } from '../tools/custom-function-invoker'; // Added Custom Function Invoker

import process from 'node:process';
import { ReadableStream } from 'node:stream/web'; 
import { GenerateRequest, Part, ToolRequest, ToolResponse, Tool } from '@genkit-ai/ai';
import type { MessageData } from '@/types/chat-types';
import { ChatRunConfig } from '@/types/chat';
import { createLoggableFlow } from '@/lib/logger'; // Import the wrapper
import { enhancedLogger } from '@/lib/logger'; // For manual logging if needed within
import { winstonLogger } from '../../lib/winston-logger';
import { z } from 'zod';
import { ActionContext } from '@genkit-ai/core';
import { GenerateResponse } from '@genkit-ai/ai';
import { AgentConfig, KnowledgeSource, RagMemoryConfig } from '../../types/unified-agent-types';
import { llmModels } from '../../data/llm-models'; // Adjust path from src/ai/flows to src/data

// Import new flows and their schemas
import { langchainAgentFlow, LangchainAgentFlowInputSchema, LangchainAgentFlowOutputSchema } from './langchain-agent-flow';
import { crewAIAgentFlow, CrewAIAgentFlowInputSchema, CrewAIAgentFlowOutputSchema } from './crewai-agent-flow';
// import { runFlow } from '@genkit-ai/flow'; // Corrija se necessário, ou remova se não usado

import { TokenUsage, calculateTotalTokens } from '@/ai/types/tokens';

type SafeTokenData = TokenUsage[] | string;

function safeCalculateTokens(data: SafeTokenData): number {
  if (typeof data === 'string') {
    try {
      const parsed: TokenUsage[] = JSON.parse(data);
      return calculateTotalTokens(parsed);
    } catch {
      return 0;
    }
  }
  return calculateTotalTokens(data);
}

function processTokenResponse(response: GenerateResponse): TokenUsage {
  // Garantir que response é válido antes de desestruturar
  if (!response || typeof response !== 'object') {
    return {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0
    };
  }

  return {
    promptTokens: response.inputTokens,
    completionTokens: response.outputTokens,
    totalTokens: response.totalTokens,
    ...(response.custom || {})
  };
}

// Initialize LRU Cache for LLM responses
const llmCache = new LRUCache<string, GenerateResponse>({
  max: 500, // Max 500 items
  ttl: 1000 * 60 * 5, // 5 minutes TTL
});

// Tipos para o fluxo de chat
export interface BasicChatInput {
  message: string;
  history?: MessageData[];
  image?: string;
  tools?: Tool[];
  config?: ChatRunConfig;
  agentToolsDetails?: Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
  }>;
}



export interface BasicChatOutput {
  response: string;
  toolResponses?: ToolResponse[];
  tokenUsage?: TokenUsage;
}

// Palavras-chave sensíveis
export const SENSITIVE_KEYWORDS = [
  'senha', 'credential', 'token', 'api-key', 
  'segredo', 'confidencial', 'pessoal'
];

// Função principal do fluxo de chat
export const basicChatFlow = defineFlow(
  {
    name: 'basicChatFlow',
    inputSchema: z.object({
      message: z.string(),
      history: z.array(z.custom<MessageData>()).optional(),
      image: z.string().optional(),
      tools: z.array(z.custom<Tool>()).optional(),
      config: z.custom<ChatRunConfig>().optional()
    }),
    outputSchema: z.object({
      response: z.string(),
      toolResponses: z.array(z.custom<ToolResponse>()).optional(),
      tokenUsage: z.custom<TokenUsage>().optional()
    })
  },
  async (input: BasicChatInput) => {
    // TODO: Implement actual chat flow logic
    // Implementação do fluxo de chat aqui
    return {
      response: 'Resposta padrão',
      tokenUsage: {}
    };
  }
);
