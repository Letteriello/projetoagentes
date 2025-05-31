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
    const { prompt } = await req.json();
    const { text } = await ai.generate(prompt);
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: error?.toString() || "Unknown error" }, { status: 500 });
  }
}
