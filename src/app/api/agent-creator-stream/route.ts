import { NextRequest, NextResponse } from 'next/server';
import { agentCreatorChatFlow } from '@/ai/flows/agent-creator-flow';
import { AgentCreatorChatInputSchema } from '@/ai/flows/agent-creator-flow';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const inputJson = await req.json();

    // Validate input against Zod schema
    const validationResult = AgentCreatorChatInputSchema.safeParse(inputJson);
    if (!validationResult.success) {
      logger.logInfo('[API AgentCreatorStream] Invalid input:', validationResult.error.flatten());
      // Standardized error response for validation errors
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input provided.",
          code: "VALIDATION_ERROR",
          details: validationResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const validatedInput = validationResult.data;
    validatedInput.stream = true; // Ensure streaming is enabled for this endpoint

    logger.logInfo('[API AgentCreatorStream] Calling agentCreatorFlow with input:', {
        userNaturalLanguageInput: validatedInput.userNaturalLanguageInput,
        chatHistoryLength: validatedInput.chatHistory?.length,
    });

    // Prepare a TransformStream to format the output from the flow (which yields objects)
    // and handle errors during transformation by sending a standardized error chunk.
    const { readable, writable } = new TransformStream<Record<string, any>, Uint8Array>({
        transform(chunk: Record<string, any>, controller: TransformStreamDefaultController<Uint8Array>) {
            try {
                // Assuming normal chunks are not errors, stringify them directly.
                // If a chunk itself could be an error from a deeper part of the flow already formatted,
                // it might need specific handling here.
                const jsonString = JSON.stringify(chunk);
                controller.enqueue(new TextEncoder().encode(jsonString + '\n'));
            } catch (e: unknown) {
                const error = e instanceof Error ? e : new Error(String(e));
                logger.logError('[API AgentCreatorStream] Error serializing chunk for streaming:', error);
                // Standardized error object for stream serialization errors
                const errorChunk = {
                  type: "error",
                  payload: {
                    message: "Error serializing data for stream: " + error.message,
                    code: "STREAM_SERIALIZATION_ERROR"
                  }
                };
                controller.enqueue(new TextEncoder().encode(JSON.stringify(errorChunk) + '\n'));
            }
        }
    });

    const writer = writable.getWriter();

    // Execute the agent creator flow.
    // Errors during the flow's execution are caught and sent as standardized error chunks.
    agentCreatorChatFlow(validatedInput, {
        streamCallback: (chunk: Record<string, any>) => {
            // This callback receives data chunks from the flow.
            // We assume these chunks are valid objects ready for stringification by the TransformStream.
            writer.write(chunk).catch(streamError => {
                 logger.logError('[API AgentCreatorStream] Error writing to stream in streamCallback:', streamError);
                 // If writing to the writer fails, it's a more fundamental stream issue.
                 // The TransformStream might not be able to send this, but we try.
                 // Consider closing the writer or controller if such an error occurs.
            });
        },
    }).catch((flowError: Error) => {
        logger.logError('[API AgentCreatorStream] Error during agentCreatorFlow execution:', flowError);
        // Standardized error object for flow execution errors
        const errorChunk = {
            type: "error",
            payload: {
                message: flowError.message || 'Flow execution error.',
                code: "FLOW_EXECUTION_ERROR"
            }
        };
        writer.write(errorChunk).catch(writeError => {
            logger.logError('[API AgentCreatorStream] Critical: Error writing flow error to stream:', writeError);
        }).finally(() => {
            writer.close().catch(closeError => {
                 logger.logError('[API AgentCreatorStream] Error closing writer after flow error:', closeError);
            });
        });
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8', // Using application/json for NDJSON
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-transform', // Ensure no caching or transformations by proxies
      },
    });

  } catch (e: any) { // Catches errors from req.json(), initial setup, or synchronous errors in flow setup
    logger.logError('[API AgentCreatorStream] Unhandled error in POST handler:', {
        message: e.message,
        stack: e.stack,
        name: e.name,
    });
    // Standardized error response for unhandled server errors
    let errorMessage = "An unexpected error occurred on the server.";
    let errorCode = "INTERNAL_SERVER_ERROR";
    if (e instanceof SyntaxError && e.message.toLowerCase().includes('json')) {
        errorMessage = "Invalid JSON payload provided.";
        errorCode = "BAD_REQUEST";
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        code: errorCode,
        details: e.message // Keep original error message for details if appropriate
      },
      { status: errorCode === "BAD_REQUEST" ? 400 : 500 }
    );
  }
}

// Optional: Handle OPTIONS requests for CORS if your client is on a different domain
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*', // Adjust for your specific domain in production
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
