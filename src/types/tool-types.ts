import { ReactNode } from "react";

/**
 * Configuração de um servidor MCP
 */
export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  description?: string;
  status?: 'connected' | 'disconnected' | 'error';
}

/**
 * Parâmetro de uma ferramenta
 */
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  defaultValue?: any;
}

/**
 * Campo de configuração para o formulário de configuração da ferramenta
 */
export interface ToolConfigField {
  id: string;
  label: string;
  type: 'text' | 'password' | 'select' | 'textarea' | 'checkbox' | 'number';
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  description?: string;
}

/**
 * Exemplo de uso da ferramenta
 */
export interface ToolExample {
  title: string;
  description: string;
  code: string;
}

/**
 * Interface expandida de uma ferramenta disponível
 */
import { LucideIcon } from "lucide-react";

export interface AvailableTool {
  id: string;
  name: string;
  description: string;
  icon?: LucideIcon;
  hasConfig?: boolean;
  configType?: string;
  requiresAuth?: boolean;

  // Campos específicos para MCP Tools
  isMCPTool?: boolean;
  mcpServerId?: string;
  mcpServerName?: string;
  mcpToolName?: string;
  parameters?: ToolParameter[];

  // Campos para configuração da UI
  configFields?: ToolConfigField[];

  // Campos para documentação
  documentation?: string;
  examples?: ToolExample[];

  // Campo de compatibilidade com implementação existente
  genkitToolName?: string;
}

