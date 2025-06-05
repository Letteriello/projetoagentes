// Tipos unificados para formulários de agentes
import type { AgentType, KnowledgeSource, ToolConfigData } from './agent-configs-fixed';

export interface AgentFormData {
  id?: string;
  agentName: string;
  description?: string;
  type: AgentType;
  model?: string;
  temperature?: number;
  goal?: string;
  tasks?: string[];
  tools?: string[];
  knowledgeSources?: KnowledgeSource[];
  toolConfigsApplied?: Record<string, ToolConfigData>;
  icon?: string;
  color?: string;
  tags?: string[];
  category?: string;
}