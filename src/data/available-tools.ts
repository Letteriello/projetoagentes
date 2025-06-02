import type { AvailableTool } from '@/types/agent-configs'; // Corrected import path
import { Search, Database, CloudCog, Code2, MessageSquare } from 'lucide-react';

export const availableTools: AvailableTool[] = [
  {
    id: 'google-search',
    label: 'Google Search',
    name: 'google-search',
    description: 'Real-time search results from Google. Requires API key.',
    type: 'mcp', // Assuming MCP or a specific type for Genkit native/custom
    icon: Search,
    category: 'Search & Browsing',
    hasConfig: true,
    // genkitToolName: 'googleSearch', // Example if it's a Genkit native tool
    configFields: [
      { id: 'googleApiKey', label: 'Google API Key (Vault)', type: 'password', description: 'API Key for Google Search.', required: false }, // Will be replaced by vault select
      { id: 'googleCseId', label: 'Programmable Search Engine ID', type: 'text', description: 'The CSE ID to use for the search.', required: true },
    ],
    requiresAuth: true,
    serviceTypeRequired: "Google Search",
  },
  {
    id: 'openapi-custom',
    label: 'Custom API (OpenAPI)',
    name: 'openapi-custom',
    description: 'Integrate with any API using an OpenAPI specification. Can require API key.',
    type: 'openapi',
    icon: CloudCog,
    category: 'Custom Integrations',
    hasConfig: true,
    configFields: [
      { id: 'openapiSpecUrl', label: 'OpenAPI Spec URL', type: 'text', description: 'URL of the OpenAPI JSON specification.', required: true },
      { id: 'openapiApiKey', label: 'API Key (Vault)', type: 'password', description: 'API Key for the custom service (if required).', required: false }, // Will be replaced by vault select
    ],
    requiresAuth: true, // Assuming most OpenAPI specs might need auth
    serviceTypeRequired: "Custom API", // Or could be more specific if known
  },
  {
    id: 'database-connector',
    label: 'SQL Database Connector',
    name: 'database-connector',
    description: 'Connect to SQL databases. May require credentials from vault.',
    type: 'custom_script', // Example type
    icon: Database,
    category: 'Data Sources',
    hasConfig: true,
    configFields: [
      { id: 'dbType', label: 'Database Type', type: 'select', options: [{label: "PostgreSQL", value: "postgresql"}, {label: "MySQL", value: "mysql"}], required: true },
      { id: 'dbHost', label: 'Host', type: 'text', required: true },
      { id: 'dbPort', label: 'Port', type: 'number', required: true, defaultValue: 5432 },
      { id: 'dbName', label: 'Database Name', type: 'text', required: true },
      { id: 'dbUser', label: 'User', type: 'text', required: true },
      { id: 'dbPassword', label: 'Password (Vault)', type: 'password', required: false }, // Will be replaced by vault select
      { id: 'dbDescription', label: 'Database Description (for Agent)', type: 'textarea', description: 'Natural language description of the database schema or purpose for the agent.', required: false },
    ],
    requiresAuth: true, // Assuming credentials might be sensitive and stored in vault
    serviceTypeRequired: "Database",
  },
  {
    id: 'simple-calculator',
    label: 'Simple Calculator',
    name: 'simple-calculator',
    description: 'Performs basic arithmetic operations. Does not require API key.',
    type: 'custom_script', // Example type
    icon: Code2,
    category: 'Utilities',
    hasConfig: false,
    requiresAuth: false,
    serviceTypeRequired: "N/A",
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
