'use server';
import { suggestAgentConfiguration, SuggestAgentConfigurationInput, SuggestAgentConfigurationOutput } from '@/ai/flows/ai-configuration-assistant';
import { z } from 'zod';

const TaskGoalSchema = z.object({
  taskGoal: z.string().min(10, { message: "O objetivo da tarefa deve ter pelo menos 10 caracteres." }),
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
      message: "Falha na validação. Por favor, verifique sua entrada.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const input: SuggestAgentConfigurationInput = {
    taskGoal: validatedFields.data.taskGoal,
  };

  try {
    const result: SuggestAgentConfigurationOutput = await suggestAgentConfiguration(input);
    return {
      message: "Sugestão recebida com sucesso!",
      suggestedConfiguration: result.suggestedConfiguration,
    };
  } catch (error) {
    console.error("Error calling AI flow:", error);
    return {
      message: "Ocorreu um erro ao buscar a sugestão. Por favor, tente novamente.",
    };
  }
}
