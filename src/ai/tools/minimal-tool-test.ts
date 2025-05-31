import { defineTool } from 'genkit';
import { z } from 'zod';

console.log('minimal-tool-test.ts: Script iniciado.');

try {
  if (typeof defineTool === 'function') {
    console.log('minimal-tool-test.ts: defineTool é uma função.');

    const testTool = defineTool(
      {
        name: 'minimalTestTool',
        description: 'A minimal test tool.',
        inputSchema: z.object({ message: z.string() }),
        outputSchema: z.object({ reply: z.string() }),
      },
      async ({ message }) => {
        return { reply: `Test tool received: ${message}` };
      }
    );
    console.log('minimal-tool-test.ts: defineTool foi chamado com sucesso.');
    console.log('minimal-tool-test.ts: Nome da ferramenta de teste:', testTool.name);
  } else {
    console.error('minimal-tool-test.ts: ERRO - defineTool NÃO é uma função. Tipo encontrado:', typeof defineTool);
  }
} catch (e: any) {
  console.error('minimal-tool-test.ts: ERRO ao tentar usar defineTool:', e.message);
  if (e.stack) {
    console.error(e.stack);
  }
}

console.log('minimal-tool-test.ts: Script concluído.');
