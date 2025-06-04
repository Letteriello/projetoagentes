import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FixedSizeList, ListOnScrollProps } from 'react-window';
import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatMessageUI, MessageListItem } from '@/types/chat'; // Updated import
import ChatMessageDisplay from './ChatMessageDisplay';
import ChatEventDisplay from './ChatEventDisplay'; // Added import

const ITEM_SIZE = 85; // Average item height in pixels - ADJUST AS NEEDED

interface MessageListProps {
  messages: MessageListItem[]; // Updated type
  isPending: boolean;
  className?: string;
  // containerRef is now managed by FixedSizeList's outerRef,
  // but if parent needs it for other reasons, it can be passed to outerRef
  containerRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (event: React.UIEvent<HTMLDivElement> | ListOnScrollProps) => void; // Adjusted type
  onRegenerate?: (messageId: string) => void;
  onFeedback?: (messageId: string, feedback: 'liked' | 'disliked' | null) => void;
  isVerboseMode?: boolean; // Added isVerboseMode prop
}

// Row component for react-window
const Row = React.memo(({ index, style, data }: { index: number; style: React.CSSProperties; data: { messages: MessageListItem[], onRegenerate?: MessageListProps['onRegenerate'], onFeedback?: MessageListProps['onFeedback'], isVerboseMode?: boolean } }) => {
  const item = data.messages[index];

  if (item.type === 'event') {
    return (
      <div style={style}>
        <ChatEventDisplay
          eventTitle={item.eventTitle}
          eventDetails={item.eventDetails}
          eventType={item.eventType}
          isVerboseMode={data.isVerboseMode} // Pass isVerboseMode
          rawEventData={item} // Pass the whole item as rawEventData
        />
      </div>
    );
  }

  // item.type === 'message'
  // Animation variants for message entry
  const messageVariants = {
    hidden: {
      opacity: 0,
      x: item.sender === "user" ? 20 : -20,
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  return (
    <div style={style}>
      <motion.div
        key={item.id}
        variants={messageVariants}
        initial="hidden"
        animate="visible"
        className="w-full h-full flex items-center"
      >
        <ChatMessageDisplay
          message={item}
          onRegenerate={data.onRegenerate}
          onFeedback={data.onFeedback}
          isVerboseMode={data.isVerboseMode} // Pass isVerboseMode
        />
      </motion.div>
    </div>
  );
});
Row.displayName = 'MessageRow';


const MessageList: React.FC<MessageListProps> = ({
  messages,
  isPending,
  className = '',
  containerRef, // This ref will be for the outer scrollable container of FixedSizeList
  onScroll,
  onRegenerate,
  onFeedback,
  isVerboseMode, // Destructure isVerboseMode
}) => {
  const listRef = useRef<FixedSizeList>(null);

  // Auto-scroll to bottom when new messages arrive or pending state changes
  useEffect(() => {
    if (messages.length > 0) {
      // When pending is true, we might not want to scroll if the user scrolled up.
      // However, if a new message just arrived, we typically do.
      // For simplicity, scroll to the last actual message.
      // If isPending is true and it's the only thing, listRef might not scroll to it.
      listRef.current?.scrollToItem(messages.length - 1, 'end');
    }
  }, [messages, messages.length]); // Removed isPending from deps for now to avoid scrolling issues when user scrolls up and pending appears

  const handleScroll = useCallback((scrollProps: ListOnScrollProps) => {
    if (onScroll) {
      // FixedSizeList's onScroll provides different props than a native div scroll event.
      // Adapt or inform the parent component about this change if necessary.
      onScroll(scrollProps);
    }
  }, [onScroll]);

  // TODO: The height of FixedSizeList (e.g., 600px) should be dynamic.
  // Consider using a library like 'react-virtualized-auto-sizer'
  // or calculate based on parent dimensions.
  const listHeight = 600;

  return (
    <div className={cn('flex flex-col flex-1 overflow-hidden', className)}> {/* Changed overflow-y-auto to overflow-hidden as FixedSizeList handles its own scrolling */}
      <div className="flex-1"> {/* This div will be targeted by AutoSizer or for height calculation */}
        <FixedSizeList
          ref={listRef}
          outerRef={containerRef} // Pass the containerRef to outerRef of FixedSizeList
          height={listHeight}
          itemCount={messages.length}
          itemSize={ITEM_SIZE}
          itemData={{ messages, onRegenerate, onFeedback, isVerboseMode }} // Pass isVerboseMode to itemData
          width="100%"
          onScroll={handleScroll}
          className="custom-scrollbar" // Optional: if you have custom scrollbar styles
        >
          {Row}
        </FixedSizeList>
      </div>
      {isPending && (
        <div className={cn("flex items-end gap-2.5 justify-start w-full p-4")}> {/* Added padding for pending indicator */}
          <div className="flex-shrink-0 p-1.5 rounded-full bg-card border border-border/50 self-start">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="p-3 rounded-lg bg-card max-w-[70%] shadow-sm rounded-bl-none border border-border/50 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      )}
      {/* messagesEndRef is no longer needed as FixedSizeList.scrollToItem is used */}
    </div>
  );
};

MessageList.displayName = 'MessageList';

export default MessageList;
