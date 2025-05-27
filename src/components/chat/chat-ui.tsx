import { useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { sendMessageToAI } from '@/lib/adk';

export function ChatUI() {
  const [messages, setMessages] = useState([
    { id: 1, isUser: false, content: 'Hello! How can I help you today?', timestamp: new Date(), isError: false }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Global loading for input disabling
  const [aiMessageId, setAiMessageId] = useState<number | null>(null); // ID of AI message being streamed
  const formRef = React.useRef<HTMLFormElement>(null); // Ref for the form

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage = {
      id: Date.now(),
      isUser: true,
      content: inputValue,
      timestamp: new Date(),
      isError: false
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInputValue = inputValue;
    setInputValue('');
    setIsLoading(true);

    const currentAiStreamMessageId = Date.now() + 1; // Unique ID for this specific AI stream
    setAiMessageId(currentAiStreamMessageId); // Set the ID of the message being streamed

    // Add a placeholder for the AI message before streaming starts
    setMessages(prev => [...prev, {
      id: currentAiStreamMessageId,
      isUser: false,
      content: '', // Start with empty content
      timestamp: new Date(),
      isError: false
    }]);

    try {
      await sendMessageToAI(currentInputValue, (chunk) => {
        setMessages(prev => prev.map(msg => 
          msg.id === currentAiStreamMessageId 
            ? { ...msg, content: msg.content + chunk } 
            : msg
        ));
      });
    } catch (error) {
      console.error("Error sending message to AI:", error);
      // Update the placeholder AI message to show an error
      setMessages(prev => prev.map(msg => 
        msg.id === currentAiStreamMessageId 
          ? { ...msg, content: "⚠️ Sorry, an error occurred. Please try again.", isError: true } 
          : msg
      ));
    } finally {
      setIsLoading(false);
      setAiMessageId(null); // Reset the streaming message ID
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      // Trigger form submission
      if (formRef.current) {
        // Check if submit button is part of the form, otherwise create and dispatch event
        const submitButton = formRef.current.querySelector('button[type="submit"]');
        if (submitButton instanceof HTMLElement) {
          submitButton.click(); // More reliable for triggering React's submit handling
        } else {
          // Fallback if specific submit button isn't found or needed
          formRef.current.requestSubmit();
        }
      }
    }
  };
  
  const handleClearInput = () => {
    setInputValue('');
  };

  return (
    <>
    <style>{`
      .auto-resize-textarea {
        min-height: 44px; /* Equivalent to py-3 + line-height */
        max-height: 200px; /* Limit max height */
        overflow-y: auto; /* Add scrollbar when max-height is reached */
      }
    `}</style>
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-gray-900">
        <h1 className="text-xl font-semibold">Chat with Gemini</h1>
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            isUser={message.isUser}
            content={message.content}
            timestamp={message.timestamp}
            isLoading={!message.isUser && message.id === aiMessageId && isLoading}
            isError={message.isError}
          />
        ))}
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-gray-800 bg-gray-900">
        <form ref={formRef} onSubmit={handleSubmit} className="flex items-start gap-3"> {/* Use items-start for alignment with multiline textarea, increased gap */}
          <div className="relative flex-1">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1} // Start with 1 row, auto-resize will adjust
              className="flex-1 bg-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full resize-none auto-resize-textarea" // resize-none + custom class
              placeholder="Type your message (Shift+Enter for new line)..."
              disabled={isLoading}
              style={{ lineHeight: '1.5rem' }} // Ensure consistent line height for auto-resize
            />
            {inputValue && !isLoading && (
              <button
                type="button"
                onClick={handleClearInput}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 p-1"
                aria-label="Clear input"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 self-end" // Use self-end to align with potentially taller textarea
            disabled={isLoading || !inputValue.trim()} // Also disable if input is empty/whitespace
          >
            Send
          </button>
        </form>
      </div>
    </div>
    </>
  );
}
