"use client";

// Este arquivo é uma versão client-safe para Firestore
// Usa API fetch para comunicar com endpoints de servidor

import type { SavedAgentConfiguration } from '@/app/agent-builder/page';

// Placeholder para o userId
const PLACEHOLDER_USER_ID = "defaultUser";

// Função para buscar agentes
export async function fetchAgents(): Promise<SavedAgentConfiguration[]> {
  try {
    // Em produção, isso chamaria um endpoint de API
    // Por enquanto, retornamos um mock para evitar dependências de servidor
    return [];
  } catch (error) {
    console.error("Erro ao buscar agentes:", error);
    return [];
  }
}

// Função para adicionar um agente
export async function addAgent(
  agentData: Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
): Promise<SavedAgentConfiguration | null> {
  try {
    // Em produção, isso chamaria um endpoint de API
    // Criamos um novo objeto com os dados do agente
    // Adicionamos apenas as propriedades que fazem parte do tipo SavedAgentConfiguration
    const timestamp = new Date();
    
    const newAgent: SavedAgentConfiguration = {
      ...agentData,
      id: `mock-${Date.now()}`,
      // Propriedades obrigatórias com valores padrão
      templateId: agentData.agentType === 'llm' ? 'custom_llm' : 
                 agentData.agentType === 'workflow' ? 'workflow_template' : 'custom_template',
      toolsDetails: agentData.agentTools?.map(toolId => ({
        id: toolId,
        label: toolId,
        iconName: 'default'
      })) || [],
      agentType: agentData.agentType || 'llm'
    };
    
    // Na implementação real, o userId, createdAt e updatedAt seriam armazenados no Firestore
    // mas não expostos no tipo retornado para o cliente
    return newAgent;
  } catch (error) {
    console.error("Erro ao adicionar agente:", error);
    return null;
  }
}

// Função para atualizar um agente
export async function updateAgent(
  agentId: string, 
  agentUpdate: Partial<Omit<SavedAgentConfiguration, 'id'>>
): Promise<boolean> {
  try {
    // Em produção, isso chamaria um endpoint de API
    return true;
  } catch (error) {
    console.error("Erro ao atualizar agente:", error);
    return false;
  }
}

// Função para excluir um agente
export async function deleteAgent(agentId: string): Promise<boolean> {
  try {
    // Em produção, isso chamaria um endpoint de API
    return true;
  } catch (error) {
    console.error("Erro ao excluir agente:", error);
    return false;
  }
}

// Tipo de timestamp compatível com o cliente
export const serverTimestamp = () => new Date();
