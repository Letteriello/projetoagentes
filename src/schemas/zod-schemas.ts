import * as z from 'zod';

// Schema for GeneralTab
export const generalTabSchema = z.object({
  agentName: z.string().min(1, { message: "Agent name is required." }).max(100, { message: "Agent name must be 100 characters or less." }),
  agentDescription: z.string().min(1, { message: "Agent description is required." }).max(500, { message: "Agent description must be 500 characters or less." }),
  agentVersion: z.string().optional(), // Assuming version is optional for now
  config: z.object({
    type: z.string().min(1, { message: "Agent type is required." }),
    framework: z.string().min(1, { message: "Agent framework is required." }),
    agentGoal: z.string().optional(), // Optional here, but might be required by LLMBehaviorForm
  }),
  // tools: z.array(z.string()).optional(), // Assuming tools are handled separately initially
});

// Schema for LLMBehaviorForm
export const llmBehaviorFormSchema = z.object({
  config: z.object({
    agentGoal: z.string().min(1, { message: "Agent goal is required for LLM agents." }),
    agentTasks: z.array(z.string()).optional(), // Assuming tasks can be optional initially
    agentPersonality: z.string().optional(),
    agentRestrictions: z.array(z.string()).optional(),
    agentModel: z.string().min(1, { message: "Language model is required." }),
    agentTemperature: z.number().min(0.0, { message: "Temperature must be at least 0.0." }).max(1.0, { message: "Temperature must be at most 1.0." }).optional(),
    // Assuming topK and topP are not explicitly in the provided LLMBehaviorForm.tsx,
    // but if they were, they'd look like this:
    // topK: z.number().min(1, { message: "TopK must be at least 1." }).optional(),
    // topP: z.number().min(0.0, { message: "TopP must be at least 0.0." }).max(1.0, { message: "TopP must be at most 1.0." }).optional(),
    safetySettings: z.array(z.object({
        category: z.string().min(1, { message: "Safety setting category is required." }),
        threshold: z.string().min(1, { message: "Safety setting threshold is required." }),
    })).optional(),
    systemPromptGenerated: z.string().optional(), // Readonly, no validation needed from user
  }),
});

// It might be beneficial to have a combined schema for the entire agent configuration
// This will also help with validating the overall structure and handling inter-dependencies
// between tabs if the form context is for the entire agent.

export const agentConfigurationSchema = generalTabSchema.extend({
  // LLM specific fields are nested under config, so we might need to merge them carefully
  // or ensure the form structure aligns with this.
  // For now, let's assume LLMBehaviorForm fields are also within the same 'config' object
  // and can be merged or handled by react-hook-form at different paths.
  config: generalTabSchema.shape.config.merge(llmBehaviorFormSchema.shape.config).passthrough(), // Use passthrough to allow other fields in config
  tools: z.array(z.string()).optional(), // From GeneralTab (if needed at root)
  toolConfigs: z.record(z.any()).optional(), // For ToolConfigModal data
  // other global/tab-specific fields can be added here
});

// Schema for CustomToolDialog
export const customToolSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  inputSchema: z.string().refine(
    (val) => {
      if (!val) return true; // Allow empty or undefined if schema is optional
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: 'Input schema must be valid JSON or empty.' }
  ).optional(),
  outputSchema: z.string().refine(
    (val) => {
      if (!val) return true; // Allow empty or undefined if schema is optional
      try {
        JSON.parse(val);
        return true;
      } catch (e) {
        return false;
      }
    },
    { message: 'Output schema must be valid JSON or empty.' }
  ).optional(),
});

// Schemas for ToolConfigModal (will be more complex and tool-dependent)
// This is a placeholder; specific tool schemas will be needed.
// For example, for 'google-search':
export const googleSearchToolSchema = z.object({
  googleCseId: z.string().min(1, { message: "Google CSE ID is required." }),
  selectedApiKeyId: z.string().optional(), // Assuming API key might be optional or handled globally
});

// For 'openapi-custom':
export const openApiToolSchema = z.object({
  openapiSpecUrl: z.string().url({ message: "Must be a valid URL." }).min(1, { message: "OpenAPI Spec URL is required." }),
  selectedApiKeyId: z.string().optional(),
});

// Generic tool config schema (can be a discriminated union if tools have vastly different params)
// For now, let's assume specific schemas will be picked based on tool ID.
// We can refine this later.
export const toolParameterSchema = z.object({
  name: z.string().min(1),
  value: z.any(), // Can be string, number, boolean - specific validation per parameter type
  type: z.enum(["string", "number", "boolean", "json"]), // Example types
  required: z.boolean().optional(),
});

export const specificToolConfigSchema = z.object({
  // Example for a tool that takes a 'path' and 'method'
  path: z.string().min(1, "Path is required."),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]),
  // Add other common or specific tool parameters here
  // For parameters that are themselves complex objects (e.g. JSON), use z.record(z.any()) or z.string().refine(...)
});


// Note: The existing custom-tool-dialog.tsx already has a good Zod schema.
// We should ensure it's moved here or that this file becomes the central place for such schemas.
// The schema in custom-tool-dialog.tsx is:
// const customToolSchema = z.object({
//   name: z.string().min(1, 'Name is required'),
//   description: z.string().min(1, 'Description is required'),
//   inputSchema: z.string().refine(
//     (val) => {
//       if (!val) return false; // Disallow empty string
//       try {
//         JSON.parse(val);
//         return true;
//       } catch (e) {
//         return false;
//       }
//     },
//     { message: 'Deve ser um JSON válido.' }
//   ),
//   outputSchema: z.string().refine(
//     (val) => {
//       if (!val) return false; // Disallow empty string
//       try {
//         JSON.parse(val);
//         return true;
//       } catch (e) {
//         return false;
//       }
//     },
//     { message: 'Deve ser um JSON válido.' }
//   ),
// });
// I'll use my refined version above that allows empty JSON strings for optional schemas.
