// src/types/agent-types-unified.ts
import { SavedAgentConfiguration, Tool } from "./agent-configs-fixed";

// Tipo adaptado para o formulário de edição/criação de agentes
export interface AdaptedAgentFormData {
  id?: string;
  agentName: string;
  description?: string;
  type: "llm" | "scriptable" | "workflow";
  tools: string[];
  toolConfigsApplied?: Record<string, ToolConfigData>;
  createdAt?: string;
  updatedAt?: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  scriptContent?: string;
  scriptPath?: string;
}

// Representação adaptada de um agente salvo para a UI
export interface AdaptedSavedAgentConfiguration {
  id: string;
  agentName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  config: {
    tools?: Tool[];
    systemPrompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    scriptContent?: string;
    scriptPath?: string;
  };
  isTemplate?: boolean;
  isPublic?: boolean;
}

// Tipo para configuração de ferramenta
export interface ToolConfigData {
  selectedApiKeyId?: string;
  selectedMcpServerId?: string;
  config?: Record<string, any>;
}