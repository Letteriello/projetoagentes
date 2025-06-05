/**
 * @fileOverview Defines a Genkit tool for accessing and managing calendar events.
 * This tool is created using a factory function to allow for dynamic configuration
 * such as a default calendar ID, service endpoint, or API key.
 * It simulates interactions with a calendar API.
 */
import { ai } from '@/ai/genkit'; // Import the configured 'ai' instance
import { z } from 'zod';

// 1. Define Configuration Interface for the tool
export interface CalendarAccessToolConfig {
  name?: string; // Optional: to allow multiple instances (e.g., 'personalCalendar', 'workTeamCalendar')
  description?: string; // Optional: custom description for this calendar instance
  defaultCalendarId?: string; // Default calendar ID (e.g., 'primary', 'user@example.com')
  serviceEndpoint?: string; // Custom calendar API endpoint (if not a standard one like Google Calendar)
  apiKey?: string; // API key if the service uses simple API key authentication
  // authType?: 'apiKey' | 'oauth' | 'none'; // Future: to specify auth mechanism
  // oauthClientCredentialsId?: string; // Future: ID for stored OAuth credentials
}

// 2. Define Input Schema for the tool's handler
// The default for calendarId is removed from schema; will be handled by config + handler logic
export const CalendarAccessInputSchema = z.object({
  action: z.enum(["check_availability", "create_event", "list_events"])
    .describe("The calendar action to perform."),
  startTime: z.string().datetime({ message: "Invalid ISO 8601 datetime format for startTime." }).optional()
    .describe("Start time for an event or availability check, in ISO 8601 format (e.g., '2024-08-15T10:00:00Z')."),
  endTime: z.string().datetime({ message: "Invalid ISO 8601 datetime format for endTime." }).optional()
    .describe("End time for an event or availability check, in ISO 8601 format (e.g., '2024-08-15T11:00:00Z')."),
  title: z.string().optional()
    .describe("Title of the event to create."),
  attendees: z.array(z.string().email({ message: "Invalid email format in attendees list." })).optional()
    .describe("Array of attendee email addresses for the event."),
  calendarId: z.string().optional()
    .describe("Identifier of the calendar to use (e.g., 'primary', 'user@example.com'). Overrides the instance's default calendar ID."),
});

// 3. Define Output Schema for the tool's handler
// Success and error fields are removed. Data is the direct output on success.
export const CalendarAccessOutputSchema = z.object({
  data: z.any().optional()
    .describe("Varies based on action: list of events, created event details, or availability status."),
  debugInfo: z.object({
    effectiveCalendarId: z.string(),
    action: z.string(),
    serviceEndpointUsed: z.string().optional(),
    apiKeyUsed: z.boolean().optional(),
  }).optional(),
});

// 4. Factory function to create the calendarAccessTool
export function createCalendarAccessTool(
  config: CalendarAccessToolConfig
): ToolDefinition<typeof CalendarAccessInputSchema, typeof CalendarAccessOutputSchema> { // Corrected Tool type
  const toolName = config.name || 'calendarAccess';
  const toolDescription = config.description ||
    `Accesses and manages events for a configured calendar (Default ID: ${config.defaultCalendarId || 'primary'}).`;

  // Optional: Early check for critical missing configuration if needed, though current logic defaults 'primary'
  // if (!config.defaultCalendarId) {
  //   console.warn(`[${toolName}] Initialized without a defaultCalendarId. Operations might fail if no calendarId is provided in input.`);
  // }

  console.log(`[${toolName}] Initialized with config:`, {
    defaultCalendarId: config.defaultCalendarId,
    serviceEndpoint: config.serviceEndpoint,
    hasApiKey: !!config.apiKey,
  });

  return ai.defineTool(
    {
      name: toolName,
      description: toolDescription,
      inputSchema: CalendarAccessInputSchema,
      outputSchema: CalendarAccessOutputSchema, // Updated schema
    },
    async (input: z.infer<typeof CalendarAccessInputSchema>) => {
      const effectiveCalendarId = input.calendarId || config.defaultCalendarId || 'primary';

      // Example of an early error throw if a calendar ID is absolutely required but somehow still not resolved.
      // if (!effectiveCalendarId) {
      //   throw new Error(`[${toolName}] Calendar ID is required but was not provided in input and no default is configured.`);
      // }

      console.log(`[${toolName}] Received action '${input.action}' for calendar '${effectiveCalendarId}'. Input:`, input);
      if(config.serviceEndpoint) {
        console.log(`[${toolName}] Configured service endpoint: ${config.serviceEndpoint}`);
      }
      if(config.apiKey) {
        console.log(`[${toolName}] API key provided in configuration.`);
      }

      const debugInfo = {
        effectiveCalendarId,
        action: input.action,
        serviceEndpointUsed: config.serviceEndpoint,
        apiKeyUsed: !!config.apiKey,
      };

      try {
        switch (input.action) {
          case 'list_events':
            console.log(`[${toolName}] Simulating 'list_events' for calendar: ${effectiveCalendarId}`);
            return { // Success: directly return data and debugInfo
              data: [
                { id: "evt1_sim", title: "Team Sync", startTime: new Date().toISOString(), endTime: new Date(Date.now() + 3600000).toISOString(), calendarId: effectiveCalendarId },
                { id: "evt2_sim", title: "Project Review", startTime: new Date(Date.now() + 7200000).toISOString(), endTime: new Date(Date.now() + 10800000).toISOString(), calendarId: effectiveCalendarId },
              ],
              debugInfo,
            };

          case 'create_event':
            if (!input.title || !input.startTime || !input.endTime) {
              console.error(`[${toolName}] Error: Missing title, startTime, or endTime for create_event action.`);
              throw new Error("Missing title, startTime, or endTime for create_event action.");
            }
            console.log(`[${toolName}] Simulating 'create_event': ${input.title} at ${input.startTime} on calendar ${effectiveCalendarId}`);
            return { // Success
              data: {
                eventId: "cal_evt_sim_" + Date.now(),
                title: input.title,
                startTime: input.startTime,
                endTime: input.endTime,
                attendees: input.attendees || [],
                calendarId: effectiveCalendarId,
                htmlLink: `https://calendar.example.com/event?id=cal_evt_sim_${Date.now()}`
              },
              debugInfo,
            };

          case 'check_availability':
            if (!input.startTime || !input.endTime) {
              console.error(`[${toolName}] Error: Missing startTime or endTime for check_availability action.`);
              throw new Error("Missing startTime or endTime for check_availability action.");
            }
            console.log(`[${toolName}] Simulating 'check_availability' for calendar ${effectiveCalendarId}: ${input.startTime} - ${input.endTime}`);
            return { // Success
              data: {
                isAvailable: true, // Simulated: always available
                checkedRange: { startTime: input.startTime, endTime: input.endTime },
                calendarId: effectiveCalendarId,
              },
              debugInfo,
            };

          default:
            // This case handles actions that are not one of the enum values.
            // Zod validation should catch this before it reaches here if the enum is exhaustive.
            // However, as a fallback or if enum isn't strictly enforced at all levels:
            const exhaustiveCheck: never = input.action; // Ensures all enum cases are handled
            console.error(`[${toolName}] Unknown or unsupported action: ${(exhaustiveCheck as string)}`);
            throw new Error(`Unknown or unsupported calendar action: ${(exhaustiveCheck as string)}`);
        }
      } catch (error: any) {
        // Log and re-throw any errors that occurred during the process
        console.error(`[${toolName}] Error during action '${input.action}' for calendar '${effectiveCalendarId}':`, error.message);
        if (error instanceof Error) {
          throw error;
        }
        throw new Error(`Failed to perform calendar action '${input.action}': ${error.message || 'Unknown error'}`);
      }
    }
  );
}

// Example of how to export a pre-configured instance (optional)
// Note: Tool type here should be ToolDefinition for consistency if imported elsewhere.
// import { ToolDefinition } from '@genkit-ai/core';
// export const myWorkCalendar = createCalendarAccessTool({
//   name: "workCalendar",
//   description: "Manages events on the work calendar.",
//   defaultCalendarId: "employee123@work.com",
//   // apiKey: process.env.WORK_CALENDAR_API_KEY, // From secure source
//   // serviceEndpoint: "https://api.workcalendar.com/v2",
// });
