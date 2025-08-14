import { z } from 'zod';

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  endpoint: {
    method: string;
    path: string;
    parameters?: any[];
    requestBody?: any;
    responses: any;
  };
}

export class OpenAPIParser {
  
  /**
   * Gera ferramentas MCP a partir da especificação OpenAPI
   */
  async generateTools(openApiSpec: any): Promise<MCPTool[]> {
    const tools: MCPTool[] = [];
    const paths = openApiSpec.paths || {};

    for (const [path, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (this.isValidHttpMethod(method)) {
          const tool = this.createToolFromOperation(
            path,
            method.toUpperCase(),
            operation as any
          );
          if (tool) {
            tools.push(tool);
          }
        }
      }
    }

    return tools;
  }

  private isValidHttpMethod(method: string): boolean {
    const validMethods = ['get', 'post', 'put', 'delete', 'patch'];
    return validMethods.includes(method.toLowerCase());
  }

  private createToolFromOperation(
    path: string,
    method: string,
    operation: any
  ): MCPTool | null {
    if (!operation || typeof operation !== 'object') {
      return null;
    }

    const operationId = operation.operationId || `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const summary = operation.summary || `${method} ${path}`;
    const description = operation.description || summary;

    // Criar schema de input baseado nos parâmetros
    const inputSchema = this.buildInputSchema(operation, path);

    return {
      name: this.sanitizeToolName(operationId),
      description: `${description}\\n\\nEndpoint: ${method} ${path}`,
      inputSchema,
      endpoint: {
        method,
        path,
        parameters: operation.parameters || [],
        requestBody: operation.requestBody,
        responses: operation.responses || {},
      },
    };
  }

  private buildInputSchema(operation: any, path: string): any {
    const properties: any = {};
    const required: string[] = [];

    // Parâmetros de path
    const pathParams = this.extractPathParameters(path);
    pathParams.forEach(param => {
      properties[param] = {
        type: 'string',
        description: `Parâmetro de caminho: ${param}`,
      };
      required.push(param);
    });

    // Parâmetros de query, header, etc.
    if (operation.parameters && Array.isArray(operation.parameters)) {
      operation.parameters.forEach((param: any) => {
        if (param.in === 'query' || param.in === 'header') {
          const propName = param.name;
          properties[propName] = this.convertSchemaType(param.schema || { type: 'string' });
          properties[propName].description = param.description || `Parâmetro ${param.in}: ${propName}`;
          
          if (param.required) {
            required.push(propName);
          }
        }
      });
    }

    // Request body
    if (operation.requestBody && operation.requestBody.content) {
      const jsonContent = operation.requestBody.content['application/json'];
      if (jsonContent && jsonContent.schema) {
        if (jsonContent.schema.properties) {
          // Schema com propriedades específicas
          Object.entries(jsonContent.schema.properties).forEach(([key, schema]: [string, any]) => {
            properties[key] = this.convertSchemaType(schema);
          });

          if (jsonContent.schema.required && Array.isArray(jsonContent.schema.required)) {
            required.push(...jsonContent.schema.required);
          }
        } else {
          // Schema simples - aceitar como 'body'
          properties['body'] = this.convertSchemaType(jsonContent.schema);
          properties['body'].description = 'Corpo da requisição';
          if (operation.requestBody.required) {
            required.push('body');
          }
        }
      }
    }

    return {
      type: 'object',
      properties,
      required: required.length > 0 ? required : undefined,
      additionalProperties: false,
    };
  }

  private extractPathParameters(path: string): string[] {
    const matches = path.match(/{([^}]+)}/g);
    if (!matches) return [];
    
    return matches.map(match => match.slice(1, -1)); // Remove { }
  }

  private convertSchemaType(schema: any): any {
    if (!schema || typeof schema !== 'object') {
      return { type: 'string' };
    }

    const result: any = {};

    // Tipo básico
    if (schema.type) {
      result.type = schema.type;
    } else {
      result.type = 'string';
    }

    // Descrição
    if (schema.description) {
      result.description = schema.description;
    }

    // Enum
    if (schema.enum) {
      result.enum = schema.enum;
    }

    // Propriedades para objetos
    if (schema.type === 'object' && schema.properties) {
      result.properties = {};
      Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
        result.properties[key] = this.convertSchemaType(propSchema);
      });

      if (schema.required) {
        result.required = schema.required;
      }
    }

    // Itens para arrays
    if (schema.type === 'array' && schema.items) {
      result.items = this.convertSchemaType(schema.items);
    }

    // Constraints
    if (schema.minimum !== undefined) result.minimum = schema.minimum;
    if (schema.maximum !== undefined) result.maximum = schema.maximum;
    if (schema.minLength !== undefined) result.minLength = schema.minLength;
    if (schema.maxLength !== undefined) result.maxLength = schema.maxLength;
    if (schema.pattern) result.pattern = schema.pattern;

    return result;
  }

  private sanitizeToolName(name: string): string {
    // Limpar e padronizar nome da ferramenta
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Valida parâmetros de entrada contra o schema
   */
  validateParameters(tool: MCPTool, parameters: any): boolean {
    try {
      // Converter schema para Zod
      const zodSchema = this.convertToZodSchema(tool.inputSchema);
      zodSchema.parse(parameters);
      return true;
    } catch (error) {
      console.error('Erro de validação:', error);
      return false;
    }
  }

  private convertToZodSchema(schema: any): z.ZodSchema {
    if (!schema || typeof schema !== 'object') {
      return z.any();
    }

    switch (schema.type) {
      case 'string':
        let stringSchema = z.string();
        if (schema.minLength) stringSchema = stringSchema.min(schema.minLength);
        if (schema.maxLength) stringSchema = stringSchema.max(schema.maxLength);
        if (schema.pattern) stringSchema = stringSchema.regex(new RegExp(schema.pattern));
        if (schema.enum) return z.enum(schema.enum as [string, ...string[]]);
        return stringSchema;

      case 'number':
      case 'integer':
        let numberSchema = z.number();
        if (schema.minimum) numberSchema = numberSchema.min(schema.minimum);
        if (schema.maximum) numberSchema = numberSchema.max(schema.maximum);
        if (schema.type === 'integer') numberSchema = numberSchema.int();
        return numberSchema;

      case 'boolean':
        return z.boolean();

      case 'array':
        const itemSchema = schema.items ? this.convertToZodSchema(schema.items) : z.any();
        return z.array(itemSchema);

      case 'object':
        const shape: any = {};
        if (schema.properties) {
          Object.entries(schema.properties).forEach(([key, propSchema]: [string, any]) => {
            shape[key] = this.convertToZodSchema(propSchema);
          });
        }
        
        let objectSchema = z.object(shape);
        
        // Campos opcionais
        if (schema.required && Array.isArray(schema.required)) {
          const optionalShape: any = {};
          Object.keys(shape).forEach(key => {
            if (schema.required.includes(key)) {
              optionalShape[key] = shape[key];
            } else {
              optionalShape[key] = shape[key].optional();
            }
          });
          objectSchema = z.object(optionalShape);
        } else {
          // Todos opcionais
          const optionalShape: any = {};
          Object.keys(shape).forEach(key => {
            optionalShape[key] = shape[key].optional();
          });
          objectSchema = z.object(optionalShape);
        }

        if (!schema.additionalProperties) {
          objectSchema = objectSchema.strict() as any;
        }

        return objectSchema;

      default:
        return z.any();
    }
  }
}