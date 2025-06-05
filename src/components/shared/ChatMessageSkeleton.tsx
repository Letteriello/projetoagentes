import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChatMessageSkeletonProps {
  senderType?: 'user' | 'agent'; // Default to agent if not specified
  className?: string;
}

const ChatMessageSkeleton: React.FC<ChatMessageSkeletonProps> = ({
  senderType = 'agent',
  className,
}) => {
  const isUser = senderType === 'user';

  return (
    <div
      className={cn(
        "flex items-end gap-2.5 w-full",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {!isUser && (
        <Skeleton className="h-9 w-9 rounded-full flex-shrink-0 self-start" /> // Avatar for agent
      )}
      <div
        className={cn(
          "p-3 rounded-lg max-w-[70%] shadow-sm space-y-2",
          isUser
            ? "bg-primary/20 rounded-br-none" // Lighter primary for user skeleton bubble
            : "bg-card/50 rounded-bl-none", // Lighter card for agent skeleton bubble
        )}
      >
        <Skeleton className="h-4 w-48 max-w-[80%]" />
        <Skeleton className="h-4 w-56 max-w-full" />
        <Skeleton className="h-4 w-32 max-w-[60%]" />
      </div>
      {isUser && (
        <Skeleton className="h-9 w-9 rounded-full flex-shrink-0 self-start" /> // Avatar for user
      )}
    </div>
  );
};

export default ChatMessageSkeleton;
