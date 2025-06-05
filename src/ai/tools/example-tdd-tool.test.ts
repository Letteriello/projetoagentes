// src/ai/tools/example-tdd-tool.test.ts

// Mock @genkit-ai/ai before importing the tool
jest.mock('@genkit-ai/ai', () => ({
  // No ...jest.requireActual('@genkit-ai/ai') to avoid initialization errors from the module itself
  defineTool: jest.fn((config, func) => ({
    name: config.name,
    description: config.description,
    inputSchema: config.inputSchema,
    outputSchema: config.outputSchema,
    func: func, // The actual function to test
    // metadata: config.metadata, // Include metadata if it's part of your tool definition and tests
  })),
  // If stringReverserTool.ts uses other exports from @genkit-ai/ai like specific types for func signature,
  // those might need to be mocked here as well if they cause issues.
  // For example, if `Tool` type itself is problematic:
  // Tool: jest.fn(), // or a more specific mock if needed
}));

import { stringReverserTool } from './example-tdd-tool';
import { z } from 'zod'; // Para testar o schema

describe('stringReverserTool', () => {
  // Teste para a função principal da ferramenta
  it('should reverse a simple string correctly', async () => {
    const input = { stringToReverse: 'hello' };
    const result = await stringReverserTool.func(input);
    expect(result).toEqual({ reversedString: 'olleh' });
  });

  it('should reverse a string with spaces', async () => {
    const input = { stringToReverse: 'hello world' };
    const result = await stringReverserTool.func(input);
    expect(result).toEqual({ reversedString: 'dlrow olleh' });
  });

  it('should return an empty string for an empty input string', async () => {
    const input = { stringToReverse: '' };
    const result = await stringReverserTool.func(input);
    expect(result).toEqual({ reversedString: '' });
  });

  it('should correctly reverse a string with numbers and symbols', async () => {
    const input = { stringToReverse: 'h3llo!' };
    const result = await stringReverserTool.func(input);
    expect(result).toEqual({ reversedString: '!oll3h' });
  });

  it('should correctly reverse a string with mixed casing', async () => {
    const input = { stringToReverse: 'HeLlO' };
    const result = await stringReverserTool.func(input);
    expect(result).toEqual({ reversedString: 'OlLeH' });
  });

  // Testes para o schema de input Zod
  describe('inputSchema', () => {
    const schema = stringReverserTool.inputSchema;

    it('should validate a correct input', () => {
      const result = schema.safeParse({ stringToReverse: 'test' });
      expect(result.success).toBe(true);
    });

    it('should fail validation if stringToReverse is not a string', () => {
      const result = schema.safeParse({ stringToReverse: 123 });
      expect(result.success).toBe(false);
      // @ts-ignore
      expect(result.error?.errors[0]?.message).toBe('Expected string, received number');
    });

    it('should fail validation if stringToReverse is missing', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(false);
      // @ts-ignore
      expect(result.error?.errors[0]?.message).toBe('Required');
    });
  });

  // Testes para o schema de output Zod (se definido)
  describe('outputSchema', () => {
    const schema = stringReverserTool.outputSchema;

    it('should validate a correct output', () => {
      const result = schema.safeParse({ reversedString: 'tset' });
      expect(result.success).toBe(true);
    });

    it('should fail validation if reversedString is not a string', () => {
      const result = schema.safeParse({ reversedString: 123 });
      expect(result.success).toBe(false);
      // @ts-ignore
      expect(result.error?.errors[0]?.message).toBe('Expected string, received number');
    });

    it('should fail validation if reversedString is missing', () => {
      const result = schema.safeParse({});
      expect(result.success).toBe(false);
      // @ts-ignore
      expect(result.error?.errors[0]?.message).toBe('Required');
    });
  });

  // Teste para a descrição da ferramenta (opcional mas bom para TDD de documentação)
  it('should have a non-empty description', () => {
    expect(stringReverserTool.description).toBeDefined();
    expect(stringReverserTool.description.length).toBeGreaterThan(0);
  });
});
