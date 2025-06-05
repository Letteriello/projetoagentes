import { NextRequest, NextResponse } from "next/server";
import { gemini15Flash, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

// Configure uma instância isolada do Genkit para a API
const ai = genkit({
  plugins: [googleAI()],
  model: gemini15Flash,
});

export async function POST(req: NextRequest) {
  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e: any) {
      // Log the JSON parsing error
      console.error('[API AI POST] Invalid JSON payload:', e.message);
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload.", code: "BAD_REQUEST", details: e.message },
        { status: 400 }
      );
    }

    const { prompt } = requestBody;

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === "") {
      console.error('[API AI POST] Validation Error: Prompt is required and must be a non-empty string.');
      return NextResponse.json(
        { success: false, error: "Prompt is required and must be a non-empty string.", code: "VALIDATION_ERROR" },
        { status: 400 }
      );
    }

    // Call Genkit AI to generate text
    const { text } = await ai.generate(prompt);

    // Return successful response
    return NextResponse.json({ success: true, data: { text } }, { status: 200 });

  } catch (error: any) {
    // Log the error (consider using a structured logger like Winston if available project-wide)
    console.error('[API AI POST] Error during AI generation:', error);

    // Standardized error response for AI generation errors or other unexpected errors
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate AI response.",
        code: "AI_GENERATION_ERROR",
        details: error.message || String(error) // Provide error message if available
      },
      { status: 500 }
    );
  }
}
