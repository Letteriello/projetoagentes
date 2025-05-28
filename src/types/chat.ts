export interface Message {
  id: string;
  isUser: boolean;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  isError?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt?: Date; // Added updatedAt field
  messages: Message[]; // Each conversation will have its own messages
  // lastMessageAt?: Date; // Optional: useful for sorting
  // summary?: string; // Optional: for a brief overview
}

export interface ChatMessageUI {
  id: string;
  text: string;
  sender: "user" | "agent" | "system";
  imageUrl?: string;
  fileName?: string;
  fileDataUri?: string;
  isStreaming?: boolean; // Added for streaming
}

// You might also want a type for the overall chat state if you use a reducer or context
export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  // other global chat settings
}
