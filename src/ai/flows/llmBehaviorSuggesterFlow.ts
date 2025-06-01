import { defineFlow, runFlow } from '@genkit-ai/flow';
import { gemini15Pro } from '@genkit-ai/googleai'; // Assuming gemini15Pro is the desired LLM
import * as z from 'zod';
import { generate } from '@genkit-ai/ai';

// 1. Define Input Schema (Zod)
export const LlmBehaviorSuggesterInputSchema = z.object({
  suggestionType: z.enum(['personality', 'restrictions']).describe('The type of suggestion requested'),
  agentGoal: z.string().optional().describe('The primary goal of the LLM agent'),
  agentTasks: z.array(z.string()).optional().describe('The main tasks the LLM agent is expected to perform'),
  currentPersonality: z.string().optional().describe('The current personality/tone setting, for context when suggesting restrictions'),
  currentRestrictions: z.array(z.string()).optional().describe('Current restrictions, for context when suggesting personalities'),
});

// 2. Define Output Schema (Zod)
export const LlmBehaviorSuggesterOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('An array of suggested strings, either personalities or restrictions'),
});

// 3. Implement the Flow (defineFlow)
export const llmBehaviorSuggesterFlow = defineFlow(
  {
    name: 'llmBehaviorSuggester',
    inputSchema: LlmBehaviorSuggesterInputSchema,
    outputSchema: LlmBehaviorSuggesterOutputSchema,
  },
  async (input) => {
    const { suggestionType, agentGoal, agentTasks, currentPersonality, currentRestrictions } = input;

    let prompt = `You are an AI assistant helping configure an LLM agent.`;
    prompt += `\nAgent Goal: ${agentGoal || 'Not specified'}`;
    prompt += `\nAgent Tasks: ${agentTasks && agentTasks.length > 0 ? agentTasks.join(', ') : 'Not specified'}`;

    if (suggestionType === 'personality') {
      prompt += `\nCurrent Restrictions: ${currentRestrictions && currentRestrictions.length > 0 ? currentRestrictions.join(', ') : 'None'}`;
      prompt += `\n\nSuggest 3-5 diverse examples of "Personality/Tone" suitable for this agent. These can be short descriptive phrases or one of the following common types: Amigável e Prestativo, Profissional e Direto, Formal e Educado, Casual e Descontraído, Engraçado e Divertido, Analítico e Detalhista, Conciso e Objetivo, Empático e Compreensivo, Criativo e Inspirador.`;
      prompt += `\nFocus on suggestions that would complement the agent's goal and tasks, considering its restrictions.`;
    } else { // suggestionType is 'restrictions'
      prompt += `\nAgent Personality: ${currentPersonality || 'Not specified'}`;
      prompt += `\n\nSuggest 3-5 concise and relevant "Restrictions" (things the agent MUST avoid doing or saying) for this agent.`;
      prompt += `\nRestrictions should help ensure the agent behaves safely, ethically, and within its defined scope. Consider the agent's goal, tasks, and personality.`;
    }

    prompt += `\n\nReturn your suggestions ONLY as a JSON object with a single key "suggestions" which contains an array of strings. For example: {"suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"]}`;
    prompt += `\nDo not include any other text, explanations, or markdown formatting outside of this JSON object.`;


    try {
      const llmResponse = await generate({
        model: gemini15Pro, // Ensure this model is configured in your Genkit setup
        prompt: prompt,
        config: {
          // Request JSON output if the model/SDK supports it directly.
          // For Gemini, explicit instruction in the prompt is the common way.
        },
      });

      const responseText = llmResponse.text();
      let parsedJson;

      try {
        // Attempt to find JSON block if markdown is used
        const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
          parsedJson = JSON.parse(match[1]);
        } else {
          // Assume the response is a direct JSON string
          parsedJson = JSON.parse(responseText);
        }
      } catch (e) {
        console.error("Failed to parse JSON response from LLM:", responseText, e);
        // Try a more lenient parsing if the above fails, e.g. by finding the first '{' and last '}'
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            try {
                parsedJson = JSON.parse(responseText.substring(firstBrace, lastBrace + 1));
            } catch (subE) {
                console.error("Secondary parsing attempt failed:", responseText, subE);
                throw new Error(`Failed to parse suggestions from LLM. Raw response: ${responseText}`);
            }
        } else {
            throw new Error(`Failed to parse suggestions from LLM. No clear JSON structure found. Raw response: ${responseText}`);
        }
      }

      if (LlmBehaviorSuggesterOutputSchema.safeParse(parsedJson).success) {
        return parsedJson as z.infer<typeof LlmBehaviorSuggesterOutputSchema>;
      } else {
        console.error("LLM output does not match the expected schema:", parsedJson);
        // Attempt to coerce if suggestions is an array of objects with a 'suggestion' key (common mistake by LLMs)
        if (parsedJson && Array.isArray(parsedJson.suggestions)) {
            const coercedSuggestions = parsedJson.suggestions.map((s: any) => typeof s === 'object' && s.suggestion ? s.suggestion : s).filter((s: any) => typeof s === 'string');
            if (coercedSuggestions.length > 0) {
                const coercedOutput = { suggestions: coercedSuggestions };
                if (LlmBehaviorSuggesterOutputSchema.safeParse(coercedOutput).success) {
                    console.warn("LLM output coerced to match schema:", coercedOutput);
                    return coercedOutput as z.infer<typeof LlmBehaviorSuggesterOutputSchema>;
                }
            }
        }
        throw new Error("LLM output validation failed after parsing.");
      }

    } catch (error) {
      console.error("Error during LLM generation or processing in llmBehaviorSuggesterFlow:", error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
);

// 4. Export the Flow (already done by using 'export const ...')

// Example of how to run the flow (optional, for testing)
/*
async function testBehaviorFlow() {
  try {
    const personalitySuggestions = await runFlow(llmBehaviorSuggesterFlow, {
      suggestionType: 'personality',
      agentGoal: 'Act as a helpful assistant for writing marketing copy.',
      agentTasks: ['Generate ad headlines', 'Write product descriptions', 'Suggest calls to action'],
    });
    console.log('Personality Suggestions:', personalitySuggestions);

    const restrictionSuggestions = await runFlow(llmBehaviorSuggesterFlow, {
      suggestionType: 'restrictions',
      agentGoal: 'Answer questions about our company history.',
      agentTasks: ['Access historical documents', 'Summarize key events'],
      currentPersonality: 'Formal and Factual',
    });
    console.log('Restriction Suggestions:', restrictionSuggestions);

  } catch (error) {
    console.error('Flow Error:', error);
  }
}
// testBehaviorFlow(); // Uncomment to run the test
*/
