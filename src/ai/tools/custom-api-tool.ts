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
export const CustomApiOutputSchema = z.object({
  success: z.boolean().describe("Indicates whether the API call was successful."),
  statusCode: z.number().optional().describe("HTTP status code of the API response."),
  responseBody: z.any().optional().describe("The body of the API response, typically a JSON object or array."),
  error: z.string().optional().describe("Error message if the API call failed or an issue occurred."),
});

// Factory function to create the customApiTool
export function createCustomApiTool(config: CustomApiToolConfig): ToolDefinition<typeof CustomApiInputSchema, typeof CustomApiOutputSchema> {
  const toolName = config.name || 'customApi';
  const toolDescription =
    config.description ||
    `Interacts with a custom API defined by an OpenAPI spec (URL: ${config.openapiSpecUrl || 'not specified'}). Provide operationId and parameters.`;

  const effectiveSpecUrl = config.openapiSpecUrl || "not_specified_in_config";
  const effectiveBaseUrl = config.baseUrl; // Can be undefined if not set

  console.log(`[${toolName}] Tool instance created with effective spec URL: ${effectiveSpecUrl}, base URL: ${effectiveBaseUrl}`);

  // Return the Genkit tool definition
  return ai.defineTool(
    {
      name: toolName,
      description: toolDescription,      inputSchema: CustomApiInputSchema,
      outputSchema: CustomApiOutputSchema,
    },
    async (input: z.infer<typeof CustomApiInputSchema>) => { const { operationId, parameters } = input;
      // This is a simplified simulation. A real implementation would use axios or fetch.
      // It would also involve more robust parsing of the OpenAPI spec to map operationId
      // to HTTP method, path, and parameter types.

      console.log(`[${toolName}] Executing operation '${operationId}' with parameters:`, parameters);
      if(config.apiKey) {
        console.log(`[${toolName}] API key provided (simulated usage).`);
        // In a real call, this would be added to headers or query params as per API spec.
      }
      if(config.defaultHeaders) {
        console.log(`[${toolName}] Default headers provided:`, config.defaultHeaders);
      }

      // Simulate based on a known OpenAPI spec (e.g., PetStore)
      // This is highly simplified and not a generic OpenAPI client.
      if (effectiveSpecUrl === "http://petstore.swagger.io/v2/swagger.json" || effectiveSpecUrl === "https://petstore.swagger.io/v2/swagger.json") {
        if (operationId === "getPetById") {
          if (parameters && parameters.petId) {
            // Actual call would be: GET `${effectiveBaseUrl}/pet/${parameters.petId}`
            // Headers would include config.defaultHeaders and potentially API key header
            console.log(`[${toolName}] Simulating 'getPetById' for ID: ${parameters.petId}. API Key used: ${!!config.apiKey}`);
            return {
              success: true,
              statusCode: 200,
              responseBody: {
                id: parameters.petId,
                name: "Doggie (from factory-configured tool)",
                // ... other fields from original example
                configUsed: { baseUrl: effectiveBaseUrl, specUrl: effectiveSpecUrl, apiKey: !!config.apiKey, headers: config.defaultHeaders }
              },
            };
          } else {
            return { success: false, statusCode: 400, error: "Missing petId parameter for getPetById operation." };
          }
        } else if (operationId === "findPetsByStatus") {
           // Actual call would be: GET `${effectiveBaseUrl}/pet/findByStatus?status=${parameters.status}`
           console.log(`[${toolName}] Simulating 'findPetsByStatus' for status: ${parameters.status}. API Key used: ${!!config.apiKey}`);
           // ... (similar simulation as before)
          return {
            success: true,
            statusCode: 200,
            responseBody: [{ id: 1, name: `Fido_${parameters.status}`, status: parameters.status }],
            configUsed: { baseUrl: effectiveBaseUrl, specUrl: effectiveSpecUrl, apiKey: !!config.apiKey, headers: config.defaultHeaders }
          };
        }
      }

      console.warn(`[${toolName}] Operation '${operationId}' on spec '${effectiveSpecUrl}' is not supported by this simulation or the spec was not recognized.`);
      return {        success: false,
        error: `Custom API operation '${operationId}' is not supported by this simulation, or spec '${effectiveSpecUrl}' was not recognized. Base URL used: ${effectiveBaseUrl || 'not set'}.`,
      };
    }
  );
}

// Example of how to export a pre-configured instance (optional)
// export const mySpecificApi = createCustomApiTool({
//   name: "myPetStoreApi",
//   openapiSpecUrl: "http://petstore.swagger.io/v2/swagger.json",
//   baseUrl: "https://petstore.swagger.io/v2",
//   // apiKey: "your_petstore_api_key_if_any"
//   defaultHeaders: { 'X-Custom-Header': 'MyToolInstance' }
// });