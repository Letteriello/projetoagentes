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
// @ts-ignore
export const WebSearchOutputSchema = z.object({
  results: z.array(SearchResultSchema).describe("Array of search results."),
  message: z.string().optional().describe("A message summarizing the search outcome."),
  errorDetails: ErrorDetailsSchema.optional().describe("Structured error information if the web search failed."),
});

// Remove the incomplete Tool definition as per analysis
// export const performWebSearchTool: Tool = { ... }

export function createPerformWebSearchTool(
  config: WebSearchToolConfig = {} // Default to empty config
): ToolDefinition<typeof WebSearchInputSchema, typeof WebSearchOutputSchema> {
  const toolName = config.name || "performGoogleWebSearch"; // Default to Google search
  const toolDescription = config.description || "Performs a web search using Google Custom Search API to find up-to-date information.";

  // Determine API key and CSE ID: config > environment > undefined
  const apiKey = config.apiKey || process.env.GOOGLE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID; // Assuming CSE ID comes from env, not typically in generic config.apiKey

  // Determine API URL: config > default Google Search API > undefined
  let apiUrl = config.apiUrl;
  if (!apiUrl && apiKey && cseId) {
    apiUrl = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}`;
  }

  winstonLogger.info(`[${toolName}] Initialized.`, {
    toolName,
    resolvedApiUrl: apiUrl || 'No API URL resolved (will be simulated or error)',
    apiKeyProvided: !!apiKey,
    cseIdProvided: !!cseId,
  });

  return ai.defineTool(
    {
      name: toolName,
      description: toolDescription,
      inputSchema: WebSearchInputSchema,
      outputSchema: WebSearchOutputSchema,
    },
    async (input: z.infer<typeof WebSearchInputSchema>) => {
      const { query, num_results = 5, flowName, agentId } = input;

      winstonLogger.info(`[${toolName}] Executing web search`, {
        toolName,
        query,
        num_results,
        resolvedApiUrl: apiUrl,
        flowName,
        agentId,
      });

      if (!apiKey || !cseId || !apiUrl) {
        winstonLogger.warn(
          `[${toolName}] API key, CSE ID, or API URL not configured. GOOGLE_API_KEY and GOOGLE_CSE_ID must be set in the environment, or apiKey and apiUrl provided in config. Returning simulated results.`,
          { toolName, flowName, agentId, apiKeyProvided: !!apiKey, cseIdProvided: !!cseId, apiUrlProvided: !!apiUrl }
        );
        const simulatedResults: SearchResult[] = Array.from({ length: Math.min(num_results, 10) }, (_, i) => ({
          title: `Simulated Result ${i + 1} for "${query}" (Missing API Config)`,
          url: `https://example.com/simulated-search?q=${encodeURIComponent(query)}&index=${i}`,
          snippet: `This is a simulated search result snippet #${i + 1}. API key or CSE ID was not configured. Please set GOOGLE_API_KEY and GOOGLE_CSE_ID environment variables.`,
        }));
        return {
          results: simulatedResults,
          message: "Web search simulation complete (API key, CSE ID, or API URL not configured).",
        };
      }

      try {
        // Actual API call logic using axios for Google Custom Search
        winstonLogger.info(`[${toolName}] Making API call to Google Custom Search`, { toolName, apiUrl, query, num_results });
        
        const response = await axios.get(apiUrl, { // apiUrl here already includes key and cx
          params: {
            q: query,
            num: Math.min(num_results, 10), // Max 10 results for Google CSE basic
          },
          headers: {
            'Accept': 'application/json',
          },
        });

        let searchResults: SearchResult[] = [];
        if (response.data && response.data.items) {
          searchResults = response.data.items.map((item: any) => ({
            title: item.title || 'No title',
            url: item.link || item.url || 'No URL',
            snippet: item.snippet || 'No snippet',
          })).slice(0, Math.min(num_results, 10));
        } else {
           winstonLogger.warn(`[${toolName}] No items found in API response or unexpected structure.`, { responseData: response.data, toolName, flowName, agentId });
        }

        return {
          results: searchResults,
          message: `Successfully fetched ${searchResults.length} results for "${query}" from Google Custom Search.`,
        };

      } catch (error) {
        // Keep existing error handling logic
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during web search.';
        let errorCode = 'UNKNOWN_TOOL_ERROR';
        let errorDetailsData: any = undefined;
        let logMetadata: Record<string, any> = {
          toolName,
          flowName,
          agentId,
          query,
          error: error instanceof Error ? { message: error.message, stack: error.stack, name: error.name } : String(error),
        };

        if (axios.isAxiosError(error)) {
          errorCode = error.response?.status ? `AXIOS_${error.response.status}` : 'AXIOS_ERROR';
          errorDetailsData = error.response?.data;
          logMetadata.axiosError = {
            status: error.response?.status,
            data: errorDetailsData,
            code: error.code,
          };
        } else if (error instanceof z.ZodError) {
          errorCode = 'INPUT_VALIDATION_ERROR';
          errorDetailsData = error.issues;
          logMetadata.zodErrorIssues = error.issues;
        }

        winstonLogger.error(`[${toolName}] Error during web search`, logMetadata);

        return {
          results: [],
          message: undefined,
          errorDetails: {
            code: errorCode,
            message: errorMessage,
            details: errorDetailsData,
          },
        };
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