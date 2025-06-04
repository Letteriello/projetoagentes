// src/ai/tools/example-tdd-tool.ts
import { defineTool, type Tool } from '@genkit-ai/ai';
import { z } from 'zod';

// Define o schema de input usando Zod
const StringReverserInputSchema = z.object({
  stringToReverse: z.string().describe('A string a ser invertida.'),
});

// Define o schema de output usando Zod
const StringReverserOutputSchema = z.object({
  reversedString: z.string().describe('A string invertida.'),
});

// Define a ferramenta Genkit
export const stringReverserTool: Tool<typeof StringReverserInputSchema, typeof StringReverserOutputSchema> = defineTool(
  {
    name: 'stringReverser',
    description: 'Inverte uma string fornecida. Demonstra o desenvolvimento orientado a testes (TDD) para ferramentas.',
    inputSchema: StringReverserInputSchema,
    outputSchema: StringReverserOutputSchema,
    // metadata: { category: 'Exemplos TDD', usageExample: 'Use para inverter strings como "olá" para "álo".' } // Opcional
  },
  async (input) => {
    // Validação de input é feita automaticamente pelo Genkit/Zod antes de chamar esta função,
    // mas podemos adicionar verificações adicionais se necessário.
    // No TDD, o teste de schema já cobre isso, então não precisamos de um throw Error explícito aqui para tipo.
    // if (typeof input.stringToReverse !== 'string') {
    //   throw new Error('Input inválido: stringToReverse deve ser uma string.');
    // }

    const reversed = input.stringToReverse.split('').reverse().join('');

    return {
      reversedString: reversed,
    };
  }
);

// Para consistência com outras ferramentas, podemos exportar uma factory se precisarmos de configuração no futuro,
// mas para este exemplo simples, exportar diretamente o objeto da ferramenta é suficiente.
// export const createStringReverserTool = () => stringReverserTool;
