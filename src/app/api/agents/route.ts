/**
 * @file src/app/api/agents/route.ts
 * 
 * This file defines the Next.js API route handler for creating (defining) new agents.
 * It listens for POST requests on the `/api/agents` endpoint.
 * 
 * Functionality:
 * - Receives agent configuration data in the request body.
 * - Uses the `defineAdkAgent` function from `adk-agent-manager.ts` to define and initialize the agent.
 * - Returns a success response with the new agent's ID and name, or an error response if creation fails.
 */
import { NextRequest, NextResponse } from 'next/server';
import { defineAdkAgent, SavedAgentConfiguration } from '../../ai/adk-agent-manager'; // Core agent definition logic
import { Agent } from '@genkit-ai/agent'; // Genkit Agent type

/**
 * Handles POST requests to /api/agents.
 * This function is responsible for creating and defining a new agent based on the
 * configuration provided in the request body.
 *
 * @param {NextRequest} request - The incoming Next.js request object.
 *                                Expected body: `SavedAgentConfiguration` JSON object.
 * @returns {Promise<NextResponse>} A promise that resolves to a Next.js response object.
 *                                  On success: 200 OK with { message, agentId, agentName }.
 *                                  On failure: 400 Bad Request for invalid input/config, 
 *                                              500 Internal Server Error for other issues.
 */
export async function POST(request: NextRequest) {
  try {
    // Attempt to parse the agent configuration from the request body.
    // `SavedAgentConfiguration` is the expected structure, defined in `adk-agent-manager.ts`.
    const agentConfig: SavedAgentConfiguration = await request.json();

    // Log the received configuration for debugging and audit purposes.
    // In a production environment, consider more structured logging.
    console.log('Received agent configuration for definition:', agentConfig);

    // Call the core agent definition logic. This function handles the complexities
    // of instantiating different types of Genkit agents.
    const definedAgent: Agent = await defineAdkAgent(agentConfig);

    // Note: The Genkit `Agent` object (returned by `defineAdkAgent`) has a `name` property.
    // We use `agentConfig.id` as the primary identifier passed from the client.
    // `definedAgent.name` should match `agentConfig.agentName`.
    return NextResponse.json(
      {
        message: 'Agent configuration received and agent defined successfully.',
        agentId: agentConfig.id, // The ID from the input configuration, used for tracking.
        agentName: definedAgent.name, // The name of the defined Genkit agent.
      },
      { status: 200 } // HTTP 200 OK for successful creation.
    );
  } catch (error: any) {
    // Log the error for server-side diagnostics.
    console.error('Error processing agent configuration in /api/agents POST handler:', error);

    // Handle JSON parsing errors specifically.
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid request body: Malformed JSON.', details: error.message },
        { status: 400 } // HTTP 400 Bad Request.
      );
    }

    // Handle known validation errors thrown by `defineAdkAgent`.
    // These typically indicate issues with the provided agent configuration.
    const knownValidationErrors = [
      'Agent name and description are required', // General validation
      'LLM agent configuration requires',       // LLM specific
      'Workflow agent configuration requires',  // Workflow specific
      'Custom agent configuration requires',    // Custom specific
      'not yet implemented',                    // Feature/type not ready
      'Failed to retrieve model',               // Error from ai.getModel()
      'Unknown detailedWorkflowType'            // Specific workflow subtype error
    ];

    if (knownValidationErrors.some(keyword => error.message.includes(keyword))) {
      return NextResponse.json(
        { error: 'Agent configuration error.', details: error.message },
        { status: 400 } // HTTP 400 Bad Request due to invalid configuration.
      );
    }

    // For any other errors, return a generic server error.
    // This hides internal details while still indicating a server-side problem.
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing the agent configuration.', details: error.message },
      { status: 500 } // HTTP 500 Internal Server Error.
    );
  }
}
