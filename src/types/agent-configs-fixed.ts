// src/types/agent-configs-fixed.ts
import type { ReactNode } from 'react';

// Tipos básicos
export type AgentFramework = "genkit" | "crewai" | "langchain" | "custom" | "none";
export type AgentType = "llm" | "workflow" | "custom" | "a2a";
export type WorkflowDetailedType = "sequential" | "parallel" | "loop" | "graph" | "stateMachine";
export type WorkflowType = WorkflowDetailedType;

// Interfaces principais
export interface ToolConfigField {
  id: string;
  label: string;
  type: "text" | "password" | "select" | "number" | "textarea";
  options?: Array<{ label: string; value: string | number }>;
  required?: boolean;
  defaultValue?: string | number | boolean;
  placeholder?: string;
  description?: string;
}

// AvailableTool interface removed from here. It's now sourced from ./tool-types.ts via agent-types.ts
// export interface AvailableTool {
//   id: string;
//   label: string;
//   name: string;
//   type: "genkit_native" | "openapi" | "mcp" | "custom_script";
//   icon?: ReactNode | string;
//   description: string;
//   hasConfig?: boolean;
//   genkitToolName?: string;
//   configFields?: ToolConfigField[];
//   category?: string;
//   requiresAuth: boolean;
//   serviceTypeRequired: string;
// }

export interface LLMAgentConfig {
  type: "llm";
  agentGoal: string;
  agentTasks: string[];
  agentModel: string;
  agentTemperature: number;
  agentPersonality?: string;
  agentRestrictions?: string[];
  modelSafetySettings?: Array<{ category: string; threshold: string }>;
}

export interface WorkflowAgentConfig {
  type: "workflow";
  workflowType: WorkflowDetailedType;
  subAgents?: string[];
  workflowConfig?: Record<string, any>;
}

export type AgentConfig = LLMAgentConfig | WorkflowAgentConfig | Record<string, any>;

export interface SavedAgentConfiguration {
  id: string;
  agentName: string;
  agentDescription: string;
  agentVersion: string;
  config: AgentConfig;
  tools: string[];
  toolConfigsApplied?: Record<string, any>;
  callbacks?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  isTemplate?: boolean;
  userId?: string;
  isFavorite?: boolean;
}

// Exportar todos os tipos
export * from './workflow-types';
