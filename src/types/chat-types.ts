/**
 * Shared type definitions for chat functionality
 * These types can be safely imported by both client and server components
 */

import { z } from 'zod';

// Tool details as used in the chat input
export interface ToolDetail {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

// Zod schema for ToolDetail
export const ToolDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  enabled: z.boolean()
});

// Message data type for chat history
export interface MessageData {
  role: string;
  content: string;
  timestamp?: Date;
  retrievedContext?: string; // Added for RAG context display
}

// Input type for chat requests
export interface ChatInput {
  userMessage: string;
  history?: MessageData[];
  fileDataUri?: string;
  modelName?: string;
  systemPrompt?: string;
  temperature?: number;
  agentToolsDetails?: ToolDetail[];
}

// Zod schema for ChatInput
export const ChatInputSchema = z.object({
  userMessage: z.string().min(1),
  history: z.array(z.object({
    role: z.string(),
    content: z.string(),
    timestamp: z.date().optional()
  })).optional(),
  fileDataUri: z.string().optional(),
  modelName: z.string().optional(),
  systemPrompt: z.string().optional(),
  temperature: z.number().optional(),
  agentToolsDetails: z.array(ToolDetailSchema).optional()
});

// Output type for chat responses
export interface ChatOutput {
  outputMessage?: string;
  error?: string;
  toolRequests?: Array<{toolId: string, params: Record<string, unknown>}>;
  toolResults?: Array<{toolId: string, result: unknown}>;
}

// Zod schema for ChatOutput
export const ChatOutputSchema = z.object({
  outputMessage: z.string().optional(),
  error: z.string().optional(),
  toolRequests: z.array(z.object({
    toolId: z.string(),
    params: z.record(z.unknown())
  })).optional(),
  toolResults: z.array(z.object({
    toolId: z.string(),
    result: z.unknown()
  })).optional()
});

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

// Extends ToolDetail
export interface ChatToolDetail extends ToolDetail {
  // Herda todos os campos de ToolDetail
}

export * from './run-config-types';
