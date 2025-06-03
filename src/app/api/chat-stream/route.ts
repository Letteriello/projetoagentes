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
  modelName?: string;
  temperature?: number;
  // agentToolsDetails from the chatInput will be overridden by the fetched agent's tools configuration
}

// Mock function to simulate fetching agent configuration
// In a real application, this would query a database or configuration service.
async function fetchAgentConfiguration(agentId: string): Promise<SavedAgentConfiguration | null> {
  console.log(`Fetching configuration for agentId: ${agentId}`);
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
      modelName: chatInput.modelName, // User can still override model per request if desired
      temperature: chatInput.temperature, // User can still override temp per request
      systemPrompt: systemPrompt, // Generated system prompt
      agentToolsDetails: agentConfig.tools, // Tools are taken from the fetched agent config
      toolConfigsApplied: agentConfig.toolConfigsApplied, // Tool configurations from fetched agent config
    };

    console.log("Prepared BasicChatInput for flow:", {
        userMessage: actualBasicChatInput.userMessage,
        modelName: actualBasicChatInput.modelName,
        systemPromptLength: actualBasicChatInput.systemPrompt?.length,
        numAgentTools: actualBasicChatInput.agentToolsDetails?.length,
        toolConfigsKeys: Object.keys(actualBasicChatInput.toolConfigsApplied || {}),
    });


    // Streaming callback for handling chunks
    let accumulatedResponse = "";
    const genkitStream = new ReadableStream({
      async start(controller) {
        await basicChatFlow(actualBasicChatInput, (chunk) => {
          // Assuming chunk is directly the string content or can be processed to string
          // This part might need adjustment based on the actual chunk structure from basicChatFlow
          let content = '';
          if (typeof chunk === 'string') {
            content = chunk;
          } else if (chunk?.outputMessage) { // If basicChatFlow stream returns objects with outputMessage
            content = chunk.outputMessage;
          } else if (chunk?.response?.text) { // Adapting to potential genkit stream structure
             content = chunk.response.text();
          } else if (chunk?.text) { // Adapting to potential genkit stream structure for candidate
             content = chunk.text();
          }


          if (content) {
            accumulatedResponse += content;
            controller.enqueue(content);
          }
        });
        controller.close();
      },
    });
    
    // Convert the Genkit stream to a Vercel AI SDK compatible stream
    return streamToResponse(genkitStream, new Headers({
        'Content-Type': 'text/plain; charset=utf-8',
    }));

  } catch (error: any) {
    console.error('[Chat API Error]', error);
    winstonLogger.error('Error in chat-stream API:', { error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : String(error) });
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred in chat API.' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
// This is required to enable streaming
export const dynamicParams = true;
export const fetchCache = 'force-no-store';
export const revalidate = 0;
