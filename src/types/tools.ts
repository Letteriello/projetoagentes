import { AgentType } from './agent-config';

export interface PageAvailableTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  configurationSchema?: Record<string, any>;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PageSavedAgentConfiguration {
  id: string;
  name: string;
  description: string;
  type: AgentType;
  tools: ToolReference[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  isPublic: boolean;
  tags: string[];
  version: string;
  icon?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface ToolReference {
  toolId: string;
  configuration: Record<string, any>;
}

export interface ToolConfiguration {
  id: string;
  name: string;
  description: string;
  schema: Record<string, any>;
  required?: string[];
  defaultValues?: Record<string, any>;
}
