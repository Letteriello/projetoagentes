/**
 * @fileOverview Defines a Genkit tool for executing queries against a database.
 * This tool is created using a factory function to allow for dynamic configuration
 * of database connection parameters (type, host, port, credentials, etc.).
 * It simulates database interaction, primarily supporting SELECT queries on
 * predefined tables for safety in this conceptual phase.
 */
import { ai } from '@/ai/genkit'; // Import the configured 'ai' instance
import { ToolDefinition } from '@genkit-ai/core'; // Import ToolDefinition
import { z } from 'zod';

// Define supported database types (can be extended)
export const SupportedDbTypesSchema = z.enum([
  'postgresql',
  'mysql',
  'sqlite',
  'mongodb',
  'sqlserver',
  'oracle',
  'other',
]);
export type SupportedDbType = z.infer<typeof SupportedDbTypesSchema>;

// 1. Define Configuration Interface for the tool
export interface DatabaseAccessToolConfig {
  name?: string;
  description?: string;
  dbType: SupportedDbType;
  dbHost?: string;
  dbPort?: number;
  dbName?: string;
  dbUser?: string;
  dbPassword?: string;
  dbConnectionString?: string;
}

// 2. Define Input Schema for the tool's handler
export const DatabaseAccessInputSchema = z.object({
  query: z.string()
    .describe("The query to execute (e.g., SQL for RDBMS, or a specific command/filter for NoSQL). IMPORTANT: This simulation primarily supports SELECT SQL queries for safety reasons."),
  parameters: z.record(z.any()).optional()
    .describe("Key-value pairs for parameterized queries (e.g., { \"userId\": 123, \"status\": \"active\"})."),
  // Added for logging context
  flowName: z.string().optional().describe("Name of the calling flow, for logging."),
  agentId: z.string().optional().describe("ID of the calling agent, for logging."),
});

// 3. Define Output Schema for the tool's handler
// Success and error fields are removed. Direct output on success. Errors are thrown.
export const DatabaseAccessOutputSchema = z.object({
  rowCount: z.number().optional().describe("Number of rows affected or returned."),
  rows: z.array(z.any()).optional().describe("An array of objects representing the rows returned by a SELECT query. Each object's keys are column names."),
  columns: z.array(z.object({ name: z.string(), type: z.string() })).optional().describe("An array describing the columns returned, with name and type."),
  executionTimeMs: z.number().optional().describe("Time taken for query execution in milliseconds."),
});

// Schema for simulated product data
const ProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.string(),
  price: z.number(),
  stock: z.number(),
});
type Product = z.infer<typeof ProductSchema>;

const productTableColumns: Array<{ name: keyof Product; type: string }> = [
  { name: 'id', type: 'integer' },
  { name: 'name', type: 'varchar' },
  { name: 'category', type: 'varchar' },
  { name: 'price', type: 'decimal' },
  { name: 'stock', type: 'integer' },
];

const simulatedProducts: Product[] = [
  { id: 1, name: 'Laptop Pro', category: 'Electronics', price: 1200.00, stock: 50 },
  { id: 2, name: 'Smartphone X', category: 'Electronics', price: 800.00, stock: 150 },
  { id: 3, name: 'Office Chair', category: 'Furniture', price: 150.00, stock: 300 },
  { id: 4, name: 'Desk Lamp', category: 'Furniture', price: 45.00, stock: 500 },
  { id: 5, name: 'Wireless Mouse', category: 'Electronics', price: 25.00, stock: 1000 },
];

// 4. Factory function to create the databaseAccessTool
export function createDatabaseAccessTool(
  config: DatabaseAccessToolConfig
): ToolDefinition<typeof DatabaseAccessInputSchema, typeof DatabaseAccessOutputSchema> {
  const toolName = config.name || 'databaseAccess';
  const toolDescription =
    config.description ||
    `Executes queries against a configured ${config.dbType} database (DB: ${config.dbName || 'N/A'}). Supports simulated SELECTs.`;

  console.log(`[${toolName}] Initialized for ${config.dbType} DB: ${config.dbName || 'N/A'} on host ${config.dbHost || 'N/A'}`);

  return ai.defineTool(
    {
      name: toolName,
      description: toolDescription,
      inputSchema: DatabaseAccessInputSchema,
      outputSchema: DatabaseAccessOutputSchema, // Updated schema
    },
    async (input: z.infer<typeof DatabaseAccessInputSchema>): Promise<z.infer<typeof DatabaseAccessOutputSchema>> => {
      const { query, parameters, flowName, agentId } = input;
      const startTime = Date.now();

      console.log(`[${toolName}] Received query: '${query}' with params:`, parameters, `for flow: ${flowName}, agent: ${agentId}`);

      try {
        if (config.dbType === 'sqlite' || config.dbType === 'postgresql' || config.dbType === 'mysql') {
          const lowerQuery = query.toLowerCase();
          if (lowerQuery.startsWith('select * from products')) {
            let filteredProducts = [...simulatedProducts];
            if (lowerQuery.includes('where')) {
              const matchCategory = lowerQuery.match(/where\s+category\s*=\s*['"](.+?)['"]/);
              if (matchCategory && matchCategory[1]) {
                filteredProducts = simulatedProducts.filter(p => p.category.toLowerCase() === matchCategory[1].toLowerCase());
              }
              const matchId = lowerQuery.match(/where\s+id\s*=\s*(\d+)/);
              if (matchId && matchId[1]) {
                const searchId = parseInt(matchId[1], 10);
                filteredProducts = simulatedProducts.filter(p => p.id === searchId);
                if (filteredProducts.length === 0) {
                  throw new Error(`Simulated query: Product with ID ${searchId} not found in 'products'.`);
                }
              }
            }
            return {
              rowCount: filteredProducts.length,
              rows: filteredProducts,
              columns: productTableColumns,
              executionTimeMs: Date.now() - startTime,
            };
          } else if (lowerQuery.startsWith('select count(*) from products')) {
            return {
              rowCount: 1,
              rows: [{ 'count(*)': simulatedProducts.length }],
              columns: [{ name: 'count(*)', type: 'integer' }],
              executionTimeMs: Date.now() - startTime,
            };
          } else if (lowerQuery.startsWith('select name, price from products where id =') && parameters?.id) {
            const productId = parameters.id as number;
            const product = simulatedProducts.find(p => p.id === productId);
            if (!product) {
              throw new Error(`Simulated query: Product with ID ${productId} not found.`);
            }
            return {
              rowCount: 1,
              rows: [{ name: product.name, price: product.price }],
              columns: [{ name: 'name', type: 'varchar' }, { name: 'price', type: 'decimal' }],
              executionTimeMs: Date.now() - startTime,
            };
          }
        } else if (config.dbType === "mongodb") {
          try {
            const mongoQuery = JSON.parse(query);
            if (mongoQuery.collection === 'users') {
              const filterId = parameters?.id as number || 1;
              // Simulate finding a user or throwing if not found based on filterId if desired
              // For now, assume user always found for simulation
              return {
                rowCount: 1,
                rows: [{ _id: filterId, name: `Mongo User ${filterId}`, db: config.dbName || 'unknown_db' }],
                executionTimeMs: Date.now() - startTime,
              };
            }
          } catch (e: any) {
            console.error(`[${toolName}] MongoDB query parsing error:`, e.message);
            throw new Error(`Invalid JSON query for MongoDB simulation: ${e.message}`);
          }
        }

        // If no specific simulation rule matched
        const noRuleErrorMsg = `Simulated query for ${config.dbType} ('${query}') matched no predefined rules for this tool.`;
        console.warn(`[${toolName}] ${noRuleErrorMsg}`);
        throw new Error(noRuleErrorMsg);

      } catch (error: any) {
        console.error(`[${toolName}] Error during query simulation:`, error.message);
        // Re-throw the error to be handled by Genkit or higher-level error handlers
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(`Database operation failed: ${error.message || 'Unknown error during simulation'}`);
      }
    }
  );
}

// Example of how to export a pre-configured instance (optional)
// export const myAnalyticsDbQueryTool = createDatabaseAccessTool({
//   name: "analyticsDbQuery",
//   description: "Query tool for the main analytics PostgreSQL database.",
//   dbType: "postgresql",
//   dbHost: "analytics.example.com",
//   dbPort: 5432,
//   dbName: "prod_analytics",
//   dbUser: "readonly_user",
//   // dbPassword: process.env.ANALYTICS_DB_PASSWORD, // From a secure source
// });