// src/types/agent-types-unified.ts
import { ReactNode } from 'react';

// Tipos básicos
export type AgentFramework = "genkit" | "crewai" | "langchain" | "custom" | "none";
export type AgentType = "llm" | "workflow" | "custom" | "a2a";
export type WorkflowDetailedType = "sequential" | "parallel" | "loop" | "graph" | "stateMachine";
export type TerminationConditionType = "tool_success" | "state_change" | "max_iterations" | "none";
export type StatePersistenceType = "session" | "memory" | "database";
export type ArtifactStorageType = "local" | "cloud" | "memory" | "filesystem";
export type StateScope = 'GLOBAL' | 'AGENT' | 'TEMPORARY';

// Interfaces principais
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
  type: string;
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
  | "other";

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

// Base para todas as configurações de agente
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

// Configuração para agentes LLM
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

// Configuração para agentes de workflow
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

// Configuração para agentes personalizados
export interface CustomAgentConfig extends AgentConfigBase {
  type: "custom";
  scriptPath?: string;
  customConfig?: Record<string, any>;
}

// Configuração para agentes A2A
// ... (adicionar interfaces relacionadas a A2A conforme necessário)

// Tipo unificado para todas as configurações de agente
export type AgentConfig = LLMAgentConfig | WorkflowAgentConfig | CustomAgentConfig;

// Tipos para implantação
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

// Interface para ferramentas
export interface ToolDetail {
  id: string;
  name: string;
  description: string;
  icon?: string;
  genkitToolName?: string;
}

// Interface principal para configuração de agente salva
export interface SavedAgentConfiguration {
  id: string;
  agentName: string;
  agentDescription: string;
  agentVersion: string;
  config: AgentConfig;
  tools: string[];
  toolsDetails?: ToolDetail[];
  toolConfigsApplied: Record<string, any>;
  a2aConfig?: Record<string, any>;
  communicationChannels?: CommunicationChannel[];
  deploymentConfig?: DeploymentConfig;
  debugModeEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  userId: string;
  isFavorite?: boolean;
}

// Tipo para formulário de criação/edição de agente
export type AgentFormData = Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'> & {
  id?: string;
};

// Exportar todos os tipos
export * from './workflow-types';

// Exportar tipos de ferramentas
export * from './tool-types';
