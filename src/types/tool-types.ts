// src/types/tool-types.ts
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
  key: string;
  service: string;
  createdAt: string;
  updatedAt?: string;
  serviceName?: string;
  apiKey?: string;
  fragment?: string;
  serviceType?: string;
}

export interface AvailableTool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: LucideIcon; // Updated from string to LucideIcon
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
}

// New interface for detailed configuration field specifications
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

// It's good practice to import types used in interfaces
// Assuming LucideIcon will be imported where this type is used,
// or define it as a generic type if it comes from different places.
// For ZodSchema, if you decide to use it:
// import { ZodSchema } from 'zod';
// And then use ZodSchema instead of string for inputSchema/outputSchema.

// Comment explaining the structure of AvailableTool
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
 */

// Comment explaining the structure of ToolConfigField
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