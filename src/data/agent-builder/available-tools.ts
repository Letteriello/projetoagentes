import { AvailableTool } from "@/types/tool-types";
import { mcpTools } from "@/types/mcp-tools";
// Merged lucide-react imports and added Video, Clock, Smile, ThumbsUp, TestTubeDiagonal, Mic, Volume2, Film, Cloud, FunctionSquare
import { LucideIcon, HelpCircle, Search, Calculator, FileText, CalendarDays, Network, Database, Code2, Terminal, Cpu, Brain, Globe, Clock, Video, Smile, ThumbsUp, TestTubeDiagonal, Mic, Volume2, Film, Cloud, FunctionSquare } from "lucide-react"; // Added Mic, Volume2, Film, Cloud, FunctionSquare
import { dateTimeTool } from "../../ai/tools/date-time-tool";
import { petStoreTool } from "../../ai/tools/openapi-tool";
import { fileIoTool } from "../../ai/tools/file-io-tool";
import { imageClassifierTool } from '../../ai/tools/image-classifier-tool';
import { textSummarizerTool } from '../../ai/tools/text-summarizer-tool';
import { sentimentAnalyzerTool } from '../../ai/tools/sentiment-analyzer-tool';
import { aiFeedbackTool } from '../../ai/tools/ai-feedback-tool';
import { stringReverserTool } from '@/ai/tools/example-tdd-tool'; // Task 9.7
import { speechToTextTool, textToSpeechTool } from '../../ai/tools/speech-tools'; // Speech Tools
import { videoSummarizerTool } from '../../ai/tools/video-summarizer-tool'; // Video Summarizer Tool
import { gcsListBucketsTool, gcsUploadFileTool } from '../../ai/tools/gcs-tool'; // GCS Tools
import { customFunctionInvokerTool } from '../../ai/tools/custom-function-invoker'; // Custom Function Invoker

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
    video: Video,
    smile: Smile,
    thumbsup: ThumbsUp,
    testtubediagonal: TestTubeDiagonal, // Added for TDD tool
    mic: Mic, // Added Mic
    volume2: Volume2, // Added Volume2 (as VolumeUp)
    film: Film, // Added Film
    cloud: Cloud, // Added Cloud
    functionsquare: FunctionSquare, // Added FunctionSquare
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
    id: "dateTimeTool",
    name: "Date & Time Operations",
    icon: Clock,
    description: "Provides functions for getting current date/time, adding days, and formatting dates.",
    hasConfig: false,
    category: "Utilities",
    value: dateTimeTool,
    genkitTool: dateTimeTool
  },
  {
    id: "petStoreTool",
    name: "Pet Store API (Mocked)",
    icon: Network,
    description: "Provides mocked functions for interacting with a Pet Store API (e.g., getPetById, addPet).",
    hasConfig: false,
    category: "API Integration",
    value: petStoreTool,
    genkitTool: petStoreTool
  },
  {
    id: "fileIoTool",
    name: "File I/O (Simulated)",
    icon: FileText,
    description: "Provides simulated functions for reading and writing files.",
    hasConfig: false,
    category: "Utilities",
    value: fileIoTool,
    genkitTool: fileIoTool
  },
  {
    id: TOOL_ID_VIDEO_STREAM_MONITOR,
    name: "Monitor de Stream de Vídeo (Simulado)",
    icon: Video,
    description: "Inicia o monitoramento simulado de um fluxo de vídeo para detectar eventos.",
    hasConfig: false,
    genkitToolName: GENKIT_TOOL_NAME_VIDEO_STREAM_MONITOR,
    configFields: []
  },
  {
    id: 'imageClassifierTool',
    name: 'Image Classifier (Simulated)',
    icon: Video,
    description: 'Simulates image classification, returning a label and confidence.',
    hasConfig: false,
    genkitToolName: 'imageClassifier', // Assuming the tool's name property is 'imageClassifier'
    value: imageClassifierTool,
    genkitTool: imageClassifierTool,
  },
  {
    id: 'textSummarizerTool',
    name: 'Text Summarizer (LLM)',
    icon: Brain,
    description: 'Summarizes long text using a Genkit LLM.',
    hasConfig: false,
    genkitToolName: textSummarizerTool.name, // Using .name from the tool definition
    value: textSummarizerTool,
    genkitTool: textSummarizerTool,
  },
  {
    id: 'sentimentAnalyzerTool',
    name: 'Sentiment Analyzer (Simulated)',
    icon: Smile,
    description: 'Simulates sentiment analysis of text, returning positive, negative, or neutral.',
    hasConfig: false,
    genkitToolName: sentimentAnalyzerTool.name,
    value: sentimentAnalyzerTool,
    genkitTool: sentimentAnalyzerTool,
  },
  {
    id: 'aiFeedbackTool',
    name: 'AI Feedback Loop (Simulated)',
    icon: ThumbsUp,
    description: 'Simulates an AI feedback loop, allowing users to rate agent responses.',
    hasConfig: false,
    genkitToolName: aiFeedbackTool.name,
    value: aiFeedbackTool,
    genkitTool: aiFeedbackTool,
  },
  { // Task 9.7: Adding stringReverserTool
    id: 'stringReverser', // Matches the name property in stringReverserTool
    name: 'String Reverser (TDD Example)',
    description: stringReverserTool.description,
    icon: TestTubeDiagonal, // Uses the getIconComponent mapping
    type: 'utility', // Or 'example', consistent with how other types might be used for filtering/display
    // inputSchema and outputSchema are typically not stored directly as Zod objects here.
    // The Agent Builder UI might rely on fetching schema details from an API or from the tool's definition at runtime.
    // For now, leaving them as undefined or empty objects if not used by UI directly from this array.
    // inputSchema: stringReverserTool.inputSchema, // This would store the Zod object
    // outputSchema: stringReverserTool.outputSchema,
    hasConfig: false,
    genkitToolName: stringReverserTool.name, // Important for linking to the Genkit tool
    value: stringReverserTool, // The actual tool instance, if needed by parts of the UI
    genkitTool: stringReverserTool, // Storing the tool for consistency
    category: "Examples", // Added category
  },
  {
    id: speechToTextTool.name, // Using tool name as ID
    name: "Speech to Text (Simulated)",
    icon: Mic, // Using imported Mic icon
    description: "Simulates converting audio data to text. Takes an audio data URI and returns a mock transcription.",
    hasConfig: false,
    category: "Media",
    genkitToolName: speechToTextTool.name,
    value: speechToTextTool, // Storing the actual tool instance
    genkitTool: speechToTextTool, // Storing the tool for consistency
  },
  {
    id: textToSpeechTool.name, // Using tool name as ID
    name: "Text to Speech (Simulated)",
    icon: Volume2, // Using imported Volume2 icon (representing VolumeUp)
    description: "Simulates converting text to audio. Takes text and returns a mock audio data URI.",
    hasConfig: false,
    category: "Media",
    genkitToolName: textToSpeechTool.name,
    value: textToSpeechTool, // Storing the actual tool instance
    genkitTool: textToSpeechTool, // Storing the tool for consistency
  },
  {
    id: videoSummarizerTool.name, // Using tool name as ID
    name: "Video Summarizer (Simulated)",
    icon: Film, // Using imported Film icon
    description: "Simulates summarizing a video from a URL. Takes a video URL and returns a mock text summary.",
    hasConfig: false,
    category: "Media", // Or "AI"
    genkitToolName: videoSummarizerTool.name,
    value: videoSummarizerTool, // Storing the actual tool instance
    genkitTool: videoSummarizerTool, // Storing the tool for consistency
  },
  {
    id: gcsListBucketsTool.name,
    name: "GCS List Buckets (Simulated)",
    icon: Cloud, // Using imported Cloud icon
    description: "Simulates listing Google Cloud Storage buckets. Optionally filters by prefix.",
    hasConfig: false,
    category: "Cloud",
    genkitToolName: gcsListBucketsTool.name,
    value: gcsListBucketsTool,
    genkitTool: gcsListBucketsTool,
  },
  {
    id: gcsUploadFileTool.name,
    name: "GCS Upload File (Simulated)",
    icon: Cloud, // Using imported Cloud icon
    description: "Simulates uploading a file to Google Cloud Storage.",
    hasConfig: false,
    category: "Cloud",
    genkitToolName: gcsUploadFileTool.name,
    value: gcsUploadFileTool,
    genkitTool: gcsUploadFileTool,
  },
  {
    id: customFunctionInvokerTool.name, // e.g., 'customPythonFunctionInvoker'
    name: "Custom Python Function Invoker (Simulated)",
    icon: FunctionSquare, // Using imported FunctionSquare icon
    description: "SIMULATED: 'Invokes' user-defined Python code. CRITICAL SECURITY WARNING: Highly dangerous if not properly sandboxed. This is a simulation ONLY. For advanced users to understand concepts.",
    hasConfig: false, // Complex security setup means no simple UI config.
    category: "Advanced",
    genkitToolName: customFunctionInvokerTool.name,
    value: customFunctionInvokerTool,
    genkitTool: customFunctionInvokerTool,
    // The `AvailableTool` type would need a `warning` field for this to be formally used.
    // For now, the prominent warning in the description is the primary method.
    // warning: "CRITICAL SECURITY RISK: Use with extreme caution. For simulation and understanding concepts only."
  }
];

/**
 * Função para converter os mcpTools (com iconName) para o formato AvailableTool (com icon)
 */
const mcpToolsWithIcons: AvailableTool[] = mcpTools.map(tool => ({
  ...tool,
  icon: getIconComponent(tool.iconName)
}));

/**
 * Todas as ferramentas disponíveis (padrão + MCP)
 */
export const allTools: AvailableTool[] = [
  ...standardTools,
  ...mcpToolsWithIcons
];