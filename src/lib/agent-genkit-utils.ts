/**
 * @fileOverview Utilities for Genkit agent configurations, specifically for constructing system prompts.
 */

// Minimal representation of the agent configuration structure needed for prompt construction.
// Based on the fields mentioned in the task description.
export interface AgentConfigForPrompt {
  type: 'llm' | 'other_agent_type'; // Example types
  globalInstruction?: string;
  agentGoal?: string;
  agentTasks?: string[];
  agentPersonality?: string;
  agentRestrictions?: string[];
  // Add other fields from SavedAgentConfiguration['config'] if they become relevant for prompts.
}

/**
 * Constructs a system prompt string for a Genkit agent based on its configuration.
 *
 * @param agentConfig - The configuration object for the agent.
 * @returns A string representing the system prompt.
 */
export function constructSystemPromptForGenkit(agentConfig: AgentConfigForPrompt): string {
  const promptParts: string[] = [];

  if (agentConfig.type === 'llm') {
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
  } else {
    // For non-LLM agents, or as a fallback.
    if (agentConfig.globalInstruction) {
      return agentConfig.globalInstruction;
    }
    // For non-LLM agents without globalInstruction, return an empty string or a default generic prompt.
    // For now, returning empty if no globalInstruction.
    return "";
  }

  // Join parts with double newlines for better readability if multiple sections exist.
  // Filter out any empty strings that might have resulted from missing optional fields
  // before joining, to avoid excessive newlines.
  const nonEmptyParts = promptParts.filter(part => part && part.trim() !== "");

  if (nonEmptyParts.length === 0 && agentConfig.type === 'llm') {
    // If an LLM agent has no specific instructions, goal, etc.,
    // it might be useful to return a very generic prompt or an empty string.
    // For now, returning an empty string.
    return "";
  }

  return nonEmptyParts.join('\n\n');
}
