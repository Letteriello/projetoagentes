/**
 * @fileOverview Defines a Genkit tool for interacting with custom external APIs
 * described by an OpenAPI specification. This tool is created using a factory
 * function to allow for dynamic configuration of API endpoint, key, and headers.
 */
import { ToolDefinition } from '@genkit-ai/core';
import { ai } from '@/ai/genkit'; // Import the configured 'ai' instance
import { z } from 'zod';
// import axios from 'axios'; // Would be used for actual HTTP calls

// Define the configuration interface for the tool
export interface CustomApiToolConfig {
  name?: string; // Optional: to allow multiple instances with different names
  description?: string; // Optional: to allow custom description per instance
  openapiSpecUrl?: string; // URL to the OpenAPI specification
  baseUrl?: string; // Base URL for the API endpoint, can often be derived from OpenAPI spec
  apiKey?: string; // API key for authentication
  defaultHeaders?: Record<string, string>; // Default headers to include in requests
}

// Define Input Schema for the tool's handler
// apiKey and openapiSpecUrl are removed from input as they come from config
export const CustomApiInputSchema = z.object({
  operationId: z.string().describe("The operationId from the OpenAPI spec to execute."),
  parameters: z.record(z.any()).optional().describe("An object containing parameters for the API operation (e.g., path, query, request body)."),
});

// Define Output Schema for the tool's handler
// On success, the tool should directly return the API's response body.
// StatusCode might be part of the response body or handled differently if needed.
// Errors are thrown, so 'success' and 'error' fields are removed from the schema.
export const CustomApiOutputSchema = z.object({
  statusCode: z.number().optional().describe("HTTP status code of the API response. This might be part of the responseBody itself depending on the API."),
  responseBody: z.any().optional().describe("The body of the API response, typically a JSON object or array."),
});

// Factory function to create the customApiTool
export function createCustomApiTool(config: CustomApiToolConfig): ToolDefinition<typeof CustomApiInputSchema, z.ZodTypeAny> { // Output schema is dynamic
  const toolName = config.name || 'customApi';
  const toolDescription =
    config.description ||
    `Interacts with a custom API defined by an OpenAPI spec. Provide operationId and parameters. Configured Spec URL: ${config.openapiSpecUrl || 'NOT SET'}`;

  const effectiveSpecUrl = config.openapiSpecUrl;
  const effectiveBaseUrl = config.baseUrl;

  // Log creation with more clarity on what's configured
  if (!effectiveSpecUrl || effectiveSpecUrl === "not_specified_in_config") {
    console.warn(`[${toolName}] Tool instance created WITHOUT a valid OpenAPI spec URL. Base URL: ${effectiveBaseUrl || 'NOT SET'}. This tool will likely fail if called.`);
  } else {
    console.log(`[${toolName}] Tool instance created. Spec URL: ${effectiveSpecUrl}, Base URL: ${effectiveBaseUrl || 'derived from spec'}`);
  }

  return ai.defineTool(
    {
      name: toolName,
      description: toolDescription,
      inputSchema: CustomApiInputSchema,
      // Output schema is dynamic based on the OpenAPI spec, ideally.
      // For now, using a generic 'any' or a base response structure.
      // If specific output schemas per operationId are needed, the tool definition might become more complex
      // or the output handling part of the calling flow would need to parse 'responseBody: z.any()'.
      outputSchema: CustomApiOutputSchema, // Using the simplified success output schema
    },
    async (input: z.infer<typeof CustomApiInputSchema>) => {
      const { operationId, parameters } = input;

      if (!effectiveSpecUrl || effectiveSpecUrl === "not_specified_in_config") {
        console.error(`[${toolName}] Error: OpenAPI spec URL is not configured for this tool.`);
        throw new Error("OpenAPI spec URL is not configured for this tool.");
      }

      console.log(`[${toolName}] Executing operation '${operationId}' on spec '${effectiveSpecUrl}' with parameters:`, parameters);
      if(config.apiKey) {
        console.log(`[${toolName}] API key IS configured (simulated usage).`);
      } else {
        console.log(`[${toolName}] API key IS NOT configured.`);
      }
      if(config.defaultHeaders) {
        console.log(`[${toolName}] Default headers provided:`, config.defaultHeaders);
      }

      try {
        // Simulate based on a known OpenAPI spec (e.g., PetStore)
        // This is highly simplified and not a generic OpenAPI client.
        if (effectiveSpecUrl.includes("petstore.swagger.io")) { // More flexible check
          if (operationId === "getPetById") {
            if (parameters && parameters.petId !== undefined) { // Check petId presence
              // Actual call would be: GET `${effectiveBaseUrl || 'SPEC_BASE_URL'}/pet/${parameters.petId}`
              console.log(`[${toolName}] Simulating 'getPetById' for ID: ${parameters.petId}.`);
              return { // Success output
                statusCode: 200,
                responseBody: {
                  id: parameters.petId,
                  name: "Doggie (from factory-configured tool)",
                  configUsed: { baseUrl: effectiveBaseUrl, specUrl: effectiveSpecUrl, apiKeyProvided: !!config.apiKey }
                },
              };
            } else {
              console.error(`[${toolName}] Error: Missing petId parameter for getPetById operation.`);
              throw new Error("Missing petId parameter for getPetById operation.");
            }
          } else if (operationId === "findPetsByStatus") {
            if (parameters && parameters.status) {
              console.log(`[${toolName}] Simulating 'findPetsByStatus' for status: ${parameters.status}.`);
              return { // Success output
                statusCode: 200,
                responseBody: [{ id: 1, name: `Fido_${parameters.status}`, status: parameters.status }],
              };
            } else {
              console.error(`[${toolName}] Error: Missing status parameter for findPetsByStatus operation.`);
              throw new Error("Missing status parameter for findPetsByStatus operation.");
            }
          } else {
            console.warn(`[${toolName}] Operation '${operationId}' on spec '${effectiveSpecUrl}' is not supported by this simulation.`);
            throw new Error(`Operation '${operationId}' on spec '${effectiveSpecUrl}' is not supported by this simulation.`);
          }
        } else {
          // Fallback for unrecognized spec
          console.warn(`[${toolName}] OpenAPI spec '${effectiveSpecUrl}' is not a recognized simulation target.`);
          throw new Error(`OpenAPI spec '${effectiveSpecUrl}' is not a recognized simulation target for operation '${operationId}'.`);
        }
      } catch (error: any) {
        // Log the error and re-throw or handle as appropriate
        // If error is already an Error instance, re-throw it. Otherwise, wrap it.
        if (error instanceof Error) {
          console.error(`[${toolName}] Simulation error for operation '${operationId}': ${error.message}`);
          throw error;
        } else {
          const errorMessage = `Unexpected error during simulation of '${operationId}': ${String(error)}`;
          console.error(`[${toolName}] ${errorMessage}`);
          throw new Error(errorMessage);
        }
      }
    }
  );
}

// Example of how to export a pre-configured instance (optional)
// This demonstrates how a user might set up a specific API tool
// export const mySpecificApi = createCustomApiTool({
//   name: "myPetStoreApi",
//   openapiSpecUrl: "http://petstore.swagger.io/v2/swagger.json",
//   baseUrl: "https://petstore.swagger.io/v2",
//   // apiKey: "your_petstore_api_key_if_any"
//   defaultHeaders: { 'X-Custom-Header': 'MyToolInstance' }
// });