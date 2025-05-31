import React, { useState, useEffect, useRef } from "react";
import { Conversation } from "@/types/chat";
import { cn } from "@/lib/utils";

// Basic SVG Icons (Heroicons outlines)
const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-4 h-4"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.56 0c1.153 0 2.243.032 3.287.096m7.971.016A48.108 48.108 0 0 1 12 5.69m0 0a48.108 48.108 0 0 1-3.478-.397m0-.096c1.153 0 2.243.032 3.287.096"
    />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 19.5 8.25 12l7.5-7.5"
    />
  </svg>
);

export interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (conversation: Conversation) => void; // Updated prop type
  isOpen: boolean;
  onToggleSidebar: () => void;
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  isOpen,
  onToggleSidebar,
}: ConversationSidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
    }
  }, [renamingId]);

  const handleStartRename = (conv: Conversation) => {
    setRenamingId(conv.id);
    setRenameValue(conv.title);
  };

  const handleConfirmRename = () => {
    if (renamingId && renameValue.trim()) {
      onRenameConversation(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const handleRenameKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter") {
      handleConfirmRename();
    } else if (event.key === "Escape") {
      setRenamingId(null);
      setRenameValue("");
    }
  };

  return (
    <>
      <style>{`
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: #1f2937; /* gray-800 */
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: #4b5563; /* gray-600 */
          border-radius: 4px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #6b7280; /* gray-500 */
        }
      `}</style>
      <div
        className={cn(
          "flex flex-col h-full bg-gray-800 text-gray-200 transition-all duration-300 ease-in-out",
          isOpen ? "w-64 p-4" : "w-0 p-0 opacity-0 overflow-hidden",
        )}
      >
        {isOpen && ( // Only render content if open to prevent layout issues when collapsed
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Chats</h2>
              <button
                onClick={onToggleSidebar}
                className="p-1 rounded-md hover:bg-gray-700 text-gray-400 hover:text-gray-100"
                aria-label="Close sidebar"
              >
                <ChevronLeftIcon />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={onNewConversation}
              className="flex items-center justify-center w-full px-4 py-2 mb-4 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <PlusIcon />
              <span className="ml-2">New Chat</span>
            </button>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar-dark -mr-2 pr-2">
              {" "}
              {/* Negative margin for scrollbar */}
              {conversations.length === 0 ? (
                <p className="text-sm text-gray-400 text-center mt-4">
                  No chats yet. Click 'New Chat' to start.
                </p>
              ) : (
                <ul className="space-y-1">
                  {conversations.map((conv) => (
                    <li key={conv.id} className="group relative">
                      <div
                        onClick={() =>
                          renamingId !== conv.id &&
                          onSelectConversation(conv.id)
                        }
                        className={cn(
                          "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md cursor-pointer",
                          activeConversationId === conv.id
                            ? "bg-gray-700 text-white"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white",
                          renamingId === conv.id ? "bg-gray-600" : "",
                        )}
                      >
                        {renamingId === conv.id ? (
                          <input
                            ref={renameInputRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={handleConfirmRename}
                            onKeyDown={handleRenameKeyDown}
                            className="flex-grow bg-transparent text-white outline-none border border-blue-500 rounded px-1 py-0.5 text-sm"
                          />
                        ) : (
                          <span className="truncate flex-grow">
                            {conv.title}
                          </span>
                        )}

                        {renamingId !== conv.id && (
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(conv);
                              }}
                              className="p-1 rounded-md hover:bg-gray-500 text-gray-400 hover:text-gray-100"
                              aria-label="Rename chat"
                            >
                              <PencilIcon />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(conv);
                              }} // Pass the full conversation object
                              className="p-1 rounded-md hover:bg-red-500 text-gray-400 hover:text-red-100"
                              aria-label="Delete chat"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default ConversationSidebar;
