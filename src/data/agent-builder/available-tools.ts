import { AvailableTool } from "@/types/tool-types";
import { mcpTools } from "@/types/mcp-tools";
import { LucideIcon, HelpCircle, Search, Calculator, FileText, CalendarDays, Network, Database, Code2, Terminal, Cpu, Brain, Globe, Clock } from "lucide-react"; // Added Clock
import { dateTimeTool } from "../../ai/tools/date-time-tool"; // Import dateTimeTool
import { petStoreTool } from "../../ai/tools/openapi-tool"; // Import petStoreTool
import { fileIoTool } from "../../ai/tools/file-io-tool"; // Import fileIoTool

function getIconComponent(name?: string): LucideIcon {
  const iconMap: Record<string, LucideIcon> = {
    search: Search,
    calculator: Calculator,
    filetext: FileText,
    calendardays: CalendarDays,
    network: Network,
    database: Database,
    code2: Code2,
    terminal: Terminal,
    cpu: Cpu,
    brain: Brain,
    globe: Globe,
    // Adicione outros ícones conforme necessário
  };
  if (!name) return HelpCircle;
  return iconMap[name.toLowerCase()] || HelpCircle;
}

import * as React from "react";

/**
 * Ferramentas padrão disponíveis para o agente
 */
export const standardTools: AvailableTool[] = [
  { 
    id: "webSearch", 
    name: "Busca na Web (Google)", 
    icon: Search, 
    description: "Permite ao agente pesquisar na internet (via Genkit). Esta ferramenta tentará usar as variáveis de ambiente GOOGLE_API_KEY e GOOGLE_CSE_ID para funcionar. A configuração na UI serve para documentar e guiar o prompt do sistema.", 
    hasConfig: true, 
    configType: "webSearch", 
    requiresAuth: true,
    genkitToolName: "performWebSearch",
    configFields: [
      {
        id: "googleApiKey",
        label: "Chave de API do Google",
        type: "password",
        required: true,
        placeholder: "AIza...",
        description: "Chave de API do Google para Custom Search"
      },
      {
        id: "googleCseId",
        label: "ID do Custom Search Engine",
        type: "text",
        required: true,
        placeholder: "a123456...",
        description: "ID do mecanismo de busca personalizado"
      }
    ]
  },
  { 
    id: "calculator", 
    name: "Calculadora", 
    icon: Calculator, 
    description: "Permite realizar cálculos matemáticos (via função Genkit).", 
    hasConfig: false,
    genkitToolName: "calculator" 
  },
  { 
    id: "knowledgeBase", 
    name: "Consulta à Base de Conhecimento (RAG)", 
    icon: FileText, 
    description: "Permite buscar em bases de conhecimento ou documentos (ex: RAG via Genkit). Requer configuração do ID da base e, possivelmente, chaves de API.", 
    hasConfig: true, 
    configType: "knowledgeBase",
    genkitToolName: "queryKnowledgeBase",
    configFields: [
      {
        id: "knowledgeBaseId",
        label: "ID da Base de Conhecimento",
        type: "text",
        required: true,
        placeholder: "ex: docs_projeto_abc",
        description: "Identificador único da base de conhecimento"
      }
    ]
  },
  { 
    id: "calendarAccess", 
    name: "Acesso à Agenda/Calendário", 
    icon: CalendarDays, 
    description: "Permite verificar ou criar eventos na agenda (requer fluxo Genkit e auth). Requer configuração do endpoint da API ou ID do fluxo.", 
    hasConfig: true, 
    configType: "calendarAccess",
    requiresAuth: true,
    genkitToolName: "accessCalendar",
    configFields: [
      {
        id: "calendarApiEndpoint",
        label: "Endpoint da API de Calendário",
        type: "text",
        required: true,
        placeholder: "https://api.exemplo.com/calendar",
        description: "URL para o serviço de agenda/calendário"
      }
    ]
  },
  { 
    id: "customApiIntegration", 
    name: "Integração com API Externa (OpenAPI)", 
    icon: Network, 
    description: "Permite interagir com serviços web externos (via OpenAPI, requer fluxo Genkit). Requer URL do esquema OpenAPI e, opcionalmente, chave API.", 
    hasConfig: true, 
    configType: "openApi",
    requiresAuth: true,
    genkitToolName: "invokeOpenAPI",
    configFields: [
      {
        id: "openapiSpecUrl",
        label: "URL do Spec OpenAPI",
        type: "text",
        required: true,
        placeholder: "https://api.exemplo.com/openapi.json",
        description: "URL do esquema OpenAPI (Swagger)"
      },
      {
        id: "openapiApiKey",
        label: "Chave de API (opcional)",
        type: "password",
        required: false,
        placeholder: "Chave secreta",
        description: "Chave de autenticação para a API"
      }
    ]
  },
  { 
    id: "databaseAccess", 
    name: "Acesso a Banco de Dados (SQL)", 
    icon: Database, 
    description: "Permite consultar e interagir com bancos de dados SQL (requer fluxo Genkit). Requer configuração detalhada da conexão.", 
    hasConfig: true, 
    configType: "database",
    requiresAuth: true,
    genkitToolName: "queryDatabase",
    configFields: [
      {
        id: "dbType",
        label: "Tipo de Banco",
        type: "select",
        required: true,
        options: [
          { label: "PostgreSQL", value: "postgres" },
          { label: "MySQL", value: "mysql" },
          { label: "SQLite", value: "sqlite" },
          { label: "Outro", value: "other" }
        ],
        description: "Tipo de banco de dados SQL"
      },
      {
        id: "dbHost",
        label: "Host do Banco",
        type: "text",
        required: true,
        placeholder: "localhost",
        description: "Endereço do servidor do banco de dados"
      },
      {
        id: "dbPort",
        label: "Porta",
        type: "text",
        required: true,
        placeholder: "5432",
        description: "Porta de conexão do banco de dados"
      },
      {
        id: "dbName",
        label: "Nome do Banco",
        type: "text",
        required: true,
        placeholder: "meu_banco",
        description: "Nome do banco de dados"
      },
      {
        id: "dbUser",
        label: "Usuário",
        type: "text",
        required: true,
        placeholder: "usuario",
        description: "Nome de usuário para acesso ao banco"
      },
      {
        id: "dbPassword",
        label: "Senha",
        type: "password",
        required: true,
        placeholder: "senha",
        description: "Senha de acesso ao banco de dados"
      },
      {
        id: "dbDescription",
        label: "Descrição (opcional)",
        type: "textarea",
        required: false,
        placeholder: "Tabela 'usuarios' com colunas id, nome, email...",
        description: "Descrição das tabelas e estrutura do banco"
      }
    ]
  },
  { 
    id: "codeExecutor", 
    name: "Execução de Código (Python Sandbox)", 
    icon: Code2, 
    description: "Permite executar trechos de código Python em um ambiente seguro (requer fluxo Genkit). Pode requerer configuração do endpoint do sandbox.", 
    hasConfig: true, 
    configType: "codeExecutor",
    genkitToolName: "executeCode",
    configFields: [
      {
        id: "sandboxEndpoint",
        label: "Endpoint do Sandbox",
        type: "text",
        required: true,
        placeholder: "https://sandbox.exemplo.com/execute",
        description: "URL para o serviço de execução de código"
      }
    ]
  },
  {
    id: "dateTimeTool",
    name: "Date & Time Operations",
    icon: Clock, // Using Clock icon
    description: "Provides functions for getting current date/time, adding days, and formatting dates.",
    hasConfig: false, // Assuming no external configuration needed for this tool itself
    // genkitToolName: "dateTimeTool", // This refers to the tool itself, not a specific action name if the tool has multiple actions.
                                      // The flow will use the tool name and specify actions like 'dateTimeTool.getCurrentDateTime'
    category: "Utilities", // Or any other relevant category
    value: dateTimeTool, // The actual tool instance
    genkitTool: dateTimeTool // Storing the actual tool for direct use if needed by the framework
  },
  {
    id: "petStoreTool",
    name: "Pet Store API (Mocked)",
    icon: Network, // Using Network icon as it's an API tool
    description: "Provides mocked functions for interacting with a Pet Store API (e.g., getPetById, addPet).",
    hasConfig: false, // No external configuration for this mocked tool
    category: "API Integration",
    value: petStoreTool, // The actual tool instance
    genkitTool: petStoreTool // Storing the actual tool for direct use
  },
  {
    id: "fileIoTool",
    name: "File I/O (Simulated)",
    icon: FileText, // Using FileText icon
    description: "Provides simulated functions for reading and writing files.",
    hasConfig: false, // No external configuration for this simulated tool
    category: "Utilities",
    value: fileIoTool, // The actual tool instance
    genkitTool: fileIoTool // Storing the actual tool for direct use
  }
];

/**
 * Função para converter os mcpTools (com iconName) para o formato AvailableTool (com icon)
 */
const mcpToolsWithIcons: AvailableTool[] = mcpTools.map(tool => ({
  ...tool,
  icon: getIconComponent((tool as any).iconName as string)
}));

/**
 * Todas as ferramentas disponíveis (padrão + MCP)
 */
export const allTools: AvailableTool[] = [
  ...standardTools,
  ...mcpToolsWithIcons
];