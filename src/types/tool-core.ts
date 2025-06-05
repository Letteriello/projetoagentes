// src/types/tool-core.ts

import type { LucideIcon } from 'lucide-react'; // Correct import for LucideIcon type

export interface MCPServerConfig {
  id: string;
  name: string;
  description?: string;
  url: string;
  apiKey?: string;
}

export interface ApiKeyEntry {
  id: string;
  name: string;
  key: string; // This is the actual key, ensure it's handled securely
  service: string; // e.g., 'OpenAI', 'GoogleAI', 'CustomAPI'
  createdAt: string; // ISO date string
  updatedAt?: string; // ISO date string
  // Optional fields for more context
  serviceName?: string; // User-friendly name if 'service' is an ID/enum
  // apiKey?: string; // This seems redundant if 'key' holds the API key value
  fragment?: string; // Could be used to store a part of the key for display (e.g., last 4 chars)
  serviceType?: string; // e.g., 'llm', 'image_generation', 'custom'
}

/**
 * Represents an available tool in the system.
 * This interface consolidates fields from various tool definitions
 * to provide a unified structure.
 * - `id`: Unique identifier for the tool.
 * - `name`: User-friendly name of the tool.
 * - `description`: A brief description of what the tool does.
 * - `category`: Category the tool belongs to (e.g., "Text", "Image").
 * - `icon`: A LucideIcon component for displaying next to the tool.
 * - `hasConfig`: Boolean indicating if the tool requires specific configuration.
 * - `configType`: Specifies the type of configuration (e.g., 'json', 'form').
 * - `configFields`: An array of ToolConfigField objects detailing each configuration option.
 * - `requiresAuth`: Boolean indicating if the tool needs authentication (e.g., API key).
 * - `genkitToolName`: The registered name of the tool in a Genkit flow.
 * - `genkitTool`: The actual Genkit tool object (can be 'any' for flexibility).
 * - `inputSchema`: String representation (e.g., JSON) of the tool's input schema.
 * - `outputSchema`: String representation (e.g., JSON) of the tool's output schema.
 * - `needsApiKey`: Legacy or specific flag, consider consolidating into `requiresAuth` or `configFields`.
 * - `needsMcpServer`: Legacy or specific flag, consider consolidating.
 * - `openApiSchema`: OpenAPI schema definition for the tool's inputs/parameters. (Added based on analysis of adk-types.ts and general best practice for tool schemas)
 */
export interface AvailableTool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string; // Changed to string, UI will use a helper to get component
  needsApiKey?: boolean; // Consider replacing with requiresAuth or similar
  needsMcpServer?: boolean; // Specific to MCP, consider generalizing or removing
  config?: Record<string, any>; // To be replaced by configFields for detailed configuration

  // New fields for comprehensive tool definition
  hasConfig?: boolean; // Indicates if the tool has specific configuration fields
  configType?: string; // Type of configuration (e.g., 'json', 'form')
  configFields?: ToolConfigField[]; // Detailed specification for each config field
  requiresAuth?: boolean; // Generic authentication requirement flag
  genkitToolName?: string; // Name of the tool in Genkit (if applicable)
  genkitTool?: any; // The actual Genkit tool definition (can be complex)
  inputSchema?: string; // String representation of the input schema (e.g., JSON schema)
  outputSchema?: string; // String representation of the output schema (e.g., JSON schema)
  openApiSchema?: Record<string, any>; // Added for OpenAPI schema support
}

/**
 * Defines the specification for a single configuration field of a tool.
 * This allows for dynamic rendering of configuration forms.
 * - `name`: The key used for this field's value in the tool's configuration object.
 * - `label`: A human-readable label for the UI.
 * - `type`: The type of input control to render (e.g., 'text', 'select').
 * - `defaultValue`: A default value for the field.
 * - `options`: If `type` is 'select', this array provides the choices.
 * - `required`: Whether this field must be filled by the user.
 * - `description`: A more detailed explanation of the field's purpose.
 */
export interface ToolConfigField {
  name: string; // The property name in the config object
  label: string; // User-friendly label for the UI
  type: 'text' | 'number' | 'boolean' | 'select' | 'textarea'; // Type of input
  defaultValue?: any;
  options?: Array<{ value: string; label: string }>; // For 'select' type
  required?: boolean;
  description?: string; // Description of the field
}

export interface ToolConfigData {
  selectedApiKeyId?: string;
  selectedMcpServerId?: string;
  config?: Record<string, any>; // This will hold the actual configuration values
}

/**
 * Represents a reference to a specific tool and its applied configuration.
 * This is often used in agent configurations to specify which tools an agent uses
 * and how those tools are set up for that agent.
 * - `toolId`: The unique identifier of the tool being referenced.
 * - `configuration`: A record containing the specific configuration values applied to this instance of the tool.
 *                  The structure of this object should align with the `configFields` or overall
 *                  configuration schema defined in the corresponding `AvailableTool`.
 */
export interface ToolReference { // Added from src/types/tools.ts
  toolId: string;
  configuration: Record<string, any>;
}
