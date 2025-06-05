/**
 * @fileOverview Defines a Genkit tool for querying a knowledge base (RAG system).
 * This tool is created using a factory function to allow for dynamic configuration
 * of the knowledge base ID, API key, service endpoint, and default query parameters.
 * It simulates interaction with a RAG system.
 */
import { ai } from '@/ai/genkit'; // Import the configured 'ai' instance
import { ToolDefinition } from '@genkit-ai/core'; // Import ToolDefinition
import { z } from 'zod';

// 1. Define Configuration Interface for the tool
export interface KnowledgeBaseToolConfig {
  name?: string; // Optional: to allow multiple instances (e.g., 'productDocsKB', 'supportTicketsKB')
  description?: string; // Optional: custom description for this KB instance
  knowledgeBaseId: string; // Identifier for the specific knowledge base to target
  apiKey?: string; // API key if the KB service requires authentication
  serviceEndpoint?: string; // Specific API endpoint if needed for the KB service
  defaultSimilarityTopK?: number; // Default K value for this KB instance
  defaultVectorDistanceThreshold?: number; // Default threshold for this KB instance
}

// 2. Define Input Schema for the tool's handler
// knowledgeBaseId is removed as it's now part of the tool's own configuration
export const KnowledgeBaseInputSchema = z.object({
  query: z.string().describe("The user's query to search for in the knowledge base."),
  similarityTopK: z.number().optional().describe("Number of top K similar chunks to retrieve. Overrides instance default."),
  vectorDistanceThreshold: z.number().optional().describe("Optional threshold for vector distance. Overrides instance default."),
  // metadataFilters: z.record(z.any()).optional().describe("Filters to apply on metadata (e.g., {'category': 'X', 'year': 2023})") // Example for future extension
  flowName: z.string().optional().describe("Name of the calling flow, for logging."),
  agentId: z.string().optional().describe("ID of the calling agent, for logging."),
});

// 3. Define Output Schema for the tool's handler
// Error field removed as errors will be thrown.
export const KnowledgeBaseOutputSchema = z.object({
  retrievedChunks: z.array(
    z.object({
      id: z.string().optional().describe("Unique identifier for the chunk or document segment."),
      content: z.string().describe("The actual text content of the retrieved chunk."),
      source: z.string().optional().describe("Source of the chunk (e.g., document name, URL)."),
      score: z.number().optional().describe("Similarity score or relevance score of the chunk."),
      metadata: z.record(z.any()).optional().describe("Any associated metadata with the chunk."),
    })
  ).describe("Array of retrieved knowledge chunks."),
  summary: z.string().optional().describe("Optional summary generated from the retrieved chunks (if supported by the RAG system)."),
  // error: z.string().optional().describe("Error message if the query failed."), // Removed
  debugInfo: z.record(z.any()).optional().describe("Optional debug information from the RAG system."),
});

// 4. Factory function to create the knowledgeBaseTool
export function createKnowledgeBaseTool(
  config: KnowledgeBaseToolConfig
): ToolDefinition<typeof KnowledgeBaseInputSchema, typeof KnowledgeBaseOutputSchema> {
  const toolName = config.name || 'knowledgeBaseQuery';
  const toolDescription =
    config.description ||
    `Queries a configured knowledge base (ID: ${config.knowledgeBaseId}) using RAG principles.`;

  // Runtime check for knowledgeBaseId, though TypeScript should enforce it at compile time.
  if (!config.knowledgeBaseId) {
    const errorMsg = `[${toolName}] Critical configuration error: knowledgeBaseId is missing. Tool cannot be created.`;
    console.error(errorMsg);
    // This error during setup phase should ideally prevent tool registration or use.
    // Depending on how tools are registered, this might need a more robust handling
    // than just a console error if it can't halt execution.
    // For now, we'll let it proceed but it will fail if called.
  } else {
    console.log(`[${toolName}] Initialized for KB ID: ${config.knowledgeBaseId}. Endpoint: ${config.serviceEndpoint || 'N/A'}`);
  }

  return ai.defineTool(
    {
      name: toolName,
      description: toolDescription,
      inputSchema: KnowledgeBaseInputSchema,
      outputSchema: KnowledgeBaseOutputSchema, // Updated schema
    },
    async (input: z.infer<typeof KnowledgeBaseInputSchema>): Promise<z.infer<typeof KnowledgeBaseOutputSchema>> => {
      const { query, similarityTopK, vectorDistanceThreshold, flowName, agentId } = input;

      // Ensure knowledgeBaseId was provided during tool creation.
      if (!config.knowledgeBaseId) {
        throw new Error(`[${toolName}] Tool is misconfigured: knowledgeBaseId was not provided at creation. Cannot process query: "${query}".`);
      }

      const effectiveTopK = similarityTopK ?? config.defaultSimilarityTopK ?? 3;
      const effectiveThreshold = vectorDistanceThreshold ?? config.defaultVectorDistanceThreshold;

      console.log(
        `[${toolName}] Received query for KB '${config.knowledgeBaseId}': "${query}". TopK: ${effectiveTopK}, Threshold: ${effectiveThreshold}. Flow: ${flowName}, Agent: ${agentId}`
      );

      if (config.apiKey) {
        console.log(`[${toolName}] API key provided (simulated usage for KB: ${config.knowledgeBaseId}).`);
      }

      try {
        // Example simulation based on knowledgeBaseId
        if (config.knowledgeBaseId === "product_manual_v3") {
          let chunks = [];
          if (query.toLowerCase().includes("setup")) {
            chunks.push({
              id: "doc1_chunk3",
              content: "To set up the device, first connect the power cable, then press the power button. Refer to page 5 for diagrams.",
              source: "product_manual_v3.pdf",
              score: 0.92,
              metadata: { page: 5, section: "2.1 Setup" },
            });
          }
          if (query.toLowerCase().includes("troubleshooting") || query.toLowerCase().includes("issue")) {
            chunks.push({
              id: "doc1_chunk15",
              content: "If the device does not power on, check the fuse and ensure the power outlet is working. Common issues are listed on page 25.",
              source: "product_manual_v3.pdf",
              score: 0.88,
              metadata: { page: 25, section: "5.1 Troubleshooting" },
            });
          }
          if (chunks.length === 0) {
            // Simulate no specific chunks found, but not an error condition for this specific KB
            // Could also throw an error here if "no results found" should be an error.
            // For this example, we'll return empty chunks for "product_manual_v3" if no keywords match.
             chunks.push({
              id: "doc1_generic_chunk_not_found",
              content: `No specific information found for "${query}" in product_manual_v3. Please try rephrasing your query.`,
              source: "product_manual_v3.pdf",
              score: 0.30, // Lower score for generic "not found" type message
              metadata: { section: "General" },
            });
          }
          const finalChunks = chunks.slice(0, effectiveTopK);

          return {
            retrievedChunks: finalChunks,
            summary: `Based on product_manual_v3, for your query "${query}": ${finalChunks.map(c => c.content).join(' ')}`,
            debugInfo: {
              configuredKbId: config.knowledgeBaseId,
              effectiveTopK: effectiveTopK,
              effectiveThreshold: effectiveThreshold,
              queryEmbeddingUsed: true,
              searchPerformed: true,
            }
          };
        } else if (config.knowledgeBaseId === "internal_dev_docs_v1") {
          // Generic simulation for another recognized KB ID
          return {
            retrievedChunks: [{
              id: 'dev_docs_sim_chunk',
              content: `Simulated developer documentation content for query "${query}" from knowledge base "${config.knowledgeBaseId}". TopK: ${effectiveTopK}.`,
              source: 'internal_dev_docs_v1_simulation.md',
              score: 0.85
            }],
            summary: `Developer information retrieved from KB: ${config.knowledgeBaseId}.`,
            debugInfo: {
              configuredKbId: config.knowledgeBaseId,
              effectiveTopK: effectiveTopK,
              effectiveThreshold: effectiveThreshold,
              queryEmbeddingUsed: true,
              searchPerformed: true,
            }
          };
        } else {
          // If the knowledgeBaseId is not recognized by any specific simulation logic
          const errorMsg = `Knowledge base ID '${config.knowledgeBaseId}' is not recognized by this simulation or the RAG system is not implemented for it. Query: "${query}".`;
          console.warn(`[${toolName}] ${errorMsg}`);
          throw new Error(errorMsg);
        }
      } catch (error: any) {
        console.error(`[${toolName}] Error during knowledge base query simulation for KB '${config.knowledgeBaseId}':`, error.message);
        if (error instanceof Error) {
          throw error; // Re-throw if it's already an Error instance
        }
        throw new Error(`Failed to query knowledge base '${config.knowledgeBaseId}': ${error.message || 'Unknown error during simulation'}`);
      }
    }
  );
}

// Example of how to export a pre-configured instance (optional)
// export const productFaqKb = createKnowledgeBaseTool({
//   name: "productFaqKnowledgeBase",
//   description: "Queries the Product FAQ knowledge base.",
//   knowledgeBaseId: "product_faq_v1",
//   // apiKey: process.env.FAQ_KB_API_KEY, // From secure source
//   // serviceEndpoint: "https://api.example.com/kb/product_faq",
//   defaultSimilarityTopK: 5,
// });