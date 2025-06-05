// src/lib/agent-type-utils.ts
import { SavedAgentConfiguration } from "@/types/agent-configs-fixed";
import { AdaptedAgentFormData, AdaptedSavedAgentConfiguration } from "@/types/agent-types-unified";

/**
 * Converte de SavedAgentConfiguration para AdaptedAgentFormData
 * Formato usado na tela de edição
 */
export function toAgentFormData(config: AdaptedSavedAgentConfiguration): AdaptedAgentFormData {
  return {
    id: config.id,
    agentName: config.agentName,
    description: config.description || "",
    type: config.config.scriptContent ? "scriptable" : "llm",
    tools: (config.config.tools || []).map(tool => tool.id),
    systemPrompt: config.config.systemPrompt,
    model: config.config.model || "gpt-3.5-turbo",
    temperature: config.config.temperature || 0.7,
    maxTokens: config.config.maxTokens || 2048,
    scriptContent: config.config.scriptContent,
    scriptPath: config.config.scriptPath,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    // Convertendo ferramentas para configuração aplicada
    toolConfigsApplied: (config.config.tools || []).reduce((acc, tool) => {
      if (tool.config) {
        acc[tool.id] = {
          config: tool.config
        };
      }
      return acc;
    }, {} as Record<string, { config?: Record<string, any> }>)
  };
}

/**
 * Converte de AdaptedAgentFormData para SavedAgentConfiguration
 * Formato usado para salvar no banco
 */
export function toSavedAgentConfiguration(
  formData: AdaptedAgentFormData
): Omit<SavedAgentConfiguration, "id" | "userId" | "createdAt" | "updatedAt"> {
  return {
    agentName: formData.agentName,
    description: formData.description,
    config: {
      tools: formData.tools.map(toolId => ({
        id: toolId,
        name: toolId, // Nome básico, pode ser atualizado posteriormente
        enabled: true,
        config: formData.toolConfigsApplied?.[toolId]?.config || {}
      })),
      systemPrompt: formData.systemPrompt,
      model: formData.model,
      temperature: formData.temperature,
      maxTokens: formData.maxTokens,
      scriptContent: formData.scriptContent,
      scriptPath: formData.scriptPath
    }
  };
}