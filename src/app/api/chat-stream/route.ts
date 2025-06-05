import { StreamingTextResponse } from 'ai'; // streamToResponse removed as it's not directly used for ReadableStream
import { NextRequest, NextResponse } from 'next/server';
import { basicChatFlow } from '@/ai/flows/chat-flow'; // Keep this as is if basicChatFlow is the target
import type { ChatInput as FlowChatInput } from '@/types/chat-core'; // Renamed to avoid clash
import { winstonLogger } from '../../../lib/winston-logger';
import { writeLogEntry } from '@/lib/logService';
// constructSystemPromptForGenkit expects AgentConfig from agent-core
import { constructSystemPromptForGenkit } from '@/lib/agent-genkit-utils'; // Assuming this util is updated or compatible
import { ReadableStream } from 'node:stream/web';

import type { SavedAgentConfiguration, AgentConfig, LLMAgentConfig } from '@/types/agent-core';
import type { ToolDetail } from '@/types/chat-core'; // Was local AgentToolDetail

// Define the expected structure of the incoming request body for this API endpoint
interface ApiChatRequestBody {
  agentId: string;
  userMessage: string;
  history?: Array<{role: string; content: any}>; // Keep 'any' if history structure varies before flow
  fileDataUri?: string;
  audioDataUri?: string;
  modelName?: string;
  temperature?: number;
  // traceId might be passed by client for tracking
  traceId?: string;
}

// Mock function to simulate fetching agent configuration
async function fetchAgentConfiguration(agentId: string): Promise<SavedAgentConfiguration | null> {
  winstonLogger.debug(`Fetching configuration for agentId: ${agentId}`, { agentId, api: 'chat-stream' });
  if (agentId === 'agent_123_llm_tool_user') {
    return {
      id: 'agent_123_llm_tool_user',
      agentName: 'Helpful LLM Assistant with Tools',
      agentDescription: 'An assistant with tools',
      agentVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'system',
      isTemplate: false,
      config: {
        type: 'llm',
        framework: 'genkit',
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
        manualSystemPromptOverride: 'You are an advanced AI assistant. Be helpful and concise.', // Example
        agentModel: 'gemini-pro', // Example
        agentTemperature: 0.7,  // Example
      } as LLMAgentConfig, // Cast to specific config type
      toolConfigsApplied: {
        'performWebSearch': { config: { apiKey: 'mock_search_api_key_from_agent_config' } },
        'knowledgeBase': { config: { knowledgeBaseId: 'kb_finance_agent_123', defaultSimilarityTopK: 5 } },
        'calendarAccess': { config: { defaultCalendarId: 'user_primary_calendar_from_agent_config' } }
      },
      tools: ['performWebSearch', 'calculator', 'knowledgeBase', 'calendarAccess'], // List of tool IDs
      toolsDetails: [ // This should be AvailableTool[] from tool-core, simplified for mock
        { id: 'performWebSearch', name: 'Web Search', description: 'Searches the web.', enabled: true } as any,
        { id: 'calculator', name: 'Calculator', description: 'Calculates math expressions.', enabled: true } as any,
        { id: 'knowledgeBase', name: 'Knowledge Base', description: 'Queries a knowledge base.', enabled: true } as any,
        { id: 'calendarAccess', name: 'Calendar Access', description: 'Accesses calendar.', enabled: true } as any,
      ],
    };
  } else if (agentId === 'agent_simple_llm') {
     return {
      id: 'agent_simple_llm',
      agentName: 'Simple LLM Assistant (No Tools)',
      agentDescription: 'A basic assistant',
      agentVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userId: 'system',
      isTemplate: false,
      config: {
        type: 'llm',
        framework: 'genkit',
        agentGoal: 'Provide answers based on your general knowledge.',
        agentPersonality: 'A very straightforward and factual AI.',
        manualSystemPromptOverride: 'You are a basic AI assistant. Answer questions directly.',
        agentModel: 'gemini-pro',
        agentTemperature: 0.7,
        agentTasks: [],
      } as LLMAgentConfig,
      toolConfigsApplied: {},
      tools: [],
      toolsDetails: [],
    };
  }
  return null;
}


export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    const serverApiKey = process.env.CHAT_API_KEY;

    if (!apiKey || apiKey !== serverApiKey) {
      winstonLogger.warn('[API ChatStream] Unauthorized access attempt.', { /* ... */ });
      return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 401 });
    }

    let apiChatRequestBody: ApiChatRequestBody;
    try {
        apiChatRequestBody = await req.json();
    } catch (e:any) {
        winstonLogger.error('[API ChatStream] Invalid JSON payload.', { error: e.message });
        return NextResponse.json({ error: "Invalid JSON payload.", code: "BAD_REQUEST" }, { status: 400 });
    }

    if (!apiChatRequestBody.agentId) {
      winstonLogger.warn('[API ChatStream] Missing agentId.', { body: apiChatRequestBody });
      return NextResponse.json({ error: "agentId is required." }, { status: 400 });
    }

    const agentConfig = await fetchAgentConfiguration(apiChatRequestBody.agentId);
    if (!agentConfig) {
      winstonLogger.warn('[API ChatStream] Agent configuration not found.', { agentId: apiChatRequestBody.agentId });
      return NextResponse.json({ error: `Agent configuration not found for agentId: ${apiChatRequestBody.agentId}` }, { status: 404 });
    }

    // Construct system prompt using the agent's specific configuration
    // constructSystemPromptForGenkit expects AgentConfig from agent-core.
    // agentConfig.config is already AgentConfig.
    const systemPrompt = constructSystemPromptForGenkit(agentConfig.config as AgentConfig);

    // Prepare the input for basicChatFlow, now using FlowChatInput (alias for ChatInput from chat-core)
    const flowInput: FlowChatInput = {
      userMessage: apiChatRequestBody.userMessage,
      history: apiChatRequestBody.history?.map(h => ({ // Map history to CoreChatMessage structure if needed
        role: h.role as 'user' | 'assistant' | 'system' | 'tool', // Cast role
        content: typeof h.content === 'string' ? h.content : JSON.stringify(h.content), // Ensure content is string
        // id, timestamp, etc., might be needed if flow expects full CoreChatMessage in history
      })) || [],
      fileDataUri: apiChatRequestBody.fileDataUri,
      // audioDataUri is not in FlowChatInput from chat-core, handle separately if flow needs it
      modelName: apiChatRequestBody.modelName || (agentConfig.config as LLMAgentConfig).agentModel, // Model from request or agent config
      temperature: apiChatRequestBody.temperature || (agentConfig.config as LLMAgentConfig).agentTemperature, // Temp from request or agent config
      systemPrompt: systemPrompt,
      // agentToolsDetails in FlowChatInput expects ToolDetail[] from chat-core
      agentToolsDetails: agentConfig.toolsDetails?.filter(td => td.enabled).map(td => ({
        id: td.id,
        name: td.name,
        description: td.description,
        enabled: td.enabled,
      })) || [],
      // toolConfigsApplied and traceId are not part of FlowChatInput from chat-core
      // These would need to be passed to basicChatFlow differently if required by its internal logic.
      // For now, they are omitted from flowInput to match FlowChatInput.
    };
    // Add traceId if present in request and flowInput schema is adapted or it's passed via options
    // if (apiChatRequestBody.traceId) { (flowInput as any).traceId = apiChatRequestBody.traceId; }


    winstonLogger.debug("Prepared FlowChatInput for flow", { /* ... */ });

    // Assuming basicChatFlow now accepts FlowChatInput and returns an object that includes
    // outputMessage, error, and potentially chatEvents (which should be CoreChatMessage or a specific event type)
    const flowOutput = await basicChatFlow(flowInput);

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (flowOutput.chatEvents && flowOutput.chatEvents.length > 0) {
            for (const event of flowOutput.chatEvents) {
              // Assuming event is compatible with what client expects for 'event' type
              controller.enqueue(JSON.stringify({ type: 'event', data: event }) + '\n');
            }
          }

          if (flowOutput.error) {
            // ... (error handling logic from original code, ensure it uses flowOutput.error) ...
            winstonLogger.error('[API ChatStream] Error from basicChatFlow.', { error: flowOutput.error });
            const errorPayload = { id: uuidv4(), timestamp: new Date().toISOString(), code: "AGENT_FLOW_ERROR", title: 'Erro no Agente', details: flowOutput.error };
            controller.enqueue(JSON.stringify({ type: 'error', data: errorPayload }) + '\n');
            controller.close();
            return;
          }

          if (flowOutput.outputMessage) {
            controller.enqueue(JSON.stringify({ type: 'text', data: flowOutput.outputMessage }) + '\n');
          }

          if (!flowOutput.outputMessage && !flowOutput.error && (!flowOutput.chatEvents || flowOutput.chatEvents.length === 0)) {
              controller.enqueue(JSON.stringify({ type: 'event', data: { /* ... no output event ... */ }}) + '\n');
          }
          controller.close();
        } catch (e: unknown) { /* ... stream processing error handling ... */ }
      },
    });

    return new StreamingTextResponse(stream, {
      headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
    });

  } catch (error: any) { /* ... outer error handling ... */
    winstonLogger.error('[API ChatStream] Critical error in POST handler.', { error: error.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const fetchCache = 'force-no-store';
export const revalidate = 0;
