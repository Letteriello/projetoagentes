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
  result: z.number().describe("The result of the calculation."),
});

export const calculatorTool = ai.defineTool(
  {
    name: 'calculator',
    description:
      "Performs mathematical calculations. Input a mathematical expression as a string (e.g., '2 + 2 * 10 / 4'). Supports addition (+), subtraction (-), multiplication (*), and division (/). Respects order of operations (multiplication/division before addition/subtraction).",
    inputSchema: CalculatorInputSchema,
    outputSchema: CalculatorOutputSchema, // Updated schema
  },
  async (input: z.infer<typeof CalculatorInputSchema>) => {
    const { expression, flowName, agentId } = input;
    const toolName = 'calculator';

    try {
      // Simple expression evaluator
      const sanitizedExpression = expression.replace(/\s+/g, ''); // Remove all whitespace
      if (!/^[0-9\.\+\-\*\/\(\)]+$/.test(sanitizedExpression)) {
        // Note: Parentheses are checked in regex but not handled by this simplified evaluator
        // Allow leading minus/plus for unary operations
        if(!/^[+\-]?([0-9].*)?$/.test(sanitizedExpression) && !/^[0-9\.\+\-\*\/\(\)]+$/.test(sanitizedExpression.substring(1))){
            throw new Error("Expression contains invalid characters or unsupported parentheses.");
        }
      }

      // Enhanced check for invalid sequences like '++' or '**' or leading '*' '/'
      if (/[\+\-\*\/]{2,}/.test(sanitizedExpression) || /^[\*\/]/.test(sanitizedExpression)) {
        throw new Error("Expression contains invalid sequence of operators or starts with invalid operator.");
      }


      const tokens: (number | string)[] = [];
      let currentNumber = '';
      for (let i = 0; i < sanitizedExpression.length; i++) {
        const char = sanitizedExpression[i];
        if (/[\d\.]/.test(char)) {
          currentNumber += char;
        } else if (/[\+\-\*\/]/.test(char)) {
          // Handle unary minus/plus at the beginning or after an operator
          if ((char === '-' || char === '+') && (currentNumber === '' && (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string'))) {
            currentNumber += char; // Start new number with sign
          } else {
            if (currentNumber) {
              tokens.push(parseFloat(currentNumber));
              currentNumber = '';
            }
            tokens.push(char); // Push the operator
          }
        } else {
          throw new Error(`Unsupported character '${char}' in expression.`);
        }
      }
      if (currentNumber) {
        tokens.push(parseFloat(currentNumber));
      }

      if (tokens.length === 0) {
        throw new Error("Empty expression results in no tokens.");
      }

      // Check for NaN tokens which can result from parseFloat on just '-' or '+'
      for(const token of tokens) {
        if(typeof token === 'number' && isNaN(token)) {
          throw new Error("Invalid number token found. Likely a misplaced operator or invalid number format.");
        }
      }


      const applyOp = (a: number, b: number, op: string): number => {
        switch (op) {
          case '+': return a + b;
          case '-': return a - b;
          case '*': return a * b;
          case '/':
            if (b === 0) throw new Error("Division by zero is not allowed.");
            return a / b;
          default: throw new Error(`Unknown operator ${op}.`);
        }
      };

      // Order of operations: Multiplication and Division first
      const pass1: (number | string)[] = [];
      let i = 0;
      while (i < tokens.length) {
        const token = tokens[i];
        if (typeof token === 'string' && (token === '*' || token === '/')) {
          const left = pass1.pop(); // This should be a number
          const right = tokens[i + 1]; // This should be a number
          if (typeof left !== 'number' || typeof right !== 'number') {
            throw new Error("Invalid expression format: Missing number around multiplication/division operator.");
          }
          pass1.push(applyOp(left, right, token));
          i += 2; // Consumed operator and right operand
        } else {
          pass1.push(token);
          i += 1;
        }
      }

      // Addition and Subtraction next
      let resultAcc = pass1[0];
      if (typeof resultAcc !== 'number') {
        // This handles cases where the expression might start with an operator without a preceding number (e.g. "*2+3")
        // or is just an operator, which should be caught by earlier checks or result in NaN.
        throw new Error("Invalid expression: Must start with a number or valid unary operation.");
      }

      for (let j = 1; j < pass1.length; j += 2) {
        const op = pass1[j];
        const right = pass1[j + 1];
        if (typeof op !== 'string' || typeof right !== 'number') {
          throw new Error("Invalid expression format: Operator must be followed by a number during addition/subtraction pass.");
        }
        resultAcc = applyOp(resultAcc as number, right, op);
      }

      if (typeof resultAcc !== 'number' || isNaN(resultAcc)) {
        // This is a fallback, most specific errors should be caught earlier.
        throw new Error("Calculation resulted in NaN. Check expression for valid numbers and operations.");
      }
      
      const toolOutput = { result: resultAcc };
      enhancedLogger.logToolCall({ // Only log on success
        flowName: flowName || "calculator_flow", // Provide default if undefined
        agentId: agentId || "calculator_agent", // Provide default if undefined
        toolName: toolName,
        input: { expression },
        output: toolOutput,
      });
      return toolOutput;

    } catch (error: any) {
      enhancedLogger.logError({ // Log error before throwing
        flowName: flowName || "calculator_flow_error",
        agentId: agentId || "calculator_agent_error",
        message: `Error in ${toolName} tool: ${error.message}`,
        error: error instanceof Error ? error : new Error(String(error)),
        details: { input: expression, expressionProcessed: expression.replace(/\s+/g, '') },
        toolName: toolName,
      });
      // Re-throw the error to be handled by Genkit
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`Calculation failed: ${error.message || "An unexpected error occurred."}`);
    }
  }
);