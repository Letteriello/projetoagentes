import { StreamingTextResponse, streamToResponse } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { basicChatFlow, BasicChatInput } from '@/ai/flows/chat-flow';
import { winstonLogger } from '../../../lib/winston-logger';
import { constructSystemPromptForGenkit, AgentConfigForPrompt } from '@/lib/agent-genkit-utils';
import { ReadableStream } from 'node:stream/web';

// Define the structure for AgentToolDetail, mirroring what BasicChatInput might expect
interface AgentToolDetail {
  id: string; // Corresponds to the key in allAvailableTools and toolConfigsApplied
  name: string;
  description: string;
  enabled: boolean;
}

// Define the structure of the configuration stored for an agent
// This is a simplified version for this mock. A real one might come from a DB.
interface SavedAgentConfiguration {
  id: string;
  name: string;
  config: AgentConfigForPrompt; // Using the imported type for the 'config' part
  toolConfigsApplied: Record<string, any>; // Configurations for each enabled tool
  tools: AgentToolDetail[]; // List of tools associated with the agent and their enabled status
}

// Define the expected structure of the incoming request body
interface ChatInput {
  agentId: string; // ID of the agent to use
  userMessage: string;
  history?: Array<{role: string; content: any}>;
  fileDataUri?: string;
  audioDataUri?: string; // Added audioDataUri
  modelName?: string;
  temperature?: number;
  // agentToolsDetails from the chatInput will be overridden by the fetched agent's tools configuration
}

// Mock function to simulate fetching agent configuration
// In a real application, this would query a database or configuration service.
async function fetchAgentConfiguration(agentId: string): Promise<SavedAgentConfiguration | null> {
  winstonLogger.debug(`Fetching configuration for agentId: ${agentId}`, { agentId, api: 'chat-stream' });
  // Simulate fetching for a specific agentId
  if (agentId === 'agent_123_llm_tool_user') {
    return {
      id: 'agent_123_llm_tool_user',
      name: 'Helpful LLM Assistant with Tools',
      config: {
        type: 'llm',
        globalInstruction: 'You are an advanced AI assistant. Be helpful and concise.',
        agentGoal: 'Assist the user with their tasks by providing information and using available tools effectively.',
        agentTasks: [
          'Understand user queries.',
          'Utilize configured tools to gather information or perform actions.',
          'Format responses clearly.',
          'Maintain a friendly and professional tone.'
        ],
        agentPersonality: 'A helpful and slightly witty AI assistant that aims to be efficient.',
        agentRestrictions: [
          'Do not provide financial advice.',
          'Do not generate harmful or offensive content.',
          'Always disclose when you are using a tool for a simulated action.'
        ],
      },
      toolConfigsApplied: {
        performWebSearch: { apiKey: 'mock_search_api_key_from_agent_config' }, // Example config for web search
        knowledgeBase: { knowledgeBaseId: 'kb_finance_agent_123', defaultSimilarityTopK: 5 },
        calendarAccess: { defaultCalendarId: 'user_primary_calendar_from_agent_config' }
        // Other tools might have empty {} if no specific config is needed beyond defaults in their factories
      },
      tools: [ // These are the tools enabled for this agent
        { id: 'performWebSearch', name: 'Web Search', description: 'Searches the web.', enabled: true },
        { id: 'calculator', name: 'Calculator', description: 'Calculates math expressions.', enabled: true },
        { id: 'knowledgeBase', name: 'Knowledge Base', description: 'Queries a knowledge base.', enabled: true },
        { id: 'calendarAccess', name: 'Calendar Access', description: 'Accesses calendar.', enabled: true },
        // customApiTool, databaseAccessTool, codeExecutorTool could be added here too
      ],
    };
  } else if (agentId === 'agent_simple_llm') {
     return {
      id: 'agent_simple_llm',
      name: 'Simple LLM Assistant (No Tools)',
      config: {
        type: 'llm',
        globalInstruction: 'You are a basic AI assistant. Answer questions directly.',
        agentGoal: 'Provide answers based on your general knowledge.',
        agentPersonality: 'A very straightforward and factual AI.',
      },
      toolConfigsApplied: {},
      tools: [], // No tools enabled for this agent
    };
  }
  return null; // Agent not found
}


export async function POST(req: NextRequest) {
  try {
    // API Key Authentication
    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const serverApiKey = process.env.CHAT_API_KEY;

    if (!apiKey || apiKey !== serverApiKey) {
      winstonLogger.warn('Unauthorized access attempt to /api/chat-stream', { api: 'chat-stream', remoteAddress: req.ip });
      return NextResponse.json({ error: 'Acesso não autorizado. Verifique sua chave de API ou token.' }, { status: 401 });
    }

    const chatInput: ChatInput = await req.json();

    if (!chatInput.agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    const agentConfig = await fetchAgentConfiguration(chatInput.agentId);

    if (!agentConfig) {
      return NextResponse.json({ error: `Agent configuration not found for agentId: ${chatInput.agentId}` }, { status: 404 });
    }

    // Construct system prompt using the agent's specific configuration
    const systemPrompt = constructSystemPromptForGenkit(agentConfig.config);

    // Prepare the input for basicChatFlow
    const actualBasicChatInput: BasicChatInput = {
      userMessage: chatInput.userMessage,
      history: chatInput.history,
      fileDataUri: chatInput.fileDataUri,
      audioDataUri: chatInput.audioDataUri, // Pass audioDataUri
      modelName: chatInput.modelName, // User can still override model per request if desired
      temperature: chatInput.temperature, // User can still override temp per request
      systemPrompt: systemPrompt, // Generated system prompt
      agentToolsDetails: agentConfig.tools, // Tools are taken from the fetched agent config
      toolConfigsApplied: agentConfig.toolConfigsApplied, // Tool configurations from fetched agent config
    };

    winstonLogger.debug("Prepared BasicChatInput for flow", {
      api: 'chat-stream',
      agentId: chatInput.agentId,
      userMessageLength: actualBasicChatInput.userMessage.length,
      modelName: actualBasicChatInput.modelName,
      systemPromptLength: actualBasicChatInput.systemPrompt?.length,
      numAgentTools: actualBasicChatInput.agentToolsDetails?.length,
      toolConfigsKeys: Object.keys(actualBasicChatInput.toolConfigsApplied || {}),
    });


    const flowOutput = await basicChatFlow(actualBasicChatInput);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Enqueue chat events first
          if (flowOutput.chatEvents && flowOutput.chatEvents.length > 0) {
            for (const event of flowOutput.chatEvents) {
              const fullEvent = {
                id: event.id || `evt-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
                timestamp: event.timestamp || new Date(),
                ...event
              };
              controller.enqueue(JSON.stringify({ type: 'event', data: fullEvent }) + '\n');
            }
          }

          // Handle potential errors from the flow
          if (flowOutput.error) {
            let userFriendlyErrorDetail = "Erro interno no fluxo do agente.";
            const lowerCaseFlowError = String(flowOutput.error).toLowerCase();
            if (lowerCaseFlowError.includes("auth") || lowerCaseFlowError.includes("token")) {
              userFriendlyErrorDetail = "Erro de autenticação no fluxo do agente.";
            } else if (lowerCaseFlowError.includes("permission") || lowerCaseFlowError.includes("denied")) {
              userFriendlyErrorDetail = "Permissão negada no fluxo do agente.";
            } else if (lowerCaseFlowError.includes("not found")) {
              userFriendlyErrorDetail = "Recurso necessário para o agente não encontrado.";
            } else if (lowerCaseFlowError.includes("fetch failed") || lowerCaseFlowError.includes("networkerror")) {
              userFriendlyErrorDetail = "Erro de rede interno ao contatar serviços para o agente.";
            } else { // Keep original error string if it's not too revealing or use a generic one
              userFriendlyErrorDetail = "Ocorreu um erro inesperado durante a execução do agente.";
            }
            // It's often better to provide a less specific error message to the user for security.
            // The original error is logged for developers.

            const errorEvent = {
              id: `err-${Date.now()}`,
              timestamp: new Date(),
              eventType: 'AGENT_ERROR',
              eventTitle: 'Erro no Agente',
              eventDetails: userFriendlyErrorDetail,
            };
            controller.enqueue(JSON.stringify({ type: 'event', data: errorEvent }) + '\n');
            winstonLogger.error('Error reported by basicChatFlow in stream', {
              api: 'chat-stream',
              agentId: chatInput.agentId,
              originalError: String(flowOutput.error), // Log original error string
              reportedError: userFriendlyErrorDetail
            });
            controller.close(); // Close stream after reporting a flow error.
            return; // Do not process outputMessage if there was a flow error.
          }

          // Enqueue the final output message (as text)
          if (flowOutput.outputMessage) {
            // Actual text streaming from LLM would be handled here if flowOutput.stream was available
            controller.enqueue(JSON.stringify({ type: 'text', data: flowOutput.outputMessage }) + '\n');
          }

          // If there was no message, no error, and no events, send a control message
          if (!flowOutput.outputMessage && !flowOutput.error && (!flowOutput.chatEvents || flowOutput.chatEvents.length === 0)) {
              controller.enqueue(JSON.stringify({ type: 'event', data: {
                  id: `ctrl-${Date.now()}`,
                  timestamp: new Date(),
                  eventType: 'AGENT_CONTROL',
                  eventTitle: 'No output',
                  eventDetails: 'The flow completed without generating a message or events.'
              }}) + '\n');
          }

          controller.close();
        } catch (e) {
          // Handle errors that occur within the stream's start/enqueue logic
          winstonLogger.error('Error directly within chat-stream ReadableStream start method', {
            api: 'chat-stream',
            agentId: chatInput?.agentId || 'unknown',
            error: e instanceof Error ? { message: e.message, stack: e.stack, name: e.name } : String(e),
          });
          // Send a final error event through the stream if possible, then error out the controller
          try {
            const errorEvent = {
              id: `err-stream-${Date.now()}`,
              timestamp: new Date(),
              eventType: 'STREAM_ERROR',
              eventTitle: 'Erro Crítico no Stream',
              eventDetails: 'Um erro crítico ocorreu durante a geração da resposta do stream.',
            };
            controller.enqueue(JSON.stringify({ type: 'event', data: errorEvent }) + '\n');
          } catch (enqueueError) {
            // Ignore if enqueuing the error itself fails, as we'll call controller.error() next.
          }
          controller.error(e instanceof Error ? e : new Error('Stream generation failed'));
        }
      },
    });

    return new StreamingTextResponse(stream, {
      headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
    });

  } catch (error: any) {
    // console.error('[Chat API Error]', error); // This was correctly removed
    winstonLogger.error('Critical error in chat-stream API POST handler', {
      api: 'chat-stream',
      // Safely access chatInput only if it's defined, otherwise it might be an error during req.json()
      agentId: typeof chatInput !== 'undefined' && chatInput?.agentId ? chatInput.agentId : 'unknown',
      error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : String(error),
    });

    let userFriendlyMessage = 'Ocorreu um erro inesperado no servidor de chat. Por favor, tente novamente mais tarde.';
    let status = 500;

    if (error instanceof SyntaxError && error.message.toLowerCase().includes('json')) {
      userFriendlyMessage = "Requisição malformada. Verifique o formato JSON enviado.";
      status = 400; // Bad Request for malformed JSON
    } else if (error instanceof Error) {
      const lowerCaseError = error.message.toLowerCase();
      if (lowerCaseError.includes("auth") || lowerCaseError.includes("token") || lowerCaseError.includes("unauthorized")) {
        userFriendlyMessage = "Autenticação falhou ou sua sessão expirou.";
        status = 401;
      } else if (lowerCaseError.includes("permission") || lowerCaseError.includes("denied")) {
        userFriendlyMessage = "Permissão negada para este recurso ou agente.";
        status = 403;
      } else if (lowerCaseError.includes("not found")) {
        userFriendlyMessage = "Recurso não encontrado ou o agente especificado não existe.";
        status = 404;
      } else if (lowerCaseError.includes("fetch failed") || lowerCaseError.includes("networkerror")) {
        userFriendlyMessage = "Erro de rede ao comunicar com serviços internos. Tente novamente mais tarde.";
        status = 503; // Service Unavailable or 504 Gateway Timeout might be appropriate
      }
      // Other specific errors could be mapped to 502, 503, 504 if distinguishable
    }

    return NextResponse.json({ error: userFriendlyMessage }, { status });
  }
}

export const runtime = 'edge'; // Keep edge runtime
export const dynamic = 'force-dynamic';
// This is required to enable streaming
export const dynamicParams = true;
export const fetchCache = 'force-no-store';
export const revalidate = 0;
