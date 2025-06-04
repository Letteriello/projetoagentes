import { defineTool } from '@genkit-ai/ai';
import { z } from 'zod';

// Define the constant for the Genkit tool name
export const GENKIT_TOOL_NAME_VIDEO_STREAM_MONITOR = "videoStreamMonitorTool";

export const videoStreamMonitorTool = defineTool(
  {
    name: GENKIT_TOOL_NAME_VIDEO_STREAM_MONITOR,
    description: "Monitors a video stream for specified events or changes. (Simulated)",
    inputSchema: z.object({
      video_source: z.string().url().describe("URL or identifier of the video stream to monitor"),
    }),
    outputSchema: z.object({ // This schema now describes the shape of EACH yielded object
      status: z.string().optional(), // e.g., "Monitoring started", "Event occurred", "Monitoring finished"
      source: z.string(),
      event: z.object({
        type: z.string(),
        details: z.string(),
        timestamp: z.string(),
      }).optional(),
      timestamp: z.string().optional(), // Timestamp for status updates or overall start/end
    }),
  },
  async *function (input: { video_source: string }) {
    // Yield initial status
    const startTime = new Date().toISOString();
    console.log(`[Tool:videoStreamMonitorTool] Monitoring starting for: ${input.video_source} at ${startTime}`);
    yield {
      status: "Monitoring started",
      source: input.video_source,
      timestamp: startTime,
    };

    // Simulate events over a period of time
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      const eventTime = new Date().toISOString();
      const randomNumber = Math.random();
      let eventData;

      if (randomNumber < 0.3) {
        eventData = { type: "mudança_detectada", details: "Movimento súbito na área A.", timestamp: eventTime };
      } else if (randomNumber < 0.6) {
        eventData = { type: "objeto_reconhecido", details: "Objeto 'bola vermelha' detectado.", timestamp: eventTime };
      } else {
        eventData = { type: "status_update", details: "Monitoramento ativo, sem novos eventos significativos.", timestamp: eventTime };
      }

      console.log(`[Tool:videoStreamMonitorTool] Yielding event for ${input.video_source}: ${JSON.stringify(eventData)}`);
      yield {
        status: "Event occurred", // Indicate that this yield is an event
        source: input.video_source,
        event: eventData,
        timestamp: eventTime, // Redundant with eventData.timestamp but can be part of the main object
      };
    }

    // Yield final status
    const endTime = new Date().toISOString();
    console.log(`[Tool:videoStreamMonitorTool] Monitoring finished for: ${input.video_source} at ${endTime}`);
    yield {
      status: "Monitoring finished",
      source: input.video_source,
      timestamp: endTime,
    };
  }
);
