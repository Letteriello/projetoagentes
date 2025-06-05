import { AvailableTool, ToolConfigField } from "@/types/tool-types"; // Updated import
import { mcpTools, MCPTool } from "@/types/mcp-tools"; // Assuming MCPTool is the type for mcpTools items
import {
  LucideIcon, HelpCircle, Search, Calculator, FileText, CalendarDays,
  Network, Database, Code2, Terminal, Cpu, Brain, Globe, Clock, Video,
  Smile, ThumbsUp, TestTubeDiagonal, Mic, Volume2, Film, Cloud, FunctionSquare
} from "lucide-react";
import { dateTimeTool } from "../../ai/tools/date-time-tool";
import { petStoreTool } from "../../ai/tools/openapi-tool";
import { fileIoTool } from "../../ai/tools/file-io-tool";
import { imageClassifierTool } from '../../ai/tools/image-classifier-tool';
import { textSummarizerTool } from '../../ai/tools/text-summarizer-tool';
import { sentimentAnalyzerTool } from '../../ai/tools/sentiment-analyzer-tool';
import { aiFeedbackTool } from '../../ai/tools/ai-feedback-tool';
import { stringReverserTool } from '@/ai/tools/example-tdd-tool';
import { speechToTextTool, textToSpeechTool } from '../../ai/tools/speech-tools';
import { videoSummarizerTool } from '../../ai/tools/video-summarizer-tool';
import { gcsListBucketsTool, gcsUploadFileTool } from '../../ai/tools/gcs-tool';
import { customFunctionInvokerTool } from '../../ai/tools/custom-function-invoker';
// It's good practice to also import Zod if you were to use ZodSchema
// import { z, ZodSchema } from 'zod';

import {
  TOOL_ID_WEB_SEARCH,
  TOOL_ID_CALCULATOR,
  TOOL_ID_KNOWLEDGE_BASE,
  TOOL_ID_CALENDAR_ACCESS,
  TOOL_ID_CUSTOM_API_INTEGRATION,
  TOOL_ID_DATABASE_ACCESS,
  TOOL_ID_CODE_EXECUTOR,
  TOOL_ID_VIDEO_STREAM_MONITOR,
  GENKIT_TOOL_NAME_WEB_SEARCH,
  GENKIT_TOOL_NAME_CALCULATOR,
  GENKIT_TOOL_NAME_KNOWLEDGE_BASE_RETRIEVE,
  GENKIT_TOOL_NAME_CALENDAR_GET_EVENTS,
  GENKIT_TOOL_NAME_CUSTOM_API_CALL,
  GENKIT_TOOL_NAME_DATABASE_QUERY,
  GENKIT_TOOL_NAME_CODE_EXECUTE,
  GENKIT_TOOL_NAME_VIDEO_STREAM_MONITOR,
  CONFIG_FIELD_GOOGLE_API_KEY, // This constant would map to ToolConfigField.name
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
} from "@/lib/constants";

// Helper to stringify schemas if they are not already strings
// For now, we assume schemas are already strings or will be handled during tool definition
// const stringifySchema = (schema: any): string | undefined => {
//   if (!schema) return undefined;
//   if (typeof schema === 'string') return schema;
//   try {
//     return JSON.stringify(schema); // Or use a Zod schema to JSON schema converter
//   } catch (error) {
//     console.error("Failed to stringify schema:", error);
//     return undefined;
//   }
// };

// getIconComponent remains the same, ensure its return type is LucideIcon
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
    video: Video,
    smile: Smile,
    thumbsup: ThumbsUp,
    testtubediagonal: TestTubeDiagonal,
    mic: Mic,
    volume2: Volume2,
    film: Film,
    cloud: Cloud,
    functionsquare: FunctionSquare,
  };
  if (!name) return HelpCircle;
  return iconMap[name.toLowerCase()] || HelpCircle;
}

// Removed import * as React from "react"; as it's not needed.

/**
 * Standard tools available for the agent.
 * These tools are defined to conform to the new AvailableTool interface.
 */
export const standardTools: AvailableTool[] = [
  { 
    id: TOOL_ID_WEB_SEARCH,
    name: "Busca na Web (Google)", 
    icon: Search, 
    description: "Permite ao agente pesquisar na internet (via Genkit). Esta ferramenta tentará usar as variáveis de ambiente GOOGLE_API_KEY e GOOGLE_CSE_ID para funcionar. A configuração na UI serve para documentar e guiar o prompt do sistema.", 
    category: "Web", // Added category
    hasConfig: true, 
    configType: "webSearch", // This could be a key for specific UI rendering
    requiresAuth: true,
    genkitToolName: GENKIT_TOOL_NAME_WEB_SEARCH,
    // inputSchema and outputSchema would ideally be JSON stringified versions of Zod schemas
    // For example: inputSchema: JSON.stringify(someZodSchema.shape),
    configFields: [ // Converted from id-based to name-based for ToolConfigField
      {
        name: CONFIG_FIELD_GOOGLE_API_KEY, // Used as key in config object
        label: "Chave de API do Google",
        type: "text", // Changed from password for simplicity, actual input type handled by UI
        required: true,
        defaultValue: "",
        description: "Chave de API do Google para Custom Search"
      },
      {
        name: CONFIG_FIELD_GOOGLE_CSE_ID,
        label: "ID do Custom Search Engine",
        type: "text",
        required: true,
        defaultValue: "",
        description: "ID do mecanismo de busca personalizado"
      },
      {
        name: CONFIG_FIELD_ALLOWED_DOMAINS,
        label: "Allowed Domains (comma-separated)",
        type: "textarea",
        defaultValue: "",
        description: "List of domains the search is restricted to. E.g., 'example.com,another.org'"
      },
      {
        name: CONFIG_FIELD_BLOCKED_DOMAINS,
        label: "Blocked Domains (comma-separated)",
        type: "textarea",
        defaultValue: "",
        description: "List of domains to exclude from search. E.g., 'undesired.com,restricted.net'"
      }
    ]
  },
  {
    id: TOOL_ID_CALCULATOR,
    name: "Calculadora", 
    icon: Calculator, 
    description: "Permite realizar cálculos matemáticos (via função Genkit).", 
    category: "Utilities", // Added category
    hasConfig: false,
    genkitToolName: GENKIT_TOOL_NAME_CALCULATOR,
    // genkitTool: calculatorTool, // If there's an actual Genkit tool instance
  },
  { 
    id: TOOL_ID_KNOWLEDGE_BASE,
    name: "Consulta à Base de Conhecimento (RAG)", 
    icon: FileText, 
    description: "Permite buscar em bases de conhecimento ou documentos (ex: RAG via Genkit). Requer configuração do ID da base e, possivelmente, chaves de API.", 
    category: "Data", // Added category
    hasConfig: true, 
    configType: "knowledgeBase",
    requiresAuth: false, // Assuming auth might be handled by the knowledge base setup itself
    genkitToolName: GENKIT_TOOL_NAME_KNOWLEDGE_BASE_RETRIEVE,
    configFields: [
      {
        name: CONFIG_FIELD_KNOWLEDGE_BASE_ID,
        label: "ID da Base de Conhecimento",
        type: "text",
        required: true,
        defaultValue: "",
        description: "Identificador único da base de conhecimento"
      }
    ]
  },
  { 
    id: TOOL_ID_CALENDAR_ACCESS,
    name: "Acesso à Agenda/Calendário", 
    icon: CalendarDays, 
    description: "Permite verificar ou criar eventos na agenda (requer fluxo Genkit e auth). Requer configuração do endpoint da API ou ID do fluxo.", 
    category: "Productivity", // Added category
    hasConfig: true, 
    configType: "calendarAccess",
    requiresAuth: true,
    genkitToolName: GENKIT_TOOL_NAME_CALENDAR_GET_EVENTS,
    configFields: [
      {
        name: CONFIG_FIELD_CALENDAR_API_ENDPOINT, // Changed from id to name
        label: "Endpoint da API de Calendário",
        type: "text",
        required: true,
        defaultValue: "https://api.exemplo.com/calendar",
        description: "URL para o serviço de agenda/calendário"
      }
    ]
  },
  { 
    id: TOOL_ID_CUSTOM_API_INTEGRATION,
    name: "Integração com API Externa (OpenAPI)", 
    icon: Network, 
    description: "Permite interagir com serviços web externos (via OpenAPI, requer fluxo Genkit). Requer URL do esquema OpenAPI e, opcionalmente, chave API.", 
    category: "Integration", // Added category
    hasConfig: true, 
    configType: "openApi",
    requiresAuth: true, // Can be true if API key is often needed
    genkitToolName: GENKIT_TOOL_NAME_CUSTOM_API_CALL,
    configFields: [
      {
        name: CONFIG_FIELD_OPENAPI_SPEC_URL,
        label: "URL do Spec OpenAPI",
        type: "text",
        required: true,
        defaultValue: "https://petstore.swagger.io/v2/swagger.json",
        description: "URL do esquema OpenAPI (Swagger)"
      },
      {
        name: CONFIG_FIELD_OPENAPI_API_KEY,
        label: "Chave de API (opcional)",
        type: "text", // Changed from password
        required: false,
        defaultValue: "",
        description: "Chave de autenticação para a API"
      },
      {
        name: CONFIG_FIELD_ALLOWED_HTTP_METHODS,
        label: "Allowed HTTP Methods (comma-separated)",
        type: "textarea",
        defaultValue: "GET,POST",
        description: "Define allowed HTTP methods like GET, POST, PUT, DELETE. Leave empty for all."
      }
    ]
  },
  {
    id: TOOL_ID_DATABASE_ACCESS,
    name: "Acesso a Banco de Dados (SQL)", 
    icon: Database, 
    description: "Permite consultar e interagir com bancos de dados SQL (requer fluxo Genkit). Requer configuração detalhada da conexão.", 
    category: "Data", // Added category
    hasConfig: true, 
    configType: "database",
    requiresAuth: true,
    genkitToolName: GENKIT_TOOL_NAME_DATABASE_QUERY,
    configFields: [
      {
        name: CONFIG_FIELD_DB_TYPE,
        label: "Tipo de Banco",
        type: "select",
        required: true,
        options: [
          { label: "PostgreSQL", value: "postgres" },
          { label: "MySQL", value: "mysql" },
          { label: "SQLite", value: "sqlite" },
          { label: "Outro", value: "other" }
        ],
        defaultValue: "postgres",
        description: "Tipo de banco de dados SQL"
      },
      {
        name: CONFIG_FIELD_DB_HOST,
        label: "Host do Banco",
        type: "text",
        required: true,
        defaultValue: "localhost",
        description: "Endereço do servidor do banco de dados"
      },
      {
        name: CONFIG_FIELD_DB_PORT,
        label: "Porta",
        type: "text", // Could be number, but text is safer for various inputs
        required: true,
        defaultValue: "5432",
        description: "Porta de conexão do banco de dados"
      },
      {
        name: CONFIG_FIELD_DB_NAME,
        label: "Nome do Banco",
        type: "text",
        required: true,
        defaultValue: "meu_banco",
        description: "Nome do banco de dados"
      },
      {
        name: CONFIG_FIELD_DB_USER,
        label: "Usuário",
        type: "text",
        required: true,
        defaultValue: "usuario",
        description: "Nome de usuário para acesso ao banco"
      },
      {
        name: CONFIG_FIELD_DB_PASSWORD,
        label: "Senha",
        type: "text", // Changed from password
        required: true,
        defaultValue: "",
        description: "Senha de acesso ao banco de dados"
      },
      {
        name: CONFIG_FIELD_DB_DESCRIPTION,
        label: "Descrição (opcional)",
        type: "textarea",
        required: false,
        defaultValue: "Tabela 'usuarios' com colunas id, nome, email...",
        description: "Descrição das tabelas e estrutura do banco"
      },
      {
        name: CONFIG_FIELD_ALLOWED_SQL_OPERATIONS,
        label: "Allowed SQL Operations (comma-separated)",
        type: "textarea",
        defaultValue: "SELECT,INSERT",
        description: "Define allowed SQL commands like SELECT, INSERT, UPDATE, DELETE. Leave empty for all allowed by DB user."
      }
    ]
  },
  {
    id: TOOL_ID_CODE_EXECUTOR,
    name: "Execução de Código (Python Sandbox)", 
    icon: Code2, 
    description: "Permite executar trechos de código Python em um ambiente seguro (requer fluxo Genkit). Pode requerer configuração do endpoint do sandbox.", 
    category: "Development", // Added category
    hasConfig: true, 
    configType: "codeExecutor",
    requiresAuth: false, // Assuming sandbox endpoint itself might be protected
    genkitToolName: GENKIT_TOOL_NAME_CODE_EXECUTE,
    configFields: [
      {
        name: CONFIG_FIELD_SANDBOX_ENDPOINT,
        label: "Endpoint do Sandbox",
        type: "text",
        required: true,
        defaultValue: "https://sandbox.exemplo.com/execute",
        description: "URL para o serviço de execução de código"
      }
    ]
  },
  // Tools based on actual Genkit tool instances
  {
    id: "dateTimeTool", // Matches Genkit tool name if not specified otherwise
    name: "Date & Time Operations",
    icon: Clock,
    description: dateTimeTool.description || "Provides functions for getting current date/time, adding days, and formatting dates.",
    category: "Utilities",
    hasConfig: false,
    genkitToolName: dateTimeTool.name,
    genkitTool: dateTimeTool, // Storing the actual tool
    inputSchema: JSON.stringify(dateTimeTool.inputSchema?.jsonSchema || {}), // Attempt to get schema
    outputSchema: JSON.stringify(dateTimeTool.outputSchema?.jsonSchema || {}),
  },
  {
    id: "petStoreTool", // Matches Genkit tool name
    name: "Pet Store API (Mocked)",
    icon: Network,
    description: petStoreTool.description || "Provides mocked functions for interacting with a Pet Store API.",
    category: "API Integration",
    hasConfig: false,
    genkitToolName: petStoreTool.name,
    genkitTool: petStoreTool,
    inputSchema: JSON.stringify(petStoreTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(petStoreTool.outputSchema?.jsonSchema || {}),
  },
  {
    id: "fileIoTool", // Matches Genkit tool name
    name: "File I/O (Simulated)",
    icon: FileText,
    description: fileIoTool.description || "Provides simulated functions for reading and writing files.",
    category: "Utilities",
    hasConfig: false,
    genkitToolName: fileIoTool.name,
    genkitTool: fileIoTool,
    inputSchema: JSON.stringify(fileIoTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(fileIoTool.outputSchema?.jsonSchema || {}),
  },
  {
    id: TOOL_ID_VIDEO_STREAM_MONITOR,
    name: "Monitor de Stream de Vídeo (Simulado)",
    icon: Video,
    description: "Inicia o monitoramento simulado de um fluxo de vídeo para detectar eventos.",
    category: "Media", // Added category
    hasConfig: false,
    genkitToolName: GENKIT_TOOL_NAME_VIDEO_STREAM_MONITOR,
    configFields: [] // Explicitly empty if no config
  },
  {
    id: 'imageClassifierTool',
    name: 'Image Classifier (Simulated)',
    icon: Video, // Consider a more appropriate icon like Cpu or Brain if available/makes sense
    description: imageClassifierTool.description || 'Simulates image classification, returning a label and confidence.',
    category: "AI", // Added category
    hasConfig: false,
    genkitToolName: imageClassifierTool.name,
    genkitTool: imageClassifierTool,
    inputSchema: JSON.stringify(imageClassifierTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(imageClassifierTool.outputSchema?.jsonSchema || {}),
  },
  {
    id: 'textSummarizerTool',
    name: 'Text Summarizer (LLM)',
    icon: Brain,
    description: textSummarizerTool.description || 'Summarizes long text using a Genkit LLM.',
    category: "AI", // Added category
    hasConfig: false,
    genkitToolName: textSummarizerTool.name,
    genkitTool: textSummarizerTool,
    inputSchema: JSON.stringify(textSummarizerTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(textSummarizerTool.outputSchema?.jsonSchema || {}),
  },
  {
    id: 'sentimentAnalyzerTool',
    name: 'Sentiment Analyzer (Simulated)',
    icon: Smile,
    description: sentimentAnalyzerTool.description || 'Simulates sentiment analysis of text, returning positive, negative, or neutral.',
    category: "AI", // Added category
    hasConfig: false,
    genkitToolName: sentimentAnalyzerTool.name,
    genkitTool: sentimentAnalyzerTool,
    inputSchema: JSON.stringify(sentimentAnalyzerTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(sentimentAnalyzerTool.outputSchema?.jsonSchema || {}),
  },
  {
    id: 'aiFeedbackTool',
    name: 'AI Feedback Loop (Simulated)',
    icon: ThumbsUp,
    description: aiFeedbackTool.description || 'Simulates an AI feedback loop, allowing users to rate agent responses.',
    category: "AI", // Added category
    hasConfig: false,
    genkitToolName: aiFeedbackTool.name,
    genkitTool: aiFeedbackTool,
    inputSchema: JSON.stringify(aiFeedbackTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(aiFeedbackTool.outputSchema?.jsonSchema || {}),
  },
  {
    id: stringReverserTool.name, // Use tool's defined name for ID
    name: 'String Reverser (TDD Example)',
    description: stringReverserTool.description,
    icon: TestTubeDiagonal,
    category: "Examples", // Consistent category
    hasConfig: false,
    genkitToolName: stringReverserTool.name,
    genkitTool: stringReverserTool,
    inputSchema: JSON.stringify(stringReverserTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(stringReverserTool.outputSchema?.jsonSchema || {}),
    // Removed 'type: utility' as category serves this purpose
  },
  {
    id: speechToTextTool.name,
    name: "Speech to Text (Simulated)",
    icon: Mic,
    description: speechToTextTool.description || "Simulates converting audio data to text.",
    category: "Media",
    hasConfig: false,
    genkitToolName: speechToTextTool.name,
    genkitTool: speechToTextTool,
    inputSchema: JSON.stringify(speechToTextTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(speechToTextTool.outputSchema?.jsonSchema || {}),
  },
  {
    id: textToSpeechTool.name,
    name: "Text to Speech (Simulated)",
    icon: Volume2,
    description: textToSpeechTool.description || "Simulates converting text to audio.",
    category: "Media",
    hasConfig: false,
    genkitToolName: textToSpeechTool.name,
    genkitTool: textToSpeechTool,
    inputSchema: JSON.stringify(textToSpeechTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(textToSpeechTool.outputSchema?.jsonSchema || {}),
  },
  {
    id: videoSummarizerTool.name,
    name: "Video Summarizer (Simulated)",
    icon: Film,
    description: videoSummarizerTool.description || "Simulates summarizing a video from a URL.",
    category: "Media",
    hasConfig: false,
    genkitToolName: videoSummarizerTool.name,
    genkitTool: videoSummarizerTool,
    inputSchema: JSON.stringify(videoSummarizerTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(videoSummarizerTool.outputSchema?.jsonSchema || {}),
  },
  {
    id: gcsListBucketsTool.name,
    name: "GCS List Buckets (Simulated)",
    icon: Cloud,
    description: gcsListBucketsTool.description || "Simulates listing Google Cloud Storage buckets.",
    category: "Cloud",
    hasConfig: false,
    genkitToolName: gcsListBucketsTool.name,
    genkitTool: gcsListBucketsTool,
    inputSchema: JSON.stringify(gcsListBucketsTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(gcsListBucketsTool.outputSchema?.jsonSchema || {}),
  },
  {
    id: gcsUploadFileTool.name,
    name: "GCS Upload File (Simulated)",
    icon: Cloud,
    description: gcsUploadFileTool.description || "Simulates uploading a file to Google Cloud Storage.",
    category: "Cloud",
    hasConfig: false,
    genkitToolName: gcsUploadFileTool.name,
    genkitTool: gcsUploadFileTool,
    inputSchema: JSON.stringify(gcsUploadFileTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(gcsUploadFileTool.outputSchema?.jsonSchema || {}),
  },
  {
    id: customFunctionInvokerTool.name,
    name: "Custom Python Function Invoker (Simulated)",
    icon: FunctionSquare,
    description: customFunctionInvokerTool.description || "SIMULATED: Invokes user-defined Python code.",
    category: "Advanced",
    hasConfig: false,
    genkitToolName: customFunctionInvokerTool.name,
    genkitTool: customFunctionInvokerTool,
    inputSchema: JSON.stringify(customFunctionInvokerTool.inputSchema?.jsonSchema || {}),
    outputSchema: JSON.stringify(customFunctionInvokerTool.outputSchema?.jsonSchema || {}),
  }
];

/**
 * Converts mcpTools to conform to AvailableTool interface.
 * Ensures icon components are used and schemas are stringified.
 */
const mcpToolsWithIcons: AvailableTool[] = mcpTools.map((tool: MCPTool): AvailableTool => ({
  id: tool.id,
  name: tool.name,
  description: tool.description,
  category: tool.category || "MCP", // Default category if not provided
  icon: getIconComponent(tool.iconName), // Ensure getIconComponent returns LucideIcon
  hasConfig: tool.configFields && tool.configFields.length > 0,
  configType: tool.configType || (tool.configFields && tool.configFields.length > 0 ? "form" : undefined),
  configFields: tool.configFields?.map(cf => ({ // Ensure MCPTool's configFields match ToolConfigField structure
    name: cf.name, // Assuming MCPTool's config fields have these properties
    label: cf.label,
    type: cf.type as ToolConfigField['type'], // Cast if necessary, ensure types are compatible
    defaultValue: cf.defaultValue,
    options: cf.options,
    required: cf.required,
    description: cf.description,
  })),
  requiresAuth: tool.requiresAuth || false,
  // Assuming mcpTools don't directly expose Genkit tool instances or schemas in the same way
  // genkitToolName: tool.genkitToolName, // If available on MCPTool
  // inputSchema: stringifySchema(tool.inputSchema),
  // outputSchema: stringifySchema(tool.outputSchema),
}));

/**
 * All available tools (standard + MCP)
 */
export const allTools: AvailableTool[] = [
  ...standardTools,
  ...mcpToolsWithIcons
];