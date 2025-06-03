// Arquivo temporário para definição de tipos de workflow
/**
 * Tipos detalhados de fluxos de trabalho para agentes
 * @enum {string}
 * @property sequential - Tarefas executadas em ordem sequencial
 * @property parallel - Tarefas executadas em paralelo
 * @property loop - Tarefas executadas em loop até condição
 * @property graph - Tarefas organizadas em grafo de dependências
 * @property stateMachine - Tarefas gerenciadas por máquina de estados
 */
export type WorkflowDetailedType = "sequential" | "parallel" | "loop" | "graph" | "stateMachine";