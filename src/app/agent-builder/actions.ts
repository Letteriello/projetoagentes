"use server";

import { generate } from "@genkit-ai/ai";
import { gemini15Pro } from "@genkit-ai/googleai"; // Ensure this is the correct model
import { runFlow } from "@genkit-ai/flow";
import {
  AgentNameDescriptionSuggesterInputSchema,
  agentNameDescriptionSuggesterFlow,
} from "@/ai/flows/agentNameDescriptionSuggesterFlow";
import { z } from "zod";

// Importing necessary types and schemas
import {
  aiConfigurationAssistantFlow,
  AiConfigurationAssistantInputSchema,
} from "@/ai/flows/aiConfigurationAssistantFlow";
import { SavedAgentConfiguration } from "@/types/agent-configs-fixed";
import type { ApiResponse } from "@/types/api-types";/**
 * Obtém sugestões do assistente de configuração de IA com base na configuração atual do agente
 * @param currentConfig Configuração atual do agente
 * @param suggestionContext Contexto opcional para sugestões (histórico de chat, entrada do usuário)
 * @returns Resposta da API com sugestões
 */
export async function getAiConfigurationSuggestionsAction(
  currentConfig: SavedAgentConfiguration,
  suggestionContext?: {
    chatHistory?: Array<{role: string, content: string}>,
    userInput?: string
  }
): Promise<ApiResponse> {
  try {
    // Constrói o input para o fluxo
    const flowInput: z.infer<typeof AiConfigurationAssistantInputSchema> = {
      fullAgentConfig: currentConfig,
      ...(suggestionContext ? { suggestionContext } : {})
    };

    // Valida o input construído antes de chamar o fluxo
    // Isso fornece uma saída antecipada se o input estiver malformado
    const parsedFlowInput = AiConfigurationAssistantInputSchema.safeParse(flowInput);
    if (!parsedFlowInput.success) {
      console.error("Input inválido para aiConfigurationAssistantFlow:", parsedFlowInput.error.flatten());
      return { 
        success: false, 
        error: "Dados de entrada inválidos para sugestões de IA: " + parsedFlowInput.error.message,
        timestamp: new Date().toISOString()
      };
    }

    const suggestions = await runFlow(aiConfigurationAssistantFlow, parsedFlowInput.data);
    
    return { 
      success: true, 
      data: suggestions,
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    console.error("[Actions] getAiConfigurationSuggestions erro:", e);
    return { 
      success: false, 
      error: e.message || "Falha ao obter sugestões do assistente de IA.",
      timestamp: new Date().toISOString()
    };
  }
}/**
 * Sugere nome e descrição para um agente com base na descrição do usuário
 * @param userDescription Descrição fornecida pelo usuário
 * @returns Resposta da API com nome e descrição sugeridos
 */
export async function suggestAgentNameAndDescriptionAction(userDescription: string): Promise<ApiResponse> {
  try {
    // Implementação futura para sugerir nome e descrição do agente
    return { 
      success: true, 
      data: { 
        agentName: "Nome do Agente Sugerido",
        agentDescription: "Descrição do agente sugerida" 
      },
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    console.error("[Actions] suggestAgentNameAndDescription erro:", e);
    return { 
      success: false, 
      error: e.message || "Falha ao sugerir nome e descrição do agente.",
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Cria um novo agente com a configuração fornecida
 * @param agentConfig Configuração do agente a ser criado
 * @returns Resposta da API com o ID do agente criado
 */
export async function createAgent(agentConfig: SavedAgentConfiguration): Promise<ApiResponse> {
  try {
    // Implementação futura para criação de agentes
    // Por enquanto, apenas retorna sucesso com ID simulado
    return { 
      success: true, 
      data: {
        ...agentConfig,
        id: `agent-${Date.now()}`
      },
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    console.error("[Actions] createAgent erro:", e);
    return { 
      success: false, 
      error: e.message || "Falha ao criar agente.",
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Lista todos os agentes disponíveis para o usuário
 * @param userId ID do usuário (opcional)
 * @returns Resposta da API com a lista de agentes
 */
export async function listAgents(userId?: string): Promise<ApiResponse> {
  try {
    // Implementação futura para listar agentes
    // Por enquanto, retorna uma lista vazia
    return { 
      success: true, 
      data: [],
      timestamp: new Date().toISOString()
    };
  } catch (e: any) {
    console.error("[Actions] listAgents erro:", e);
    return { 
      success: false, 
      error: e.message || "Falha ao listar agentes.",
      timestamp: new Date().toISOString()
    };
  }
}