import { defineTool, ai } from '@genkit-ai/ai';
import { z } from 'zod';
import { winstonLogger } from '../../lib/winston-logger'; // Assuming logger is available

/**
 * Defines the input schema for the Text Summarizer Tool.
 * Requires textToSummarize and an optional modelName.
 */
const TextSummarizerInputSchema = z.object({
  textToSummarize: z.string(),
  modelName: z.string().optional(),
});

/**
 * Defines the output schema for the Text Summarizer Tool.
 */
const TextSummarizerOutputSchema = z.object({
  summary: z.string(),
});

/**
 * Text Summarizer Tool (LLM)
 *
 * This tool summarizes a given text using a Genkit-configured Language Model.
 * It accepts text to summarize and an optional model name.
 * If no modelName is provided, it defaults to a predefined model (e.g., gemini-pro).
 */
export const textSummarizerTool = defineTool(
  {
    name: 'textSummarizer',
    description: 'Summarizes a given text using a Genkit-configured Language Model.',
    inputSchema: TextSummarizerInputSchema,
    outputSchema: TextSummarizerOutputSchema,
  },
  async (input) => {
    const flowName = 'textSummarizerTool';
    winstonLogger.info(`[${flowName}] Starting summarization. Text length: ${input.textToSummarize.length}, Model: ${input.modelName || 'gemini-pro'}`, { flowName });

    if (!input.textToSummarize.trim()) {
      winstonLogger.warn(`[${flowName}] Text to summarize is empty or whitespace.`, { flowName });
      return { summary: '' }; // Or throw new Error('Text to summarize cannot be empty.');
    }

    const modelToUse = input.modelName || 'gemini-pro'; // Default model
    const prompt = `Please summarize the following text concisely:\n\n"${input.textToSummarize}"\n\nSummary:`;

    try {
      const llmResponse = await ai.generate({
        model: modelToUse, // Ensure this model is configured in Genkit
        prompt: prompt,
        config: {
          temperature: 0.5, // Adjust temperature for summarization
        },
      });

      const summaryText = llmResponse.text();

      if (!summaryText) {
        winstonLogger.warn(`[${flowName}] LLM returned an empty summary for model ${modelToUse}.`, { flowName });
        throw new Error('LLM returned an empty summary.');
      }

      winstonLogger.info(`[${flowName}] Summarization successful. Summary length: ${summaryText.length}`, { flowName });
      return { summary: summaryText };

    } catch (error: any) {
      winstonLogger.error(`[${flowName}] Error during LLM interaction for model ${modelToUse}: ${error.message}`, {
        flowName,
        error: { message: error.message, stack: error.stack, name: error.name },
        textLength: input.textToSummarize.length,
      });
      // It's often better to throw the error so the calling flow can handle it appropriately.
      // However, if the tool should always return a "graceful" output, you might return an error message in the summary.
      // For now, let's re-throw to indicate a tool failure.
      throw new Error(`Failed to generate summary using ${modelToUse}: ${error.message}`);
    }
  }
);
