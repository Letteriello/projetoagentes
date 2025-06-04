/**
 * @fileOverview Template for creating a Genkit OpenAPI Tool.
 * An OpenAPI Tool allows Genkit to interact with an API described by an OpenAPI specification.
 * Genkit can understand the API's operations and make calls to them based on the schema.
 */

import { defineOpenapiTool } from '@genkit-ai/ai'; // Core function to define an OpenAPI tool
// Zod can be useful for defining parts of schemas or if you need to handle data
// before sending it to the API or after receiving it, though it's not strictly
// required for the basic definition if your OpenAPI schema is complete.
// import { z } from 'zod';

// 1. Define or locate your OpenAPI Schema.
// This can be:
//    a) A URL string pointing to your OpenAPI specification (e.g., 'https://petstore.swagger.io/v2/swagger.json').
//    b) A JavaScript object representing the OpenAPI specification.
//    c) A path to a local JSON or YAML file (Genkit might require specific handling for local paths,
//       often by reading the file and passing the object, or using a URL if served locally).

// Example of an inline OpenAPI schema object (for simple cases):
const MyExampleOpenAPISchema = {
  openapi: '3.0.0',
  info: {
    title: 'My Example API',
    version: 'v1.0.0',
    description: 'An example API to demonstrate OpenAPI tool integration with Genkit.',
  },
  servers: [
    {
      url: 'https://api.example.com/v1', // Replace with your actual API server URL
      description: 'Production server',
    },
  ],
  paths: {
    '/items/{itemId}': {
      get: {
        summary: 'Get an item by its ID',
        operationId: 'getItemById', // Important for Genkit to identify the operation
        parameters: [
          {
            name: 'itemId',
            in: 'path',
            required: true,
            description: 'The ID of the item to retrieve.',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Successful response with the item data.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', description: 'Item ID.' },
                    name: { type: 'string', description: 'Item name.' },
                    description: { type: 'string', optional: true, description: 'Item description.' },
                  },
                },
              },
            },
          },
          '404': {
            description: 'Item not found.',
          },
        },
      },
    },
    // Add more paths and operations as needed
  },
};

// 2. Define the OpenAPI tool using `defineOpenapiTool`.
export const myOpenapiTool = defineOpenapiTool({
  name: 'myApiService', // Choose a descriptive name for your tool.
  description: 'A tool that interacts with My Example API to perform operations like retrieving item details.', // Describe what the API (and thus the tool) does.

  // Provide your OpenAPI schema.
  // Option A: URL string (most common for published APIs)
  // schema: 'https://api.example.com/openapi.v3.json',

  // Option B: Inline schema object (useful for smaller schemas or for this template)
  schema: MyExampleOpenAPISchema,

  // Option C: If loading from a local file, you might read it and parse it here,
  // then pass the resulting object to `schema`.
  // Example:
  // import * as fs from 'fs';
  // import * as yaml from 'js-yaml'; // or JSON.parse for JSON files
  // const schemaFile = fs.readFileSync('./path/to/your/openapi.yaml', 'utf8');
  // const schemaObject = yaml.load(schemaFile);
  // schema: schemaObject,

  // 3. Configure Authentication (if required by your API).
  // If your API requires authentication, you'll need to provide the necessary headers
  // or use the `auth` configuration block for OAuth 2.0.

  // Example for API Key in header:
  // headers: {
  //   'Authorization': `Bearer ${process.env.MY_API_SERVICE_KEY}`, // Always use environment variables for keys
  //   'x-api-key': process.env.ANOTHER_API_KEY,
  // },

  // Example for OAuth (refer to Genkit documentation for details on specific providers):
  // auth: {
  //   type: 'oauth2',
  //   authorizationUrl: 'https://example.com/oauth/authorize', // If using Genkit's auth code flow support
  //   // client_id, client_secret, etc., would be needed depending on the flow
  //   // and how Genkit handles token acquisition for this provider.
  // },

  // 4. Optional: Customize which operations are exposed as tools.
  // By default, all operations in the OpenAPI spec are exposed.
  // You can filter them if needed:
  // filter: (operation, spec) => {
  //   // Example: Only expose GET requests or operations with a specific tag
  //   // return operation.method === 'get';
  //   // return operation.tags?.includes('items');
  //   return true; // Expose all by default
  // },
});

// How to use this template:
// 1. Rename `myOpenapiTool` and update its `name` and `description` to be specific to the API it represents.
// 2. Replace `MyExampleOpenAPISchema` with your actual OpenAPI schema:
//    - Provide a URL string to a hosted schema.
//    - Or, for an inline schema, define the object accurately.
//    - Or, load from a local file and parse it.
// 3. If your API requires authentication:
//    - For API keys, add a `headers` object with the necessary authorization headers.
//      Store actual keys in environment variables (e.g., `process.env.YOUR_API_KEY`).
//    - For OAuth2 or other auth mechanisms, configure the `auth` block according to Genkit's documentation.
// 4. If needed, use the `filter` function to select which API operations should be available as tools.
// 5. Import and use this tool in your Genkit flows.
//    Ensure this file is imported by your Genkit configuration or a flow for the tool to be registered.

// To make this tool discoverable by Genkit, ensure it's exported and the file
// is imported by your Genkit setup (e.g., in `src/ai/index.ts` or `src/ai/genkit.ts`
// or directly within a flow file).
export {}; // Ensures this file is treated as a module.
