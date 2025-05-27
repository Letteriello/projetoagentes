import { AvailableTool } from "./tool-types";
import { Cpu, Terminal, Search, Brain, Globe } from "lucide-react";
import * as React from "react";

/**
 * Exemplos de ferramentas MCP para demonstração
 * Nota: Os ícones precisam ser criados dinamicamente em componentes React
 * Aqui estamos apenas definindo os nomes dos ícones que serão usados
 */
export const mcpTools: Omit<AvailableTool, 'icon'>[] & { iconName?: string }[] = [
  {
    id: "desktop-commander",
    name: "Desktop Commander",
    description: "Executa comandos e gerencia arquivos no sistema do usuário de forma segura",
    iconName: "Terminal",
    isMCPTool: true,
    mcpServerId: "local-mcp",
    mcpServerName: "Servidor Local MCP",
    mcpToolName: "desktop-commander",
    hasConfig: true,
    configType: "desktopCommander",
    parameters: [
      {
        name: "command",
        type: "string",
        required: true,
        description: "Comando a ser executado no terminal"
      },
      {
        name: "timeout_ms",
        type: "number",
        required: false,
        description: "Tempo máximo de execução em milissegundos"
      }
    ],
    documentation: "Desktop Commander permite que o agente execute comandos no sistema do usuário de forma segura e controlada. Use esta ferramenta para automação de tarefas de sistema.",
    examples: [
      {
        title: "Executar comando simples",
        description: "Exemplo de como listar arquivos em um diretório",
        code: "desktop_commander.execute_command('ls -la /home/user/documents')"
      }
    ]
  },
  {
    id: "memory-search",
    name: "Memory Search",
    description: "Realiza buscas semânticas em bases de conhecimento usando vetorização e embeddings",
    iconName: "Search",
    isMCPTool: true,
    mcpServerId: "local-mcp",
    mcpServerName: "Servidor Local MCP",
    mcpToolName: "memory-search",
    hasConfig: true,
    configType: "memorySearch",
    parameters: [
      {
        name: "query",
        type: "string",
        required: true,
        description: "Consulta para busca semântica"
      },
      {
        name: "limit",
        type: "number",
        required: false,
        description: "Número máximo de resultados a retornar"
      }
    ]
  },
  {
    id: "sequential-thinking",
    name: "Sequential Thinking",
    description: "Decomposição de problemas em passos sequenciais para resolução eficiente",
    iconName: "Brain",
    isMCPTool: true,
    mcpServerId: "local-mcp",
    mcpServerName: "Servidor Local MCP",
    mcpToolName: "sequential-thinking",
    hasConfig: false,
    parameters: [
      {
        name: "thought",
        type: "string",
        required: true,
        description: "O passo atual de pensamento"
      },
      {
        name: "nextThoughtNeeded",
        type: "boolean",
        required: true,
        description: "Se é necessário outro passo de pensamento"
      }
    ]
  },
  {
    id: "puppeteer-browser",
    name: "Puppeteer Browser",
    description: "Automatiza navegadores web para capturar conteúdo ou interagir com sites",
    iconName: "Globe",
    isMCPTool: true,
    mcpServerId: "local-mcp",
    mcpServerName: "Servidor Local MCP",
    mcpToolName: "puppeteer",
    hasConfig: true,
    configType: "puppeteer",
    requiresAuth: true,
    parameters: [
      {
        name: "url",
        type: "string",
        required: true,
        description: "URL para navegar"
      },
      {
        name: "selector",
        type: "string",
        required: false,
        description: "Seletor CSS para elemento"
      }
    ],
    configFields: [
      {
        id: "puppeteerEndpoint",
        label: "Endpoint Puppeteer",
        type: "text",
        required: true,
        placeholder: "http://localhost:3000/api/puppeteer",
        description: "Endpoint da API do serviço Puppeteer"
      },
      {
        id: "headless",
        label: "Modo Headless",
        type: "checkbox",
        required: false,
        description: "Executar navegador em modo headless (sem interface gráfica)"
      }
    ]
  }
];

/**
 * Função auxiliar para converter o nome do ícone em um componente React
 * Deve ser usada no componente React que vai renderizar as ferramentas
 */
export function getIconComponent(iconName: string): React.ReactNode {
  switch (iconName) {
    case 'Terminal':
      return React.createElement(Terminal, { size: 16, className: "mr-2" });
    case 'Search':
      return React.createElement(Search, { size: 16, className: "mr-2" });
    case 'Brain':
      return React.createElement(Brain, { size: 16, className: "mr-2" });
    case 'Globe':
      return React.createElement(Globe, { size: 16, className: "mr-2" });
    default:
      return React.createElement(Cpu, { size: 16, className: "mr-2" });
  }
}