// src/types/agent-types-unified.d.ts
// Arquivo de definição de tipos para compatibilidade com o código existente

// Re-exportar todos os tipos do arquivo unificado
export * from './unified-agent-types';

// Garantir compatibilidade com importações existentes
declare module './agent-types-unified' {
  export * from './unified-agent-types';
}
