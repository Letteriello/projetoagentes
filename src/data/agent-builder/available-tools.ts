import { AvailableTool } from "@/types/tool-types";
import { mcpTools } from "@/types/mcp-tools";
import { LucideIcon, HelpCircle, Search, Calculator, FileText, CalendarDays, Network, Database, Code2, Terminal, Cpu, Brain, Globe, Video } from "lucide-react"; // Added Video
import {
  TOOL_ID_WEB_SEARCH,
  TOOL_ID_CALCULATOR,
  TOOL_ID_KNOWLEDGE_BASE,
  TOOL_ID_CALENDAR_ACCESS,
  TOOL_ID_CUSTOM_API_INTEGRATION,
  TOOL_ID_DATABASE_ACCESS,
  TOOL_ID_CODE_EXECUTOR,
  TOOL_ID_VIDEO_STREAM_MONITOR, // Added TOOL_ID_VIDEO_STREAM_MONITOR
  GENKIT_TOOL_NAME_WEB_SEARCH,
  GENKIT_TOOL_NAME_CALCULATOR,
  GENKIT_TOOL_NAME_KNOWLEDGE_BASE_RETRIEVE,
  GENKIT_TOOL_NAME_CALENDAR_GET_EVENTS,
  GENKIT_TOOL_NAME_CUSTOM_API_CALL,
  GENKIT_TOOL_NAME_DATABASE_QUERY,
  GENKIT_TOOL_NAME_CODE_EXECUTE,
  GENKIT_TOOL_NAME_VIDEO_STREAM_MONITOR, // Added GENKIT_TOOL_NAME_VIDEO_STREAM_MONITOR
  CONFIG_FIELD_GOOGLE_API_KEY,
  CONFIG_FIELD_GOOGLE_CSE_ID,
  CONFIG_FIELD_ALLOWED_DOMAINS,
  CONFIG_FIELD_BLOCKED_DOMAINS,
  CONFIG_FIELD_KNOWLEDGE_BASE_ID,
  CONFIG_FIELD_CALENDAR_API_ENDPOINT,
  CONFIG_FIELD_OPENAPI_SPEC_URL,
  CONFIG_FIELD_OPENAPI_API_KEY,
  CONFIG_FIELD_ALLOWED_HTTP_METHODS,
  CONFIG_FIELD_DB_TYPE,
  CONFIG_FIELD_DB_HOST,
  CONFIG_FIELD_DB_PORT,
  CONFIG_FIELD_DB_NAME,
  CONFIG_FIELD_DB_USER,
  CONFIG_FIELD_DB_PASSWORD,
  CONFIG_FIELD_DB_DESCRIPTION,
  CONFIG_FIELD_ALLOWED_SQL_OPERATIONS,
  CONFIG_FIELD_SANDBOX_ENDPOINT,
  // CONFIG_FIELD_AUTHENTICATION_TYPE, // Not used in this file yet
  // CONFIG_FIELD_API_KEY, // Not used in this file yet
  // CONFIG_FIELD_OAUTH_CLIENT_ID, // Not used in this file yet
  // CONFIG_FIELD_OAUTH_CLIENT_SECRET, // Not used in this file yet
  // CONFIG_FIELD_OAUTH_TOKEN_URL, // Not used in this file yet
  // CONFIG_FIELD_DATABASE_TYPE, // Not used in this file yet
  // CONFIG_FIELD_CONNECTION_STRING, // Not used in this file yet
  // CONFIG_FIELD_QUERY, // Not used in this file yet
  // CONFIG_FIELD_CODE_LANGUAGE, // Not used in this file yet
  // CONFIG_FIELD_CODE_TO_EXECUTE, // Not used in this file yet
  // CONFIG_FIELD_MAX_OUTPUT_CHARACTERS, // Not used in this file yet
} from "@/lib/constants";

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
    video: Video, // Added Video icon
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
    id: TOOL_ID_WEB_SEARCH,
    name: "Busca na Web (Google)", 
    icon: Search, 
    description: "Permite ao agente pesquisar na internet (via Genkit). Esta ferramenta tentará usar as variáveis de ambiente GOOGLE_API_KEY e GOOGLE_CSE_ID para funcionar. A configuração na UI serve para documentar e guiar o prompt do sistema.", 
    hasConfig: true, 
    configType: "webSearch", 
    requiresAuth: true,
    genkitToolName: GENKIT_TOOL_NAME_WEB_SEARCH,
    configFields: [
      {
        id: CONFIG_FIELD_GOOGLE_API_KEY,
        label: "Chave de API do Google",
        type: "password",
        required: true,
        placeholder: "AIza...",
        description: "Chave de API do Google para Custom Search"
      },
      {
        id: CONFIG_FIELD_GOOGLE_CSE_ID,
        label: "ID do Custom Search Engine",
        type: "text",
        required: true,
        placeholder: "a123456...",
        description: "ID do mecanismo de busca personalizado"
      },
      {
        id: CONFIG_FIELD_ALLOWED_DOMAINS,
        label: "Allowed Domains (comma-separated)",
        type: "textarea",
        description: "List of domains the search is restricted to. E.g., 'example.com,another.org'"
      },
      {
        id: CONFIG_FIELD_BLOCKED_DOMAINS,
        label: "Blocked Domains (comma-separated)",
        type: "textarea",
        description: "List of domains to exclude from search. E.g., 'undesired.com,restricted.net'"
      }
    ]
  },
  {
    id: TOOL_ID_CALCULATOR,
    name: "Calculadora", 
    icon: Calculator, 
    description: "Permite realizar cálculos matemáticos (via função Genkit).", 
    hasConfig: false,
    genkitToolName: GENKIT_TOOL_NAME_CALCULATOR
  },
  { 
    id: TOOL_ID_KNOWLEDGE_BASE,
    name: "Consulta à Base de Conhecimento (RAG)", 
    icon: FileText, 
    description: "Permite buscar em bases de conhecimento ou documentos (ex: RAG via Genkit). Requer configuração do ID da base e, possivelmente, chaves de API.", 
    hasConfig: true, 
    configType: "knowledgeBase",
    genkitToolName: GENKIT_TOOL_NAME_KNOWLEDGE_BASE_RETRIEVE,
    configFields: [
      {
        id: CONFIG_FIELD_KNOWLEDGE_BASE_ID,
        label: "ID da Base de Conhecimento",
        type: "text",
        required: true,
        placeholder: "ex: docs_projeto_abc",
        description: "Identificador único da base de conhecimento"
      }
    ]
  },
  { 
    id: TOOL_ID_CALENDAR_ACCESS,
    name: "Acesso à Agenda/Calendário", 
    icon: CalendarDays, 
    description: "Permite verificar ou criar eventos na agenda (requer fluxo Genkit e auth). Requer configuração do endpoint da API ou ID do fluxo.", 
    hasConfig: true, 
    configType: "calendarAccess",
    requiresAuth: true,
    genkitToolName: GENKIT_TOOL_NAME_CALENDAR_GET_EVENTS,
    configFields: [
      {
        id: CONFIG_FIELD_CALENDAR_API_ENDPOINT,
        label: "Endpoint da API de Calendário",
        type: "text",
        required: true,
        placeholder: "https://api.exemplo.com/calendar",
        description: "URL para o serviço de agenda/calendário"
      }
    ]
  },
  { 
    id: TOOL_ID_CUSTOM_API_INTEGRATION,
    name: "Integração com API Externa (OpenAPI)", 
    icon: Network, 
    description: "Permite interagir com serviços web externos (via OpenAPI, requer fluxo Genkit). Requer URL do esquema OpenAPI e, opcionalmente, chave API.", 
    hasConfig: true, 
    configType: "openApi",
    requiresAuth: true,
    genkitToolName: GENKIT_TOOL_NAME_CUSTOM_API_CALL,
    configFields: [
      {
        id: CONFIG_FIELD_OPENAPI_SPEC_URL,
        label: "URL do Spec OpenAPI",
        type: "text",
        required: true,
        placeholder: "https://api.exemplo.com/openapi.json",
        description: "URL do esquema OpenAPI (Swagger)"
      },
      {
        id: CONFIG_FIELD_OPENAPI_API_KEY,
        label: "Chave de API (opcional)",
        type: "password",
        required: false,
        placeholder: "Chave secreta",
        description: "Chave de autenticação para a API"
      },
      {
        id: CONFIG_FIELD_ALLOWED_HTTP_METHODS,
        label: "Allowed HTTP Methods (comma-separated)",
        type: "textarea",
        placeholder: "GET,POST",
        description: "Define allowed HTTP methods like GET, POST, PUT, DELETE. Leave empty for all."
      }
    ]
  },
  {
    id: TOOL_ID_DATABASE_ACCESS,
    name: "Acesso a Banco de Dados (SQL)", 
    icon: Database, 
    description: "Permite consultar e interagir com bancos de dados SQL (requer fluxo Genkit). Requer configuração detalhada da conexão.", 
    hasConfig: true, 
    configType: "database",
    requiresAuth: true,
    genkitToolName: GENKIT_TOOL_NAME_DATABASE_QUERY,
    configFields: [
      {
        id: CONFIG_FIELD_DB_TYPE,
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
        id: CONFIG_FIELD_DB_HOST,
        label: "Host do Banco",
        type: "text",
        required: true,
        placeholder: "localhost",
        description: "Endereço do servidor do banco de dados"
      },
      {
        id: CONFIG_FIELD_DB_PORT,
        label: "Porta",
        type: "text",
        required: true,
        placeholder: "5432",
        description: "Porta de conexão do banco de dados"
      },
      {
        id: CONFIG_FIELD_DB_NAME,
        label: "Nome do Banco",
        type: "text",
        required: true,
        placeholder: "meu_banco",
        description: "Nome do banco de dados"
      },
      {
        id: CONFIG_FIELD_DB_USER,
        label: "Usuário",
        type: "text",
        required: true,
        placeholder: "usuario",
        description: "Nome de usuário para acesso ao banco"
      },
      {
        id: CONFIG_FIELD_DB_PASSWORD,
        label: "Senha",
        type: "password",
        required: true,
        placeholder: "senha",
        description: "Senha de acesso ao banco de dados"
      },
      {
        id: CONFIG_FIELD_DB_DESCRIPTION,
        label: "Descrição (opcional)",
        type: "textarea",
        required: false,
        placeholder: "Tabela 'usuarios' com colunas id, nome, email...",
        description: "Descrição das tabelas e estrutura do banco"
      },
      {
        id: CONFIG_FIELD_ALLOWED_SQL_OPERATIONS,
        label: "Allowed SQL Operations (comma-separated)",
        type: "textarea",
        placeholder: "SELECT,INSERT",
        description: "Define allowed SQL commands like SELECT, INSERT, UPDATE, DELETE. Leave empty for all allowed by DB user."
      }
    ]
  },
  {
    id: TOOL_ID_CODE_EXECUTOR,
    name: "Execução de Código (Python Sandbox)", 
    icon: Code2, 
    description: "Permite executar trechos de código Python em um ambiente seguro (requer fluxo Genkit). Pode requerer configuração do endpoint do sandbox.", 
    hasConfig: true, 
    configType: "codeExecutor",
    genkitToolName: GENKIT_TOOL_NAME_CODE_EXECUTE,
    configFields: [
      {
        id: CONFIG_FIELD_SANDBOX_ENDPOINT,
        label: "Endpoint do Sandbox",
        type: "text",
        required: true,
        placeholder: "https://sandbox.exemplo.com/execute",
        description: "URL para o serviço de execução de código"
      }
    ]
  },
  {
    id: TOOL_ID_VIDEO_STREAM_MONITOR,
    name: "Monitor de Stream de Vídeo (Simulado)",
    icon: Video, // Using Video icon
    description: "Inicia o monitoramento simulado de um fluxo de vídeo para detectar eventos.",
    hasConfig: false, // No config fields for the initial mock
    genkitToolName: GENKIT_TOOL_NAME_VIDEO_STREAM_MONITOR,
    configFields: [] // No configuration fields initially
  },
];

/**
 * Função para converter os mcpTools (com iconName) para o formato AvailableTool (com icon)
 */
const mcpToolsWithIcons: AvailableTool[] = mcpTools.map(tool => ({
  ...tool,
  icon: getIconComponent(tool.iconName) // Removed 'as any' and 'as string', tool.iconName is string | undefined
}));

/**
 * Todas as ferramentas disponíveis (padrão + MCP)
 */
export const allTools: AvailableTool[] = [
  ...standardTools,
  ...mcpToolsWithIcons
];