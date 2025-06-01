import { defineFlow, runFlow } from '@genkit-ai/flow';
import { gemini15Pro } from '@genkit-ai/googleai'; // Assuming gemini15Pro is the desired LLM
import * as z from 'zod';
import { generate } from '@genkit-ai/ai';

// 1. Define Input Schema (Zod)
export const AgentNameDescriptionSuggesterInputSchema = z.object({
  agentType: z.string().describe('The type of the agent (e.g., "llm", "workflow", "custom")'),
  agentGoal: z.string().optional().describe('The primary goal or objective of the agent'),
  selectedTools: z.array(
    z.object({
      name: z.string().describe('Name of the selected tool'),
      description: z.string().describe('Description of the selected tool'),
    })
  ).optional().describe('A list of tools selected for the agent and their descriptions'),
});

// 2. Define Output Schema (Zod)
export const AgentNameDescriptionSuggesterOutputSchema = z.object({
  suggestedName: z.string().describe('A concise and descriptive suggested name for the agent'),
  suggestedDescription: z.string().describe('A brief and informative suggested description for the agent'),
});

// 3. Implement the Flow (defineFlow)
export const agentNameDescriptionSuggesterFlow = defineFlow(
  {
    name: 'agentNameDescriptionSuggester',
    inputSchema: AgentNameDescriptionSuggesterInputSchema,
    outputSchema: AgentNameDescriptionSuggesterOutputSchema,
  },
  async (input) => {
    const { agentType, agentGoal, selectedTools } = input;

    const toolsDescription = selectedTools && selectedTools.length > 0
      ? selectedTools.map(t => `${t.name} (Effect: ${t.description})`).join(', ')
      : 'None';

    // Construct a prompt for an LLM (e.g., Gemini)
    const prompt = `
You are an expert in designing AI agents. Based on the following details:
Agent Type: ${agentType}
Agent Goal: ${agentGoal || 'Not specified'}
Selected Tools: ${toolsDescription}

Suggest a concise and descriptive Agent Name (3-5 words ideally) and a brief, informative Agent Description (1-2 sentences ideally).
The name should be catchy and reflect the agent's core function. The description should clearly state what the agent does.

Return your suggestions in a JSON object with keys "suggestedName" and "suggestedDescription".
Example JSON:
{
  "suggestedName": "Pesquisador de Documentos IA",
  "suggestedDescription": "Um agente IA que utiliza ferramentas de busca para encontrar e resumir informações de documentos."
}
Do not include any other text or explanation outside of the JSON object.
`;

    try {
      const llmResponse = await generate({
        model: gemini15Pro, // Ensure this model is configured in your Genkit setup
        prompt: prompt,
        config: {
          // Specify JSON output mode if available and supported by the model/SDK version
          // For Gemini, often it's about instructing it to output JSON and then parsing.
          // If a specific JSON mode exists (e.g., responseFormat: 'json_object' for some models), use it.
          // Otherwise, parse from text.
        },
      });

      const responseText = llmResponse.text();

      // Attempt to parse the JSON from the LLM's response
      // The LLM should ideally return only the JSON string as requested.
      // Robust parsing might involve cleaning up potential markdown ```json ... ``` blocks
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
        throw new Error(`Failed to parse suggestions from LLM. Raw response: ${responseText}`);
      }


      if (AgentNameDescriptionSuggesterOutputSchema.safeParse(parsedJson).success) {
        return parsedJson as z.infer<typeof AgentNameDescriptionSuggesterOutputSchema>;
      } else {
        console.error("LLM output does not match the expected schema:", parsedJson);
        throw new Error("LLM output validation failed.");
      }

    } catch (error) {
      console.error("Error during LLM generation or processing:", error);
      // Fallback or re-throw error
      // For a more user-friendly approach, you might return a default/error state
      // that matches the output schema, but for now, we'll re-throw.
      throw error;
    }
  }
);

// 4. Export the Flow (already done by using 'export const agentNameDescriptionSuggesterFlow')

// Example of how to run the flow (optional, for testing)
/*
async function testFlow() {
  try {
    const result = await runFlow(agentNameDescriptionSuggesterFlow, {
      agentType: 'llm',
      agentGoal: 'To analyze customer feedback and identify common issues.',
      selectedTools: [
        { name: 'Sentiment Analysis Tool', description: 'Analyzes text to determine sentiment (positive, negative, neutral).' },
        { name: 'Topic Extraction Tool', description: 'Identifies main topics in a block of text.' }
      ]
    });
    console.log('Flow Result:', result);
  } catch (error) {
    console.error('Flow Error:', error);
  }
}
// testFlow(); // Uncomment to run the test
*/
