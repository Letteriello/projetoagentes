/**
 * @fileOverview Defines Genkit tools for simulated speech-to-text and text-to-speech conversion.
 * These tools provide mock responses and do not perform actual STT/TTS operations.
 */

import { ai } from '@/ai/genkit'; // Import the configured 'ai' instance
import { z } from 'zod';

// 1. Speech-to-Text (STT) Tool

// Define Input Schema for STT
export const SpeechToTextInputSchema = z.object({
  audioDataUri: z.string().describe("The base64 encoded audio data URI to transcribe."),
});

// Define Output Schema for STT
export const SpeechToTextOutputSchema = z.object({
  transcription: z.string().describe("The simulated transcribed text."),
});

// Create speechToTextTool
export const speechToTextTool = ai.defineTool(
  {
    name: 'speechToText',
    description: 'Simulates converting speech (audio data URI) to text. Returns a mock transcription.',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
  },
  async (input: z.infer<typeof SpeechToTextInputSchema>) => {
    console.log('[SpeechToTextTool] Received input:', input.audioDataUri.substring(0, 50) + '...'); // Log a snippet
    // Simulate transcription
    return {
      transcription: "This is a simulated transcription from the provided audio data.",
    };
  }
);

// 2. Text-to-Speech (TTS) Tool

// Define Input Schema for TTS
export const TextToSpeechInputSchema = z.object({
  text: z.string().describe("The text to convert to speech."),
});

// Define Output Schema for TTS
export const TextToSpeechOutputSchema = z.object({
  audioDataUri: z.string().describe("A mock base64 encoded audio data URI representing the speech."),
});

// Create textToSpeechTool
export const textToSpeechTool = ai.defineTool(
  {
    name: 'textToSpeech',
    description: 'Simulates converting text to speech. Returns a mock audio data URI.',
    inputSchema: TextToSpeechInputSchema,
    outputSchema: TextToSpeechOutputSchema,
  },
  async (input: z.infer<typeof TextToSpeechInputSchema>) => {
    console.log('[TextToSpeechTool] Received text:', input.text);
    // Simulate TTS by returning a common short, silent WAV file data URI
    return {
      audioDataUri: "data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
    };
  }
);

// Ensure tools are exported if this file is treated as a module
// (Though Genkit typically discovers tools registered with the 'ai' instance)
// export { speechToTextTool, textToSpeechTool };
