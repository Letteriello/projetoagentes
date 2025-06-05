/**
 * Client-safe API functions for interacting with AI endpoints
 * No Node.js dependencies should be imported in this file
 */

import { ChatInput, ChatOutput } from '@/types/chat-core'; // Updated path

/**
 * Send a message to the AI via the API route
 * This function is safe to use in client components
 */
export async function sendMessageToAI(input: ChatInput): Promise<ChatOutput> {
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message to AI:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Stream chat response from the AI via the streaming API route
 * This function is safe to use in client components
 */
export async function streamChatFromAI(input: ChatInput, onChunk: (chunk: string) => void): Promise<ChatOutput> {
  try {
    const response = await fetch('/api/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    // Process the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let completeResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      completeResponse += chunk;
      onChunk(chunk);
    }

    return { outputMessage: completeResponse };
  } catch (error) {
    console.error('Error streaming chat from AI:', error);
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
