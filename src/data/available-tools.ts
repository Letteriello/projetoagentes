import { AvailableTool, ToolConfigField } from '@/types/tool-types'; // Corrected import
import { Search, Database, CloudCog, Code2, MessageSquare, LucideIcon } from 'lucide-react'; // Added LucideIcon

export const availableTools: AvailableTool[] = [
  {
    id: 'google-search',
    // label: 'Google Search', // Mapped to name
    name: 'Google Search', // Consolidated from label
    description: 'Real-time search results from Google. Requires API key. Service Type: Google Search', // Integrated serviceTypeRequired
    configType: 'mcp', // type mapped to configType
    icon: Search as LucideIcon, // Ensure icon is LucideIcon
    category: 'Search & Browsing',
    hasConfig: true,
    genkitToolName: 'googleSearch', // Example if it's a Genkit native tool (added for completeness)
    configFields: [
      // id mapped to name, type 'password' changed to 'text' (UI handles actual input type)
      { name: 'googleApiKey', label: 'Google API Key (Vault)', type: 'text', description: 'API Key for Google Search.', required: false, defaultValue: "" },
      { name: 'googleCseId', label: 'Programmable Search Engine ID', type: 'text', description: 'The CSE ID to use for the search.', required: true, defaultValue: "" },
    ],
    requiresAuth: true,
    // serviceTypeRequired: "Google Search", // Removed, integrated into description or handled by config fields
    inputSchema: `{
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "The search query."
        }
      },
      "required": ["query"]
    }`,
    outputSchema: undefined, // Added for completeness
  },
  {
    id: 'openapi-custom',
    // label: 'Custom API (OpenAPI)',
    name: 'Custom API (OpenAPI)',
    description: 'Integrate with any API using an OpenAPI specification. Can require API key. Service Type: Custom API',
    configType: 'openapi',
    icon: CloudCog as LucideIcon,
    category: 'Custom Integrations',
    hasConfig: true,
    genkitToolName: undefined, // Placeholder
    configFields: [
      { name: 'openapiSpecUrl', label: 'OpenAPI Spec URL', type: 'text', description: 'URL of the OpenAPI JSON specification.', required: true, defaultValue: "" },
      { name: 'openapiApiKey', label: 'API Key (Vault)', type: 'text', description: 'API Key for the custom service (if required).', required: false, defaultValue: "" },
    ],
    requiresAuth: true,
    // serviceTypeRequired: "Custom API",
    inputSchema: `{
      "type": "object",
      "properties": {
        "endpoint": {
          "type": "string",
          "description": "The specific API endpoint to call."
        },
        "parameters": {
          "type": "object",
          "description": "Parameters to pass to the API endpoint."
        }
      },
      "required": ["endpoint"]
    }`,
    outputSchema: undefined, // Added for completeness
  },
  {
    id: 'database-connector',
    // label: 'SQL Database Connector',
    name: 'SQL Database Connector',
    description: 'Connect to SQL databases. May require credentials from vault. Service Type: Database',
    configType: 'custom_script',
    icon: Database as LucideIcon,
    category: 'Data Sources',
    hasConfig: true,
    genkitToolName: undefined, // Placeholder
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
    // serviceTypeRequired: "Database",
    inputSchema: `{
      "type": "object",
      "properties": {
        "sql_query": {
          "type": "string",
          "description": "The SQL query to execute."
        },
        "params": {
          "type": "array",
          "description": "Parameters for the SQL query.",
          "items": { "type": "string" } // Changed "any" to "string" for better typing, adjust if other types needed
        }
      },
      "required": ["sql_query"]
    }`,
    outputSchema: undefined, // Added for completeness
  },
  {
    id: 'simple-calculator',
    // label: 'Simple Calculator',
    name: 'Simple Calculator',
    description: 'Performs basic arithmetic operations. Does not require API key. Service Type: N/A',
    configType: 'custom_script',
    icon: Code2 as LucideIcon,
    category: 'Utilities',
    hasConfig: false,
    requiresAuth: false,
    genkitToolName: undefined, // Placeholder
    configFields: [], // Explicitly empty array
    // serviceTypeRequired: "N/A",
    inputSchema: `{
      "type": "object",
      "properties": {
        "expression": {
          "type": "string",
          "description": "The mathematical expression to evaluate."
        }
      },
      "required": ["expression"]
    }`
  },
  {
    id: 'chat-tool',
    label: 'Chat Tool',
    name: 'chat-tool',
    description: 'A tool for enabling chat functionalities.',
    type: 'mcp',
    icon: MessageSquare,
    category: 'Communication',
    hasConfig: false,
    requiresAuth: false,
    serviceTypeRequired: "N/A",
  }
];
