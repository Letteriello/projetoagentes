import { Tool } from '@genkit-ai/sdk';
import { performWebSearchTool } from './web-search-tool';
import { calculatorTool } from './calculator-tool';
import { knowledgeBaseTool } from './knowledge-base-tool';
import { customApiTool } from './custom-api-tool';
import { calendarAccessTool } from './calendar-access-tool';
import { databaseAccessTool } from './database-access-tool';
import { codeExecutorTool } from './code-executor-tool'; // Added import

/**
 * Registro central de todas as ferramentas disponíveis para os agentes do Genkit
 */
export interface ToolRegistry {
  [key: string]: Tool;
}

/**
 * Registro de todas as ferramentas disponíveis
 * Ao adicionar novas ferramentas, inclua-as aqui
 */
export const availableTools: ToolRegistry = {
  webSearch: performWebSearchTool,
  calculator: calculatorTool,
  knowledgeBase: knowledgeBaseTool,
  customApiIntegration: customApiTool,
  calendarAccess: calendarAccessTool,
  databaseAccess: databaseAccessTool,
  codeExecutor: codeExecutorTool, // Added codeExecutorTool
  // Adicione outras ferramentas aqui à medida que forem implementadas
  // example: exampleTool,
  // dataAnalysis: dataAnalysisTool,
};

/**
 * Função para obter uma ferramenta específica pelo ID
 */
export function getToolById(toolId: string): Tool | undefined {
  return availableTools[toolId];
}

/**
 * Função para obter todas as ferramentas disponíveis
 */
export function getAllTools(): Tool[] {
  return Object.values(availableTools);
}

/**
 * Função para obter as ferramentas especificadas por seus IDs
 */
export function getToolsByIds(toolIds: string[]): Tool[] {
  return toolIds
    .map(id => availableTools[id])
    .filter(tool => tool !== undefined);
}