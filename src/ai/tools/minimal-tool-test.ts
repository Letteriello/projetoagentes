import { ai } from '@/ai/genkit'; // Import the configured 'ai' instance
import { z } from 'zod';

console.log('minimal-tool-test.ts: Script iniciado.');

// Define the input schema for the tool
const MinimalTestToolInputSchema = z.object({
  message: z.string().describe("A message to send to the test tool."),
  flowName: z.string().optional().describe("Name of the calling flow, for logging."),
  agentId: z.string().optional().describe("ID of the calling agent, for logging."),
});

// Define the output schema for the tool
const MinimalTestToolOutputSchema = z.object({
  reply: z.string().describe("The reply from the test tool."),
});

try {
  // Check if ai.defineTool is available
  if (typeof ai?.defineTool === 'function') {
    console.log('minimal-tool-test.ts: ai.defineTool is a function.');

    const testTool = ai.defineTool(
      {
        name: 'minimalTestTool',
        description: 'A minimal test tool to verify Genkit ai.defineTool functionality.',
        inputSchema: MinimalTestToolInputSchema, // Use the defined schema
        outputSchema: MinimalTestToolOutputSchema, // Use the defined schema
      },
      async (input: z.infer<typeof MinimalTestToolInputSchema>) => { // Explicitly type input
        const { message, flowName, agentId } = input; // Destructure after typing
        console.log(`[minimalTestTool] Called with message: "${message}", flow: ${flowName}, agent: ${agentId}`);
        return { reply: `Test tool received: ${message}` };
      }
    );
    console.log('minimal-tool-test.ts: ai.defineTool was called successfully.');
    if (testTool) {
        console.log('minimal-tool-test.ts: Test tool name:', testTool.name);
    } else {
        console.error('minimal-tool-test.ts: ERRO - ai.defineTool returned undefined or null.');
    }
  } else {
    // Log details if ai or ai.defineTool is not as expected
    let aiDetails = 'ai is undefined or null.';
    if (ai) {
      aiDetails = `ai object exists, but ai.defineTool is of type ${typeof ai.defineTool}.`;
    }
    console.error(`minimal-tool-test.ts: ERRO - ai.defineTool IS NOT a function. ${aiDetails}`);
  }
} catch (e: any) {
  console.error('minimal-tool-test.ts: ERRO ao tentar usar ai.defineTool:', e.message);
  if (e.stack) {
    console.error(e.stack);
  }
}

console.log('minimal-tool-test.ts: Script concluído.');

// Ensure this file is treated as a module.
export {};