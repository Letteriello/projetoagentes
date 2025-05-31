import { NextRequest, NextResponse } from 'next/server';
import { agentCreatorFlow, AgentCreatorFlowInputSchema } from '@/ai/flows/agent-creator-flow';
import { FlowRunResult } from 'genkit/flow'; // To type the flow result if needed, though stream is primary concern
import { logger } from '@/lib/logger'; // Assuming a logger utility

export async function POST(req: NextRequest) {
  try {
    const inputJson = await req.json();

    // Validate input against Zod schema
    const validationResult = AgentCreatorFlowInputSchema.safeParse(inputJson);
    if (!validationResult.success) {
      logger.warn('[API AgentCreatorStream] Invalid input:', validationResult.error.flatten());
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const validatedInput = validationResult.data;
    validatedInput.stream = true; // Ensure streaming is enabled for this endpoint

    logger.info('[API AgentCreatorStream] Calling agentCreatorFlow with input:', {
        userMessage: validatedInput.userMessage,
        historyLength: validatedInput.history?.length,
        userId: validatedInput.userId
    });

    // Prepare a TransformStream to format the output from the flow (which yields objects)
    // into a byte stream of JSON strings, typically one JSON object per line.
    const { readable, writable } = new TransformStream({
        transform(chunk, controller) {
            // Assuming `agentCreatorFlow`'s streamCallback will yield objects like { agentResponseChunk: "..." } or { error: "..." }
            try {
                const jsonString = JSON.stringify(chunk);
                controller.enqueue(new TextEncoder().encode(jsonString + '\n')); // Add newline to delimit JSON objects
            } catch (e) {
                logger.error('[API AgentCreatorStream] Error serializing chunk for streaming:', e);
                // Handle serialization error, maybe enqueue an error object if the stream is still open
            }
        }
    });

    // Call the flow, providing the streamCallback that writes to our TransformStream
    // agentCreatorFlow is designed to be async but not return the stream directly,
    // instead it calls streamCallback. We don't await it here if we want to start streaming ASAP.
    // However, to catch initial errors from the flow setup before streaming starts, we can await.
    // The current defineFlow structure with streamCallback has an async void return.
    // We need to ensure any errors before the first streamCallback call are handled.

    let flowError: any = null;
    agentCreatorFlow(validatedInput, (chunk) => {
      const writer = writable.getWriter();
      writer.write(chunk); // chunk is already an object like { agentResponseChunk: "..." }
      writer.releaseLock();
    }).catch(err => {
        logger.error('[API AgentCreatorStream] Error during agentCreatorFlow execution:', err);
        flowError = err; // Capture error to potentially close the stream with an error chunk
        const writer = writable.getWriter();
        try {
            writer.write({ error: err.message || 'Flow execution error before streaming started.' });
        } finally {
            writer.close(); // Close the writable side if an error occurs during flow setup
            writer.releaseLock();
        }
    });

    // If an error occurred very early (before any stream chunk was written),
    // and the flow itself might have thrown, we might not have a stream to return.
    // This setup assumes the flow will call streamCallback at least once, even for errors,
    // or that writable.getWriter().close() will propagate correctly.
    // A more robust way for early errors might be to await a setup phase of the flow if possible.
    // For now, we proceed with returning the readable stream.

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8', // Each line is a JSON object
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-transform',
        // Consider 'Transfer-Encoding': 'chunked' if not automatically handled by Next.js/Vercel
      },
    });

  } catch (e: any) {
    logger.error('[API AgentCreatorStream] Unhandled error in POST handler:', e);
    // This catches errors from req.json() or Zod parsing if not caught before, or other unexpected errors.
    return NextResponse.json(
      { error: "An unexpected error occurred on the server.", details: e.message },
      { status: 500 }
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
