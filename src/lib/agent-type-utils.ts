import { 
  SavedAgentConfiguration,
  AgentFormData,
  AgentConfig,
  LLMAgentConfig,
  WorkflowAgentConfig,
  CustomAgentConfig,
  A2AAgentSpecialistConfig,
  AgentType,
  AnyAgent,
  isSavedAgentConfiguration,
  isAgentFormData
} from '@/types/unified-agent-types';

// Tipo para compatibilidade com código legado
type UnifiedSavedAgentConfiguration = SavedAgentConfiguration;
type UnifiedAgentFormData = AgentFormData;
type UnifiedAgentConfig = AgentConfig;
type FixedSavedAgentConfiguration = SavedAgentConfiguration;
type FixedAgentConfig = AgentConfig;

export function toUnifiedAgent(agent: AnyAgent): SavedAgentConfiguration {
  // Se já for um SavedAgentConfiguration, retorna como está
  if (isSavedAgentConfiguration(agent)) {
    return agent;
  }

  // Se for um AgentFormData, converte para SavedAgentConfiguration
  if (isAgentFormData(agent)) {
    return toSavedAgentConfiguration(agent);
  }

  // Se for um objeto genérico, tenta converter para SavedAgentConfiguration
  const anyAgent = agent as Record<string, any>;
  
  // Criar um agente unificado com valores padrão
  const unifiedAgent: SavedAgentConfiguration = {
    id: anyAgent.id || `agent_${Date.now()}`,
    agentName: anyAgent.agentName || 'Novo Agente',
    agentDescription: anyAgent.agentDescription || '',
    agentVersion: anyAgent.agentVersion || '1.0.0',
    config: toUnifiedAgentConfig(anyAgent.config || {}),
    tools: Array.isArray(anyAgent.tools) ? anyAgent.tools : [],
    toolsDetails: Array.isArray(anyAgent.toolsDetails) ? anyAgent.toolsDetails : [],
    toolConfigsApplied: anyAgent.toolConfigsApplied || {},
    a2aConfig: anyAgent.a2aConfig || {},
    communicationChannels: Array.isArray(anyAgent.communicationChannels) ? anyAgent.communicationChannels : [],
    debugModeEnabled: Boolean(anyAgent.debugModeEnabled),
    isTemplate: Boolean(anyAgent.isTemplate),
    isFavorite: Boolean(anyAgent.isFavorite),
    userId: anyAgent.userId || 'current-user-id',
    createdAt: anyAgent.createdAt || new Date().toISOString(),
    updatedAt: anyAgent.updatedAt || new Date().toISOString(),
  };

  return unifiedAgent;
}

function toUnifiedAgentConfig(config: any): AgentConfig {
  // Se não for um objeto, retorna uma configuração padrão
  if (!config || typeof config !== 'object') {
    return {
      type: 'llm',
      agentGoal: '',
      agentTasks: [],
      framework: 'none',
      agentModel: 'gpt-3.5-turbo',
      agentTemperature: 0.7,
    };
  }

  // Determinar o tipo de configuração com base no tipo ou em propriedades existentes
  let agentType: AgentType = 'llm';
  if ('type' in config && ['llm', 'workflow', 'custom', 'a2a'].includes(config.type)) {
    agentType = config.type as AgentType;
  } else if ('workflowType' in config) {
    agentType = 'workflow';
  } else if ('customConfig' in config) {
    agentType = 'custom';
  } else if ('specialistRole' in config) {
    agentType = 'a2a';
  }

  // Criar configuração base
  const baseConfig: any = {
    ...config,
    type: agentType,
    agentGoal: config.agentGoal || '',
    agentTasks: Array.isArray(config.agentTasks) ? config.agentTasks : [],
    framework: config.framework || 'none',
  };

  // Adicionar campos específicos do tipo
  switch (agentType) {
    case 'llm':
      baseConfig.agentModel = config.agentModel || 'gpt-3.5-turbo';
      baseConfig.agentTemperature = typeof config.agentTemperature === 'number' ? config.agentTemperature : 0.7;
      baseConfig.agentPersonality = config.agentPersonality || '';
      baseConfig.agentRestrictions = Array.isArray(config.agentRestrictions) ? config.agentRestrictions : [];
      break;
    
    case 'workflow':
      baseConfig.workflowType = config.workflowType || 'sequential';
      baseConfig.workflowSteps = Array.isArray(config.workflowSteps) ? config.workflowSteps : [];
      baseConfig.subAgents = Array.isArray(config.subAgents) ? config.subAgents : [];
      baseConfig.workflowConfig = config.workflowConfig || {};
      break;
      
    case 'custom':
      baseConfig.scriptPath = config.scriptPath || '';
      baseConfig.customConfig = config.customConfig || {};
      break;
      
    case 'a2a':
      baseConfig.specialistRole = config.specialistRole || '';
      baseConfig.specialistSkills = Array.isArray(config.specialistSkills) ? config.specialistSkills : [];
      baseConfig.targetAudience = config.targetAudience || '';
      baseConfig.responseFormat = config.responseFormat || '';
      baseConfig.specialistExamples = Array.isArray(config.specialistExamples) ? config.specialistExamples : [];
      break;
  }

  return baseConfig as AgentConfig;
}

export function toAgentFormData(agent: AnyAgent): AgentFormData {
  const unifiedAgent = toUnifiedAgent(agent);
  
  // Remover campos que não devem estar no formulário
  const { id, createdAt, updatedAt, userId, ...formData } = unifiedAgent;
  
  return {
    ...formData,
    id: id,
    isTemplate: unifiedAgent.isTemplate || false
  } as AgentFormData;
}

export function toSavedAgentConfiguration(formData: AgentFormData): SavedAgentConfiguration {
  const now = new Date().toISOString();
  const agentId = formData.id || `agent_${Date.now()}`;
  
  // Criar configuração base
  const savedAgent: SavedAgentConfiguration = {
    ...formData,
    id: agentId,
    createdAt: (formData as any).createdAt || now,
    updatedAt: now,
    userId: (formData as any).userId || 'current-user-id',
    isTemplate: Boolean(formData.isTemplate),
    agentDescription: formData.agentDescription || '',
    agentVersion: formData.agentVersion || '1.0.0',
    tools: Array.isArray(formData.tools) ? formData.tools : [],
    toolsDetails: Array.isArray(formData.toolsDetails) ? formData.toolsDetails : [],
    toolConfigsApplied: formData.toolConfigsApplied || {},
    a2aConfig: formData.a2aConfig || {},
    communicationChannels: Array.isArray(formData.communicationChannels) ? formData.communicationChannels : [],
    debugModeEnabled: Boolean(formData.debugModeEnabled),
    isFavorite: Boolean(formData.isFavorite),
    config: toUnifiedAgentConfig(formData.config || {})
  };
  
  return savedAgent;
}

// Funções de compatibilidade para código legado
export {
  SavedAgentConfiguration as UnifiedSavedAgentConfiguration,
  AgentFormData as UnifiedAgentFormData,
  AgentConfig as UnifiedAgentConfig,
  SavedAgentConfiguration as FixedSavedAgentConfiguration,
  AgentConfig as FixedAgentConfig
};
