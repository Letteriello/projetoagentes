import { defineTool } from '@genkit-ai/ai';
import { z } from 'zod';

/**
 * Defines the input schema for the Image Classifier Tool.
 * Requires either an imageUrl or a fileDataUri to be provided.
 */
const ImageClassifierInputSchema = z.object({
  imageUrl: z.string().optional(),
  fileDataUri: z.string().optional(),
}).refine(data => data.imageUrl || data.fileDataUri, {
  message: 'Either imageUrl or fileDataUri must be provided.',
});

/**
 * Defines the output schema for the Image Classifier Tool.
 */
const ImageClassifierOutputSchema = z.object({
  classification: z.string(),
  confidence: z.number(),
});

/**
 * A list of possible image classifications.
 */
const POSSIBLE_CLASSIFICATIONS = [
  "cat", "dog", "car", "tree", "house", "person", "food", "document", "product", "landscape",
];

/**
 * Image Classifier Tool (Simulated)
 *
 * This tool simulates image classification. It accepts either an image URL
 * or a file data URI and returns a mock classification object with a label
 * and a confidence score.
 */
export const imageClassifierTool = defineTool(
  {
    name: 'imageClassifier',
    description: 'Simulates image classification and returns a label and confidence score.',
    inputSchema: ImageClassifierInputSchema,
    outputSchema: ImageClassifierOutputSchema,
  },
  async (input) => {
    if (!input.imageUrl && !input.fileDataUri) {
      throw new Error('No image input provided. Please provide either an imageUrl or a fileDataUri.');
    }

    // Simulate classification
    const randomClassification = POSSIBLE_CLASSIFICATIONS[Math.floor(Math.random() * POSSIBLE_CLASSIFICATIONS.length)];
    const randomConfidence = Math.random() * (0.99 - 0.7) + 0.7; // Confidence between 0.7 and 0.99

    return {
      classification: randomClassification,
      confidence: parseFloat(randomConfidence.toFixed(2)), // Round to 2 decimal places
    };
  }
);
