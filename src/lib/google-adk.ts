// src/lib/google-adk.ts
import { v4 as uuidv4 } from 'uuid';
// Import the specific DB function needed
import { getAgentByIdDB } from '@/lib/agentIndexedDB';
import { ADKAgentConfig, ADKChatMessage, ADKContentPart, ADKChatCompletionOptions, ADKChatCompletionResponse, ADKTool } from '@/types/adk-types'; // Assuming types are here

// Mock da API do Google ADK - Substituir pela implementação real quando disponível
export class GoogleADK {
  private apiKey: string | null = null;
  private defaultModel: string = 'gemini-1.5-pro';
  
  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    } else {
      // API key from localStorage is fine, as it's a user setting, not structured data
      this.apiKey = typeof window !== 'undefined' 
        ? localStorage.getItem('GOOGLE_ADK_API_KEY') 
        : process.env.GOOGLE_ADK_API_KEY || null;
    }
  }
  
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    if (typeof window !== 'undefined') {
      localStorage.setItem('GOOGLE_ADK_API_KEY', apiKey);
    }
  }
  
  hasApiKey(): boolean {
    return !!this.apiKey;
  }
  
  async createAgent(config: ADKAgentConfig): Promise<string> {
    if (!this.hasApiKey()) {
      throw new Error('API key não configurada para o Google ADK');
    }
    const agentId = config.agentId || `agent-${uuidv4()}`;
    // Persistence of agent configuration is now handled by useAgentStorage with IndexedDB
    // This mock ADK class itself will no longer persist agents directly.
    // The UI/hook should call addAgentDB via useAgentStorage.
    console.log(`[GoogleADK Mock] createAgent called for ID: ${agentId}. Agent data should be saved via useAgentStorage/IndexedDB separately.`);
    return agentId;
  }
  
  async sendMessage(options: ADKChatCompletionOptions): Promise<ADKChatCompletionResponse> {
    if (!this.hasApiKey()) {
      throw new Error('API key não configurada para o Google ADK');
    }
    
    const model = options.model || this.defaultModel;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const response: ADKChatCompletionResponse = {
      id: `chatcmpl-${uuidv4()}`,
      model,
      choices: [
        {
          index: 0,
          message: {
            role: 'model',
            content: this.generateMockResponse(options.messages)
          },
          finishReason: 'stop'
        }
      ],
      usage: {
        promptTokens: 150,
        completionTokens: 50,
        totalTokens: 200
      }
    };
    
    if (options.tools && options.tools.length > 0 && Math.random() < 0.3) {
      const randomTool = options.tools[Math.floor(Math.random() * options.tools.length)];
      response.toolCalls = [
        {
          id: `call-${uuidv4()}`,
          toolName: randomTool.name,
          parameters: { query: "informação solicitada" }
        }
      ];
    }
    
    return response;
  }
  
  async executeToolCall(toolCall: any, tools: ADKTool[]): Promise<any> {
    const tool = tools.find(t => t.name === toolCall.toolName);
    if (!tool || !tool.implementation) {
      throw new Error(`Ferramenta ${toolCall.toolName} não implementada`);
    }
    return await tool.implementation(toolCall.parameters);
  }
  
  private generateMockResponse(messages: ADKChatMessage[]): string {
    const lastMessage = messages[messages.length - 1];
    let content = '';
    
    if (typeof lastMessage.content === 'string') {
      content = lastMessage.content;
    } else if (Array.isArray(lastMessage.content)) {
      content = lastMessage.content
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join(' ');
    }
    
    if (content.toLowerCase().includes('olá') || content.toLowerCase().includes('oi')) {
      return 'Olá! Como posso ajudar você hoje?';
    }
    if (content.toLowerCase().includes('ajuda')) {
      return 'Estou aqui para ajudar! Posso responder perguntas, fornecer informações ou auxiliar com tarefas específicas. O que você gostaria de saber?';
    }
    return 'Entendi sua mensagem. Como posso ajudar com mais informações sobre esse assunto?';
  }

  public async listAgents(): Promise<ADKAgentConfig[]> {
    console.log("[GoogleADK Mock] listAgents called. Agent data should be retrieved via useAgentStorage/IndexedDB.");
    // This mock should not directly access IndexedDB.
    // The calling context (e.g., a React component) should use `useAgentStorage().loadAgents()`.
    // For the purpose of this mock ADK, it returns an empty array,
    // as it doesn't manage the list itself.
    return [];
  }
}

export const googleADK = new GoogleADK();

export async function sendMessageToAgent(
  agentId: string, 
  message: string | ADKContentPart[], 
  history: ADKChatMessage[] = []
): Promise<ADKChatMessage> {
  // Retrieve agent configuration from IndexedDB
  const agentConfig = await getAgentByIdDB(agentId); // Changed from localStorage
  
  if (!agentConfig) {
    // Try to provide a more specific error if agent is not found by ID
    throw new Error(`Agente com ID ${agentId} não encontrado no IndexedDB.`);
  }
  
  const messages: ADKChatMessage[] = [
    ...history,
    {
      role: 'user',
      content: message
    }
  ];
  
  // Ensure agentConfig.tools is treated as ADKTool[]
  const adkTools: ADKTool[] = (agentConfig.tools || []) as ADKTool[];

  const response = await googleADK.sendMessage({
    model: agentConfig.model,
    messages,
    tools: adkTools
  });
  
  if (response.toolCalls && response.toolCalls.length > 0 && adkTools.length > 0) {
    for (const toolCall of response.toolCalls) {
      const toolResult = await googleADK.executeToolCall(toolCall, adkTools);
      messages.push({
        role: 'tool',
        content: JSON.stringify(toolResult),
        toolCallId: toolCall.id,
        toolName: toolCall.toolName
      });
    }
    
    const followUpResponse = await googleADK.sendMessage({
      model: agentConfig.model,
      messages,
      tools: adkTools
    });
    
    return followUpResponse.choices[0].message;
  }
  
  return response.choices[0].message;
}

// createCustomAgent function remains unchanged as its responsibility is to format
// the agent config and call googleADK.createAgent. The actual saving of this
// agent to IndexedDB should be handled by the UI/caller of createCustomAgent,
// typically by then calling useAgentStorage().saveAgent(returnedConfig).
export async function createCustomAgent(
  name: string,
  description: string,
  selectedTools: string[],
  systemPrompt: string
): Promise<ADKAgentConfig> { // Return ADKAgentConfig for the caller to save
  const availableTools: Record<string, ADKTool> = {
    'web_search': { name: 'web_search', description: 'Search the web', implementation: async (params: any) => `Search results for ${params.query}` },
    'calculator': { name: 'calculator', description: 'Calculate expressions', implementation: async (params: any) => `Result of ${params.expression}` },
    'weather': { name: 'weather', description: 'Get weather forecast', implementation: async (params: any) => `Weather in ${params.location}: Sunny` }
  };
  
  const agentConfig: ADKAgentConfig = {
    displayName: name,
    description,
    model: 'gemini-1.5-pro', // Default or make configurable
    tools: selectedTools.map(toolName => availableTools[toolName]).filter(t => t), // Filter out undefined tools
    capabilities: ['code_generation', 'tool_use'] // Example capabilities
  };
  
  if (systemPrompt) {
    // System prompt can be part of the description or a dedicated field if ADK supports it
    agentConfig.description = `${description}

System prompt: ${systemPrompt}`;
  }
  
  // The googleADK.createAgent is a mock and doesn't save.
  // It could return the generated agentId or the full config.
  // Let's assume it returns the agentId and we augment the config with it.
  const agentId = await googleADK.createAgent(agentConfig);

  // The caller of createCustomAgent will be responsible for saving this config to IndexedDB
  // using useAgentStorage hook.
  return { ...agentConfig, agentId }; // Return the full config including a potential ID
}

// Ensure all imports for ADK types are correct, e.g.
// import { ADKAgentConfig, ADKChatMessage, ADKContentPart, ADKChatCompletionOptions, ADKChatCompletionResponse, ADKTool } from '@/types/adk-types';
// (Path to adk-types.ts might need adjustment)
