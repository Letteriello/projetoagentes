"use client";

import * as React from "react";
import { StreamingChat } from "@/components/features/chat/StreamingChat";
import { useAgents } from "@/contexts/AgentsContext";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatPage() {
  const { savedAgents, isLoading } = useAgents();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isClientLoaded, setIsClientLoaded] = useState(false);

  // Efeito para selecionar o primeiro agente quando a lista é carregada
  useEffect(() => {
    if (savedAgents && savedAgents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(savedAgents[0].id);
    }
  }, [savedAgents, selectedAgentId]);

  // Verificar se estamos no lado do cliente
  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  // Obter o agente selecionado
  const selectedAgent = savedAgents?.find(agent => agent.id === selectedAgentId);

  if (!isClientLoaded) {
    return (
      <div className="container h-full py-6 flex flex-col">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="container h-full py-6 flex flex-col">
      <div className="flex-1">
        <StreamingChat 
          agent={selectedAgent} 
          sessionId={`chat-${selectedAgentId || 'default'}`}
        />
      </div>
    </div>
  );
}