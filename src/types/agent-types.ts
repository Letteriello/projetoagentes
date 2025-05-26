import { A2AConfig } from "./a2a-types";
import { ArtifactDefinition } from "@/components/agent-builder/artifact-management-tab";
import { KnowledgeSource, RagMemoryConfig } from "@/components/agent-builder/memory-knowledge-tab";

export interface ToolConfigData {
  [key: string]: any;
}

export interface AvailableTool {
  id: string;
  name: string;
  description: string;
  icon?: string;
  hasConfig?: boolean;
  configType?: string;
  requiresAuth?: boolean;
}

export interface AgentConfig {
  agentType: 'llm' | 'task' | 'workflow' | 'sequential' | 'parallel' | 'loop' | 'custom' | 'a2a';
  agentName: string;
  agentDescription: string;
  agentVersion: string;
  agentTools: string[];
  
  // Campos opcionais dependendo do tipo de agente
  agentGoal?: string;
  agentTasks?: string;
  agentPersonality?: string;
  agentRestrictions?: string;
  agentModel?: string;
  agentTemperature?: number;
  
  // Campos para fluxos de trabalho
  detailedWorkflowType?: 'sequential' | 'parallel' | 'loop';
  workflowDescription?: string;
  loopMaxIterations?: number;
  loopTerminationConditionType?: 'tool' | 'state';
  loopExitToolName?: string;
  loopExitStateKey?: string;
  loopExitStateValue?: string;
  
  // Campo para lógica customizada
  customLogicDescription?: string;
  
  // Campos para gerenciamento de estado
  enableStatePersistence?: boolean;
  statePersistenceType?: 'session' | 'memory' | 'database';
  initialStateValues?: Array<{
    key: string;
    value: string;
    scope: 'global' | 'agent' | 'temporary';
    description: string;
  }>;
  enableStateSharing?: boolean;
  stateSharingStrategy?: 'all' | 'explicit' | 'none';
  
  // Campos para RAG e conhecimento
  enableRAG?: boolean;
  ragMemoryConfig?: RagMemoryConfig;
  
  // Campos para artefatos
  enableArtifacts?: boolean;
  artifactStorageType?: 'memory' | 'filesystem' | 'cloud';
  artifacts?: ArtifactDefinition[];
  cloudStorageBucket?: string;
  localStoragePath?: string;
  
  // Campos para multi-agente
  isRootAgent?: boolean;
  subAgents?: string[];
  globalInstruction?: string;
  
  // Campos para A2A
  a2aConfig?: A2AConfig;
}

export interface SavedAgentConfiguration extends AgentConfig {
  id: string;
  templateId: string;
  systemPromptGenerated?: string;
  toolsDetails?: AvailableTool[];
  toolConfigsApplied?: Record<string, ToolConfigData>;
}

// Tipos específicos para diferentes tipos de agente
export interface LLMAgentConfig extends AgentConfig {
  agentType: 'llm';
  agentGoal: string;
  agentTasks: string;
  agentPersonality: string;
  agentRestrictions?: string;
  agentModel: string;
  agentTemperature: number;
}

export interface TaskAgentConfig extends AgentConfig {
  agentType: 'task';
  agentGoal: string;
  agentTasks: string;
  agentPersonality?: string;
  agentRestrictions?: string;
  agentModel?: string;
  agentTemperature?: number;
}

export interface WorkflowAgentConfig extends AgentConfig {
  agentType: 'workflow' | 'sequential' | 'parallel' | 'loop';
  detailedWorkflowType?: 'sequential' | 'parallel' | 'loop';
  workflowDescription?: string;
  loopMaxIterations?: number;
  loopTerminationConditionType?: 'tool' | 'state';
  loopExitToolName?: string;
  loopExitStateKey?: string;
  loopExitStateValue?: string;
  // Opcional: pode ter campos de LLM para metadescriçao/capacidades
  agentGoal?: string;
  agentTasks?: string;
  agentPersonality?: string;
  agentRestrictions?: string;
  agentModel?: string;
  agentTemperature?: number;
}

export interface CustomAgentConfig extends AgentConfig {
  agentType: 'custom';
  customLogicDescription: string;
  // Opcional: pode ter campos de LLM
  agentGoal?: string;
  agentTasks?: string;
  agentPersonality?: string;
  agentRestrictions?: string;
  agentModel?: string;
  agentTemperature?: number;
}

export interface A2AAgentConfig extends AgentConfig {
  agentType: 'a2a';
  a2aConfig: A2AConfig;
  // Opcional: pode ter campos de LLM
  agentGoal?: string;
  agentTasks?: string;
  agentPersonality?: string;
  agentRestrictions?: string;
  agentModel?: string;
  agentTemperature?: number;
}