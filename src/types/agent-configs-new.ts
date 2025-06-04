// Arquivo limpo com todas as definições de tipos para agentes
import { ReactNode } from 'react';

// Tipos básicos
export type AgentFramework = "genkit" | "crewai" | "langchain" | "custom" | "none";
export type AgentType = "llm" | "workflow" | "custom" | "a2a";

// Detailed Model Information
export interface LLMModelDetails {
  id: string;
  name: string;
  provider?: string;
  capabilities?: {
    streaming?: boolean;
    tools?: boolean;
    // other capabilities like vision, etc.
  };
  estimatedCost?: {
    input?: number; // e.g., cost per 1K tokens
    output?: number; // e.g., cost per 1K tokens
    unit?: string; // e.g., "USD_PER_1K_TOKENS"
  };
  maxOutputTokens?: number; // Default max tokens for this model
  customProperties?: Record<string, any>; // For model-specific simulation flags or other properties
}

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
  manualSystemPromptOverride?: string; // Manually overridden system prompt
  sandboxedCodeExecution?: boolean;
  systemPromptHistory?: Array<{ prompt: string; timestamp: string }>; // History of system prompts
}

export interface ModelSafetySettingItem {
  category: string;
  threshold: string;
}

export interface LLMAgentConfig extends AgentConfigBase {
  type: "llm";
  agentModel: string; // This will be an ID referencing an LLMModelDetails entry
  agentTemperature: number;
  agentPersonality?: string;
  agentRestrictions?: string[];
  modelSafetySettings?: ModelSafetySettingItem[];
  maxHistoryTokens?: number;
  // New fields for LLMAgentConfig
  maxOutputTokens?: number; // Overrides model's default maxOutputTokens and replaces maxTokensPerResponse
  topP?: number;
  topK?: number;
  forceToolUsage?: boolean;
}

export interface WorkflowAgentConfig extends AgentConfigBase {
  type: "workflow";
  workflowType: WorkflowDetailedType;
  subAgents?: string[];
  workflowConfig?: Record<string, any>; // General config placeholder
  workflowSteps?: WorkflowStep[];

  // Loop-specific termination conditions (complementary to general terminationConditions)
  // These are applied specifically when workflowType is 'loop'.
  loopExitToolName?: string;      // Name of a tool whose successful execution (or specific output) terminates the loop.
  loopExitStateKey?: string;      // A key in the loop's accumulated state.
  loopExitStateValue?: string;    // The value to check for at loopExitStateKey. Loop terminates if state[key] === value.
                                  // Consider if this should be `any` or a more specific union type if state values are diverse.
                                  // For now, string is simpler for direct comparison.
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