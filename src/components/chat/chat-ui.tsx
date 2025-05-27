import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ConversationSidebar } from './ConversationSidebar';
import * as cs from '@/lib/conversationStorage';
import { Conversation, Message } from '@/types/chat';
import { sendMessageToAI } from '@/lib/adk'; 
import { Modal } from '@/components/ui/Modal'; // Import the Modal component

// Basic SVG Icons
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
  </svg>
);


export function ChatUI() {
  // New state variables
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  
  // Existing state variables that are still relevant
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false); 
  const formRef = React.useRef<HTMLFormElement>(null);

  // Initial load effect
  useEffect(() => {
    const loadedConversations = cs.getAllConversations();
    if (loadedConversations.length > 0) {
      setConversations(loadedConversations);
      setActiveConversationId(loadedConversations[0].id);
      // Messages will be set by the next effect
    } else {
      const newConv = cs.createNewConversation("First Chat");
      setConversations([newConv]);
      setActiveConversationId(newConv.id);
      setCurrentMessages([]); // New chat starts with no messages
    }
  }, []);

  // Effect to update currentMessages when activeConversationId or conversations change
  useEffect(() => {
    if (activeConversationId) {
      const activeConv = conversations.find(conv => conv.id === activeConversationId);
      setCurrentMessages(activeConv ? activeConv.messages : []);
    } else {
      setCurrentMessages([]);
    }
  }, [activeConversationId, conversations]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const handleNewConversation = () => {
    const newConv = cs.createNewConversation(`Chat ${conversations.length + 1}`);
    setConversations(prev => [newConv, ...prev]); // Add to the beginning for newest first
    setActiveConversationId(newConv.id);
    // currentMessages will be updated by the effect
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    const updatedConv = cs.renameConversationInStorage(id, newTitle);
    if (updatedConv) {
      setConversations(prev => prev.map(c => c.id === id ? updatedConv : c));
    }
    console.log("Rename conv:", id, newTitle); // Placeholder
  };

  const handleDeleteConversation = (id: string) => {
    const updatedConversations = cs.deleteConversationFromStorage(id);
    setConversations(updatedConversations);
    if (activeConversationId === id) {
      setActiveConversationId(updatedConversations.length > 0 ? updatedConversations[0].id : null);
    }
    console.log("Delete conv:", id); // Placeholder
  };

  const promptDeleteConversation = (conversation: Conversation) => {
    setConversationToDelete(conversation);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      handleDeleteConversation(conversationToDelete.id); // This already updates state and storage
      setConversationToDelete(null);
      setShowDeleteModal(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeConversationId) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      isUser: true,
      content: inputValue,
      timestamp: new Date(),
      isError: false,
    };

    // Update UI immediately
    setCurrentMessages(prev => [...prev, userMessage]);
    // Persist and update conversations state
    let updatedConv = cs.addMessageToConversation(activeConversationId, userMessage);
    if (updatedConv) {
      setConversations(prevConvs => prevConvs.map(c => c.id === activeConversationId ? updatedConv! : c));
    }
    
    const currentInputValue = inputValue;
    setInputValue('');
    setIsLoading(true);

    // AI Response part
    const aiPlaceholderMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      isUser: false,
      content: '',
      timestamp: new Date(),
      isError: false,
    };
    setCurrentMessages(prev => [...prev, aiPlaceholderMessage]);
    updatedConv = cs.addMessageToConversation(activeConversationId, aiPlaceholderMessage);
    if (updatedConv) {
        setConversations(prevConvs => prevConvs.map(c => c.id === activeConversationId ? updatedConv! : c));
    }


    try {
      await sendMessageToAI(currentInputValue, (chunk) => {
        setCurrentMessages(prevMsgs => {
          const newMsgs = [...prevMsgs];
          const lastMsgIndex = newMsgs.length - 1;
          if (lastMsgIndex >= 0 && !newMsgs[lastMsgIndex].isUser) {
            newMsgs[lastMsgIndex].content += chunk;
            newMsgs[lastMsgIndex].timestamp = new Date(); // Update timestamp during streaming
          }
          return newMsgs;
        });
        // Persist streaming chunk to storage
        const convAfterStreamChunk = cs.updateLastMessageInConversation(activeConversationId, chunk);
         if (convAfterStreamChunk) {
            setConversations(prevConvs => prevConvs.map(c => c.id === activeConversationId ? convAfterStreamChunk : c));
        }
      });
    } catch (error) {
      console.error("Error sending message to AI:", error);
      const errorContent = "⚠️ Sorry, an error occurred. Please try again.";
      setCurrentMessages(prevMsgs => {
        const newMsgs = [...prevMsgs];
        const lastMsgIndex = newMsgs.length - 1;
        if (lastMsgIndex >= 0 && !newMsgs[lastMsgIndex].isUser) {
          newMsgs[lastMsgIndex].content = errorContent;
          newMsgs[lastMsgIndex].isError = true;
          newMsgs[lastMsgIndex].timestamp = new Date();
        }
        return newMsgs;
      });
       const convAfterError = cs.updateLastMessageInConversation(activeConversationId, errorContent, true);
        if (convAfterError) {
            setConversations(prevConvs => prevConvs.map(c => c.id === activeConversationId ? convAfterError : c));
        }
    } finally {
      setIsLoading(false);
      // Attempt automatic titling
      if (activeConversationId) {
        const activeConv = conversations.find(c => c.id === activeConversationId);
        // Ensure there are at least two messages (user query + AI response)
        // and the title is one of the default patterns.
        if (activeConv && 
            (activeConv.title === "First Chat" || activeConv.title.startsWith("Chat ")) && 
            currentMessages.length >= 2) { // Check based on currentMessages for the active chat
          
          let potentialTitleSource = "";
          // Prefer user's first message in the current conversation for the title
          const firstUserMessageInCurrentChat = currentMessages.find(m => m.isUser);
          // Fallback to the first successful AI message in the current conversation
          const firstAiMessageInCurrentChat = currentMessages.find(m => !m.isUser && !m.isError);

          if (firstUserMessageInCurrentChat && firstUserMessageInCurrentChat.content.trim()) {
            potentialTitleSource = firstUserMessageInCurrentChat.content;
          } else if (firstAiMessageInCurrentChat && firstAiMessageInCurrentChat.content.trim()) {
            potentialTitleSource = firstAiMessageInCurrentChat.content;
          }
          
          if (potentialTitleSource) {
            // Simple Markdown removal for title generation
            const plainTextTitle = potentialTitleSource
              .replace(/```[\s\S]*?```/g, '') // Remove code blocks
              .replace(/[`*#[\]()>!-]/g, '')   // Remove common markdown characters (simple approach)
              .replace(/(\r\n|\n|\r)/gm, " ")    // Replace newlines with spaces
              .replace(/\s+/g, ' ')           // Normalize multiple spaces to one
              .trim();

            if (plainTextTitle) {
                const generatedTitle = plainTextTitle.split(/\s+/).slice(0, 7).join(" ").substring(0, 50);
                // Check if a meaningful title was generated and it's different from the current one
                if (generatedTitle.trim() && generatedTitle.trim() !== activeConv.title) { 
                    handleRenameConversation(activeConversationId, generatedTitle.trim());
                }
            }
          }
        }
      }
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

  // Test Markdown Strings
  const testMarkdownBasic = `
# Heading 1
## Heading 2
This is **bold text**, *italic text*, and \`inline code\`.
- Unordered List Item 1
- Unordered List Item 2
1. Ordered List Item 1
2. Ordered List Item 2
[A link to Google](https://www.google.com)
> A blockquote
`;
  const testMarkdownJSCode = `
\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
greet('World');
\`\`\`
`;
  const testMarkdownPythonCode = `
\`\`\`python
def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)

print(factorial(5))
\`\`\`
`;
  const testMarkdownMixed = `
This is a paragraph with some \`inline_code\`.
Followed by a code block:
\`\`\`typescript
interface User {
  id: number;
  name: string;
}
const user: User = { id: 1, name: "Test User" };
console.log(user);
\`\`\`
And then a list:
- Item A
- Item B
`;
  const testXssAttempt = `
This is an XSS attempt:
<img src="x" onerror="alert('XSS Attempted!')" />
\`\`\`html
<p>Even in a code block, this should be sanitized or properly displayed as code:</p>
<img src="x" onerror="alert('XSS in code block!')" />
\`\`\`
[A malicious link](javascript:alert('XSS Link!'))
`;

  const addTestMessage = (content: string, isError: boolean = false) => {
    // This function bypasses the normal flow and might not trigger auto-titling
    // as it directly adds an AI message. For testing auto-titling, use the UI.
    if (activeConversationId) {
        const testAiMessage: Message = {
            id: `msg-test-${Date.now()}`,
            isUser: false,
            content: content,
            timestamp: new Date(),
            isError: isError,
        };
        setCurrentMessages(prev => [...prev, testAiMessage]); // Update current messages for UI
        const updatedConv = cs.addMessageToConversation(activeConversationId, testAiMessage); // Persist
        if (updatedConv) {
            setConversations(prevConvs => prevConvs.map(c => c.id === activeConversationId ? updatedConv : c));
        }
    } else {
        console.warn("No active conversation to add test message to. Create or select a conversation first.");
        // Optionally, create a new conversation for this test message
        const newConvForTest = cs.createNewConversation("Test Message Holder");
        setConversations(prev => [newConvForTest, ...prev]);
        setActiveConversationId(newConvForTest.id);
        // Now add the message (though this will be an AI message in an empty chat)
         const testAiMessage: Message = {
            id: `msg-test-${Date.now()}`,
            isUser: false,
            content: content,
            timestamp: new Date(),
            isError: isError,
        };
        setCurrentMessages([testAiMessage]); // Set as the only message
        const updatedConvForTest = cs.addMessageToConversation(newConvForTest.id, testAiMessage);
         if (updatedConvForTest) {
            setConversations(prevConvs => prevConvs.map(c => c.id === newConvForTest.id ? updatedConvForTest : c));
        }
    }
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
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={promptDeleteConversation} // Updated prop
        isOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1">
        {/* Temporary Test Buttons Area - Moved here or could be removed if sidebar is main navigation */}
        {/* For now, let's keep it for testing, but it might be better placed or conditionally rendered */}
        <div className="p-2 bg-gray-700/50 space-x-2 text-center flex flex-wrap justify-center gap-2 border-b border-gray-800">
            <button onClick={() => addTestMessage(testMarkdownBasic)} className="px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-xs rounded">Test Basic MD</button>
            <button onClick={() => addTestMessage(testMarkdownJSCode)} className="px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-xs rounded">Test JS Code</button>
            <button onClick={() => addTestMessage(testMarkdownPythonCode)} className="px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-xs rounded">Test Python Code</button>
            <button onClick={() => addTestMessage(testMarkdownMixed)} className="px-2 py-1 bg-indigo-500 hover:bg-indigo-600 text-xs rounded">Test Mixed Content</button>
            <button onClick={() => addTestMessage(testXssAttempt)} className="px-2 py-1 bg-orange-500 hover:bg-orange-600 text-xs rounded">Test XSS</button>
        </div>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-800 bg-gray-900 flex items-center">
          {!isSidebarOpen && (
            <button onClick={toggleSidebar} className="mr-3 p-1 rounded-md hover:bg-gray-700">
              <MenuIcon />
            </button>
          )}
          <h1 className="text-xl font-semibold truncate">
            {activeConversationId ? conversations.find(c => c.id === activeConversationId)?.title : "Chat"}
          </h1>
        </div>

        {/* Message area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentMessages.map((message) => (
            <ChatMessage
              key={message.id}
              isUser={message.isUser}
              content={message.content}
              timestamp={message.timestamp}
              // isLoading logic needs to be adapted if we still want per-message loading for streaming
              // For now, global isLoading handles the input field.
              // The last AI message that has no content yet could be considered loading.
              isLoading={!message.isUser && !message.content && isLoading && message.id === currentMessages[currentMessages.length -1]?.id }
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Conversation"
        footerContent={
          <>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete
            </button>
          </>
        }
      >
        <p>Are you sure you want to delete the chat titled: <br />
          <strong className="font-semibold break-all">"{conversationToDelete?.title}"</strong>?
        </p>
        <p className="mt-2 text-xs text-gray-400">This action cannot be undone.</p>
      </Modal>
      </div> {/* fecha flex flex-col flex-1 */}
    </div>   {/* fecha flex h-screen ... */}
    </>
  );
}
