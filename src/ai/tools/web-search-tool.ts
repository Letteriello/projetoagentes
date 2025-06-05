/**
 * @fileOverview Defines a Genkit tool for performing web searches.
 * This tool is created using a factory function to allow for dynamic configuration
 * of API keys and endpoints for a web search service.
 */
import { ai } from '@/ai/genkit'; // Import the configured 'ai' instance
import { winstonLogger } from '../../lib/winston-logger'; // Import Winston Logger
import { ToolDefinition } from '@genkit-ai/core'; // Import ToolDefinition
import { z } from 'zod';
import axios from 'axios'; // For actual HTTP calls if implemented

// Define the Zod schema for a single search result
// @ts-ignore
export const SearchResultSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;

// Define the Zod schema for structured error details
// @ts-ignore
export const ErrorDetailsSchema = z.object({
  code: z.string().optional().describe("An optional error code (e.g., API_ERROR, VALIDATION_ERROR)."),
  message: z.string().describe("A human-readable error message."),
  details: z.any().optional().describe("Any additional details or context about the error."),
});
export type ErrorDetails = z.infer<typeof ErrorDetailsSchema>;

// Define the configuration interface for the tool
export interface WebSearchToolConfig {
  apiKey?: string; // API key for the search service
  apiUrl?: string; // API URL for the search service (e.g., Google Custom Search, Bing Search API)
  name?: string; // Optional name for the tool instance
  description?: string; // Optional description for the tool instance
}

// Define the Zod schema for the tool's input
// @ts-ignore
export const WebSearchInputSchema = z.object({
  query: z.string().describe("The search query to execute."),
  num_results: z.number().optional().default(5).describe("Number of results to return (max 10)."),
  flowName: z.string().optional().describe("Name of the calling flow, for logging."),
  agentId: z.string().optional().describe("ID of the calling agent, for logging."),
});

// Define the Zod schema for the tool's output
// Message and errorDetails fields removed. Errors are thrown for failures.
// @ts-ignore
export const WebSearchOutputSchema = z.object({
  results: z.array(SearchResultSchema).describe("Array of search results."),
  // Optional: could add a field like `queryEcho: z.string()` if useful for successful response.
});

// Remove the incomplete Tool definition as per analysis
// export const performWebSearchTool: Tool = { ... }

export function createPerformWebSearchTool(
  config: WebSearchToolConfig = {} // Default to empty config
): ToolDefinition<typeof WebSearchInputSchema, typeof WebSearchOutputSchema> {
  const toolName = config.name || "performGoogleWebSearch";
  const toolDescription = config.description || "Performs a web search using Google Custom Search API to find up-to-date information.";

  const apiKey = config.apiKey || process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID; // Specific to Google Custom Search

  let apiUrl = config.apiUrl;
  if (!apiUrl && apiKey && cseId) { // Default to Google Custom Search if key and CSE ID are available
    apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}`;
  }

  // Log initialization status
  if (!apiKey || !cseId) { // For Google CSE, both are typically needed.
    winstonLogger.warn(
      `[${toolName}] Initialized with INCOMPLETE configuration for Google Custom Search. Missing GOOGLE_API_KEY or GOOGLE_CSE_ID. Tool will throw an error if called without full config.`,
      { toolName, apiKeyProvided: !!apiKey, cseIdProvided: !!cseId, apiUrlProvided: !!apiUrl }
    );
  } else if (!apiUrl) {
     winstonLogger.warn(
      `[${toolName}] Initialized but API URL could not be determined (e.g. missing apiKey/cseId for default Google, or no apiUrl in config). Tool will throw an error if called.`,
      { toolName }
    );
  }
 else {
    winstonLogger.info(`[${toolName}] Initialized successfully.`, {
      toolName,
      resolvedApiUrl: apiUrl,
      apiKeyProvided: !!apiKey, // Useful to log if key was found, not the key itself
      cseIdProvided: !!cseId,   // Useful to log if CSE ID was found
    });
  }

  return ai.defineTool(
    {
      name: toolName,
      description: toolDescription,
      inputSchema: WebSearchInputSchema,
      outputSchema: WebSearchOutputSchema, // Updated schema
    },
    async (input: z.infer<typeof WebSearchInputSchema>): Promise<z.infer<typeof WebSearchOutputSchema>> => {
      const { query, num_results = 5, flowName, agentId } = input;

      // Configuration Check at runtime
      if (!apiKey || !cseId || !apiUrl) { // Check all essential parts for Google CSE
        const errorMsg = `Web search tool '${toolName}' is not properly configured. Essential settings (API key, CSE ID for Google, or API URL) are missing.`;
        winstonLogger.error(
          `[${toolName}] ${errorMsg}`,
          { toolName, flowName, agentId, apiKeyProvided: !!apiKey, cseIdProvided: !!cseId, apiUrlConfigured: !!apiUrl }
        );
        throw new Error(errorMsg);
      }

      winstonLogger.info(`[${toolName}] Executing web search`, {
        toolName,
        query,
        num_results,
        resolvedApiUrl: apiUrl, // Log the actual URL being used (without sensitive parts if they were separate)
        flowName,
        agentId,
      });

      try {
        winstonLogger.info(`[${toolName}] Making API call to configured search endpoint`, { toolName, query, num_results });
        
        // Construct params carefully, not including key/cx if they are already in apiUrl
        const searchParams: Record<string, any> = { q: query, num: Math.min(num_results, 10) };
        // if apiUrl was a base URL, apiKey and cseId would be added to params here.
        // But current logic embeds them into apiUrl for Google CSE.

        const response = await axios.get(apiUrl, { // If apiUrl includes key/cx, no need to add them to params again.
          params: searchParams,
          headers: { 'Accept': 'application/json' },
        });

        if (response.data && response.data.items) {
          const searchResults: SearchResult[] = response.data.items.map((item: any) => ({
            title: item.title || 'No title',
            url: item.link || item.url || 'No URL', // item.link is common for Google CSE
            snippet: item.snippet || 'No snippet',
          })).slice(0, Math.min(num_results, 10)); // Ensure we respect num_results

          winstonLogger.info(`[${toolName}] Successfully fetched ${searchResults.length} results for "${query}".`, { toolName, flowName, agentId });
          return { results: searchResults };
        } else {
           winstonLogger.warn(`[${toolName}] No items found in API response or unexpected structure. Query: "${query}"`, { responseData: response.data, toolName, flowName, agentId });
           // Consider if this should be an error or just return empty results
           return { results: [] }; // Return empty results if API gives no items
        }

      } catch (error: any) {
        let errorMessage = 'An unknown error occurred during web search.';
        let capturedErrorDetails: any = { originalError: String(error) };

        if (axios.isAxiosError(error)) {
          errorMessage = `Web search API call failed with status ${error.response?.status || 'unknown'}: ${error.message}`;
          capturedErrorDetails = {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data, // This could be large, log selectively or summarize
            code: error.code,
          };
          winstonLogger.error(`[${toolName}] Axios error during web search: ${errorMessage}`, {
            toolName, flowName, agentId, query, ...capturedErrorDetails
          });
        } else if (error instanceof z.ZodError) { // Should not happen if input validation is done by Genkit before tool fn
          errorMessage = `Web search input validation error: ${error.message}`;
          capturedErrorDetails = error.issues;
           winstonLogger.error(`[${toolName}] Zod validation error (should be caught by Genkit): ${errorMessage}`, {
            toolName, flowName, agentId, query, issues: error.issues
          });
        } else {
           winstonLogger.error(`[${toolName}] Non-Axios error during web search: ${errorMessage}`, {
            toolName, flowName, agentId, query, error: String(error)
          });
        }
        // Throw a new error, optionally with a cause for better debugging
        throw new Error(errorMessage, { cause: capturedErrorDetails });
      }
    }
  );
}

// Ensure this file is treated as a module.
export {};

// Example of how to export a pre-configured instance that would use the env vars by default:
// export const googleCustomSearchTool = createPerformWebSearchTool();
//
// Or one that overrides the name/description but still uses env vars for keys:
// export const customNamedGoogleSearchTool = createPerformWebSearchTool({
//   name: "customGoogleSearch",
//   description: "Performs a Google search with a custom name."
// });
//
// Or one that uses specific keys, overriding environment variables:
// export const specificKeySearchTool = createPerformWebSearchTool({
//   name: "specificKeyGoogleSearch",
//   description: "Performs a Google search using a specific API key, overriding environment variables.",
//   apiKey: "SPECIFIC_API_KEY_HERE", // Not recommended to hardcode, better from a secure config
//   apiUrl: "https://www.googleapis.com/customsearch/v1?key=SPECIFIC_API_KEY_HERE&cx=SPECIFIC_CSE_ID_HERE" // If API URL also needs full override
// });