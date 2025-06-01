/**
 * @fileOverview Defines a Genkit tool for executing queries against a database.
 * This tool is created using a factory function to allow for dynamic configuration
 * of database connection parameters (type, host, port, credentials, etc.).
 * It simulates database interaction, primarily supporting SELECT queries on
 * predefined tables for safety in this conceptual phase.
 */
import { defineTool, Tool } from 'genkit/tool';
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
  name?: string; // Optional: to allow multiple instances with different names (e.g., 'userDbQuery', 'inventoryDbQuery')
  description?: string; // Optional: to allow custom description per instance
  dbType: SupportedDbType;
  dbHost?: string; // Optional if connectionString is used or for embedded DBs like SQLite
  dbPort?: number; // Optional, defaults vary by dbType
  dbName?: string; // Database name
  dbUser?: string; // Username for authentication
  dbPassword?: string; // Password for authentication - consider secure storage/retrieval for real scenarios
  dbConnectionString?: string; // Full connection string (can override individual params)
}

// 2. Define Input Schema for the tool's handler
// dbId is removed as the tool instance itself is configured for a specific DB
export const DatabaseAccessInputSchema = z.object({
  query: z.string()
    .describe("The query to execute (e.g., SQL for RDBMS, or a specific command/filter for NoSQL). IMPORTANT: This simulation primarily supports SELECT SQL queries for safety reasons."),
  parameters: z.record(z.any()).optional()
    .describe("Key-value pairs for parameterized queries (e.g., { \"userId\": 123, \"status\": \"active\" }). These help prevent injection attacks."),
  options: z.record(z.any()).optional()
    .describe("Additional options for query execution (e.g., read preference for NoSQL, transaction control - highly dependent on DB type and client library).")
});

// 3. Define Output Schema for the tool's handler
export const DatabaseAccessOutputSchema = z.object({
  success: z.boolean().describe("Indicates whether the database query execution was successful."),
  rowCount: z.number().optional().describe("Number of rows affected or returned. For SELECT, it's the number of rows in the 'rows' array."),
  rows: z.array(z.record(z.any())).optional()
    .describe("An array of objects, where each object represents a row/document returned by a read query."),
  columns: z.array(z.object({
    name: z.string().describe("Name of the column/field."),
    type: z.string().optional().describe("Data type of the column/field (e.g., 'integer', 'varchar', 'decimal', 'array', 'object').")
  })).optional().describe("Information about the columns/fields returned by a read query."),
  error: z.string().optional().describe("Error message if the query execution failed."),
  executionTimeMs: z.number().optional().describe("Time taken to execute the query in milliseconds.")
});

// 4. Factory function to create the databaseAccessTool
export function createDatabaseAccessTool(
  config: DatabaseAccessToolConfig
): Tool<typeof DatabaseAccessInputSchema, typeof DatabaseAccessOutputSchema> {
  const toolName = config.name || 'databaseAccess';
  const toolDescription = config.description ||
    `Executes a query against a configured ${config.dbType} database. ` +
    (config.dbName ? `(DB: ${config.dbName}) ` : '') +
    "This simulation primarily supports SELECT SQL-like queries.";

  // Log configuration on tool creation (excluding sensitive parts like password in a real scenario)
  console.log(`[${toolName}] Initialized with config:`, {
    dbType: config.dbType,
    dbHost: config.dbHost,
    dbPort: config.dbPort,
    dbName: config.dbName,
    dbUser: config.dbUser,
    hasPassword: !!config.dbPassword, // Log presence, not the password itself
    hasConnectionString: !!config.dbConnectionString,
  });

  return defineTool(
    {
      name: toolName,
      description: toolDescription,
      inputSchema: DatabaseAccessInputSchema,
      outputSchema: DatabaseAccessOutputSchema,
    },
    async ({ query, parameters /*, options */ }) => {
      const startTime = Date.now();
      console.log(`[${toolName}] Received query:`, { query, parameters });
      console.log(`[${toolName}] Tool using DB config: ${config.dbType} on ${config.dbHost || (config.dbConnectionString ? 'connection string' : 'N/A')}${config.dbName ? '/' + config.dbName : ''}`);

      // TODO: Implement actual database interaction here based on config.dbType.
      // This would involve:
      // 1. Connection Management using config (dbType, dbHost, dbPort, dbUser, dbPassword, dbConnectionString):
      //    - Choose client library (e.g., 'pg' for PostgreSQL, 'mysql2', 'mongodb driver', 'sqlite3').
      //    - Establish connection (ideally from a pool).
      //
      // 2. Security - Injection Prevention:
      //    - **Crucially important:** Use parameterized queries with `parameters` input.
      //    - For NoSQL, ensure proper sanitization or use of library-specific query builders.
      //
      // 3. Query Execution & Result Formatting:
      //    - Adapt based on `config.dbType`. The simulation below is SQL-centric.
      //
      // 4. Error Handling & Connection Closing/Releasing.

      // --- Simulation Logic (SQL-centric for now) ---
      if (config.dbType !== "mongodb" && config.dbType !== "other") { // Assuming SQL-like for these
        const lowerCaseQuery = query.toLowerCase().trim();
        if (!lowerCaseQuery.startsWith("select")) {
          console.warn(`[${toolName}] Non-SELECT query attempted: ${query}`);
          return {
            success: false,
            error: "This simulation primarily supports SELECT SQL queries. Other query types are not allowed.",
            executionTimeMs: Date.now() - startTime,
          };
        }
        // Simplified security check (from original tool)
        if (lowerCaseQuery.includes("drop ") || lowerCaseQuery.includes("delete ") || lowerCaseQuery.includes("update ") || lowerCaseQuery.includes("insert ") || lowerCaseQuery.includes("alter ") || lowerCaseQuery.includes("truncate ")) {
            if (!lowerCaseQuery.startsWith("select") || (lowerCaseQuery.startsWith("select") && (lowerCaseQuery.includes(" from information_schema") || lowerCaseQuery.includes(" from pg_catalog")))){
                return {
                    success: false,
                    error: "Harmful DML/DDL operations or access to system tables are not allowed in this simulation.",
                    executionTimeMs: Date.now() - startTime,
                };
            }
        }

        // Simulated responses based on table names (from original tool)
        if (lowerCaseQuery.includes("from users")) {
          const userIdParam = parameters?.userId || parameters?.id || 1;
          const simulatedUser = {
            id: Number(userIdParam),
            name: `Simulated User ${userIdParam} from ${config.dbName || config.dbHost || 'DB'}`,
            email: `user${userIdParam}@example.com`,
            status: parameters?.status || "active"
          };
          return {
            success: true,
            rowCount: 1,
            rows: [simulatedUser],
            columns: [ /* ... as before ... */ ],
            executionTimeMs: Date.now() - startTime,
          };
        } else if (lowerCaseQuery.includes("from products")) {
          const simulatedProducts = [ /* ... as before, potentially add config info ... */ ];
          return {
            success: true,
            rowCount: simulatedProducts.length,
            rows: simulatedProducts,
            columns: [ /* ... as before ... */ ],
            executionTimeMs: Date.now() - startTime,
          };
        }
      } else if (config.dbType === "mongodb") {
        // Crude simulation for MongoDB
        // Example: query might be '{"collection": "users", "filter": {"status": "active"}}'
        // Parameters could be merged into the filter or used for other options.
        try {
          const mongoQuery = JSON.parse(query);
          if (mongoQuery.collection === 'users') {
             const filterId = parameters?.id || 1;
             return {
                success: true,
                rowCount: 1,
                rows: [{ _id: filterId, name: `Mongo User ${filterId}`, db: config.dbName }],
                executionTimeMs: Date.now() - startTime,
             };
          }
        } catch (e) {
          return { success: false, error: "Invalid JSON query for MongoDB simulation.", executionTimeMs: Date.now() - startTime };
        }
      }

      // Default response if no simulation rule matched
      return {
        success: true, // Or false, depending on desired behavior for unknown queries
        rowCount: 0,
        rows: [],
        columns: [],
        error: `Simulated query for ${config.dbType} ('${query}') matched no predefined rules for this tool.`,
        executionTimeMs: Date.now() - startTime,
      };
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
