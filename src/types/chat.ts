export interface Message {
  id: string;
  isUser: boolean;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
  sender?: 'user' | 'system' | 'assistant' | string; // Adiciona a propriedade sender usada no código
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt?: Date; // Added updatedAt field
  messages: Message[]; // Each conversation will have its own messages
  agentId?: string; // Adiciona a propriedade agentId usada no Firestore
  // lastMessageAt?: Date; // Optional: useful for sorting
  // summary?: string; // Optional: for a brief overview
}

export interface ToolCallData {
  name: string;
  input?: Record<string, any>; // Or a more specific type
}

// Defines structured error details that tools can return or be used by the system.
export interface ErrorDetails {
  code?: string;
  message: string;
  details?: any;
}

export interface ToolResponseData {
  name: string;
  output?: any; // Output might not exist if there's an error
  errorDetails?: ErrorDetails; // Structured error information
  status: 'success' | 'error' | 'pending'; // Status should always be set
}

export interface ChatMessageUI {
  id: string;
  text: string;
  sender: "user" | "agent" | "system";
  imageUrl?: string;
  fileName?: string;
  fileDataUri?: string;
  isStreaming?: boolean; // Added for streaming
  isError?: boolean; // Added/Ensured
  status?: 'pending' | 'completed' | 'error'; // Added status for UI
  toolUsed?: { // This field might be deprecated in favor of toolCall/toolResponse
    name: string;
    status?: 'pending' | 'success' | 'error';
    input?: Record<string, any>; // Or a more specific type if available
    output?: any; // Or a more specific type if available
  };
  toolCall?: ToolCallData;
  toolResponse?: ToolResponseData; // This will now use the updated ToolResponseData
  feedback?: 'liked' | 'disliked' | null; // Added for message feedback
}

// You might also want a type for the overall chat state if you use a reducer or context
export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  // other global chat settings
}
