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
      const errorMsg = 'Text to summarize cannot be empty.';
      winstonLogger.warn(`[${flowName}] ${errorMsg}`, { flowName });
      throw new Error(errorMsg);
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

      const summaryText = llmResponse.text()?.trim(); // Also trim the summary

      if (!summaryText) { // Check if summaryText is empty after trim
        const errorMsg = `LLM returned an empty or whitespace-only summary for model ${modelToUse}.`;
        winstonLogger.warn(`[${flowName}] ${errorMsg}`, { flowName });
        throw new Error(errorMsg);
      }

      winstonLogger.info(`[${flowName}] Summarization successful. Summary length: ${summaryText.length}`, { flowName });
      return { summary: summaryText };

    } catch (error: any) {
      const errorMessage = `Failed to generate summary using ${modelToUse}: ${error.message}`;
      winstonLogger.error(`[${flowName}] ${errorMessage}`, {
        flowName,
        error: { message: error.message, stack: error.stack, name: error.name },
        textLength: input.textToSummarize.length,
      });
      // Re-throw the error to indicate a tool failure.
      // If error is already an Error instance, re-throw it, otherwise wrap it.
      if (error instanceof Error) {
        throw error; // Or wrap with more context: new Error(errorMessage, { cause: error })
      }
      throw new Error(errorMessage);
    }
  }
);
