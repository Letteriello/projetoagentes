import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { FixedSizeList, ListOnScrollProps } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
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

const SCROLL_THRESHOLD = 10; // Pixels from bottom to consider "at bottom"

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
          isVerboseMode={data.isVerboseMode}
          rawEventData={item}
          // Events typically don't have their own applied configs,
          // they would be displayed in context of a message that does.
          // If an event message itself could have configs, pass them here:
          // appliedUserChatConfig={item.appliedUserChatConfig}
          // appliedTestRunConfig={item.appliedTestRunConfig}
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
          message={item} // item here is ChatMessageUI, which will have the configs
          onRegenerate={data.onRegenerate}
          onFeedback={data.onFeedback}
          isVerboseMode={data.isVerboseMode}
          // appliedUserChatConfig and appliedTestRunConfig are part of 'item' (message)
          // and ChatMessageDisplay will need to be updated to accept them.
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
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMessagesLengthRef = useRef(messages.length);
  const prevIsPendingRef = useRef(isPending);

  useEffect(() => {
    const newMessagesAdded = messages.length > prevMessagesLengthRef.current;
    const pendingStateChanged = prevIsPendingRef.current !== isPending;

    // Scroll to bottom if:
    // 1. New messages were added and user was already at the bottom.
    // 2. OR, if the pending indicator just disappeared (message finished streaming) and user is at bottom.
    // 3. OR, if it's the initial load with messages.
    if (
      listRef.current &&
      messages.length > 0 &&
      isAtBottom &&
      (newMessagesAdded || (!isPending && pendingStateChanged))
    ) {
      listRef.current.scrollToItem(messages.length - 1, 'end');
    } else if (newMessagesAdded && messages.length === 1) {
      // Special case: if it's the very first message, always scroll.
      listRef.current?.scrollToItem(0, 'end');
    }

    // Update refs for the next render
    prevMessagesLengthRef.current = messages.length;
    prevIsPendingRef.current = isPending;
  }, [messages, messages.length, isPending, isAtBottom]); // Add isAtBottom and isPending

  // listHeight is now dynamic via AutoSizer, so it's not a fixed const here.
  // We need to pass the dynamic height to handleScroll if its calculations depend on it.
  // Let's store the current list height in a state or ref if handleScroll needs it.
  const currentListHeightRef = useRef(0);

  const handleScroll = useCallback((scrollProps: ListOnScrollProps) => {
    const { scrollOffset, scrollHeight } = scrollProps;
    const clientHeight = currentListHeightRef.current; // Use the stored dynamic height

    if (clientHeight > 0) { // Ensure clientHeight is positive before calculation
      if (scrollHeight <= clientHeight) {
        setIsAtBottom(true);
      } else {
        const isNowAtBottom = scrollOffset + clientHeight >= scrollHeight - SCROLL_THRESHOLD;
        setIsAtBottom(isNowAtBottom);
      }
    } else {
      // If clientHeight is 0 (e.g. initial render before AutoSizer provides it),
      // assume not at bottom or maintain current state. Or default to true if list is empty.
      setIsAtBottom(scrollHeight <= 0);
    }

    if (onScroll) {
      onScroll(scrollProps);
    }
  }, [onScroll]); // Removed listHeight, will use currentListHeightRef

  return (
    <div className={cn('flex flex-col flex-1 overflow-hidden', className)}>
      <div className="flex-1 h-full"> {/* Ensure this wrapper takes full height for AutoSizer */}
        <AutoSizer>
          {({ height, width }) => {
            // Update the ref with the current height for handleScroll
            currentListHeightRef.current = height;
            return (
              <FixedSizeList
                ref={listRef}
                outerRef={containerRef}
                height={height}
                itemCount={messages.length}
                itemSize={ITEM_SIZE}
                itemData={{ messages, onRegenerate, onFeedback, isVerboseMode }}
                width={width}
                onScroll={handleScroll}
                className="custom-scrollbar"
              >
                {Row}
              </FixedSizeList>
            );
          }}
        </AutoSizer>
      </div>
      {isPending && (
        <div className={cn("flex items-end gap-2.5 justify-start w-full p-4 border-t")}> {/* Added border-t for separation */}
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
