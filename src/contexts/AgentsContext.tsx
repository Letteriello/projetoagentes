
"use client";

import type { SavedAgentConfiguration } from '@/app/agent-builder/page'; // Ajuste o caminho se necessário
import * as React from 'react';

interface AgentsContextType {
  savedAgents: SavedAgentConfiguration[];
  setSavedAgents: React.Dispatch<React.SetStateAction<SavedAgentConfiguration[]>>;
  // Poderíamos adicionar funções para adicionar/remover/atualizar agentes aqui também
}

const AgentsContext = React.createContext<AgentsContextType | undefined>(undefined);

export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const [savedAgents, setSavedAgents] = React.useState<SavedAgentConfiguration[]>([]);

  return (
    <AgentsContext.Provider value={{ savedAgents, setSavedAgents }}>
      {children}
    </AgentsContext.Provider>
  );
}

export function useAgents() {
  const context = React.useContext(AgentsContext);
  if (context === undefined) {
    throw new Error('useAgents must be used within an AgentsProvider');
  }
  return context;
}
