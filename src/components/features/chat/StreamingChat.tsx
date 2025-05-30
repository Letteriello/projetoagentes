"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useGenkitSession } from '@/hooks/useGenkitSession';
import { StreamingMessageList } from './streaming/StreamingMessageList';
import { StreamingInputArea } from './streaming/StreamingInputArea';
import { ChatHeader } from '@/components/features/chat/ChatHeader';
import { useToast } from '@/hooks/use-toast';
import { SavedAgentConfiguration } from '@/app/agent-builder/page';

interface StreamingChatProps {
  agent?: SavedAgentConfiguration;
  sessionId?: string;
  initialSystemPrompt?: string;
  tools?: any[];
  className?: string;
}

export function StreamingChat({
  agent,
  sessionId,
  initialSystemPrompt,
  tools,
  className
}: StreamingChatProps) {
  const { toast } = useToast();
  const [temperature, setTemperature] = useState(0.7);
  
  // Usar o hook de sessão Genkit
  const {
    sessionId: activeSessionId,
    messages,
    isProcessing,
    sessionState,
    error,
    sendMessage
  } = useGenkitSession({
    initialSessionId: sessionId,
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Efeito para notificar erros
  useEffect(() => {
    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  }, [error, toast]);

  // Manipula envio de mensagem
  const handleSendMessage = async (message: string, fileDataUri?: string) => {
    try {
      await sendMessage(message, {
        modelId: agent?.config.model,
        systemPrompt: initialSystemPrompt || agent?.config.systemPrompt,
        tools: tools || agent?.config.tools,
        temperature: temperature,
        fileDataUri
      });
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden">
      <ChatHeader 
        title={agent?.name || 'Chat com IA'} 
        description={agent?.description || 'Chat com streaming de respostas em tempo real'}
        modelInfo={agent?.config.model || 'Modelo padrão'}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        <StreamingMessageList 
          messages={messages} 
          isProcessing={isProcessing} 
        />
        
        <StreamingInputArea 
          onSubmit={handleSendMessage}
          isProcessing={isProcessing}
          placeholder="Digite sua mensagem..."
        />
      </div>
    </Card>
  );
}