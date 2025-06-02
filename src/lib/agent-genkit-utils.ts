/**
 * @fileOverview Utilities for Genkit agent configurations, specifically for constructing system prompts.
 */

import { LLMAgentConfig } from '@/types/agent-configs';

/**
 * Constructs a system prompt string for a Genkit LLM agent based on its configuration.
 *
 * @param agentConfig - The LLM agent configuration object.
 * @returns A string representing the system prompt.
 */
export function constructSystemPromptForGenkit(agentConfig: LLMAgentConfig): string {
  const promptParts: string[] = [];

  // The type check `agentConfig.type === 'llm'` is implicitly true due to the LLMAgentConfig type,
  // but kept here for clarity or if the function were to be made more generic in the future
  // with a union type for agentConfig. Given the current signature, it's guaranteed.

  if (agentConfig.globalInstruction) {
    promptParts.push(agentConfig.globalInstruction);
  }

  if (agentConfig.agentGoal) {
    promptParts.push(`MAIN GOAL:\n${agentConfig.agentGoal}`);
  }

  if (agentConfig.agentTasks && agentConfig.agentTasks.length > 0) {
    const tasksString = agentConfig.agentTasks.map(task => `- ${task.trim()}`).join('\n');
    promptParts.push(`KEY TASKS:\n${tasksString}`);
  }

  if (agentConfig.agentPersonality) {
    promptParts.push(`PERSONA/TONE:\n${agentConfig.agentPersonality}`);
  }

  if (agentConfig.agentRestrictions && agentConfig.agentRestrictions.length > 0) {
    const restrictionsString = agentConfig.agentRestrictions.map(restriction => `- ${restriction.trim()}`).join('\n');
    promptParts.push(`IMPORTANT RESTRICTIONS:\n${restrictionsString}`);
  }

  // The 'else' block for non-LLM types is removed as this function now specifically accepts LLMAgentConfig.

  // Join parts with double newlines for better readability if multiple sections exist.
  // Filter out any empty strings that might have resulted from missing optional fields
  // before joining, to avoid excessive newlines.
  const nonEmptyParts = promptParts.filter(part => part && part.trim() !== "");

  if (nonEmptyParts.length === 0) {
    // If an LLM agent has no specific instructions, goal, etc., return an empty string.
    return "";
  }

  return nonEmptyParts.join('\n\n');
}
