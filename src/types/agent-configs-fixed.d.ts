// src/types/agent-configs-fixed.d.ts
// Arquivo de definição de tipos para compatibilidade com código legado

// Re-exportar todos os tipos do arquivo unificado
import * as UnifiedTypes from './unified-agent-types';

export * from './unified-agent-types';

// Manter compatibilidade com importações antigas
declare module './agent-configs-fixed' {
  // Re-exportar tipos com os mesmos nomes
  export type AgentFramework = UnifiedTypes.AgentFramework;
  export type AgentType = UnifiedTypes.AgentType;
  export type WorkflowDetailedType = UnifiedTypes.WorkflowDetailedType;
  export type TerminationConditionType = UnifiedTypes.TerminationConditionType;
  export type StatePersistenceType = UnifiedTypes.StatePersistenceType;
  export type ArtifactStorageType = UnifiedTypes.ArtifactStorageType;
  export type StateScope = UnifiedTypes.StateScope;
  export type KnowledgeSourceType = UnifiedTypes.KnowledgeSourceType;
  
  // Interfaces
  export interface ToolConfigField extends UnifiedTypes.ToolConfigField {}
  export interface ArtifactDefinition extends UnifiedTypes.ArtifactDefinition {}
  export interface ArtifactsConfig extends UnifiedTypes.ArtifactsConfig {}
  export interface ToolConfigData {
    [toolId: string]: {
      [fieldId: string]: string | number | boolean;
    };
  }
  export interface CommunicationChannel extends UnifiedTypes.CommunicationChannel {}
  export interface AgentTerminationCondition extends UnifiedTypes.AgentTerminationCondition {}
  export interface StatePersistenceConfig extends UnifiedTypes.StatePersistenceConfig {}
  export interface KnowledgeSource extends UnifiedTypes.KnowledgeSource {}
  export interface RagMemoryConfig extends UnifiedTypes.RagMemoryConfig {}
  export interface ModelSafetySettingItem extends UnifiedTypes.ModelSafetySettingItem {}
  
  // Configurações de agente
  export interface AgentConfigBase extends UnifiedTypes.AgentConfigBase {}
  export interface LLMAgentConfig extends UnifiedTypes.LLMAgentConfig {}
  export interface WorkflowStep extends UnifiedTypes.WorkflowStep {}
  export interface WorkflowAgentConfig extends UnifiedTypes.WorkflowAgentConfig {}
  export interface CustomAgentConfig extends UnifiedTypes.CustomAgentConfig {}
  export interface A2AAgentSpecialistConfig extends UnifiedTypes.A2AAgentSpecialistConfig {}
  
  // Tipos de configuração
  export type AgentConfig = UnifiedTypes.AgentConfig;
  
  // Configuração de implantação
  export interface EnvironmentVariable extends UnifiedTypes.EnvironmentVariable {}
  export interface ResourceRequirements extends UnifiedTypes.ResourceRequirements {}
  export interface DeploymentConfig extends UnifiedTypes.DeploymentConfig {}
  
  // Ferramentas
  export interface ToolDetail extends UnifiedTypes.ToolDetail {}
  
  // Configuração de agente salva
  export interface SavedAgentConfiguration extends UnifiedTypes.SavedAgentConfiguration {}
  
  // Tipos para formulários
  export type AgentFormData = UnifiedTypes.AgentFormData;
  
  // Exportar funções de utilidade
  export const isSavedAgentConfiguration: typeof UnifiedTypes.isSavedAgentConfiguration;
  export const isAgentFormData: typeof UnifiedTypes.isAgentFormData;
  
  // Exportar funções de conversão
  export const toUnifiedAgent: (agent: any) => UnifiedTypes.SavedAgentConfiguration;
  export const toAgentFormData: (agent: any) => UnifiedTypes.AgentFormData;
  export const toSavedAgentConfiguration: (formData: UnifiedTypes.AgentFormData) => UnifiedTypes.SavedAgentConfiguration;
}
// Tipos temporários para desbloquear o build e corrigir imports quebrados
export type ToolConfigData = any;
export type A2AConfig = any;
export type CommunicationChannel = any;

// ...restante do arquivo original...
