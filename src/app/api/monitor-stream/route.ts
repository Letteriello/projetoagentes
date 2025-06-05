import { type NextRequest } from 'next/server';
import { MonitorEvent, ToolCallEvent, TaskCompletionEvent, ErrorEvent, InfoEvent, AgentStateEvent, PerformanceMetricsEvent } from '@/types/monitor-events';

// Helper function to generate a random ID
function generateId(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

// Helper function to pick a random item from an array
function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const agentIds = ['agent-001', 'agent-002', 'agent-003', 'agent-004', 'corp-workflow-agent'];
const toolNames = ['web_search', 'database_query', 'code_interpreter', 'file_api', 'calculator'];
const errorMessages = [
  'LLM model timeout',
  'Tool validation failed',
  'API connection error',
  'Agent authorization denied',
  'Internal server error in sub-agent',
];
const taskMessages = [
  'User query processed successfully.',
  'Data analysis complete.',
  'Report generated and saved.',
  'Scheduled task executed.',
];
const infoMessages = [
  'Agent initializing...',
  'Configuration loaded.',
  'Switching to new model version.',
  'Verbose logging enabled for trace.',
];
const agentStatuses: AgentStateEvent['status'][] = ['online', 'offline', 'busy', 'idle'];


function generateMockEvent(): MonitorEvent {
  const agentId = getRandomElement(agentIds);
  const traceId = `trace-${generateId(6)}`;
  const eventTypeChance = Math.random();
  const baseEvent = {
    id: `evt-${generateId()}`,
    timestamp: new Date().toISOString(),
    agentId,
    traceId,
  };

  if (eventTypeChance < 0.3) { // 30% chance ToolCallEvent
    const status = getRandomElement<'started' | 'completed' | 'error'>(['started', 'completed', 'error']);
    const event: ToolCallEvent = {
      ...baseEvent,
      eventType: 'tool_call',
      toolName: getRandomElement(toolNames),
      input: { query: `Sample input for ${baseEvent.agentId} at ${baseEvent.timestamp}` },
      status,
    };
    if (status === 'completed') {
      event.output = { result: `Mock output for ${event.toolName}` };
    } else if (status === 'error') {
      event.errorDetails = { message: getRandomElement(errorMessages) };
    }
    return event;
  } else if (eventTypeChance < 0.5) { // 20% chance TaskCompletionEvent
    const status = getRandomElement<'success' | 'failure'>(['success', 'failure']);
    return {
      ...baseEvent,
      eventType: 'task_completion',
      status,
      message: status === 'success' ? getRandomElement(taskMessages) : getRandomElement(errorMessages),
      result: status === 'success' ? { data: 'Sample task result' } : undefined,
    } as TaskCompletionEvent;
  } else if (eventTypeChance < 0.65) { // 15% chance ErrorEvent
    return {
      ...baseEvent,
      eventType: 'error',
      errorMessage: getRandomElement(errorMessages),
      stackTrace: `Error: ${getRandomElement(errorMessages)}
    at mockFunction (mock/path:12:34)
    at anotherMock (mock/another:56:78)`,
      errorSource: getRandomElement(['agent_core', 'llm_service', 'tool_execution', 'sub_agent_failure']),
    } as ErrorEvent;
  } else if (eventTypeChance < 0.8) { // 15% chance InfoEvent
    return {
      ...baseEvent,
      eventType: 'info',
      message: getRandomElement(infoMessages),
      data: { detail: `Additional info for ${agentId}` },
    } as InfoEvent;
  } else if (eventTypeChance < 0.9) { // 10% chance AgentStateEvent
    const status = getRandomElement(agentStatuses);
    return {
      ...baseEvent,
      eventType: 'agent_state',
      status: status,
      message: `Agent ${agentId} is now ${status}.`,
    } as AgentStateEvent;
  } else { // 10% chance PerformanceMetricsEvent
    const metricType = getRandomElement<'latency' | 'token_usage' | 'cost'>(['latency', 'token_usage', 'cost']);
    let value: number;
    let unit: string | undefined;
    let details: any | undefined;

    if (metricType === 'latency') {
      value = Math.floor(Math.random() * 2000) + 100; // 100ms to 2100ms
      unit = 'ms';
    } else if (metricType === 'token_usage') {
      value = Math.floor(Math.random() * 5000) + 500; // 500 to 5500 tokens
      unit = 'tokens';
      details = { promptTokens: Math.floor(value * 0.4), completionTokens: Math.floor(value*0.6) };
    } else { // cost
      value = parseFloat((Math.random() * 0.1).toFixed(4)); // $0.0000 to $0.1000
      unit = 'USD';
      details = { service: getRandomElement(['OpenAI API', 'Vertex AI', 'Custom LLM']) };
    }
    return {
      ...baseEvent,
      eventType: 'performance_metrics',
      metricName: metricType,
      value,
      unit,
      details
    } as PerformanceMetricsEvent;
  }
}


export async function GET(request: NextRequest) {
  try {
    const stream = new ReadableStream({
      start(controller) {
        let timer: NodeJS.Timeout | undefined;

        const sendEvent = () => {
          try {
            const event = generateMockEvent();
            // SSE format: data: <json_string>\n\n
            // Ensure event is stringified, then prefixed.
            const eventPayload = JSON.stringify(event);
            const data = `data: ${eventPayload}\n\n`;
            controller.enqueue(new TextEncoder().encode(data));

            const interval = Math.random() * 2000 + 1000; // 1 to 3 seconds
            timer = setTimeout(sendEvent, interval);
          } catch (e: any) {
            // Log error during event generation or enqueueing
            console.error('[API monitor-stream SSE] Error sending event:', e);
            // Attempt to send an error event to the client before closing
            try {
              const errorData = JSON.stringify({
                success: false,
                error: "Error generating or sending monitor event.",
                code: "STREAM_EVENT_ERROR",
                details: e.message || String(e)
              });
              controller.enqueue(new TextEncoder().encode(`event: stream_error\ndata: ${errorData}\n\n`));
            } catch (enqueueError: any) {
              console.error('[API monitor-stream SSE] Failed to enqueue stream_error event:', enqueueError);
            }
            // Stop further events and close the stream
            if (timer) clearTimeout(timer);
            controller.close();
          }
        };

        // Start sending events
        timer = setTimeout(sendEvent, 1000);

        // Cleanup function when the stream is cancelled or closed by the server/client
        return () => {
          if (timer) {
            clearTimeout(timer);
          }
          // Consider using a structured logger if available project-wide
          console.log('[API monitor-stream SSE] Stream closed.');
        };
      },
      cancel(reason) {
        // This is called if the client closes the connection (e.g., browser tab closed)
        // Or if controller.error() is called.
        console.log('[API monitor-stream SSE] Stream cancelled by client or due to error:', reason);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform', // Important for SSE
        'Connection': 'keep-alive', // Important for SSE
        // Optional: CORS headers if your frontend is on a different domain
        // 'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error: any) {
    // This catch block handles errors during the initial setup of the stream.
    // Once the stream starts, errors within it are handled by the stream's own logic.
    console.error('[API monitor-stream GET] Error setting up SSE stream:', error);
    // Standardized JSON error response for setup failures
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize monitor event stream.",
        code: "STREAM_SETUP_ERROR",
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
}

// Ensure the Edge runtime is not used if there are Node.js specific APIs,
// but for this simple SSE, it should be fine. If issues arise, remove this.
// export const runtime = 'edge'; // or 'nodejs'
// but for this simple SSE, it should be fine. If issues arise, remove this.
// export const runtime = 'edge'; // or 'nodejs'
