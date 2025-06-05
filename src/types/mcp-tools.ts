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
  },
  {
    id: "calendar-manager-mcp",
    name: "Calendar Manager MCP (Simulated)",
    description: "Simulates managing calendar events (create, list, delete) via a secure MCP connection.",
    iconName: "Terminal", // Placeholder for CalendarDays; getIconComponent in this file is limited.
    isMCPTool: true,
    mcpServerId: "secure-mcp-server-1",
    mcpServerName: "Secure MCP Server",
    mcpToolName: "calendarManager",
    hasConfig: true,
    configType: "calendarManagerMcp",
    parameters: [
      { name: "action", type: "string", required: true, description: "Action to perform: 'list_events', 'create_event', 'delete_event'." },
      { name: "eventDetails", type: "object", required: false, description: "Object containing event details (e.g., title, date, attendees). Required for 'create_event'." },
      { name: "eventId", type: "string", required: false, description: "ID of the event to delete. Required for 'delete_event'." },
      { name: "dateRangeStart", type: "string", required: false, description: "Start date for 'list_events' (ISO format)." },
      { name: "dateRangeEnd", type: "string", required: false, description: "End date for 'list_events' (ISO format)." }
    ],
    documentation: "Allows the agent to manage calendar events on behalf of the user via a secure MCP channel. Supports listing, creating, and deleting events.",
    examples: [
      { title: "List upcoming week's events", description: "Lists events for the first week of July 2024.", code: "calendarManager.list_events({ dateRangeStart: '2024-07-01T00:00:00Z', dateRangeEnd: '2024-07-07T23:59:59Z' })" },
      { title: "Create a new meeting", description: "Creates a new meeting titled 'Project Sync'.", code: "calendarManager.create_event({ eventDetails: { title: 'Project Sync', date: '2024-07-03T10:00:00Z', attendees: ['user@example.com'] } })" }
    ]
  },
  {
    id: "crm-integrator-mcp",
    name: "CRM Integrator MCP (Simulated)",
    description: "Simulates fetching or updating customer data in a CRM via a secure MCP connection.",
    iconName: "Search", // Placeholder for Users; getIconComponent in this file is limited.
    isMCPTool: true,
    mcpServerId: "secure-mcp-server-1",
    mcpServerName: "Secure MCP Server",
    mcpToolName: "crmIntegrator",
    hasConfig: true,
    configType: "crmIntegratorMcp",
    parameters: [
      { name: "action", type: "string", required: true, description: "Action: 'get_contact', 'update_contact', 'search_contacts'." },
      { name: "contactId", type: "string", required: false, description: "ID of the contact for 'get_contact' or 'update_contact'." },
      { name: "contactData", type: "object", required: false, description: "Data for 'update_contact'." },
      { name: "searchQuery", type: "string", required: false, description: "Query for 'search_contacts' (e.g., email, name)." }
    ],
    documentation: "Provides secure access to CRM data. Allows fetching, updating, and searching customer contact information.",
    examples: [
      { title: "Get contact by ID", description: "Fetches contact details for a given ID.", code: "crmIntegrator.get_contact({ contactId: 'contact_12345' })" },
      { title: "Search for contacts by email", description: "Searches for contacts matching an email address.", code: "crmIntegrator.search_contacts({ searchQuery: 'test@example.com' })" }
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