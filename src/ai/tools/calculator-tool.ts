/**
 * @file calculator-tool.ts
 * 
 * Defines a Genkit tool for performing basic mathematical calculations.
 * This is a placeholder/mock implementation, primarily demonstrating how a tool is defined
 * and integrated into the ADK. It currently supports a few hardcoded operations.
 * 
 * In a production scenario, this tool would be replaced with a robust math expression parser
 * or an API call to a dedicated calculation service.
 */
import { ai } from '../genkit'; // For ai.defineTool
import { z } from 'genkit';   // For defining input and output schemas with Zod

/**
 * Defines the 'calculator' Genkit tool.
 * This tool can be used by LLM agents to perform mathematical calculations.
 */
export const calculatorTool = ai.defineTool(
  {
    name: 'calculator', // Unique name for the tool.
    description: "Realiza cálculos matemáticos. Ex: 'quanto é 2+2?', 'raiz quadrada de 16'.", // Description for the LLM to understand when to use the tool.
    
    // Defines the expected input structure for the tool using Zod schema.
    inputSchema: z.object({
      operation: z.string().describe('A expressão matemática a ser calculada. Ex: "2+2", "raiz quadrada de 16", "5*5".'),
    }),
    
    // Defines the expected output structure of the tool using Zod schema.
    outputSchema: z.object({
      result: z.union([z.number(), z.string()]).describe('O resultado numérico do cálculo ou uma mensagem de texto em caso de erro ou operação não suportada.'),
    }),
  },
  /**
   * The asynchronous function that implements the tool's logic.
   * @param {object} input - The input object, matching `inputSchema`.
   * @param {string} input.operation - The mathematical operation to perform.
   * @returns {Promise<object>} A promise that resolves to an object matching `outputSchema`.
   */
  async (input) => {
    console.log(`Calculator tool received operation: ${input.operation}`);

    // Normalize input for easier matching: trim whitespace, convert to lowercase, remove internal spaces.
    // This helps in matching variations like "SQRT (16)" or "2 + 2".
    const operationCleaned = input.operation.trim().toLowerCase().replace(/\s+/g, '');

    // Mock implementations for a few specific simple operations.
    // A real implementation would use a math expression parser library.
    if (operationCleaned === '2+2') {
      return { result: 4 };
    }
    if (operationCleaned === '5*5' || operationCleaned === '5x5') {
      return { result: 25 };
    }
    if (operationCleaned === '10-3') {
      return { result: 7 };
    }
    if (operationCleaned === '10/2' || operationCleaned === '10÷2') {
      return { result: 5 };
    }
    // Handle variations for square root.
    if (operationCleaned === 'raizquadradade16' || operationCleaned === 'sqrt(16)' || input.operation.toLowerCase().includes("raiz quadrada de 16")) {
      return { result: 4 };
    }
    if (operationCleaned === 'raizquadradade25' || operationCleaned === 'sqrt(25)' || input.operation.toLowerCase().includes("raiz quadrada de 25")) {
      return { result: 5 };
    }

    // Placeholder message for any other operation not explicitly handled above.
    // IMPORTANT: Using eval() for arbitrary string input is a major security risk and should be avoided.
    // A proper implementation would involve a safe math expression parser/evaluator.
    // TODO: Replace this mock logic with a call to a safe math parsing library (e.g., mathjs) or a secure microservice.
    return { result: `Cálculo para "${input.operation}" não implementado ainda. Apenas operações simples como 2+2, 5*5, 10/2, raiz quadrada de 16/25 são suportadas no momento.` };
  }
);
