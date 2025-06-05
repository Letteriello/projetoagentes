import { StreamingTextResponse, streamToResponse } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { basicChatFlow, BasicChatInput } from '@/ai/flows/chat-flow';
import { winstonLogger } from '../../../lib/winston-logger';
import { writeLogEntry } from '@/lib/logService'; // Added import
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

    // API Key Authentication
    if (!apiKey || apiKey !== serverApiKey) {
      winstonLogger.warn('[API ChatStream] Unauthorized access attempt.', {
        api: 'chat-stream',
        remoteAddress: req.ip,
        requestUrl: req.url
      });
      return NextResponse.json(
        { success: false, error: 'Acesso não autorizado. Verifique sua chave de API ou token.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    let chatInput: ChatInput;
    try {
        // Parse request body for chat input
        chatInput = await req.json();
    } catch (e:any) {
        winstonLogger.error('[API ChatStream] Invalid JSON payload.', {
            api: 'chat-stream',
            requestUrl: req.url,
            error: { message: e.message, stack: e.stack } // Log error details
        });
        return NextResponse.json(
            { success: false, error: "Invalid JSON payload.", code: "BAD_REQUEST", details: e.message },
            { status: 400 }
        );
    }

    // Validate agentId presence
    if (!chatInput.agentId) {
      winstonLogger.warn('[API ChatStream] Missing agentId in request body.', {
        api: 'chat-stream',
        requestUrl: req.url,
        // body: chatInput // Be cautious logging entire body if it can be very large or sensitive
        receivedAgentId: chatInput.agentId
      });
      return NextResponse.json(
        { success: false, error: "agentId is required in the request body.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Fetch agent configuration
    const agentConfig = await fetchAgentConfiguration(chatInput.agentId);

    if (!agentConfig) {
      winstonLogger.warn('[API ChatStream] Agent configuration not found.', {
        api: 'chat-stream',
        agentId: chatInput.agentId,
        requestUrl: req.url
      });
      // Return 404 if agent configuration is not found
      return NextResponse.json(
        { success: false, error: `Agent configuration not found for agentId: ${chatInput.agentId}`, code: "AGENT_CONFIG_NOT_FOUND" },
        { status: 404 }
      );
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
            let errorCode = "AGENT_EXECUTION_FAILED"; // Default error code for flow errors
            const lowerCaseFlowError = String(flowOutput.error).toLowerCase();

            // Attempt to categorize the error for a more specific user message and code
            if (lowerCaseFlowError.includes("auth") || lowerCaseFlowError.includes("token")) {
              userFriendlyErrorDetail = "Erro de autenticação no fluxo do agente.";
              errorCode = "AGENT_AUTH_ERROR";
            } else if (lowerCaseFlowError.includes("permission") || lowerCaseFlowError.includes("denied")) {
              userFriendlyErrorDetail = "Permissão negada no fluxo do agente.";
              errorCode = "AGENT_PERMISSION_ERROR";
            } else if (lowerCaseFlowError.includes("not found")) {
              userFriendlyErrorDetail = "Recurso necessário para o agente não encontrado.";
              errorCode = "AGENT_RESOURCE_NOT_FOUND";
            } else if (lowerCaseFlowError.includes("fetch failed") || lowerCaseFlowError.includes("networkerror")) {
              userFriendlyErrorDetail = "Erro de rede interno ao contatar serviços para o agente.";
              errorCode = "AGENT_NETWORK_ERROR";
            } else {
              // For unclassified errors, keep a generic message. The original error is logged.
              userFriendlyErrorDetail = "Ocorreu um erro inesperado durante a execução do agente.";
            }


            // Log the detailed error for developers using Winston
            const flowErrorContext = {
              api: 'chat-stream',
              agentId: chatInput.agentId,
              traceId: actualBasicChatInput.traceId, // Assuming traceId is part of actualBasicChatInput
              originalError: String(flowOutput.error),
              reportedError: userFriendlyErrorDetail,
              errorCode: errorCode,
              requestUrl: req.url,
            };
            winstonLogger.error('[API ChatStream] Error reported by basicChatFlow in stream.', flowErrorContext);

            // Persist this significant operational error to Firestore.
            // Using fire-and-forget style for writeLogEntry to not block the response stream.
            writeLogEntry({
              type: 'error',
              severity: 'ERROR',
              flowName: 'basicChatFlow', // Or a more specific flow name if available from agentConfig or flowOutput
              agentId: chatInput.agentId,
              traceId: actualBasicChatInput.traceId,
              message: `Error in basicChatFlow: ${userFriendlyErrorDetail}`,
              details: {
                originalError: String(flowOutput.error), // Keep it concise for Firestore
                errorCode: errorCode,
                // Avoid logging full chatInput if it contains very large or sensitive data.
                chatInputUserMessageLength: chatInput.userMessage?.length,
                modelName: chatInput.modelName, // If available and relevant
                requestUrl: req.url,
              }
            }).catch(logServiceError => {
              // Log if persisting to Firestore fails, but don't let this interrupt the client response.
              winstonLogger.error('[API ChatStream] Failed to write basicChatFlow error to logService.', {
                originalFlowErrorMsg: String(flowOutput.error), // Main error context
                logServiceErrorMessage: logServiceError.message, // Error from logService
                agentId: chatInput.agentId,
                traceId: actualBasicChatInput.traceId,
              });
            });

            // Send a standardized error object to the client via the stream
            const errorPayload = {
              id: `err-flow-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
              timestamp: new Date().toISOString(),
              code: errorCode,
              title: 'Erro no Agente',
              details: userFriendlyErrorDetail,
            };
            controller.enqueue(JSON.stringify({ type: 'error', data: errorPayload }) + '\n');

            controller.close(); // Close the stream as the main flow operation failed.
            return; // Do not process outputMessage if there was a flow error.
          }

          // Enqueue the final output message (as text)
          // Note: If basicChatFlow were to provide a true stream (e.g., from an LLM),
          // this part would need to iterate over that stream and enqueue chunks.
          // Currently, it assumes outputMessage is a complete string.
          if (flowOutput.outputMessage) {
            controller.enqueue(JSON.stringify({ type: 'text', data: flowOutput.outputMessage }) + '\n');
          }

          // If there was no message, no error, and no events, send a control message
          // This helps the client understand that the flow finished but had nothing to say.
          if (!flowOutput.outputMessage && !flowOutput.error && (!flowOutput.chatEvents || flowOutput.chatEvents.length === 0)) {
              controller.enqueue(JSON.stringify({ type: 'event', data: {
                  id: `ctrl-no-output-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
                  timestamp: new Date().toISOString(),
                  eventType: 'AGENT_CONTROL',
                  eventTitle: 'No output',
                  eventDetails: 'The flow completed without generating a message or events.'
              }}) + '\n');
          }

          controller.close(); // Successfully close the stream after all data is enqueued.
        } catch (e: unknown) { // Catching unknown is safer and then checking instanceof Error
          // Handle errors that occur within the stream's start/enqueue logic itself
          const streamProcessingError = e instanceof Error ? e : new Error('Unknown error during stream processing');
          const streamErrorContext = {
            api: 'chat-stream',
            agentId: chatInput?.agentId || 'unknown', // chatInput might be defined from the outer scope
            traceId: actualBasicChatInput?.traceId || 'unknown', // actualBasicChatInput might be available
            errorName: streamProcessingError.name,
            errorMessage: streamProcessingError.message,
            // Stack traces can be very long; log them to Winston but maybe not to Firestore unless essential.
            errorStack: streamProcessingError.stack,
            requestUrl: req.url,
          };
          winstonLogger.error('[API ChatStream] Error directly within ReadableStream start method.', streamErrorContext);

          // Persist this stream processing error to Firestore
          // Using fire-and-forget style
          writeLogEntry({
            type: 'error',
            severity: 'CRITICAL', // Stream processing errors can be critical for the specific request
            flowName: 'ChatStreamProcessing', // Specific identifier for this part of the process
            agentId: chatInput?.agentId || 'unknown',
            traceId: actualBasicChatInput?.traceId || 'unknown',
            message: 'Critical error during stream generation: ' + streamProcessingError.message,
            details: {
              errorName: streamProcessingError.name,
              // errorStack: streamProcessingError.stack, // Consider if stack is needed in Firestore
              requestUrl: req.url,
            }
          }).catch(logServiceError => {
            winstonLogger.error('[API ChatStream] Failed to write stream processing error to logService.', {
              originalStreamErrorMsg: streamProcessingError.message,
              logServiceErrorMsg: logServiceError.message,
              agentId: chatInput?.agentId || 'unknown',
              traceId: actualBasicChatInput?.traceId || 'unknown',
            });
          });

          // Attempt to send a final error event through the stream before erroring out the controller.
          // This is a best-effort attempt, as the controller itself might be in a bad state.
          try {
            const errorPayload = {
              id: `err-stream-${Date.now()}-${Math.random().toString(36).substring(2,9)}`,
              timestamp: new Date().toISOString(),
              code: 'STREAM_PROCESSING_ERROR',
              title: 'Erro Crítico no Stream',
              details: 'Um erro crítico ocorreu durante a geração da resposta do stream. A conexão pode ser interrompida.',
            };
            controller.enqueue(JSON.stringify({ type: 'error', data: errorPayload }) + '\n');
          } catch (enqueueError: unknown) {
            winstonLogger.warn('Failed to enqueue final error message to stream, controller might be broken.', {
                api: 'chat-stream',
                agentId: chatInput?.agentId || 'unknown',
                originalError: streamProcessingError.message,
                enqueueError: enqueueError instanceof Error ? enqueueError.message : String(enqueueError),
            });
            // Ignore if enqueuing the error itself fails, as we'll call controller.error() next.
          }
          // This signals a fatal error with the stream itself.
          controller.error(streamProcessingError);
        }
      },
    });

    // Configure the response to use the NDJSON content type
    return new StreamingTextResponse(stream, {
      headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
    });

  } catch (error: any) { // Outer catch for errors before stream creation (e.g., auth, req.json(), fetchAgentConfiguration)
    let agentIdForLog = 'unknown';
    // Try to get agentId from request body if possible, for better logging context
    // This is a best-effort attempt if chatInput parsing failed or happened before chatInput was set.
    if (req?.headers?.get('content-type')?.includes('application/json')) {
        try {
            const clonedReq = req.clone(); // Clone to read body safely
            const body = await clonedReq.json();
            agentIdForLog = body?.agentId || 'unknown_in_body';
        } catch (e) {
            // If cloning or parsing fails here, agentIdForLog remains 'unknown' or specific error string
            agentIdForLog = 'unknown_body_parse_failed_in_catch';
        }
    }

    const errorContext = {
      api: 'chat-stream',
      agentId: agentIdForLog,
      requestUrl: req.url, // Log the request URL
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack, // Full stack for Winston
    };
    winstonLogger.error('[API ChatStream] Critical error in POST handler (pre-stream setup).', errorContext);

    // Persist significant pre-stream setup errors to Firestore if they are not client errors (like bad JSON or auth)
    // For example, if fetchAgentConfiguration itself throws an unexpected system error.
    if (!(error instanceof SyntaxError) && !error.message?.toLowerCase().includes("unauthorized") && !error.message?.toLowerCase().includes("auth")) {
        writeLogEntry({
            type: 'error',
            severity: 'CRITICAL',
            flowName: 'ChatStreamSetup', // Generic flow name for setup phase
            agentId: agentIdForLog, // Log agentId if available
            message: 'Critical failure during chat stream pre-stream setup: ' + error.message,
            details: {
                errorName: error.name,
                errorMessage: error.message, // Keep it concise for Firestore
                requestUrl: req.url,
            }
        }).catch(logServiceError => {
            // Log if persisting to Firestore fails, but don't let this interrupt the client response.
            winstonLogger.error('[API ChatStream] Failed to write pre-stream setup error to logService.', {
              originalSetupErrorMsg: error.message,
              logServiceErrorMsg: logServiceError.message,
              agentId: agentIdForLog,
            });
        });
    }

    // Standardized error response (already mostly good from previous work, ensure consistency)
    let userFriendlyMessage = 'Ocorreu um erro inesperado no servidor de chat. Por favor, tente novamente mais tarde.';
    let errorCode = "INTERNAL_SERVER_ERROR";
    let httpStatus = 500;

    if (error instanceof SyntaxError || error.message?.toLowerCase().includes('json')) { // Broader check for JSON issues
      userFriendlyMessage = "Requisição malformada. Verifique o formato JSON enviado.";
      errorCode = "BAD_REQUEST";
      httpStatus = 400;
    } else {
        const lowerCaseErrorMsg = error.message?.toLowerCase() || "";
        // Keep specific error messages for client if appropriate
        if (lowerCaseErrorMsg.includes("auth") || lowerCaseErrorMsg.includes("token") || lowerCaseErrorMsg.includes("unauthorized")) {
            userFriendlyMessage = "Autenticação falhou ou sua sessão expirou."; // Original message was more generic, this is fine
            errorCode = "AUTH_FAILURE";
            httpStatus = 401;
        } else if (lowerCaseErrorMsg.includes("permission") || lowerCaseErrorMsg.includes("denied")) {
            userFriendlyMessage = "Permissão negada para este recurso ou agente.";
            errorCode = "FORBIDDEN";
            httpStatus = 403;
        } else if (lowerCaseErrorMsg.includes("not found")) {
            userFriendlyMessage = "Recurso não encontrado ou o agente especificado não existe.";
            errorCode = "RESOURCE_NOT_FOUND"; // Can be from fetchAgentConfiguration or other internal fetches
            httpStatus = 404;
        } else if (lowerCaseErrorMsg.includes("fetch failed") || lowerCaseErrorMsg.includes("networkerror")) {
            userFriendlyMessage = "Erro de rede ao comunicar com serviços internos. Tente novamente mais tarde.";
            errorCode = "NETWORK_ERROR_INTERNAL";
            httpStatus = 503;
        }
        // Default to INTERNAL_SERVER_ERROR if no specific category matched
    }

    return NextResponse.json(
        { success: false, error: userFriendlyMessage, code: errorCode, details: error.message },
        { status: httpStatus }
    );
  }
}

export const runtime = 'edge'; // Keep edge runtime
export const dynamic = 'force-dynamic';
// This is required to enable streaming
export const dynamicParams = true;
export const fetchCache = 'force-no-store';
export const revalidate = 0;
