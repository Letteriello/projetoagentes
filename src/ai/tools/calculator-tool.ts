/**
 * @fileOverview Defines a Genkit tool for performing mathematical calculations.
 * This tool takes a string mathematical expression, evaluates it respecting
 * basic order of operations, and returns the result or an error message.
 * It's designed to avoid direct use of `eval()` for security.
 */
import { defineTool } from 'genkit/tool';
import { z } from 'zod';

export const CalculatorInputSchema = z.object({
  expression: z.string().describe("The mathematical expression to evaluate. E.g., '2 + 2 * 10 / 4 - 1'"),
});

export const CalculatorOutputSchema = z.object({
  result: z.union([z.number(), z.string()]).describe("The result of the calculation or an error message."),
});

export const calculatorTool = defineTool(
  {
    name: 'calculator',
    description:
      "Performs mathematical calculations. Input a mathematical expression as a string (e.g., '2 + 2 * 10 / 4'). Supports addition (+), subtraction (-), multiplication (*), and division (/). Respects order of operations (multiplication/division before addition/subtraction).",
    inputSchema: CalculatorInputSchema,
    outputSchema: CalculatorOutputSchema,
  },
  async ({ expression }) => {
    // Simple expression evaluator
    // This is a basic implementation and might not cover all edge cases or complex scenarios.
    // It prioritizes safety over feature completeness for this example.

    // Sanitize and validate input further if necessary, though Zod handles basic type.
    // For now, we assume the expression is somewhat well-behaved.
    const sanitizedExpression = expression.replace(/\s+/g, ''); // Remove all whitespace

    // Regex to tokenize the expression. It captures numbers and operators.
    const tokens = sanitizedExpression.match(/(\d+\.?\d*|[\+\-\*\/])/g);

    if (!tokens) {
      return { result: "Error: Invalid expression format or empty expression." };
    }

    // Helper to perform an operation
    const applyOp = (a: number, b: number, op: string): number | string => {
      switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/':
          if (b === 0) return "Error: Division by zero.";
          return a / b;
        default: return `Error: Unknown operator ${op}`;
      }
    };

    const numbers: number[] = [];
    const ops: string[] = [];

    // Operator precedence
    const precedence: { [key: string]: number } = { '+': 1, '-': 1, '*': 2, '/': 2 };

    // Shunting-yard inspired logic (simplified for immediate execution of higher precedence)
    // This implementation will directly calculate * and / first, then + and -

    let currentNumberString = "";
    const processedTokens: (number | string)[] = [];

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!isNaN(parseFloat(token))) { // Is a number
            currentNumberString += token;
            // If next token is an operator or end of expression, push the number
            if (i === tokens.length - 1 || isNaN(parseFloat(tokens[i+1]))) {
                processedTokens.push(parseFloat(currentNumberString));
                currentNumberString = "";
            }
        } else if (['+', '-', '*', '/'].includes(token)) { // Is an operator
            if (currentNumberString !== "") { // Handles cases like "2*-1" if we allowed unary minus explicitly
                 processedTokens.push(parseFloat(currentNumberString));
                 currentNumberString = "";
            }
            // Handle unary minus at the beginning of an expression or after another operator
            if (token === '-' && (processedTokens.length === 0 || typeof processedTokens[processedTokens.length -1] === 'string')) {
                currentNumberString = "-"; // Start accumulating a negative number
                continue;
            }
            processedTokens.push(token);
        } else {
            return { result: `Error: Invalid token '${token}' in expression.` };
        }
    }
     if (currentNumberString !== "") { // Possible trailing number
        processedTokens.push(parseFloat(currentNumberString));
    }


    // Phase 1: Multiplication and Division
    const pass1: (number | string)[] = [];
    for (let i = 0; i < processedTokens.length; i++) {
      const token = processedTokens[i];
      if (typeof token === 'string' && (token === '*' || token === '/')) {
        const left = pass1.pop();
        const right = processedTokens[i + 1];
        if (typeof left !== 'number' || typeof right !== 'number') {
          return { result: "Error: Invalid sequence of operators and numbers." };
        }
        const opResult = applyOp(left, right, token);
        if (typeof opResult === 'string') return { result: opResult }; // Error occurred
        pass1.push(opResult);
        i++; // Skip next token (right operand)
      } else {
        pass1.push(token);
      }
    }

    // Phase 2: Addition and Subtraction
    let resultAcc = pass1[0];
    if (typeof resultAcc !== 'number') {
        // This can happen if the first token is an operator without a preceding number (e.g. "/2+3")
        // or if the expression is just an operator.
        if (pass1.length === 1 && typeof pass1[0] === 'string') {
             return { result: `Error: Expression cannot be just an operator '${pass1[0]}'.`};
        }
        // If the first element is an operator but it's not a unary minus that got handled, it's an error.
        // Unary minus should have been combined with the number already.
        return { result: "Error: Expression must start with a number or a valid unary minus." };
    }


    for (let i = 1; i < pass1.length; i += 2) {
      const op = pass1[i];
      const right = pass1[i + 1];
      if (typeof op !== 'string' || typeof right !== 'number') {
        return { result: "Error: Invalid sequence of operators and numbers during addition/subtraction." };
      }
      const opResult = applyOp(resultAcc as number, right, op);
      if (typeof opResult === 'string') return { result: opResult }; // Error occurred
      resultAcc = opResult;
    }

    if (typeof resultAcc !== 'number' || isNaN(resultAcc)) {
        return { result: "Error: Could not compute the final result. Invalid expression." };
    }

    return { result: resultAcc };
  }
);
