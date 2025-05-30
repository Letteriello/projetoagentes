"use client";

import React, { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { StreamingMessage } from './StreamingMessage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface StreamingMessageItem {
  id: string;
  content: string;
  role: 'user' | 'model' | 'system' | 'tool';
  isPartial: boolean;
  timestamp: number;
}

interface StreamingMessageListProps {
  messages: StreamingMessageItem[];
  isProcessing?: boolean;
  className?: string;
}

export function StreamingMessageList({
  messages,
  isProcessing = false,
  className
}: StreamingMessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Rolar para o final quando novas mensagens chegarem
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={cn("flex-1 overflow-hidden", className)}>
      <ScrollArea 
        ref={scrollAreaRef} 
        className="h-full overflow-auto"
      >
        <div className="flex flex-col gap-6 p-4 pb-20">
          <AnimatePresence initial={false}>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full mt-20"
              >
                <div className="text-center max-w-md space-y-4">
                  <h2 className="text-2xl font-semibold tracking-tight">Bem-vindo ao AgentVerse</h2>
                  <p className="text-muted-foreground">
                    Inicie uma conversa com os agentes de IA. O sistema suporta streaming de respostas para uma experiência mais natural.
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
                    content={message.content}
                    role={message.role}
                    isPartial={message.isPartial}
                    timestamp={message.timestamp}
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