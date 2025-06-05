// Utilitários para conversão entre tipos de agentes
import type { SavedAgentConfiguration as OldSavedAgentConfiguration } from '../types/agent-configs-fixed';
import type { SavedAgentConfiguration as NewSavedAgentConfiguration } from '../types/agent-configs-new';
import type { AgentFormData } from '../types/agent-types-unified';

/**
 * Converte um SavedAgentConfiguration para AgentFormData
 */
export function toAgentFormData(savedConfig: OldSavedAgentConfiguration | NewSavedAgentConfiguration): AgentFormData {
  // Implementação simplificada para compilação
  return {
    id: savedConfig.id,
    agentName: savedConfig.agentName,
    description: savedConfig.description || '',
    type: savedConfig.config.type,
    tools: [],
    toolConfigsApplied: {},
    // Outros campos conforme necessário para AgentFormData
  } as AgentFormData;
}

/**
 * Converte AgentFormData para SavedAgentConfiguration
 */
export function toSavedAgentConfiguration(formData: AgentFormData): NewSavedAgentConfiguration {
  // Implementação simplificada para compilação
  const now = new Date().toISOString();
  
  return {
    id: formData.id || '',
    agentName: formData.agentName,
    description: formData.description,
    createdAt: now,
    updatedAt: now,
    config: {
      type: formData.type,
      // Outros campos conforme tipo de agente
      agentModel: 'default-model',
      agentTemperature: 0.7,
      framework: 'default',
      agentGoal: '',
      agentTasks: [],
    },
    toolConfigsApplied: formData.toolConfigsApplied || {},
  } as NewSavedAgentConfiguration;
}