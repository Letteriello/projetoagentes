import { motion } from "framer-motion";
import ChatMessageDisplay from "./ChatMessageDisplay"; // Import the display component
import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatMessageUI } from "@/types/chat"; // Import shared type

interface MessageListProps {
  messages: ChatMessageUI[];
  isPending: boolean;
  // currentUserId?: string; // If needed for specific user styling beyond sender type
}

export default function MessageList({ messages, isPending }: MessageListProps) {
  return (
    <>
      {messages.map((msg, idx) => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, x: msg.sender === "user" ? 20 : -20, y: 10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            delay: 0.05, // Apply a small consistent delay for each new message
          }}
          className="w-full" // Ensure motion.div takes full width for proper alignment
        >
          <ChatMessageDisplay message={msg} isStreaming={msg.isStreaming} />
        </motion.div>
      ))}

      {isPending && (
        <div className={cn("flex items-end gap-2.5 justify-start w-full")}>
          {" "}
          {/* Ensure pending indicator is also full width for consistency */}
          <div className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50 self-start">
            <Bot className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div className="p-3 rounded-lg bg-card max-w-[70%] shadow-sm rounded-bl-none border border-border/50">
            <span className="flex gap-1 items-center text-sm text-muted-foreground animate-pulse">
              <span>D</span>
              <span>i</span>
              <span>g</span>
              <span>i</span>
              <span>t</span>
              <span>a</span>
              <span>n</span>
              <span>d</span>
              <span>o</span>
              <span>.</span>
              <span className="animate-bounce" style={{ animationDelay: "0s" }}>
                .
              </span>
              <span
                className="animate-bounce"
                style={{ animationDelay: "0.15s" }}
              >
                .
              </span>
              <span
                className="animate-bounce"
                style={{ animationDelay: "0.3s" }}
              >
                .
              </span>
            </span>
          </div>
        </div>
      )}
    </>
  );
}
