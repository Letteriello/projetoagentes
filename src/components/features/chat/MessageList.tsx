import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { ChatMessageUI } from '@/types/chat';
import { forwardRef, useRef, useEffect } from 'react';
import SimplerChatMessage from './SimplerChatMessage';

interface MessageListProps {
  /** Array of messages to display */
  messages: ChatMessageUI[];
  /** Whether the chat is currently loading/processing a message */
  isPending: boolean;
  /** Optional class name for the container */
  className?: string;
  /** Optional ref for the messages container */
  containerRef?: React.RefObject<HTMLDivElement>;
  /** Callback when the messages container is scrolled */
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  /** Callback to regenerate a message */
  onRegenerate?: (messageId: string) => void;
  /** Callback for message feedback */
  onFeedback?: (messageId: string, feedback: 'liked' | 'disliked' | null) => void;
}

/**
 * A component that displays a list of chat messages with animations
 */
const MessageList = forwardRef<HTMLDivElement, MessageListProps>(({ 
  messages, 
  isPending, 
  className = '',
  onScroll,
  onRegenerate,
  onFeedback, // Destructure onFeedback
  ...props 
}, ref) => {
  // Animation variants for message entry
  const messageVariants = {
    hidden: (isUser: boolean) => ({
      opacity: 0,
      x: isUser ? 20 : -20,
      y: 10,
    }),
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 20,
      },
    },
  };

  // Internal ref to handle scrolling when new messages arrive
  const internalRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = ref || internalRef;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className={cn('flex-1 overflow-y-auto', className)} ref={scrollContainerRef} onScroll={onScroll} {...props}>
      <div className="flex flex-col gap-4 p-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.sender === "user" ? 20 : -20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.05,
              }}
              className="w-full"
            >
              <SimplerChatMessage message={msg} onRegenerate={onRegenerate} onFeedback={onFeedback} />
            </motion.div>
          ))}
          {isPending && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn("flex items-end gap-2.5 justify-start w-full")}
            >
              <div className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50 self-start">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div className="p-3 rounded-lg bg-card max-w-[70%] shadow-sm rounded-bl-none border border-border/50 space-y-2">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                {/* Optional: Keep "Digitando..." alongside or remove if Skeleton is enough */}
                {/* <span className="flex gap-1 items-center text-xs text-muted-foreground/80 animate-pulse">
                  <span>D</span><span>i</span><span>g</span><span>i</span><span>t</span><span>a</span><span>n</span><span>d</span><span>o</span>
                  <span className="animate-bounce" style={{ animationDelay: "0s" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.15s" }}>.</span>
                  <span className="animate-bounce" style={{ animationDelay: "0.3s" }}>.</span>
                </span> */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
