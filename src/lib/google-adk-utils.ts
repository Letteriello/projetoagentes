// DEPRECATED: This file and its functions (e.g., convertToGoogleADKConfig) do not appear to be actively used or imported elsewhere in the project.
// It might be related to an old or experimental Google ADK integration.
// Verify no active critical dependencies before actual removal.

/**
 * Utilitários para conversão entre o formato interno de agentes e o formato do Google ADK
 */

// Importamos apenas os tipos necessários sem criar dependências circulares
type AgentConfig = {
  agentName: string;
  agentDescription: string;
  agentVersion: string;
  agentTools: string[];
  isRootAgent?: boolean; 
  subAgents?: string[];
  globalInstruction?: string;
  agentType: string;
  [key: string]: any;
};

type AvailableTool = {
  id: string;
  label: string;
  description: string;
  genkitToolName?: string;
  [key: string]: any;
};

type ToolConfigData = {
  [key: string]: any;
};

/**
 * Interface que representa a configuração de um agente no formato do Google ADK
 */
export interface GoogleADKAgentConfig {
  name: string;
  model?: string;
  description?: string;
  instruction?: string;
  tools?: any[];
  sub_agents?: any[];
  global_instruction?: string;
  generate_content_config?: {
    temperature?: number;
    [key: string]: any;
  };
  input_schema?: any;
  output_schema?: any;
  output_key?: string;
  
  // Configurações de estado e memória
  state_settings?: {
    persistence_enabled: boolean;
    persistence_type?: string;
    initial_values?: Record<string, any>;
    sharing_enabled?: boolean;
    sharing_strategy?: string;
  };
  
  // Configurações de RAG e conhecimento
  memory_service?: {
    service_type: string;
    project_id?: string;
    location?: string;
    rag_corpus_name?: string;
    similarity_top_k?: number;
    vector_distance_threshold?: number;
    include_conversation_context?: boolean;
    persistent_memory?: boolean;
    knowledge_sources?: Array<{
      id: string;
      name: string;
      type: string;
      location: string;
      description?: string;
      enabled: boolean;
      [key: string]: any;
    }>;
  };
  
  // Configurações de artefatos
  artifact_settings?: {
    enabled: boolean;
    storage_type: string;
    storage_location?: string;
    artifacts: Array<{
      id: string;
      name: string;
      type: string;
      mime_type: string;
      description?: string;
      access_roles: string[];
      version_control?: boolean;
      size_limit?: number;
      uri_pattern?: string;
      [key: string]: any;
    }>;
  };
}

/**
 * @deprecated This function's original purpose was likely to consolidate various agent instructional fields
 * into a single string for a previous system or agent framework. For current Genkit agent flows,
 * similar system prompt construction logic is handled by `constructSystemPromptForGenkit`
 * in `src/lib/agent-genkit-utils.ts`.
 *
 * Gera uma instrução consolidada a partir dos campos separados de um agente
 */
export function generateInstructionFromFields(agent: AgentConfig): string {
  let instruction = '';
  
  // Para agentes do tipo LLM, usa os campos específicos de LLM
  if ('agentGoal' in agent && agent.agentGoal) {
    instruction += `OBJETIVO PRINCIPAL:\n${agent.agentGoal}\n\n`;
  }
  
  if ('agentTasks' in agent && agent.agentTasks) {
    instruction += `TAREFAS PRINCIPAIS A SEREM REALIZADAS:\n${agent.agentTasks}\n\n`;
  }
  
  if ('agentPersonality' in agent && agent.agentPersonality) {
    instruction += `PERSONALIDADE/TOM DE COMUNICAÇÃO:\n${agent.agentPersonality}\n\n`;
  }
  
  if ('agentRestrictions' in agent && agent.agentRestrictions) {
    instruction += `RESTRIÇÕES E DIRETRIZES IMPORTANTES A SEGUIR RIGOROSAMENTE:\n${agent.agentRestrictions}\n\n`;
  }
  
  // Para agentes do tipo workflow, adiciona informações de fluxo
  if ('workflowDescription' in agent && agent.workflowDescription) {
    instruction += `DESCRIÇÃO DO FLUXO DE TRABALHO:\n${agent.workflowDescription}\n\n`;
  }
  
  // Para agentes do tipo custom, adiciona a descrição da lógica personalizada
  if ('customLogicDescription' in agent && agent.customLogicDescription) {
    instruction += `LÓGICA PERSONALIZADA:\n${agent.customLogicDescription}\n\n`;
  }
  
  return instruction.trim();
}

/**
 * Converte as configurações de ferramentas para o formato esperado pelo Google ADK
 */
export function generateToolsConfig(toolIds: string[], availableTools: AvailableTool[], toolsConfig: Record<string, ToolConfigData>): any[] {
  return toolIds.map(toolId => {
    const tool = availableTools.find(t => t.id === toolId);
    const toolConfig = toolsConfig[toolId] || {};
    
    if (!tool) return null;
    
    return {
      name: tool.genkitToolName || tool.id,
      description: tool.description,
      config: toolConfig
    };
  }).filter(Boolean);
}

/**
 * @deprecated This function is not used for the current Genkit agent flows.
 * System prompt logic for Genkit agents is now primarily handled by
 * the `constructSystemPromptForGenkit` function in `src/lib/agent-genkit-utils.ts`.
 *
 * Converte uma configuração de agente interna para o formato do Google ADK
 */
export function convertToGoogleADKConfig(
  agent: AgentConfig, 
  availableTools: AvailableTool[], 
  toolsConfig: Record<string, ToolConfigData>,
  savedAgents: { id: string; agentName: string; }[]
): GoogleADKAgentConfig {
  const baseConfig: GoogleADKAgentConfig = {
    name: agent.agentName,
    description: agent.agentDescription,
  };
  
  // Adiciona o modelo se for um agente LLM ou tiver modelo definido
  if ('agentModel' in agent && agent.agentModel) {
    baseConfig.model = agent.agentModel;
  }
  
  // Gera a instrução consolidada
  baseConfig.instruction = generateInstructionFromFields(agent);
  
  // Configura as ferramentas
  if (agent.agentTools.length > 0) {
    baseConfig.tools = generateToolsConfig(agent.agentTools, availableTools, toolsConfig);
  }
  
  // Configura temperatura se disponível
  if ('agentTemperature' in agent && typeof agent.agentTemperature === 'number') {
    baseConfig.generate_content_config = {
      temperature: agent.agentTemperature
    };
  }
  
  // Configura sub-agentes se for um agente raiz
  if (agent.isRootAgent && agent.subAgents && agent.subAgents.length > 0) {
    baseConfig.sub_agents = agent.subAgents.map(subAgentId => {
      const subAgent = savedAgents.find(a => a.id === subAgentId);
      return {
        id: subAgentId,
        name: subAgent?.agentName || subAgentId
      };
    });
  }
  
  // Configura instrução global se for um agente raiz
  if (agent.isRootAgent && agent.globalInstruction) {
    baseConfig.global_instruction = agent.globalInstruction;
  }
  
  // Configura estado e memória
  if (agent.enableStatePersistence || agent.initialStateValues?.length > 0 || agent.enableStateSharing) {
    baseConfig.state_settings = {
      persistence_enabled: agent.enableStatePersistence || false,
      persistence_type: agent.enableStatePersistence ? mapStatePersistenceType(agent.statePersistenceType) : undefined,
      sharing_enabled: agent.enableStateSharing || false,
      sharing_strategy: agent.enableStateSharing ? mapSharingStrategy(agent.stateSharingStrategy) : undefined,
    };
    
    // Adiciona valores iniciais de estado se existirem
    if (agent.initialStateValues && agent.initialStateValues.length > 0) {
      baseConfig.state_settings.initial_values = agent.initialStateValues.reduce(
        (values: Record<string, Record<string, any>>, stateItem: { scope: string; key: string; value: any }) => {
          // Os valores iniciais são convertidos para um objeto aninhado por escopo
          // para seguir o formato do Google ADK
          if (!values[stateItem.scope]) values[stateItem.scope] = {};
          values[stateItem.scope][stateItem.key] = parseStateValue(stateItem.value);
          return values;
        }, 
        {} as Record<string, Record<string, any>>
      );
    }
  }
  
  // Configura RAG e serviço de memória
  if (agent.ragMemoryConfig && agent.ragMemoryConfig.enabled) {
    baseConfig.memory_service = {
      service_type: mapMemoryServiceType(agent.ragMemoryConfig.serviceType),
      similarity_top_k: agent.ragMemoryConfig.similarityTopK || 5,
      vector_distance_threshold: agent.ragMemoryConfig.vectorDistanceThreshold || 0.7,
      include_conversation_context: agent.ragMemoryConfig.includeConversationContext || false,
      persistent_memory: agent.ragMemoryConfig.persistentMemory || false,
    };
    
    // Adiciona configuração específica para serviço Vertex AI RAG
    if (agent.ragMemoryConfig.serviceType === 'vertex-ai-rag') {
      baseConfig.memory_service.project_id = agent.ragMemoryConfig.projectId;
      baseConfig.memory_service.location = agent.ragMemoryConfig.location;
      baseConfig.memory_service.rag_corpus_name = agent.ragMemoryConfig.ragCorpusName;
    }
    
    // Adiciona fontes de conhecimento
    if (agent.ragMemoryConfig.knowledgeSources && agent.ragMemoryConfig.knowledgeSources.length > 0) {
      baseConfig.memory_service.knowledge_sources = agent.ragMemoryConfig.knowledgeSources
        .filter((source: { enabled: boolean }) => source.enabled)
        .map((source: { id: string; name: string; type: string; location: string; description?: string; enabled: boolean; format?: string; credentials?: any; updateFrequency?: any }) => ({
          id: source.id,
          name: source.name,
          type: source.type,
          location: source.location,
          description: source.description,
          enabled: source.enabled,
          format: source.format,
          credentials: source.credentials,
          update_frequency: source.updateFrequency
        }));
    }
  }
  
  // Configura artefatos
  if (agent.enableArtifacts && agent.artifacts && agent.artifacts.length > 0) {
    baseConfig.artifact_settings = {
      enabled: true,
      storage_type: agent.artifactStorageType || 'memory',
      artifacts: agent.artifacts.map((artifact: { id: string; name: string; type: string; mimeType: string; description?: string; accessRoles?: string[]; versionControl?: boolean; sizeLimit?: number; uriPattern?: string }) => ({
        id: artifact.id,
        name: artifact.name,
        type: artifact.type,
        mime_type: artifact.mimeType,
        description: artifact.description,
        access_roles: artifact.accessRoles,
        version_control: artifact.versionControl,
        size_limit: artifact.sizeLimit,
        uri_pattern: artifact.uriPattern
      }))
    };
    
    // Adiciona configuração de armazenamento específica
    if (agent.artifactStorageType === 'cloud' && agent.cloudStorageBucket) {
      baseConfig.artifact_settings.storage_location = agent.cloudStorageBucket;
    } else if (agent.artifactStorageType === 'filesystem' && agent.localStoragePath) {
      baseConfig.artifact_settings.storage_location = agent.localStoragePath;
    }
  }
  
  return baseConfig;
}

/**
 * Mapeia o tipo de persistência de estado para o formato do ADK
 */
function mapStatePersistenceType(type?: 'memory' | 'session' | 'database'): string {
  switch (type) {
    case 'memory': return 'in_memory';
    case 'session': return 'session_storage';
    case 'database': return 'database';
    default: return 'in_memory';
  }
}

/**
 * Mapeia a estratégia de compartilhamento para o formato do ADK
 */
function mapSharingStrategy(strategy?: 'all' | 'explicit' | 'none'): string {
  switch (strategy) {
    case 'all': return 'share_all';
    case 'explicit': return 'share_explicit';
    case 'none': return 'share_none';
    default: return 'share_explicit';
  }
}

/**
 * Mapeia o tipo de serviço de memória para o formato do ADK
 */
function mapMemoryServiceType(type?: 'in-memory' | 'vertex-ai-rag' | 'custom'): string {
  switch (type) {
    case 'in-memory': return 'in_memory_memory_service';
    case 'vertex-ai-rag': return 'vertex_ai_rag_memory_service';
    case 'custom': return 'custom_memory_service';
    default: return 'in_memory_memory_service';
  }
}

/**
 * Tenta analisar um valor de estado para o tipo apropriado
 */
function parseStateValue(value: string): any {
  try {
    // Tenta analisar como JSON para objetos, arrays ou primitivos
    return JSON.parse(value);
  } catch (e) {
    // Se não for um JSON válido, retorna como string
    return value;
  }
}