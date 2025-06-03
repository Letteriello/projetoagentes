// Exportação explícita do tipo WorkflowDetailedType para resolver problemas de importação
/**
 * Tipos detalhados de fluxos de trabalho para agentes
 */
export type WorkflowDetailedType = "sequential" | "parallel" | "loop" | "graph" | "stateMachine";

// Re-exportando do arquivo original para manter a compatibilidade
export * from './agent-configs';