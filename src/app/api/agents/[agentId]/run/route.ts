/**
 * @file src/app/api/agents/[agentId]/run/route.ts
 * 
 * This file defines the Next.js API route handler for executing a defined agent.
 * It listens for POST requests on dynamic routes like `/api/agents/my-agent-id/run`.
 * 
 * Functionality:
 * - Extracts the `agentId` from the URL path.
 * - Retrieves the corresponding agent using `getDefinedAgent` from `adk-agent-manager.ts`.
 * - Parses the input for the agent from the request body (expects JSON with an "input" field).
 * - Executes the agent using `agent.run(input)`.
 * - Returns the agent's output or an error response.
 */
import { NextResponse } from 'next/server';
import { getDefinedAgent } from '../../../../ai/adk-agent-manager'; // Function to retrieve defined agents
import { Agent } from '@genkit-ai/agent'; // Genkit Agent type (though not strictly needed for `agent.run()`)

/**
 * Handles POST requests to /api/agents/[agentId]/run.
 * This function is responsible for executing a previously defined agent with the provided input.
 *
 * @param {Request} request - The incoming Fetch API Request object (Next.js uses this standard).
 *                            Expected body: JSON object like `{ "input": "user query" }`.
 * @param {object} params - An object containing the dynamic route parameters.
 * @param {string} params.agentId - The ID of the agent to execute.
 * @returns {Promise<NextResponse>} A promise that resolves to a Next.js response object.
 *                                  On success: 200 OK with { output: result_from_agent_run }.
 *                                  On failure: 400 Bad Request (missing agentId, invalid input),
 *                                              404 Not Found (agent not defined),
 *                                              415 Unsupported Media Type (invalid content type),
 *                                              500 Internal Server Error (agent execution error or other issues).
 */
export async function POST(
  request: Request, // Standard Fetch API Request object used by Next.js
  { params }: { params: { agentId: string } } // Destructure agentId from route parameters
) {
  const { agentId } = params;

  // Validate that agentId is provided in the path.
  if (!agentId) {
    return NextResponse.json(
      { error: 'Agent ID is required in the URL path.' }, 
      { status: 400 }
    );
  }

  // Retrieve the agent instance from the in-memory store.
  const agent = getDefinedAgent(agentId);

  // If no agent is found for the given ID, return a 404 error.
  if (!agent) {
    return NextResponse.json(
      { error: `Agent '${agentId}' not found or not defined.` }, 
      { status: 404 }
    );
  }

  let agentInput: any; // Variable to store the validated input for the agent.
  try {
    // Check content type: only application/json is accepted.
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type. Only application/json is accepted.' },
        { status: 415 } // HTTP 415 Unsupported Media Type
      );
    }

    // Parse the JSON body from the request.
    // This can throw a SyntaxError if the body is malformed or not valid JSON.
    const body = await request.json(); 

    // Validate the structure of the parsed body: must be an object with an "input" field.
    // This is a specific requirement for how this ADK expects agent inputs.
    if (typeof body !== 'object' || body === null || !body.hasOwnProperty('input')) {
      console.warn(`Request body for agent '${agentId}' must be a JSON object with an 'input' field. Received:`, body);
      return NextResponse.json(
        { error: "Invalid request format: body must be a JSON object with an 'input' field." },
        { status: 400 }
      );
    }
    agentInput = body.input; // Extract the actual input for the agent.

  } catch (error: any) {
    // Handle errors during input processing (e.g., JSON parsing).
    if (error instanceof SyntaxError) {
      console.error(`Error parsing JSON input for agent '${agentId}':`, error);
      return NextResponse.json(
        { error: 'Invalid JSON input. Ensure the request body is valid JSON.', details: error.message },
        { status: 400 }
      );
    }
    // Catch any other unexpected errors during this stage.
    console.error(`Unexpected error processing input for agent '${agentId}':`, error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while processing the request input.', details: error.message },
      { status: 500 }
    );
  }

  // Try to execute the agent with the processed input.
  try {
    // Log the agent ID and the input being used for execution.
    // Be cautious with logging potentially sensitive input data in production environments.
    console.log(`Running agent '${agentId}' with input:`, JSON.stringify(agentInput, null, 2));
    
    // Execute the agent's run method. The structure of `agentInput` should match
    // what the specific agent's underlying flow or LLM expects.
    // For Genkit agents, `agent.run()` is the standard way to invoke them.
    // The type of `agentInput` can be `any` here because different agents might have different input schemas.
    // Genkit itself will handle schema validation if the agent's flow defines an input schema.
    const result = await agent.run(agentInput);

    // Return the successful result from the agent.
    return NextResponse.json({ output: result }, { status: 200 });
  } catch (error: any) {
    // Handle errors that occur during the agent's execution.
    console.error(`Error running agent '${agentId}':`, error);
    return NextResponse.json(
      { error: 'Agent execution failed.', details: error.message }, // Provide the error message from the agent run.
      { status: 500 } // HTTP 500 Internal Server Error.
    );
  }
}
