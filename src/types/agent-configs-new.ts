// Arquivo limpo com todas as definições de tipos para agentes
import { ReactNode } from 'react';

// Tipos básicos
export type AgentFramework = "genkit" | "crewai" | "langchain" | "custom" | "none";
export type AgentType = "llm" | "workflow" | "custom" | "a2a";
export type WorkflowDetailedType = "sequential" | "parallel" | "loop" | "graph" | "stateMachine";
export type TerminationConditionType = "tool_success" | "state_change" | "max_iterations" | "none";
export type StatePersistenceType = "session" | "memory" | "database";
export type ArtifactStorageType = "local" | "cloud" | "memory" | "filesystem";
export type StateScope = 'GLOBAL' | 'AGENT' | 'TEMPORARY';

// Artifact Interfaces
export interface ArtifactDefinition {
  id: string;
  name: string;
  description?: string;
  mimeType?: string;
  required?: boolean; // default to false
  accessPermissions?: 'read' | 'write' | 'read_write'; // default to 'read_write'
  versioningEnabled?: boolean; // default to false
  storagePath?: string; // URI/path to the uploaded file
  fileName?: string; // Original name of the uploaded file
}

export interface ArtifactsConfig {
  enabled: boolean;
  storageType: ArtifactStorageType;
  cloudStorageBucket?: string;
  localStoragePath?: string;
  definitions?: ArtifactDefinition[];
}

// Interfaces
export interface ToolConfigField {
  id: string;
  label: string;
  type: "text" | "password" | "select" | "number" | "boolean";
  required: boolean;
  options?: string[];
  defaultValue?: string | number | boolean;
  description?: string;
  placeholder?: string;
}

export interface AvailableTool {
  id: string;
  label: string;
  name: string;
  type: "genkit_native" | "openapi" | "mcp" | "custom_script";
  icon?: ReactNode | string;
  description: string;
  hasConfig?: boolean;
  genkitToolName?: string;
  configFields?: ToolConfigField[];
  category?: string;
  requiresAuth: boolean;
  serviceTypeRequired: string;
}

export interface ToolConfigData {
  [toolId: string]: {
    [fieldId: string]: string | number | boolean;
  };
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

export interface StatePersistenceConfig {
  type: StatePersistenceType;
  config?: Record<string, any>;
}

export type KnowledgeSourceType =
  | "document"
  | "website"
  | "api"
  | "database"
  | "custom";

export interface KnowledgeSource {
  id: string;
  name: string;
  type: KnowledgeSourceType;
  description?: string;
  location: string; // URI, URL, ou caminho de arquivo
  credentials?: string; // Opcional, para fontes que requerem autenticação
  format?: string; // Formato do conteúdo (PDF, HTML, JSON, etc.)
  updateFrequency?: "static" | "daily" | "weekly" | "monthly" | "custom"; // Frequência de atualização
  enabled: boolean;
}

export interface RagMemoryConfig {
  enabled: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
  embeddingModel?: string;
  similarityThreshold?: number;
  maxRetrievedDocuments?: number;
}

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
  systemPromptGenerated?: string; // Added field for auto-generated system prompt
  sandboxedCodeExecution?: boolean;
}

export interface ModelSafetySettingItem {
  category: string;
  threshold: string;
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
}

export interface WorkflowAgentConfig extends AgentConfigBase {
  type: "workflow";
  workflowType: WorkflowDetailedType;
  subAgents?: string[];
  workflowConfig?: Record<string, any>;
  workflowSteps?: WorkflowStep[];
}

export interface WorkflowStep {
  agentId: string;
  inputMapping: Record<string, any>;
  outputKey: string;
  // Optional: Add a name and description for better readability in UI
  name?: string;
  description?: string;
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
}

export type AgentConfig =
  | LLMAgentConfig
  | WorkflowAgentConfig
  | CustomAgentConfig
  | A2AAgentSpecialistConfig;

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
}

export interface SavedAgentConfiguration {
  id: string;
  agentName: string;
  agentDescription?: string;
  agentVersion?: string;
  config: AgentConfig;
  tools: string[];
  toolsDetails?: Array<{
    id: string;
    name: string;
    description: string;
    icon?: string;
    genkitToolName?: string;
  }>;
  toolConfigsApplied: ToolConfigData;
  a2aConfig?: Record<string, any>;
  communicationChannels?: CommunicationChannel[];
  deploymentConfig?: DeploymentConfig;
  /** Enables verbose debug information in the chat for this agent. */
  debugModeEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
  isTemplate: boolean;
  userId: string;
}