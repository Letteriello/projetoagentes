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
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.flatten() },
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
    const { readable, writable } = new TransformStream<Record<string, any>, Uint8Array>({
        transform(chunk: Record<string, any>, controller: TransformStreamDefaultController<Uint8Array>) {
            try {
                const jsonString = JSON.stringify(chunk);
                controller.enqueue(new TextEncoder().encode(jsonString + '\n'));
            } catch (e: unknown) {
                const error = e instanceof Error ? e : new Error(String(e));
                logger.logError('[API AgentCreatorStream] Error serializing chunk for streaming:', error);
                controller.enqueue(new TextEncoder().encode(JSON.stringify({ error: error.message }) + '\n'));
            }
        }
    });

    // Handle flow execution errors that happen before any stream chunk is written
    const writer = writable.getWriter();
    agentCreatorChatFlow(validatedInput, {
        streamCallback: (chunk: Record<string, any>) => {
            writer.write(chunk);
        },
    }).catch((err: Error) => {
        logger.logError('[API AgentCreatorStream] Error in agentCreatorFlow:', err);
        writer.write({ error: err.message || 'Flow execution error before streaming started.' }).finally(() => {
            writer.close();
        });
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-transform',
      },
    });

  } catch (e: any) {
    logger.logError('[API AgentCreatorStream] Unhandled error in POST handler:', e);
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
