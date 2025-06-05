// import { defineTool, ToolAction } from 'genkit';
const defineTool = (...args: any[]) => args; // Mock temporário para evitar erro de importação
import { z } from 'zod';
import { addDays as dfAddDays, format as dfFormat, parseISO, isValid } from 'date-fns';

// Input and Output Schemas
const getCurrentDateTimeOutputSchema = z.string().datetime({ message: "Output should be a valid ISO date-time string" });

const addDaysInputSchema = z.object({
  date: z.string().refine((val) => isValid(parseISO(val)), {
    message: "Input 'date' must be a valid ISO 8601 date string.",
  }),
  days: z.number().int({ message: "Input 'days' must be an integer." }),
});
const addDaysOutputSchema = z.string().datetime({ message: "Output should be a valid ISO date-time string" });

const formatDateInputSchema = z.object({
  date: z.string().refine((val) => isValid(parseISO(val)), {
    message: "Input 'date' must be a valid ISO 8601 date string.",
  }),
  format: z.string().min(1, { message: "Input 'format' string cannot be empty." }),
});
const formatDateOutputSchema = z.string();

// Tool Definition
export const dateTimeTool = defineTool(
  {
    name: 'dateTimeTool',
    description: 'Provides functions for date and time manipulation, such as getting the current time, adding days to a date, and formatting dates.',
    actions: {
      getCurrentDateTime: {
        description: 'Retrieves the current date and time in ISO 8601 format (e.g., YYYY-MM-DDTHH:mm:ss.sssZ).',
        outputSchema: getCurrentDateTimeOutputSchema,
        async fn(): Promise<string> {
          return new Date().toISOString();
        },
      },
      addDays: {
        description: 'Adds a specified number of integer days to a given ISO 8601 date string. Returns the new date in ISO 8601 format.',
        inputSchema: addDaysInputSchema,
        outputSchema: addDaysOutputSchema,
        async fn({ date, days }: z.infer<typeof addDaysInputSchema>): Promise<string> {
          const parsedDate = parseISO(date);
          const newDate = dfAddDays(parsedDate, days);
          return newDate.toISOString();
        },
      },
      formatDate: {
        description: "Formats a given ISO 8601 date string into a custom format string (e.g., 'YYYY-MM-DD HH:mm:ss', 'MM/dd/yyyy'). Returns the formatted date string.",
        inputSchema: formatDateInputSchema,
        outputSchema: formatDateOutputSchema,
        async fn({ date, format }: z.infer<typeof formatDateInputSchema>): Promise<string> {
          const parsedDate = parseISO(date);
          return dfFormat(parsedDate, format);
        },
      },
    },
  }
);

export default dateTimeTool;
