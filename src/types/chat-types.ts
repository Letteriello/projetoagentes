/**
 * Shared type definitions for chat functionality
 * These types can be safely imported by both client and server components
 */

// Input type for chat requests
export interface ChatInput {
  userMessage: string;
  history?: Array<{role: string; content: any}>;  // Simplified message data type
  fileDataUri?: string;
  modelName?: string;
  systemPrompt?: string;
  temperature?: number;
  agentToolsDetails?: ChatToolDetail[];
}

// Output type for chat responses
export interface ChatOutput {
  outputMessage?: string;
  error?: string;
  toolRequests?: any[]; 
  toolResults?: any[];
}

// Form state for chat interactions
export interface ChatFormState {
  message: string;
  agentResponse?: string | null;
  errors?: {
    userInput?: string[];
    chatHistoryJson?: string[];
    fileDataUri?: string[];
    agentToolsDetailsJson?: string[];
  } | null;
}

// Tool details for agent configuration
export interface AgentToolDetail {
  id: string;
  label: string;
  iconName?: string;
  needsConfiguration?: boolean;
  genkitToolName?: string;
}

// Tool details as used in the chat input
export interface ChatToolDetail {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}
