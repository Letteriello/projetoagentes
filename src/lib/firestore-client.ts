"use client";

// Este arquivo é uma versão client-safe para Firestore
// Usa API fetch para comunicar com endpoints de servidor

import type { SavedAgentConfiguration, AgentConfig } from '@/types/agent-core'; // Updated path

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
    const timestamp = new Date().toISOString(); // Core type uses string for dates
    
    // agentData is Omit<SavedAgentConfiguration, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
    // It should already have agentName, agentDescription, config, tools, etc.
    const newAgent: SavedAgentConfiguration = {
      id: `mock-${Date.now()}`, // Mock ID
      userId: PLACEHOLDER_USER_ID, // Mock userId
      createdAt: timestamp,
      updatedAt: timestamp,
      agentName: agentData.agentName,
      agentDescription: agentData.agentDescription,
      agentVersion: agentData.agentVersion || '1.0.0',
      config: agentData.config as AgentConfig, // Ensure agentData has a valid AgentConfig
      tools: agentData.tools || [],
      toolConfigsApplied: agentData.toolConfigsApplied || {},
      toolsDetails: agentData.toolsDetails || [], // This should be AvailableTool[]
      isTemplate: agentData.isTemplate || false,
      // Fill in other required fields from SavedAgentConfiguration if not in Omit
      isFavorite: false,
      // templateId: agentData.templateId, // If templateId is part of the Omit type
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
