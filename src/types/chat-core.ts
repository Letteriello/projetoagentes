// src/types/chat-core.ts
import { z } from 'zod';
import { ChatRunConfig as BaseChatRunConfig, SpeechConfig as BaseSpeechConfig } from './run-config-types';

// --- From chat-types.ts ---

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

// Original MessageData removed, properties merged into CoreChatMessage.

// Input type for chat requests
export interface ChatInput {
  userMessage: string;
  history?: CoreChatMessage[]; // Updated to use CoreChatMessage
  fileDataUri?: string;
  modelName?: string;
  systemPrompt?: string;
  temperature?: number;
  agentToolsDetails?: ToolDetail[]; // These are tools provided *to* the agent for a run
}

// Zod schema for ChatInput
export const ChatInputSchema = z.object({
  userMessage: z.string().min(1),
  // history schema needs to align with CoreChatMessage or a simplified version for input
  // For now, keeping original schema as CoreChatMessage is broad for input.
  // This might need a specific InputMessageData schema if CoreChatMessage is too complex for history.
  history: z.array(z.object({
    role: z.string(), // Simplification: roles can be user, assistant.
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

// Tool details for agent configuration (e.g. in agent builder UI)
export interface AgentToolDetail {
  id: string; // ID of the AvailableTool
  label: string; // Display label, often tool name
  iconName?: string; // Icon for UI
  needsConfiguration?: boolean; // If this tool requires setup (e.g. API key in its ToolConfigData)
  genkitToolName?: string; // Name used by Genkit flow
}

// ChatToolDetail is identical to ToolDetail, so it's removed.
// If specific chat-time properties for a tool are needed later, ToolDetail can be extended.

// --- From chat.ts ---

// Original Message interface removed, properties merged into CoreChatMessage.

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date; // Consider standardizing to string (ISO 8601)
  updatedAt?: Date; // Consider standardizing to string (ISO 8601)
  messages: CoreChatMessage[]; // Explicitly using CoreChatMessage[]
  agentId?: string;
  summary?: string;
}

// --- Consolidated Core Chat Message Type ---
export interface CoreChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool'; // Standardized from isUser, sender
  content: string; // Common field, 'text' from ChatMessageUI maps here
  name?: string; // For tool role, the name/ID of the tool that was called
  timestamp: Date; // Common, consider standardizing to string (ISO 8601) in future
  isLoading?: boolean; // From Message
  isError?: boolean; // Common in Message and ChatMessageUI
  retrievedContext?: string; // From MessageData
  imageUrl?: string; // From ChatMessageUI
  fileName?: string; // From ChatMessageUI
  fileDataUri?: string; // From ChatMessageUI
  isStreaming?: boolean; // From ChatMessageUI
  status?: 'pending' | 'completed' | 'error'; // From ChatMessageUI
  toolCall?: ToolCallData; // From ChatMessageUI (standardized tool call)
  toolResponse?: ToolResponseData; // From ChatMessageUI (standardized tool response)
  feedback?: 'liked' | 'disliked' | null; // From ChatMessageUI
  appliedUserChatConfig?: ChatRunConfig; // From ChatMessageUI
  appliedTestRunConfig?: any; // From ChatMessageUI, type TestRunConfig was local
}

export interface ToolCallData { // From chat.ts - represents a tool call made by the agent
  name: string; // Name of the tool called
  input?: Record<string, any>; // Input provided to the tool
}

// Defines structured error details that tools can return or be used by the system.
export interface ErrorDetails { // From chat.ts
  code?: string;
  message: string;
  details?: any;
}

export interface ToolResponseData { // From chat.ts - represents the response from a tool execution
  name: string; // Name of the tool that responded
  output?: any; // Output from the tool
  errorDetails?: ErrorDetails; // Structured error information if any
  status: 'success' | 'error' | 'pending'; // Status of the tool execution
}

// Original ChatMessageUI interface definition is now removed.
// The comment below correctly states its properties are merged into CoreChatMessage.
// Original ChatMessageUI removed, properties merged into CoreChatMessage.
// If UI-specific fields are needed later, a new ChatMessageUIDisplay interface
// could extend CoreChatMessage.

export interface ChatEvent { // From chat.ts
  id: string;
  timestamp: Date; // Consider standardizing to string (ISO 8601)
  eventType: 'TOOL_CALL' | 'TOOL_ERROR' | 'AGENT_CONTROL' | 'TOOL_CALL_PENDING' | 'CALLBACK_SIMULATION';
  eventTitle: string;
  eventDetails?: string;
  toolName?: string;
  callbackType?: 'beforeModel' | 'afterModel' | 'beforeTool' | 'afterTool';
  callbackAction?: string;
  originalData?: string;
  modifiedData?: string;
}

export type MessageListItem = // From chat.ts - updated to use CoreChatMessage
  | ({ type: 'message' } & CoreChatMessage)
  | ({ type: 'event' } & ChatEvent);

export interface ChatState { // From chat.ts
  conversations: Conversation[];
  activeConversationId: string | null;
}

export interface SpeechConfig extends BaseSpeechConfig {
  // Inherits voice and speed from BaseSpeechConfig
}

export interface ChatRunConfig extends BaseChatRunConfig {
  agentId?: string;
  modelName?: string; // This is also in ChatInput, consider if needed in both
  streamingEnabled: boolean;
  simulatedVoiceConfig?: SpeechConfig;
}

// Re-export from run-config-types, ensures types like BaseChatRunConfig are available
export * from './run-config-types';
