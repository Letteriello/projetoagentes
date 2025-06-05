// src/data/available-tools.ts
import { AvailableTool, ToolConfigField } from '@/types/tool-core'; // Adjusted path
import { mcpTools as mcpToolExamples } from './mcp-tool-examples'; // Adjusted path

// Importing actual Genkit tool instances - paths might need adjustment
// Assuming these paths are correct relative to src/ or an alias like @/ is configured
import { dateTimeTool } from '@/ai/tools/date-time-tool';
import { petStoreTool } from '@/ai/tools/openapi-tool';
import { fileIoTool } from '@/ai/tools/file-io-tool';
import { imageClassifierTool } from '@/ai/tools/image-classifier-tool';
import { textSummarizerTool } from '@/ai/tools/text-summarizer-tool';
import { sentimentAnalyzerTool } from '@/ai/tools/sentiment-analyzer-tool';
import { aiFeedbackTool } from '@/ai/tools/ai-feedback-tool';
import { stringReverserTool } from '@/ai/tools/example-tdd-tool';
import { speechToTextTool, textToSpeechTool } from '@/ai/tools/speech-tools';
import { videoSummarizerTool } from '@/ai/tools/video-summarizer-tool';
import { gcsListBucketsTool, gcsUploadFileTool } from '@/ai/tools/gcs-tool';
import { customFunctionInvokerTool } from '@/ai/tools/custom-function-invoker';

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
} from '@/lib/constants'; // Assuming constants are in lib

// Helper function to safely stringify schemas (remains internal if only used here)
const stringifySchema = (schema: any): string | undefined => {
  if (!schema) return undefined;
  if (typeof schema === 'string') return schema;
  try {
    return JSON.stringify(schema);
  } catch (error) {
    console.error("Failed to stringify schema:", error);
    return undefined;
  }
};

const standardTools: AvailableTool[] = [
  {
    id: TOOL_ID_WEB_SEARCH,
    name: "Busca na Web (Google)",
    icon: "Search", // Changed from Lucide component to string name
    description: "Permite ao agente pesquisar na internet (via Genkit). Esta ferramenta tentará usar as variáveis de ambiente GOOGLE_API_KEY e GOOGLE_CSE_ID para funcionar. A configuração na UI serve para documentar e guiar o prompt do sistema.",
    category: "Web",
    hasConfig: true,
    configType: "webSearch",
    requiresAuth: true,
    genkitToolName: GENKIT_TOOL_NAME_WEB_SEARCH,
    configFields: [
      { name: CONFIG_FIELD_GOOGLE_API_KEY, label: "Chave de API do Google", type: "text", required: true, defaultValue: "", description: "Chave de API do Google para Custom Search" },
      { name: CONFIG_FIELD_GOOGLE_CSE_ID, label: "ID do Custom Search Engine", type: "text", required: true, defaultValue: "", description: "ID do mecanismo de busca personalizado" },
      { name: CONFIG_FIELD_ALLOWED_DOMAINS, label: "Allowed Domains (comma-separated)", type: "textarea", defaultValue: "", description: "List of domains the search is restricted to. E.g., 'example.com,another.org'" },
      { name: CONFIG_FIELD_BLOCKED_DOMAINS, label: "Blocked Domains (comma-separated)", type: "textarea", defaultValue: "", description: "List of domains to exclude from search. E.g., 'undesired.com,restricted.net'" }
    ]
  },
  {
    id: TOOL_ID_CALCULATOR,
    name: "Calculadora",
    icon: "Calculator", // Changed to string name
    description: "Permite realizar cálculos matemáticos (via função Genkit).",
    category: "Utilities",
    hasConfig: false,
    genkitToolName: GENKIT_TOOL_NAME_CALCULATOR,
  },
  {
    id: TOOL_ID_KNOWLEDGE_BASE,
    name: "Consulta à Base de Conhecimento (RAG)",
    icon: "FileText", // Changed to string name
    description: "Permite buscar em bases de conhecimento ou documentos (ex: RAG via Genkit). Requer configuração do ID da base e, possivelmente, chaves de API.",
    category: "Data",
    hasConfig: true,
    configType: "knowledgeBase",
    requiresAuth: false,
    genkitToolName: GENKIT_TOOL_NAME_KNOWLEDGE_BASE_RETRIEVE,
    configFields: [
      { name: CONFIG_FIELD_KNOWLEDGE_BASE_ID, label: "ID da Base de Conhecimento", type: "text", required: true, defaultValue: "", description: "Identificador único da base de conhecimento" }
    ]
  },
  {
    id: TOOL_ID_CALENDAR_ACCESS,
    name: "Acesso à Agenda/Calendário",
    icon: "CalendarDays", // Changed to string name
    description: "Permite verificar ou criar eventos na agenda (requer fluxo Genkit e auth). Requer configuração do endpoint da API ou ID do fluxo.",
    category: "Productivity",
    hasConfig: true,
    configType: "calendarAccess",
    requiresAuth: true,
    genkitToolName: GENKIT_TOOL_NAME_CALENDAR_GET_EVENTS,
    configFields: [
      { name: CONFIG_FIELD_CALENDAR_API_ENDPOINT, label: "Endpoint da API de Calendário", type: "text", required: true, defaultValue: "https://api.exemplo.com/calendar", description: "URL para o serviço de agenda/calendário" }
    ]
  },
  {
    id: TOOL_ID_CUSTOM_API_INTEGRATION,
    name: "Integração com API Externa (OpenAPI)",
    icon: "Network", // Changed to string name
    description: "Permite interagir com serviços web externos (via OpenAPI, requer fluxo Genkit). Requer URL do esquema OpenAPI e, opcionalmente, chave API.",
    category: "Integration",
    hasConfig: true,
    configType: "openApi",
    requiresAuth: true,
    genkitToolName: GENKIT_TOOL_NAME_CUSTOM_API_CALL,
    configFields: [
      { name: CONFIG_FIELD_OPENAPI_SPEC_URL, label: "URL do Spec OpenAPI", type: "text", required: true, defaultValue: "https://petstore.swagger.io/v2/swagger.json", description: "URL do esquema OpenAPI (Swagger)" },
      { name: CONFIG_FIELD_OPENAPI_API_KEY, label: "Chave de API (opcional)", type: "text", required: false, defaultValue: "", description: "Chave de autenticação para a API" },
      { name: CONFIG_FIELD_ALLOWED_HTTP_METHODS, label: "Allowed HTTP Methods (comma-separated)", type: "textarea", defaultValue: "GET,POST", description: "Define allowed HTTP methods like GET, POST, PUT, DELETE. Leave empty for all." }
    ]
  },
  {
    id: TOOL_ID_DATABASE_ACCESS,
    name: "Acesso a Banco de Dados (SQL)",
    icon: "Database", // Changed to string name
    description: "Permite consultar e interagir com bancos de dados SQL (requer fluxo Genkit). Requer configuração detalhada da conexão.",
    category: "Data",
    hasConfig: true,
    configType: "database",
    requiresAuth: true,
    genkitToolName: GENKIT_TOOL_NAME_DATABASE_QUERY,
    configFields: [
      { name: CONFIG_FIELD_DB_TYPE, label: "Tipo de Banco", type: "select", required: true, options: [{ label: "PostgreSQL", value: "postgres" }, { label: "MySQL", value: "mysql" }, { label: "SQLite", value: "sqlite" }, { label: "Outro", value: "other" }], defaultValue: "postgres", description: "Tipo de banco de dados SQL" },
      { name: CONFIG_FIELD_DB_HOST, label: "Host do Banco", type: "text", required: true, defaultValue: "localhost", description: "Endereço do servidor do banco de dados" },
      { name: CONFIG_FIELD_DB_PORT, label: "Porta", type: "text", required: true, defaultValue: "5432", description: "Porta de conexão do banco de dados" },
      { name: CONFIG_FIELD_DB_NAME, label: "Nome do Banco", type: "text", required: true, defaultValue: "meu_banco", description: "Nome do banco de dados" },
      { name: CONFIG_FIELD_DB_USER, label: "Usuário", type: "text", required: true, defaultValue: "usuario", description: "Nome de usuário para acesso ao banco" },
      { name: CONFIG_FIELD_DB_PASSWORD, label: "Senha", type: "text", required: true, defaultValue: "", description: "Senha de acesso ao banco de dados" },
      { name: CONFIG_FIELD_DB_DESCRIPTION, label: "Descrição (opcional)", type: "textarea", required: false, defaultValue: "Tabela 'usuarios' com colunas id, nome, email...", description: "Descrição das tabelas e estrutura do banco" },
      { name: CONFIG_FIELD_ALLOWED_SQL_OPERATIONS, label: "Allowed SQL Operations (comma-separated)", type: "textarea", defaultValue: "SELECT,INSERT", description: "Define allowed SQL commands like SELECT, INSERT, UPDATE, DELETE. Leave empty for all allowed by DB user." }
    ]
  },
  {
    id: TOOL_ID_CODE_EXECUTOR,
    name: "Execução de Código (Python Sandbox)",
    icon: "Code2", // Changed to string name
    description: "Permite executar trechos de código Python em um ambiente seguro (requer fluxo Genkit). Pode requerer configuração do endpoint do sandbox.",
    category: "Development",
    hasConfig: true,
    configType: "codeExecutor",
    requiresAuth: false,
    genkitToolName: GENKIT_TOOL_NAME_CODE_EXECUTE,
    configFields: [
      { name: CONFIG_FIELD_SANDBOX_ENDPOINT, label: "Endpoint do Sandbox", type: "text", required: true, defaultValue: "https://sandbox.exemplo.com/execute", description: "URL para o serviço de execução de código" }
    ]
  },
  {
    id: "dateTimeTool", name: "Date & Time Operations", icon: "Clock", description: dateTimeTool.description || "Provides functions for getting current date/time, adding days, and formatting dates.", category: "Utilities", hasConfig: false, genkitToolName: dateTimeTool.name, genkitTool: dateTimeTool, inputSchema: stringifySchema(dateTimeTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(dateTimeTool.outputSchema?.jsonSchema),
  },
  {
    id: "petStoreTool", name: "Pet Store API (Mocked)", icon: "Network", description: petStoreTool.description || "Provides mocked functions for interacting with a Pet Store API.", category: "API Integration", hasConfig: false, genkitToolName: petStoreTool.name, genkitTool: petStoreTool, inputSchema: stringifySchema(petStoreTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(petStoreTool.outputSchema?.jsonSchema),
  },
  {
    id: "fileIoTool", name: "File I/O (Simulated)", icon: "FileText", description: fileIoTool.description || "Provides simulated functions for reading and writing files.", category: "Utilities", hasConfig: false, genkitToolName: fileIoTool.name, genkitTool: fileIoTool, inputSchema: stringifySchema(fileIoTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(fileIoTool.outputSchema?.jsonSchema),
  },
  {
    id: TOOL_ID_VIDEO_STREAM_MONITOR, name: "Monitor de Stream de Vídeo (Simulado)", icon: "Video", description: "Inicia o monitoramento simulado de um fluxo de vídeo para detectar eventos.", category: "Media", hasConfig: false, genkitToolName: GENKIT_TOOL_NAME_VIDEO_STREAM_MONITOR, configFields: []
  },
  {
    id: 'imageClassifierTool', name: 'Image Classifier (Simulated)', icon: "Cpu", description: imageClassifierTool.description || 'Simulates image classification, returning a label and confidence.', category: "AI", hasConfig: false, genkitToolName: imageClassifierTool.name, genkitTool: imageClassifierTool, inputSchema: stringifySchema(imageClassifierTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(imageClassifierTool.outputSchema?.jsonSchema),
  },
  {
    id: 'textSummarizerTool', name: 'Text Summarizer (LLM)', icon: "Brain", description: textSummarizerTool.description || 'Summarizes long text using a Genkit LLM.', category: "AI", hasConfig: false, genkitToolName: textSummarizerTool.name, genkitTool: textSummarizerTool, inputSchema: stringifySchema(textSummarizerTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(textSummarizerTool.outputSchema?.jsonSchema),
  },
  {
    id: 'sentimentAnalyzerTool', name: 'Sentiment Analyzer (Simulated)', icon: "Smile", description: sentimentAnalyzerTool.description || 'Simulates sentiment analysis of text, returning positive, negative, or neutral.', category: "AI", hasConfig: false, genkitToolName: sentimentAnalyzerTool.name, genkitTool: sentimentAnalyzerTool, inputSchema: stringifySchema(sentimentAnalyzerTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(sentimentAnalyzerTool.outputSchema?.jsonSchema),
  },
  {
    id: 'aiFeedbackTool', name: 'AI Feedback Loop (Simulated)', icon: "ThumbsUp", description: aiFeedbackTool.description || 'Simulates an AI feedback loop, allowing users to rate agent responses.', category: "AI", hasConfig: false, genkitToolName: aiFeedbackTool.name, genkitTool: aiFeedbackTool, inputSchema: stringifySchema(aiFeedbackTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(aiFeedbackTool.outputSchema?.jsonSchema),
  },
  {
    id: stringReverserTool.name, name: 'String Reverser (TDD Example)', description: stringReverserTool.description, icon: "TestTubeDiagonal", category: "Examples", hasConfig: false, genkitToolName: stringReverserTool.name, genkitTool: stringReverserTool, inputSchema: stringifySchema(stringReverserTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(stringReverserTool.outputSchema?.jsonSchema),
  },
  {
    id: speechToTextTool.name, name: "Speech to Text (Simulated)", icon: "Mic", description: speechToTextTool.description || "Simulates converting audio data to text.", category: "Media", hasConfig: false, genkitToolName: speechToTextTool.name, genkitTool: speechToTextTool, inputSchema: stringifySchema(speechToTextTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(speechToTextTool.outputSchema?.jsonSchema),
  },
  {
    id: textToSpeechTool.name, name: "Text to Speech (Simulated)", icon: "Volume2", description: textToSpeechTool.description || "Simulates converting text to audio.", category: "Media", hasConfig: false, genkitToolName: textToSpeechTool.name, genkitTool: textToSpeechTool, inputSchema: stringifySchema(textToSpeechTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(textToSpeechTool.outputSchema?.jsonSchema),
  },
  {
    id: videoSummarizerTool.name, name: "Video Summarizer (Simulated)", icon: "Film", description: videoSummarizerTool.description || "Simulates summarizing a video from a URL.", category: "Media", hasConfig: false, genkitToolName: videoSummarizerTool.name, genkitTool: videoSummarizerTool, inputSchema: stringifySchema(videoSummarizerTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(videoSummarizerTool.outputSchema?.jsonSchema),
  },
  {
    id: gcsListBucketsTool.name, name: "GCS List Buckets (Simulated)", icon: "Cloud", description: gcsListBucketsTool.description || "Simulates listing Google Cloud Storage buckets.", category: "Cloud", hasConfig: false, genkitToolName: gcsListBucketsTool.name, genkitTool: gcsListBucketsTool, inputSchema: stringifySchema(gcsListBucketsTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(gcsListBucketsTool.outputSchema?.jsonSchema),
  },
  {
    id: gcsUploadFileTool.name, name: "GCS Upload File (Simulated)", icon: "Cloud", description: gcsUploadFileTool.description || "Simulates uploading a file to Google Cloud Storage.", category: "Cloud", hasConfig: false, genkitToolName: gcsUploadFileTool.name, genkitTool: gcsUploadFileTool, inputSchema: stringifySchema(gcsUploadFileTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(gcsUploadFileTool.outputSchema?.jsonSchema),
  },
  {
    id: customFunctionInvokerTool.name, name: "Custom Python Function Invoker (Simulated)", icon: "FunctionSquare", description: customFunctionInvokerTool.description || "SIMULATED: Invokes user-defined Python code.", category: "Advanced", hasConfig: false, genkitToolName: customFunctionInvokerTool.name, genkitTool: customFunctionInvokerTool, inputSchema: stringifySchema(customFunctionInvokerTool.inputSchema?.jsonSchema), outputSchema: stringifySchema(customFunctionInvokerTool.outputSchema?.jsonSchema),
  }
];

// Convert mcpToolExamples (Partial<AvailableTool>[]) to AvailableTool[]
// For now, we cast them, assuming they have all required fields or they will be handled appropriately by consumers.
// Icon names are already strings in mcp-tool-examples.ts.
const mcpToolsProcessed: AvailableTool[] = mcpToolExamples.map(tool => ({
  ...tool,
  // Ensure all required fields of AvailableTool are present, adding defaults if necessary
  id: tool.id || `mcp-tool-${Math.random().toString(36).substr(2, 9)}`,
  name: tool.name || "Unnamed MCP Tool",
  description: tool.description || "No description.",
  category: tool.category || "MCP",
  icon: tool.icon || "Cpu", // Default icon if not specified
  // genkitTool: undefined, // MCP tools might not have direct Genkit tool instances
  // inputSchema: tool.inputSchema ? stringifySchema(tool.inputSchema) : undefined,
  // outputSchema: tool.outputSchema ? stringifySchema(tool.outputSchema) : undefined,
} as AvailableTool));


// Tools from old `src/data/available-tools.ts`
const oldAvailableToolsData: Partial<AvailableTool>[] = [
  {
    id: 'google-search',
    name: 'Google Search',
    description: 'Real-time search results from Google. Requires API key. Service Type: Google Search',
    configType: 'mcp',
    icon: "Search",
    category: 'Search & Browsing',
    hasConfig: true,
    genkitToolName: 'googleSearch', // Example if it's a Genkit native tool
    configFields: [
      { name: 'googleApiKey', label: 'Google API Key (Vault)', type: 'text', description: 'API Key for Google Search.', required: false, defaultValue: "" },
      { name: 'googleCseId', label: 'Programmable Search Engine ID', type: 'text', description: 'The CSE ID to use for the search.', required: true, defaultValue: "" },
    ],
    requiresAuth: true,
    inputSchema: "{\n      \"type\": \"object\",\n      \"properties\": {\n        \"query\": {\n          \"type\": \"string\",\n          \"description\": \"The search query.\"\n        }\n      },\n      \"required\": [\"query\"]\n    }",
  },
  {
    id: 'openapi-custom',
    name: 'Custom API (OpenAPI)',
    description: 'Integrate with any API using an OpenAPI specification. Can require API key. Service Type: Custom API',
    configType: 'openapi',
    icon: "CloudCog",
    category: 'Custom Integrations',
    hasConfig: true,
    configFields: [
      { name: 'openapiSpecUrl', label: 'OpenAPI Spec URL', type: 'text', description: 'URL of the OpenAPI JSON specification.', required: true, defaultValue: "" },
      { name: 'openapiApiKey', label: 'API Key (Vault)', type: 'text', description: 'API Key for the custom service (if required).', required: false, defaultValue: "" },
    ],
    requiresAuth: true,
    inputSchema: "{\n      \"type\": \"object\",\n      \"properties\": {\n        \"endpoint\": {\n          \"type\": \"string\",\n          \"description\": \"The specific API endpoint to call.\"\n        },\n        \"parameters\": {\n          \"type\": \"object\",\n          \"description\": \"Parameters to pass to the API endpoint.\"\n        }\n      },\n      \"required\": [\"endpoint\"]\n    }",
  },
  {
    id: 'database-connector',
    name: 'SQL Database Connector',
    description: 'Connect to SQL databases. May require credentials from vault. Service Type: Database',
    configType: 'custom_script',
    icon: "Database",
    category: 'Data Sources',
    hasConfig: true,
    configFields: [
      { name: 'dbType', label: 'Database Type', type: 'select', options: [{label: "PostgreSQL", value: "postgresql"}, {label: "MySQL", value: "mysql"}], required: true, defaultValue: "postgresql" },
      { name: 'dbHost', label: 'Host', type: 'text', required: true, defaultValue: "localhost" },
      { name: 'dbPort', label: 'Port', type: 'number', required: true, defaultValue: 5432 },
      { name: 'dbName', label: 'Database Name', type: 'text', required: true, defaultValue: "" },
      { name: 'dbUser', label: 'User', type: 'text', required: true, defaultValue: "" },
      { name: 'dbPassword', label: 'Password (Vault)', type: 'text', required: false, defaultValue: "" },
      { name: 'dbDescription', label: 'Database Description (for Agent)', type: 'textarea', description: 'Natural language description of the database schema or purpose for the agent.', required: false, defaultValue: "" },
    ],
    requiresAuth: true,
    inputSchema: "{\n      \"type\": \"object\",\n      \"properties\": {\n        \"sql_query\": {\n          \"type\": \"string\",\n          \"description\": \"The SQL query to execute.\"\n        },\n        \"params\": {\n          \"type\": \"array\",\n          \"description\": \"Parameters for the SQL query.\",\n          \"items\": { \"type\": \"string\" }\n        }\n      },\n      \"required\": [\"sql_query\"]\n    }",
  },
  {
    id: 'simple-calculator',
    name: 'Simple Calculator',
    description: 'Performs basic arithmetic operations. Does not require API key. Service Type: N/A',
    configType: 'custom_script',
    icon: "Code2",
    category: 'Utilities',
    hasConfig: false,
    requiresAuth: false,
    configFields: [],
    inputSchema: "{\n      \"type\": \"object\",\n      \"properties\": {\n        \"expression\": {\n          \"type\": \"string\",\n          \"description\": \"The mathematical expression to evaluate.\"\n        }\n      },\n      \"required\": [\"expression\"]\n    }"
  },
  {
    id: 'chat-tool',
    name: 'Chat Tool', // Original label was 'Chat Tool', name was 'chat-tool'
    description: 'A tool for enabling chat functionalities.',
    configType: 'mcp', // Original type was 'mcp'
    icon: "MessageSquare",
    category: 'Communication',
    hasConfig: false,
    requiresAuth: false,
  }
];

// Tools from `src/data/agentBuilderConfig.tsx` (availableTools array)
const agentBuilderConfigToolsData: Partial<AvailableTool>[] = [
  {
    id: "webSearch",
    name: "Busca na Web (Google)", // Using label as name for user-friendliness
    description: "Permite ao agente pesquisar na internet (via Genkit). Esta ferramenta tentará usar as variáveis de ambiente GOOGLE_API_KEY e GOOGLE_CSE_ID para funcionar. A configuração na UI serve para documentar e guiar o prompt do sistema.",
    icon: "Search",
    category: "Web",
    hasConfig: true,
    genkitToolName: "performWebSearch",
    // configFields are defined in standardTools, if this is a duplicate, it won't be added.
    // If it's meant to be a distinct config, its ID should be different or configFields provided here.
  },
  {
    id: "calculator",
    name: "Calculadora",
    description: "Permite realizar cálculos matemáticos (via função Genkit).",
    icon: "Calculator",
    category: "Utilities",
    genkitToolName: "calculator",
  },
  {
    id: "knowledgeBase",
    name: "Consulta à Base de Conhecimento (RAG)",
    description: "Permite buscar em bases de conhecimento ou documentos (ex: RAG via Genkit). Requer configuração do ID da base e, possivelmente, chaves de API.",
    icon: "FileText",
    category: "Data",
    hasConfig: true,
    genkitToolName: "queryKnowledgeBase",
  },
  {
    id: "calendarAccess",
    name: "Acesso à Agenda/Calendário",
    description: "Permite verificar ou criar eventos na agenda (requer fluxo Genkit e auth). Requer configuração do endpoint da API ou ID do fluxo.",
    icon: "CalendarDays",
    category: "Productivity",
    hasConfig: true,
    genkitToolName: "accessCalendar",
  },
  {
    id: "customApiIntegration",
    name: "Integração com API Externa (OpenAPI)",
    description: "Permite interagir com serviços web externos (via OpenAPI, requer fluxo Genkit). Requer URL do esquema OpenAPI e, opcionalmente, chave API.",
    icon: "Network",
    category: "Integration",
    hasConfig: true,
    genkitToolName: "invokeOpenAPI",
  },
  {
    id: "databaseAccess",
    name: "Acesso a Banco de Dados (SQL)",
    description: "Permite consultar e interagir com bancos de dados SQL (requer fluxo Genkit). Requer configuração detalhada da conexão.",
    icon: "Database",
    category: "Data",
    hasConfig: true,
    genkitToolName: "queryDatabase",
  },
  {
    id: "codeExecutor",
    name: "Execução de Código (Python Sandbox)",
    description: "Permite executar trechos de código Python em um ambiente seguro (requer fluxo Genkit). Pode requerer configuração do endpoint do sandbox.",
    icon: "Code2",
    category: "Development",
    hasConfig: true,
    genkitToolName: "executeCode",
  }
];

// Consolidate all tools
const consolidatedTools: AvailableTool[] = [...standardTools];
const existingToolIds = new Set(consolidatedTools.map(t => t.id));

mcpToolsProcessed.forEach(tool => {
  if (!existingToolIds.has(tool.id)) {
    consolidatedTools.push(tool);
    existingToolIds.add(tool.id);
  }
});

oldAvailableToolsData.forEach(tool => {
  if (tool.id && !existingToolIds.has(tool.id)) {
    // Basic transformation: ensure icon is string, add category if missing
    const transformedTool = {
        ...tool,
        icon: String(tool.icon || "HelpCircle"), // Ensure icon is string
        category: tool.category || "Uncategorized",
        // Ensure all required fields for AvailableTool are present
        name: tool.name || tool.id,
        description: tool.description || "No description provided.",
    } as AvailableTool;
    consolidatedTools.push(transformedTool);
    existingToolIds.add(transformedTool.id);
  }
});

agentBuilderConfigToolsData.forEach(tool => {
  if (tool.id && !existingToolIds.has(tool.id)) {
     const transformedTool = {
        ...tool,
        icon: String(tool.icon || "HelpCircle"),
        category: tool.category || "Uncategorized",
        name: tool.name || tool.id,
        description: tool.description || "No description provided.",
    } as AvailableTool;
    consolidatedTools.push(transformedTool);
    existingToolIds.add(transformedTool.id);
  }
});

export const allAvailableTools: AvailableTool[] = consolidatedTools;

// The getIconComponent function from the original agent-builder/available-tools.ts
// should be moved to a central UI utility file (e.g., src/utils/icon-utils.ts).
// It is not included here as this is a data file.
// Example:
// export function getIconComponent(name?: string): LucideIconType { ... }
// where LucideIconType is the actual type for Lucide icons.
// UI components would then import that utility and use it.
// For example, if tool.icon = "Search", a UI component would do:
// const IconComponent = getIconComponent(tool.icon); <IconComponent />
