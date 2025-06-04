import { A2AConfig } from "./a2a-types";
import { ArtifactDefinition } from "@/components/features/agent-builder/artifact-management-tab";
import { KnowledgeSource, RagMemoryConfig } from "@/components/features/agent-builder/memory-knowledge-tab";

export interface ToolConfigData {
  [key: string]: any;
}

// Unifica com o tipo de tool-types.ts para evitar conflitos de tipagem em toda a aplicação
import type { AvailableTool as UIAvailableTool } from './tool-types';
export type AvailableTool = UIAvailableTool;

export type AgentFramework = "genkit" | "crewai" | "langchain" | "custom" | "none";

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
  tool_trajectory_avg_score?: number; // New optional property
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
// src/types/agent-types.ts
export type {
  AgentFramework,
  AgentType,
  WorkflowDetailedType,
  TerminationConditionType,
  StatePersistenceType,
  ArtifactStorageType,
  StateScope,
  ToolConfigField,
  // AvailableTool, // Removed from here
  ToolConfigData,
  CommunicationChannel,
  A2AConfig,
  ArtifactDefinition,
  ArtifactsConfig,
  InitialStateValue,
  StateValidationRule,
  StatePersistenceConfig,
  KnowledgeSource,
  RagMemoryConfig,
  AgentConfigBase,
  LLMAgentConfig,
  WorkflowAgentConfig,
  CustomAgentConfig,
  A2AAgentSpecialistConfig,
  AgentConfig,
  SavedAgentConfiguration
} from './agent-configs';

// Re-export AvailableTool from its new single source of truth
export type { AvailableTool } from './tool-types';
