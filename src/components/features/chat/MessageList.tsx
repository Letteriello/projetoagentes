import { motion, AnimatePresence } from 'framer-motion';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
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
}

/**
 * A component that displays a list of chat messages with animations
 */
const MessageList = forwardRef<HTMLDivElement, MessageListProps>(({ 
  messages, 
  isPending, 
  className = '',
  onScroll,
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
    <div 
      ref={scrollContainerRef}
      className={cn('flex-1 overflow-y-auto', className)}
      onScroll={onScroll}
      role="log"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
      {...props}
    >
      <div className="flex flex-col gap-4 p-4">
        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              custom={message.sender === 'user'}
              initial="hidden"
              animate="visible"
              variants={messageVariants}
              transition={{ delay: 0.05 }}
              className="w-full"
              layout
            >
              <div className="message-item" aria-label={`Message from ${message.sender === 'user' ? 'you' : 'assistant'}`}>
                <SimplerChatMessage message={message} />
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {isPending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-2.5 w-full"
              role="status"
              aria-live="polite"
              aria-label="Assistant is typing"
            >
              <div 
                className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50 self-start"
                aria-hidden="true"
              >
                <Bot className="h-5 w-5 text-primary animate-pulse" aria-hidden="true" />
              </div>
              <div 
                className="p-3 rounded-lg bg-card max-w-[70%] shadow-sm rounded-bl-none border border-border/50"
                aria-hidden="true"
              >
                <span className="flex gap-1 items-center text-sm text-muted-foreground">
                  <span className="animate-pulse">Digitando</span>
                  <span className="flex items-baseline h-4 overflow-hidden">
                    <span className="animate-bounce" style={{ animationDelay: '0s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.15s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.3s' }}>.</span>
                  </span>
                </span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </AnimatePresence>
      </div>
    </div>
  );
});

// Set display name for better dev tools
MessageList.displayName = 'MessageList';

export default MessageList;
