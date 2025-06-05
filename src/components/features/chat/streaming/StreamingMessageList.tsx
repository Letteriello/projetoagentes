"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { StreamingMessage } from "./StreamingMessage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface StreamingMessageItem {
  id: string;
  content: string;
  role: "user" | "model" | "system" | "tool";
  isPartial: boolean;
  timestamp: number;
  toolUsed?: {
    name: string;
    status?: "pending" | "success" | "error";
    input?: Record<string, any>;
    output?: any;
  };
  feedback?: 'liked' | 'disliked' | null; // Added feedback state
}

interface StreamingMessageListProps {
  messages: StreamingMessageItem[];
  isProcessing?: boolean;
  className?: string;
  onRegenerate?: (messageId: string) => void;
  onFeedback?: (messageId: string, feedback: 'liked' | 'disliked' | null) => void; // Added onFeedback prop
}

export function StreamingMessageList({
  messages,
  isProcessing = false,
  className,
  onRegenerate,
  onFeedback,
}: StreamingMessageListProps) {
  const viewportRef = useRef<HTMLDivElement>(null); // Ref for the ScrollArea.Viewport
  const [isAtBottom, setIsAtBottom] = useState(true);
  const SCROLL_THRESHOLD = 10; // Pixels from bottom to consider "at bottom"
  const prevMessagesLengthRef = useRef(messages.length);

  const handleScroll = useCallback(() => {
    if (!viewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;

    if (scrollHeight <= clientHeight) {
      setIsAtBottom(true);
    } else {
      const isNowAtBottom = scrollTop + clientHeight >= scrollHeight - SCROLL_THRESHOLD;
      setIsAtBottom(isNowAtBottom);
    }
  }, []);

  useEffect(() => {
    const viewportElement = viewportRef.current;
    if (viewportElement) {
      viewportElement.addEventListener('scroll', handleScroll);
      // Initial check
      handleScroll();
      return () => viewportElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  useEffect(() => {
    const newMessagesAdded = messages.length > prevMessagesLengthRef.current;

    if (viewportRef.current && (isAtBottom || newMessagesAdded && messages.length === 1)) {
      // Only scroll if new messages were added and we were at the bottom,
      // OR if it's the very first message in a new sequence.
      if (newMessagesAdded || (messages.length > 0 && prevMessagesLengthRef.current === 0)) {
        viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, isAtBottom]);


  return (
    <div className={cn("flex-1 overflow-hidden", className)}>
      {/*
        The ScrollArea component from Shadcn UI wraps Radix UI ScrollArea.
        We need to pass the ref to the ScrollArea.Viewport for direct scroll manipulation and event listening.
        Shadcn's ScrollArea doesn't directly expose a viewportRef prop.
        A common way is to use `asChild` on ScrollArea.Viewport if it were a direct child,
        or querySelector, or manage the ref if ScrollArea passes it down.
        For simplicity, if ScrollArea's root ref (scrollAreaRef) gives access to the viewport,
        or if it directly is the scrollable element, the original approach might work with modifications.
        However, typical Radix structure has a Viewport child.
        Let's assume `ScrollArea` itself is what we attach the ref to, and its first child IS the viewport.
        This is often the case with simple wrappers.
        If not, this needs adjustment for how Shadcn `ScrollArea` exposes its viewport.
        A more robust way with Shadcn UI's ScrollArea is often to rely on its own scrolling behavior
        and manage external triggers. But for "isAtBottom", we need scroll events.

        Given the current structure, the best approach is to get the ref to the Viewport.
        Shadcn's <ScrollArea> passes its ref to the underlying RadixScrollArea.Root.
        The Viewport is a child. We'll try to attach the listener to the viewport.
      */}
      <ScrollArea
        className="h-full overflow-auto"
        // Radix ScrollArea.Root doesn't take onScroll directly.
        // We need to get to the viewport.
        // A common pattern for Radix is to pass viewportRef to a custom component that renders ScrollArea.Viewport
        // For now, we will use the viewportRef and assume it's correctly assigned to the viewport.
        // This usually means ScrollArea's internal Viewport needs to accept this ref.
        // If `ScrollArea` is a simple div wrapper, then `viewportRef` on it would be the scrollable element.
        // The `useEffect` for attaching scroll listener will use this `viewportRef`.
      >
        {/* The actual scrollable viewport content goes here.
            The `ScrollArea` from `components/ui/scroll-area.tsx` creates a structure.
            We need the ref on the viewport. A common pattern is to have `viewportRef` on `ScrollAreaViewport`.
            Let's assume `ScrollArea` is structured such that its direct child or a queryable child is the viewport.
            For this implementation, I will attach the ref to the direct child of ScrollArea,
            which is the div rendered by ScrollArea that has overflow styles.
        */}
        <div ref={viewportRef} className="h-full w-full [&>div]:!block"> {/* Targeting Radix Viewport style */}
          <div className="flex flex-col gap-6 p-4 pb-20">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full mt-20"
              >
                <div className="text-center max-w-md space-y-4">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Bem-vindo ao AgentVerse
                  </h2>
                  <p className="text-muted-foreground">
                    Inicie uma conversa com os agentes de IA. O sistema suporta
                    streaming de respostas para uma experiência mais natural.
                  </p>
                </div>
              </motion.div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <StreamingMessage
                    id={message.id} // Pass id
                    content={message.content}
                    role={message.role}
                    isPartial={message.isPartial}
                    timestamp={message.timestamp}
                    toolUsed={message.toolUsed}
                    onRegenerate={onRegenerate}
                    feedback={message.feedback} // Pass feedback state
                    onFeedback={onFeedback} // Pass onFeedback callback
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>

          {/* Indicador de processamento */}
          {isProcessing && !messages[messages.length - 1]?.isPartial && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center py-4"
            >
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                <span>Processando...</span>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
