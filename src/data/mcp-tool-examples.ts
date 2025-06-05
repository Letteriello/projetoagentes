// src/data/mcp-tool-examples.ts
import { AvailableTool, ToolConfigField } from '@/types/tool-core'; // Adjusted path

/**
 * Exemplos de ferramentas MCP para demonstração
 * Estes são exemplos e podem precisar de configuração adicional para uso real.
 * O campo 'icon' aqui é um nome de string que pode ser mapeado para um componente de ícone na UI.
 */
export const mcpTools: Partial<AvailableTool>[] = [
  {
    id: "desktop-commander",
    name: "Desktop Commander",
    description: "Executa comandos e gerencia arquivos no sistema do usuário de forma segura",
    icon: "Terminal", // Was iconName
    category: "System", // Assuming a category
    // isMCPTool: true, // These fields are not part of AvailableTool,
    // mcpServerId: "local-mcp", // they seem specific to MCP rendering/logic.
    // mcpServerName: "Servidor Local MCP", // Store in customConfig or handle in UI.
    // mcpToolName: "desktop-commander",
    hasConfig: true,
    // configType: "desktopCommander", // Not a direct field in AvailableTool, could be in customConfig
    // parameters: [ ... ] // Should map to openApiSchema or configFields if they are for tool execution setup
    // For now, assuming 'parameters' here described runtime args, map to a simplified openApiSchema example
    openApiSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "Comando a ser executado no terminal" },
        timeout_ms: { type: "number", description: "Tempo máximo de execução em milissegundos" }
      },
      required: ["command"]
    },
    // documentation: "Desktop Commander...", // Not a direct field, could be part of description or a custom field
    // examples: [ ... ] // Not a direct field, could be custom field
  },
  {
    id: "memory-search",
    name: "Memory Search",
    description: "Realiza buscas semânticas em bases de conhecimento usando vetorização e embeddings",
    icon: "Search", // Was iconName
    category: "Data",
    hasConfig: true,
    openApiSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Consulta para busca semântica" },
        limit: { type: "number", description: "Número máximo de resultados a retornar" }
      },
      required: ["query"]
    },
  },
  {
    id: "sequential-thinking",
    name: "Sequential Thinking",
    description: "Decomposição de problemas em passos sequenciais para resolução eficiente",
    icon: "Brain", // Was iconName
    category: "Logic",
    hasConfig: false,
    openApiSchema: {
      type: "object",
      properties: {
        thought: { type: "string", description: "O passo atual de pensamento" },
        nextThoughtNeeded: { type: "boolean", description: "Se é necessário outro passo de pensamento" }
      },
      required: ["thought", "nextThoughtNeeded"]
    },
  },
  {
    id: "puppeteer-browser",
    name: "Puppeteer Browser",
    description: "Automatiza navegadores web para capturar conteúdo ou interagir com sites",
    icon: "Globe", // Was iconName
    category: "Web",
    hasConfig: true,
    requiresAuth: true, // From original data
    openApiSchema: {
      type: "object",
      properties: {
        url: { type: "string", description: "URL para navegar" },
        selector: { type: "string", description: "Seletor CSS para elemento" }
      },
      required: ["url"]
    },
    configFields: [ // This maps to AvailableTool.configFields
      {
        name: "puppeteerEndpoint", // was id
        label: "Endpoint Puppeteer",
        type: "text", // was type
        required: true,
        defaultValue: "http://localhost:3000/api/puppeteer", // was placeholder
        description: "Endpoint da API do serviço Puppeteer"
      },
      {
        name: "headless", // was id
        label: "Modo Headless",
        type: "boolean", // was checkbox, mapped to boolean
        required: false,
        description: "Executar navegador em modo headless (sem interface gráfica)"
      }
    ] as ToolConfigField[], // Type assertion
  },
  {
    id: "calendar-manager-mcp",
    name: "Calendar Manager MCP (Simulated)",
    description: "Simulates managing calendar events (create, list, delete) via a secure MCP connection.",
    icon: "CalendarDays", // Changed from Terminal to a more appropriate icon name
    category: "Productivity",
    hasConfig: true,
    openApiSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action to perform: 'list_events', 'create_event', 'delete_event'." },
        eventDetails: { type: "object", description: "Object containing event details (e.g., title, date, attendees). Required for 'create_event'." },
        eventId: { type: "string", description: "ID of the event to delete. Required for 'delete_event'." },
        dateRangeStart: { type: "string", description: "Start date for 'list_events' (ISO format)." },
        dateRangeEnd: { type: "string", description: "End date for 'list_events' (ISO format)." }
      },
      required: ["action"]
    },
  },
  {
    id: "crm-integrator-mcp",
    name: "CRM Integrator MCP (Simulated)",
    description: "Simulates fetching or updating customer data in a CRM via a secure MCP connection.",
    icon: "Users", // Placeholder icon name
    category: "Business",
    hasConfig: true,
    openApiSchema: {
      type: "object",
      properties: {
        action: { type: "string", description: "Action: 'get_contact', 'update_contact', 'search_contacts'." },
        contactId: { type: "string", description: "ID of the contact for 'get_contact' or 'update_contact'." },
        contactData: { type: "object", description: "Data for 'update_contact'." },
        searchQuery: { type: "string", description: "Query for 'search_contacts' (e.g., email, name)." }
      },
      required: ["action"]
    },
  }
];
