import { jsonSchemaToZodString, generateGenkitToolStub } from './agent-genkit-utils';
import * as z from 'zod'; // Required for eval-ing the generated Zod schemas for testing

describe('agent-genkit-utils', () => {
  describe('jsonSchemaToZodString', () => {
    const evalSchema = (schemaString: string, schemaName: string): any => {
      // DANGER: eval is used here for testing purposes ONLY. Do not use in production.
      // It's used to validate that the generated Zod schema string is valid JavaScript
      // and creates a Zod schema object we can then inspect or use.
      try {
        const fullCode = `${schemaString}\nmodule.exports = ${sanitizeNameForJsEval(schemaName)};`;
        // Emulate a module environment for 'exports'
        const context = { module: { exports: {} }, z: z }; 
        const result = new Function('module', 'exports', 'z', fullCode);
        result(context.module, context.exports, context.z);
        return context.module.exports;
      } catch (e) {
        console.error("Eval error for schema string:", schemaString, e);
        throw e;
      }
    };
    
    // Helper to sanitize schema names for use in eval context, must match sanitizeNameForJs logic
    const sanitizeNameForJsEval = (name: string): string => {
        if (!name) return 'customTool';
        let sanitized = name
            .replace(/[^a-zA-Z0-9_ ]/g, '')
            .split(' ')
            .map((word, index) => {
            if (index === 0) return word.toLowerCase();
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })
            .join('');
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sanitized)) {
            sanitized = `tool${sanitized.replace(/[^a-zA-Z0-9_]/g, '')}`;
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sanitized)) {
                return 'customTool';
            }
        }
        return sanitized || 'customTool';
    };


    test('should convert basic types correctly', () => {
      const schema = { type: 'object', properties: {
        myString: { type: 'string' },
        myNumber: { type: 'number' },
        myInteger: { type: 'integer' },
        myBoolean: { type: 'boolean' },
      }};
      const schemaName = 'basicSchema';
      const zodString = jsonSchemaToZodString(JSON.stringify(schema), schemaName);
      expect(zodString).toContain(`const ${sanitizeNameForJsEval(schemaName)} = z.object({`);
      expect(zodString).toContain('myString: z.string()');
      expect(zodString).toContain('myNumber: z.number()');
      expect(zodString).toContain('myInteger: z.number()');
      expect(zodString).toContain('myBoolean: z.boolean()');
      
      const generatedSchema = evalSchema(zodString, schemaName);
      expect(generatedSchema.shape.myString).toBeInstanceOf(z.ZodString);
    });

    test('should handle required and optional properties', () => {
      const schema = {
        type: 'object',
        properties: {
          requiredProp: { type: 'string' },
          optionalProp: { type: 'number' },
        },
        required: ['requiredProp'],
      };
      const schemaName = 'reqOptSchema';
      const zodString = jsonSchemaToZodString(JSON.stringify(schema), schemaName);
      expect(zodString).toContain('requiredProp: z.string()');
      expect(zodString).toContain('optionalProp: z.number().optional()');

      const generatedSchema = evalSchema(zodString, schemaName);
      expect(generatedSchema.shape.requiredProp).toBeInstanceOf(z.ZodString);
      expect(generatedSchema.shape.optionalProp).toBeInstanceOf(z.ZodOptional);
    });

    test('should handle simple array of strings', () => {
      const schema = { type: 'array', items: { type: 'string' } };
      const schemaName = 'arraySchema';
      const zodString = jsonSchemaToZodString(JSON.stringify(schema), schemaName);
      expect(zodString).toContain(`const ${sanitizeNameForJsEval(schemaName)} = z.array(z.string());`);
      const generatedSchema = evalSchema(zodString, schemaName);
      expect(generatedSchema).toBeInstanceOf(z.ZodArray);
      expect(generatedSchema.element).toBeInstanceOf(z.ZodString);
    });

    test('should handle array of any if items not specified', () => {
        const schema = { type: 'array' };
        const schemaName = 'anyArraySchema';
        const zodString = jsonSchemaToZodString(JSON.stringify(schema), schemaName);
        expect(zodString).toContain(`const ${sanitizeNameForJsEval(schemaName)} = z.array(z.any());`);
        const generatedSchema = evalSchema(zodString, schemaName);
        expect(generatedSchema.element).toBeInstanceOf(z.ZodAny);
    });
    
    test('should handle nested objects', () => {
      const schema = {
        type: 'object',
        properties: {
          parentProp: { type: 'string' },
          childObj: {
            type: 'object',
            properties: { nestedProp: { type: 'boolean' } },
            required: ['nestedProp'],
          },
        },
      };
      const schemaName = 'nestedObjSchema';
      const zodString = jsonSchemaToZodString(JSON.stringify(schema), schemaName);
      expect(zodString).toContain('childObj: z.object({\n    nestedProp: z.boolean()\n  }).optional()');
      
      const generatedSchema = evalSchema(zodString, schemaName);
      expect(generatedSchema.shape.childObj.unwrap().shape.nestedProp).toBeInstanceOf(z.ZodBoolean);
    });

    test('should handle array of objects', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'object',
          properties: { id: { type: 'number' }, value: { type: 'string' } },
          required: ['id'],
        },
      };
      const schemaName = 'arrayOfObjSchema';
      const zodString = jsonSchemaToZodString(JSON.stringify(schema), schemaName);
      expect(zodString).toContain(`const ${sanitizeNameForJsEval(schemaName)} = z.array(z.object({\n    id: z.number(),\n    value: z.string().optional()\n  }));`);
      const generatedSchema = evalSchema(zodString, schemaName);
      expect(generatedSchema.element.shape.id).toBeInstanceOf(z.ZodNumber);
    });
    
    test('should handle invalid JSON input gracefully', () => {
      const invalidJson = '{"type": "string", "name": "myField",'; // Missing closing brace
      const schemaName = 'invalidJsonSchema';
      const zodString = jsonSchemaToZodString(invalidJson, schemaName);
      expect(zodString).toContain(`const ${sanitizeNameForJsEval(schemaName)} = z.any();`);
      expect(zodString).toContain('// Failed to parse original schema:');
    });

    test('should handle empty JSON object or non-object schema gracefully', () => {
      const emptyObjJson = '{}';
      let schemaName = 'emptySchema';
      let zodString = jsonSchemaToZodString(emptyObjJson, schemaName);
      expect(zodString).toContain(`const ${sanitizeNameForJsEval(schemaName)} = z.any();`);
      expect(zodString).toContain('// Original schema was: {}');

      const stringRootSchema = JSON.stringify({ type: 'string' });
      schemaName = 'stringRootSchema';
      zodString = jsonSchemaToZodString(stringRootSchema, schemaName);
      expect(zodString).toContain(`const ${sanitizeNameForJsEval(schemaName)} = z.string()`);
    });
    
    test('should sanitize schema variable names', () => {
      const schema = { type: 'string' };
      const schemaName = 'Schema With Spaces and-Special_chars!';
      const zodString = jsonSchemaToZodString(JSON.stringify(schema), schemaName);
      expect(zodString).toContain(`const schemaWithSpacesAndSpecial_chars = z.string()`);
    });

     test('should handle enums', () => {
      const schema = { type: 'string', enum: ['USD', 'EUR', 'GBP'] };
      const schemaName = 'enumSchema';
      const zodString = jsonSchemaToZodString(JSON.stringify(schema), schemaName);
      expect(zodString).toContain("z.enum(['USD', 'EUR', 'GBP'])");
      const generatedSchema = evalSchema(zodString, schemaName);
      expect(generatedSchema).toBeInstanceOf(z.ZodEnum);
    });

    test('should handle root array with object items', () => {
        const schema = {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    age: { type: 'number' }
                },
                required: ['name']
            }
        };
        const schemaName = 'rootArrayObjectSchema';
        const zodString = jsonSchemaToZodString(JSON.stringify(schema), schemaName);
        expect(zodString).toContain(`const ${sanitizeNameForJsEval(schemaName)} = z.array(z.object({\n    name: z.string(),\n    age: z.number().optional()\n  }));`);
        const generatedSchema = evalSchema(zodString, schemaName);
        expect(generatedSchema).toBeInstanceOf(z.ZodArray);
        expect(generatedSchema.element.shape.name).toBeInstanceOf(z.ZodString);
    });

  });

  describe('generateGenkitToolStub', () => {
    const defaultInputSchema = JSON.stringify({ type: 'object', properties: { query: { type: 'string' } }, required: ['query'] });
    const defaultOutputSchema = JSON.stringify({ type: 'object', properties: { result: { type: 'string' } }, required: ['result'] });

    test('should generate a valid Genkit tool stub structure', () => {
      const stub = generateGenkitToolStub('My Test Tool', 'A test description', defaultInputSchema, defaultOutputSchema);
      expect(stub).toContain("import { defineTool } from '@genkit-ai/ai';");
      expect(stub).toContain("import * as z from 'zod';");
      expect(stub).toContain('export const myTestToolTool = defineTool(');
      expect(stub).toContain("name: 'My_Test_Tool'");
      expect(stub).toContain("description: 'A test description'");
      expect(stub).toContain('inputSchema: myTestToolInputSchema,');
      expect(stub).toContain('outputSchema: myTestToolOutputSchema,');
      expect(stub).toContain('async (input) => {');
      expect(stub).toContain('// TODO: Implement your tool logic here.');
      expect(stub).toContain("throw new Error('Tool logic for My_Test_Tool not implemented yet.');");
    });

    test('should correctly embed Zod schema definitions', () => {
      const stub = generateGenkitToolStub('SchemaEmbed', 'Desc', defaultInputSchema, defaultOutputSchema);
      expect(stub).toContain('const schemaEmbedInputSchema = z.object({\n  query: z.string()\n});');
      expect(stub).toContain('const schemaEmbedOutputSchema = z.object({\n  result: z.string()\n});');
    });
    
    test('should sanitize the exported tool constant name', () => {
      const stub = generateGenkitToolStub('Tool With Spaces', 'Desc', defaultInputSchema, defaultOutputSchema);
      expect(stub).toContain('export const toolWithSpacesTool = defineTool(');
      expect(stub).toContain("name: 'Tool_With_Spaces'"); // Genkit name property
    });

    test('should sanitize the Genkit tool name property', () => {
        const stub = generateGenkitToolStub('Another Tool_!@#', 'Desc', defaultInputSchema, defaultOutputSchema);
        expect(stub).toContain('export const anotherTool_Tool = defineTool('); // Variable name
        expect(stub).toContain("name: 'Another_Tool___'");      // Genkit name property
    });

    test('should handle descriptions with special characters', () => {
        const description = "This is a tool with 'single quotes' and \"double quotes\" and backticks ``;";
        const stub = generateGenkitToolStub('SpecialDescTool', description, defaultInputSchema, defaultOutputSchema);
        expect(stub).toContain("description: 'This is a tool with \\'single quotes\\' and \"double quotes\" and backticks ``;'");
    });
  });
});
