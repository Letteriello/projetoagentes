import * as z from 'zod'; // For type inference, actual z will be in generated code.

// Helper to sanitize names for JS variables/exports
const sanitizeNameForJs = (name: string): string => {
  if (!name) return 'customTool';
  // Remove characters not suitable for variable names, then camelCase
  let sanitized = name
    .replace(/[^a-zA-Z0-9_ ]/g, '')
    .split(' ')
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
  
  // Ensure it's a valid JS identifier (basic check)
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sanitized)) {
    sanitized = `tool${sanitized.replace(/[^a-zA-Z0-9_]/g, '')}`;
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(sanitized)) {
        return 'customTool'; // fallback
    }
  }
  return sanitized || 'customTool';
};


export const jsonSchemaToZodString = (jsonSchemaString: string, schemaName: string): string => {
  let schemaObj: any;
  try {
    schemaObj = JSON.parse(jsonSchemaString);
    if (typeof schemaObj !== 'object' || schemaObj === null) {
      // If not an object, or if it's an empty schema, default to z.any()
      console.warn(`Invalid or non-object schema for ${schemaName}, defaulting to z.any(). Schema:`, jsonSchemaString);
      return `const ${sanitizeNameForJs(schemaName)} = z.any();\n// Original schema was: ${jsonSchemaString.replace(/\n/g, ' ')}`;
    }
  } catch (e) {
    console.error(`Error parsing JSON schema for ${schemaName}:`, e);
    // If parsing fails, default to z.any() and include original as comment
    return `const ${sanitizeNameForJs(schemaName)} = z.any();\n// Failed to parse original schema: ${jsonSchemaString.replace(/\n/g, ' ')}`;
  }

  const zodParts: string[] = [];

  const convertProperty = (propKey: string, propSchema: any, isRequired: boolean): string => {
    let zodType = 'z.any()'; // Default for unknown or complex types

    if (propSchema.type) {
      switch (propSchema.type) {
        case 'string':
          zodType = 'z.string()';
          if (propSchema.enum) {
            zodType = `z.enum([${propSchema.enum.map((s: string) => `'${s}'`).join(', ')}])`;
          }
          break;
        case 'number':
        case 'integer':
          zodType = 'z.number()';
          break;
        case 'boolean':
          zodType = 'z.boolean()';
          break;
        case 'object':
          if (propSchema.properties) {
            const nestedProps = Object.entries(propSchema.properties)
              .map(([key, val]) => 
                `${sanitizeNameForJs(key)}: ${convertProperty(key, val, propSchema.required?.includes(key) || false)}`
              )
              .join(',\n    ');
            zodType = `z.object({\n    ${nestedProps}\n  })`;
          } else {
            zodType = 'z.record(z.string(), z.any())'; // For object without specified properties
          }
          break;
        case 'array':
          if (propSchema.items) {
            // Assuming items is a single schema object, not an array of schemas (tuple)
            const itemSchemaName = `${propKey}Item`;
            const itemZodType = convertProperty(itemSchemaName, propSchema.items, true); // Item schema is always "required" in itself
            zodType = `z.array(${itemZodType})`;
          } else {
            zodType = 'z.array(z.any())';
          }
          break;
      }
    } else if (propSchema.oneOf || propSchema.anyOf) {
        // Handle discriminated unions or unions if possible, otherwise z.any()
        // This simplified version doesn't fully support complex union types
        const unionTypes = (propSchema.oneOf || propSchema.anyOf).map((subSchema: any, index: number) => 
            convertProperty(`${propKey}_option${index}`, subSchema, true) // Treat options as required within their own structure
        );
        if (unionTypes.length > 0) {
            zodType = `z.union([${unionTypes.join(', ')}])`;
        } else {
            zodType = 'z.any()';
        }
    }
    // For top-level schema, required is handled by its presence. For properties, add .optional()
    // The `isRequired` parameter to `convertProperty` handles this for nested properties.
    // The top-level schema itself is always "required".
    return `${zodType}${!isRequired ? '.optional()' : ''}`;
  };
  
  // For the main schema object
  if (schemaObj.type === 'object' && schemaObj.properties) {
    const properties = Object.entries(schemaObj.properties)
      .map(([key, value]) => {
        const isRequired = schemaObj.required?.includes(key) || false;
        return `${sanitizeNameForJs(key)}: ${convertProperty(key, value, isRequired)}`;
      })
      .join(',\n  ');
    zodParts.push(`const ${sanitizeNameForJs(schemaName)} = z.object({\n  ${properties}\n});`);
  } else if (schemaObj.type === 'array' && schemaObj.items) {
     const itemZodType = convertProperty(`${schemaName}Item`, schemaObj.items, true);
     zodParts.push(`const ${sanitizeNameForJs(schemaName)} = z.array(${itemZodType});`);
  } else if (schemaObj.type) { // Handle cases where the root is a primitive type
    const primitiveZodType = convertProperty(schemaName, schemaObj, true);
    zodParts.push(`const ${sanitizeNameForJs(schemaName)} = ${primitiveZodType};`);
  }
  else {
    // Fallback for schemas that are not objects or arrays at the root, or empty
    console.warn(`Root schema for ${schemaName} is not a standard object or array with properties/items. Defaulting to z.any(). Schema:`, schemaObj);
    zodParts.push(`const ${sanitizeNameForJs(schemaName)} = z.any();\n// Original schema was: ${JSON.stringify(schemaObj, null, 2).replace(/\n/g, ' ')}`);
  }

  return zodParts.join('\n\n');
};


export const generateGenkitToolStub = (
  toolName: string, // This is the human-readable name, will be sanitized for code
  description: string,
  inputSchemaJson: string,
  outputSchemaJson: string
): string => {
  const sanitizedToolName = sanitizeNameForJs(toolName);
  const inputSchemaName = `${sanitizedToolName}InputSchema`;
  const outputSchemaName = `${sanitizedToolName}OutputSchema`;

  const inputSchemaZodString = jsonSchemaToZodString(inputSchemaJson, inputSchemaName);
  const outputSchemaZodString = jsonSchemaToZodString(outputSchemaJson, outputSchemaName);

  // Ensure the generated const names are used in defineTool
  const finalInputSchemaConstName = sanitizeNameForJs(inputSchemaName);
  const finalOutputSchemaConstName = sanitizeNameForJs(outputSchemaName);
  
  const genkitToolName = toolName.replace(/[^a-zA-Z0-9_]/g, '_'); // Simple sanitization for Genkit's tool name property

  return `import { defineTool } from '@genkit-ai/ai';
import * as z from 'zod';

// Input Schema for ${toolName}
${inputSchemaZodString}

// Output Schema for ${toolName}
${outputSchemaZodString}

export const ${sanitizedToolName}Tool = defineTool(
  {
    name: '${genkitToolName}',
    description: '${description.replace(/'/g, "\\'")}',
    inputSchema: ${finalInputSchemaConstName},
    outputSchema: ${finalOutputSchemaConstName},
  },
  async (input) => {
    // TODO: Implement your tool logic here.
    // The 'input' variable will be validated according to ${finalInputSchemaConstName}.
    // You should return a value that conforms to ${finalOutputSchemaConstName}.
    console.log('${genkitToolName} tool called with input:', input);
    
    // Example placeholder - adjust according to your actual output schema.
    // If your outputSchema is, for example, z.object({ success: z.boolean(), message: z.string().optional() }),
    // you might return:
    // return { success: true, message: "Operation completed successfully." };
    // Or if it's just z.string():
    // return "Output string";

    // Replace this with your actual implementation:
    throw new Error('Tool logic for ${genkitToolName} not implemented yet.');
  }
);
`;
};
