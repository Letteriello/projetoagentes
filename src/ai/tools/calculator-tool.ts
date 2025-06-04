/**
 * @fileOverview Defines a Genkit tool for performing mathematical calculations.
 * This tool takes a string mathematical expression, evaluates it respecting
 * basic order of operations, and returns the result or an error message.
 * It's designed to avoid direct use of `eval()` for security.
 */
import { ai } from '@/ai/genkit'; // Import the configured 'ai' instance
import { z } from 'zod';
import { enhancedLogger } from '@/lib/logger'; // Import the logger

export const CalculatorInputSchema = z.object({
  expression: z.string().describe("The mathematical expression to evaluate. E.g., '2 + 2 * 10 / 4 - 1'"),
  // Optional fields for enhanced logging if provided by caller
  flowName: z.string().optional().describe("Name of the calling flow, for logging."),
  agentId: z.string().optional().describe("ID of the calling agent, for logging."),
});

export const CalculatorOutputSchema = z.object({
  result: z.union([z.number(), z.string()]).describe("The result of the calculation or an error message."),
});

export const calculatorTool = ai.defineTool(
  {
    name: 'calculator',
    description:
      "Performs mathematical calculations. Input a mathematical expression as a string (e.g., '2 + 2 * 10 / 4'). Supports addition (+), subtraction (-), multiplication (*), and division (/). Respects order of operations (multiplication/division before addition/subtraction).",
    inputSchema: CalculatorInputSchema,
    outputSchema: CalculatorOutputSchema,
  },
  async (input: z.infer<typeof CalculatorInputSchema>) => {
    const { expression, flowName, agentId } = input;
    const toolName = 'calculator';
    let toolOutput: { result: number | string };

    try {
      // Simple expression evaluator
      const sanitizedExpression = expression.replace(/\s+/g, ''); // Remove all whitespace
      if (!/^[\d\.\+\-\*\/\(\)]+$/.test(sanitizedExpression)) {
        // Note: Parentheses are checked in regex but not handled by this simplified evaluator
        throw new Error("Expression contains invalid characters or unsupported parentheses.");
      }

      const tokens: (number | string)[] = [];
      let currentNumber = '';
      for (let i = 0; i < sanitizedExpression.length; i++) {
        const char = sanitizedExpression[i];
        if (/[\d\.]/.test(char)) {
          currentNumber += char;
        } else if (/[\+\-\*\/]/.test(char)) {
          if (currentNumber) {
            tokens.push(parseFloat(currentNumber));
            currentNumber = '';
          }
          if (char === '-' || char === '+') {
            if (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string') {
              currentNumber += char;
              continue;
            }
          }
          tokens.push(char);
        } else {
          // This path should ideally not be reached if regex is comprehensive for supported chars
          throw new Error(`Unsupported character '${char}' in expression.`);
        }
      }
      if (currentNumber) {
        tokens.push(parseFloat(currentNumber));
      }

      if (tokens.length === 0) {
        throw new Error("Empty expression.");
      }

      const applyOp = (a: number, b: number, op: string): number => {
        switch (op) {
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/':
            if (b === 0) throw new Error("Division by zero.");
            return a / b;
          default: throw new Error(`Unknown operator ${op}`);
        }
      };

      // Order of operations: Multiplication and Division first
      const pass1: (number | string)[] = [];
      let i = 0;
      while (i < tokens.length) {
        const token = tokens[i];
        if (typeof token === 'string' && (token === '*' || token === '/')) {
          const left = pass1.pop();
          const right = tokens[i + 1];
          if (typeof left !== 'number' || typeof right !== 'number') {
            throw new Error("Invalid expression format for multiplication/division.");
          }
          pass1.push(applyOp(left, right, token));
          i += 2;
        } else {
          pass1.push(token);
          i += 1;
        }
      }

      // Addition and Subtraction next
      let resultAcc = pass1[0];
      if (typeof resultAcc !== 'number') {
        throw new Error("Expression must start with a number or valid unary minus/plus.");
      }

      for (let i = 1; i < pass1.length; i += 2) {
        const op = pass1[i];
        const right = pass1[i + 1];
        if (typeof op !== 'string' || typeof right !== 'number') {
          throw new Error("Invalid sequence of operators and numbers during addition/subtraction.");
        }
        resultAcc = applyOp(resultAcc as number, right, op);
      }

      if (typeof resultAcc !== 'number' || isNaN(resultAcc)) {
        throw new Error("Could not compute the final result. Invalid expression.");
      }
      
      toolOutput = { result: resultAcc };
      // Success logging within try block, after result is confirmed
      enhancedLogger.logToolCall({
        flowName: flowName || "unknown_flow",
        agentId: agentId || "unknown_agent",
        toolName: toolName,
        input: { expression },
        output: toolOutput,
      });

    } catch (error: any) {
      // Error logging within catch block
      toolOutput = { result: error.message || "An unexpected error occurred during calculation." };
      enhancedLogger.logError({
        flowName: flowName || "unknown_flow",
        agentId: agentId || "unknown_agent",
        message: `Error in ${toolName} tool`,
        error: error instanceof Error ? error : new Error(String(error)), // Ensure it's an Error object
        details: { input: expression, output: toolOutput },
        toolName: toolName,
      });
    }
    
    return toolOutput;
  }
);