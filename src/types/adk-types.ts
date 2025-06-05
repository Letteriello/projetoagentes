/**
 * Types for Agent Development Kit (ADK) integration
 * These are client-safe type definitions (no Node.js dependencies)
 */

// ADK Agent Configuration - client-safe type definition
export interface ADKAgentConfig {
  agentId?: string;
  displayName: string;
  description?: string;
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  tools?: ADKTool[];
}

// ADK Tool - client-safe type definition
export interface ADKTool {
  name: string;
  description: string;
  parameters?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}
