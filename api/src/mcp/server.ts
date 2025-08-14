import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { OpenAPIParser } from './tools/openapi-parser.js';
import { ToolExecutor } from './tools/tool-executor.js';
import { SystemPrompts } from './prompts/system-prompt.js';
import { swaggerSpec } from '../config/swagger.config.js';

export class MCPServer {
  private server: Server;
  private parser: OpenAPIParser;
  private executor: ToolExecutor;
  private systemPrompts: SystemPrompts;

  constructor() {
    this.server = new Server(
      {
        name: 'ebrecho-api-copilot',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
        },
      }
    );

    this.parser = new OpenAPIParser();
    this.executor = new ToolExecutor();
    this.systemPrompts = new SystemPrompts();

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // Handler para listar ferramentas disponíveis
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = await this.parser.generateTools(swaggerSpec);
      return {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Handler para executar ferramentas
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Buscar a ferramenta correspondente
        const tools = await this.parser.generateTools(swaggerSpec);
        const tool = tools.find(t => t.name === name);
        
        if (!tool) {
          throw new Error(`Ferramenta '${name}' não encontrada`);
        }

        // Executar a ferramenta
        const result = await this.executor.executeTool(tool, args);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        return {
          content: [
            {
              type: 'text',
              text: `Erro ao executar ferramenta '${name}': ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  public async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.log('🤖 MCP Server eBrecho iniciado');
    console.log('📡 Aguardando conexões...');
  }

  public async stop(): Promise<void> {
    await this.server.close();
    console.log('🛑 MCP Server parado');
  }
}

// Criar e iniciar o servidor se executado diretamente
if (require.main === module) {
  const server = new MCPServer();
  
  server.start().catch((error) => {
    console.error('❌ Erro ao iniciar MCP Server:', error);
    process.exit(1);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\\n🛑 Parando servidor...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\\n🛑 Parando servidor...');
    await server.stop();
    process.exit(0);
  });
}

export default MCPServer;