'use server';
import { suggestAgentConfiguration, SuggestAgentConfigurationInput, SuggestAgentConfigurationOutput } from '@/ai/flows/ai-configuration-assistant';
import { z } from 'zod';

const TaskGoalSchema = z.object({
  taskGoal: z.string().min(10, { message: "Task goal must be at least 10 characters long." }),
});

interface FormState {
  message: string;
  suggestedConfiguration?: string;
  errors?: {
    taskGoal?: string[];
  };
}

export async function getAgentConfigurationSuggestion(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = TaskGoalSchema.safeParse({
    taskGoal: formData.get('taskGoal'),
  });

  if (!validatedFields.success) {
    return {
      message: "Validation failed. Please check your input.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const input: SuggestAgentConfigurationInput = {
    taskGoal: validatedFields.data.taskGoal,
  };

  try {
    const result: SuggestAgentConfigurationOutput = await suggestAgentConfiguration(input);
    return {
      message: "Suggestion received successfully!",
      suggestedConfiguration: result.suggestedConfiguration,
    };
  } catch (error) {
    console.error("Error calling AI flow:", error);
    return {
      message: "An error occurred while fetching the suggestion. Please try again.",
    };
  }
}
