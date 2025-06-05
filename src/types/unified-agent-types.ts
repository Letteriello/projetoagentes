// src/types/unified-agent-types.ts
import {
  A2AConfig as ActualA2AConfig,
  CommunicationChannel as A2ACommunicationChannel // This is the detailed one from a2a-types.ts
} from './a2a-types';

// =============================================
// Tipos Básicos
// =============================================

export type AgentFramework = "genkit" | "crewai" | "langchain" | "custom" | "none";
export type AgentType = "llm" | "workflow" | "custom" | "a2a";
export type WorkflowDetailedType = "sequential" | "parallel" | "loop" | "graph" | "stateMachine";
export type TerminationConditionType = "tool_success" | "state_change" | "max_iterations" | "none";
export type StatePersistenceType = "session" | "memory" | "database";
export type ArtifactStorageType = "local" | "cloud" | "memory" | "filesystem";
export type StateScope = 'GLOBAL' | 'AGENT' | 'TEMPORARY';

// =============================================
// Interfaces de Configuração
// =============================================

export interface ToolConfigField {
  id: string;
  label: string;
  type: "text" | "password" | "select" | "number" | "boolean" | "textarea";
  required?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  defaultValue?: string | number | boolean;
  placeholder?: string;
  description?: string;
}

export interface ToolConfigData {
  [toolId: string]: {
    [fieldId: string]: string | number | boolean;
  };
}

export interface ArtifactDefinition {
  id: string;
  name: string;
  description?: string;
  mimeType?: string;
  required?: boolean;
  accessPermissions?: 'read' | 'write' | 'read_write';
  versioningEnabled?: boolean;
  storagePath?: string;
  fileName?: string;
}

export interface ArtifactsConfig {
  enabled: boolean;
  storageType: ArtifactStorageType;
  cloudStorageBucket?: string;
  localStoragePath?: string;
  definitions?: ArtifactDefinition[];
}

export interface CommunicationChannel {
// This is the original generic channel. Keep it if it's used by non-A2A parts.
// If it's exclusively for A2A and the detailed one is preferred, this might be removable
// or be the one that gets the detailed properties.
// For now, assume a2a-types.ts.CommunicationChannel is the specific one needed by a2a-config.tsx.
// The `CommunicationChannel` named type in this file will remain generic for now.
export interface CommunicationChannel {
  type: string; // e.g., 'webhook', 'message_queue' - generic
  config: Record<string, any>;
}

export interface AgentTerminationCondition {
  type: TerminationConditionType;
  value?: number | string | boolean;
  description?: string;
}

export type KnowledgeSourceType =
  | "document"
  | "database"
  | "api"
  | "website"
  | "knowledge_base"
  | "custom";

export interface KnowledgeSource {
  id: string;
  name: string;
  type: KnowledgeSourceType;
  description?: string;
  location: string;
  credentials?: string;
  format?: string;
  updateFrequency?: "static" | "daily" | "weekly" | "monthly" | "custom";
  enabled: boolean;
}

export interface StatePersistenceConfig {
  type: StatePersistenceType;
  config?: Record<string, any>;
}

export interface RagMemoryConfig {
  enabled: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
  embeddingModel?: string;
  similarityThreshold?: number;
  maxRetrievedDocuments?: number;
  maxDocuments?: number;
  maxDocumentSize?: number;
  vectorStoreType?: string;
}

export interface ModelSafetySettingItem {
  category: string;
  threshold: string;
}

// =============================================
// Configurações de Agente
// =============================================

export interface AgentConfigBase {
  type: AgentType;
  framework: AgentFramework;
  agentGoal: string;
  agentTasks: string[];
  terminationConditions?: AgentTerminationCondition[];
  statePersistence?: StatePersistenceConfig;
  knowledgeSources?: KnowledgeSource[];
  ragMemoryConfig?: RagMemoryConfig;
  artifacts?: ArtifactsConfig;
  systemPromptGenerated?: string;
  manualSystemPromptOverride?: string;
  sandboxedCodeExecution?: boolean;
  systemPromptHistory?: Array<{ prompt: string; timestamp: string }>;
}

export interface LLMAgentConfig extends AgentConfigBase {
  type: "llm";
  agentModel: string;
  agentTemperature: number;
  agentPersonality?: string;
  agentRestrictions?: string[];
  modelSafetySettings?: ModelSafetySettingItem[];
  maxHistoryTokens?: number;
  maxTokensPerResponse?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
  forceToolUsage?: boolean;
}

export interface WorkflowStep {
  agentId: string;
  inputMapping: Record<string, any>;
  outputKey: string;
  name?: string;
  description?: string;
}

export interface WorkflowAgentConfig extends AgentConfigBase {
  type: "workflow";
  workflowType: WorkflowDetailedType;
  subAgents?: string[];
  workflowConfig?: Record<string, any>;
  workflowSteps?: WorkflowStep[];
  loopExitToolName?: string;
  loopExitStateKey?: string;
  loopExitStateValue?: string;
}

export interface CustomAgentConfig extends AgentConfigBase {
  type: "custom";
  scriptPath?: string;
  customConfig?: Record<string, any>;
}

export interface A2AAgentSpecialistConfig extends AgentConfigBase {
  type: "a2a";
  specialistRole: string;
  specialistSkills: string[];
  targetAudience?: string;
  responseFormat?: string;
  specialistExamples?: string[];
  a2a?: ActualA2AConfig; // Embed the detailed A2A configuration
}

export type AgentConfig =
  | LLMAgentConfig
  | WorkflowAgentConfig
  | CustomAgentConfig
  | A2AAgentSpecialistConfig
  // Ensure that if type is 'a2a', it can have the a2a field from A2AAgentSpecialistConfig
  | ({ type: "a2a" } & Partial<A2AAgentSpecialistConfig> & { a2a?: ActualA2AConfig }) // More explicit for type inference
  | (Record<string, any> & { type: string });

// =============================================
// Configuração de Implantação
// =============================================

export interface EnvironmentVariable {
  key: string;
  value: string;
  isSecret?: boolean;
}

export interface ResourceRequirements {
  cpu?: string;
  memory?: string;
  gpu?: string;
}

export interface DeploymentConfig {
  environment: "development" | "staging" | "production";
  envVars?: EnvironmentVariable[];
  resources?: ResourceRequirements;
  scaling?: {
    minInstances?: number;
    maxInstances?: number;
    targetConcurrency?: number;
  };
  minInstances?: number;
  maxInstances?: number;
  targetConcurrency?: number;
}

// =============================================
// Ferramentas
// =============================================

export interface ToolDetail {
  id: string;
  name: string;
  description: string;
  icon?: string;
  genkitToolName?: string;
}

// =============================================
// Configuração de Agente Salva
// =============================================

export interface SavedAgentConfiguration {
  id: string;
  agentName: string;
  agentDescription: string;
  agentVersion: string;
  config: AgentConfig; // This config will hold the 'a2a' field if the agent type is A2AAgentSpecialistConfig
  tools: string[];
  toolsDetails?: ToolDetail[];
  toolConfigsApplied: ToolConfigData;
  // The following two lines might be redundant if config.a2a is the source of truth.
  // For now, keeping them to see how they are used, but suspect they might need removal or alignment.
  a2aConfig?: ActualA2AConfig;
  communicationChannels?: A2ACommunicationChannel[];
  deploymentConfig?: DeploymentConfig;
  debugModeEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  userId: string;
  isFavorite?: boolean;
}

// =============================================
// Tipos para Formulários
// =============================================

export type AgentFormData = Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & {
  id?: string;
};

// =============================================
// Exportar todos os tipos
// =============================================

export * from './workflow-types';
export * from './tool-types';

// Tipos utilitários para conversão
export type AnyAgent = 
  | SavedAgentConfiguration 
  | AgentFormData 
  | { [key: string]: any };

/**
 * Verifica se um objeto é um SavedAgentConfiguration
 */
export function isSavedAgentConfiguration(agent: any): agent is SavedAgentConfiguration {
  return agent && 
         typeof agent === 'object' && 
         'id' in agent && 
         'config' in agent && 
         'tools' in agent;
}

/**
 * Verifica se um objeto é um AgentFormData
 */
export function isAgentFormData(agent: any): agent is AgentFormData {
  return agent && 
         typeof agent === 'object' && 
         'config' in agent && 
         'tools' in agent;
}
