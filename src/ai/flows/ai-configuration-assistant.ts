// use server'
'use server';
/**
 * @fileOverview AI-powered assistant for suggesting agent configurations based on the task goal.
 *
 * - suggestAgentConfiguration - A function that suggests agent configurations.
 * - SuggestAgentConfigurationInput - The input type for the suggestAgentConfiguration function.
 * - SuggestAgentConfigurationOutput - The return type for the suggestAgentConfiguration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestAgentConfigurationInputSchema = z.object({
  taskGoal: z
    .string()
    .describe('The task goal for which the agent configuration is needed.'),
});
export type SuggestAgentConfigurationInput = z.infer<
  typeof SuggestAgentConfigurationInputSchema
>;

const SuggestAgentConfigurationOutputSchema = z.object({
  suggestedConfiguration: z
    .string()
    .describe('The suggested agent configuration based on the task goal.'),
});
export type SuggestAgentConfigurationOutput = z.infer<
  typeof SuggestAgentConfigurationOutputSchema
>;

export async function suggestAgentConfiguration(
  input: SuggestAgentConfigurationInput
): Promise<SuggestAgentConfigurationOutput> {
  return suggestAgentConfigurationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestAgentConfigurationPrompt',
  input: {schema: SuggestAgentConfigurationInputSchema},
  output: {schema: SuggestAgentConfigurationOutputSchema},
  prompt: `You are an AI configuration assistant. Based on the task goal
provided by the user, you will suggest an agent configuration that can
achieve the task goal. The suggested configuration should be a detailed
configuration that is ready to be used by the agent.

Task Goal: {{{taskGoal}}} `,
});

const suggestAgentConfigurationFlow = ai.defineFlow(
  {
    name: 'suggestAgentConfigurationFlow',
    inputSchema: SuggestAgentConfigurationInputSchema,
    outputSchema: SuggestAgentConfigurationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
