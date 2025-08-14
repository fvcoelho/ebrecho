import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdminRole } from '../middlewares/roles.middleware';
import { OpenAPIParser } from '../mcp/tools/openapi-parser';
import { ToolExecutor } from '../mcp/tools/tool-executor';
import { SystemPrompts } from '../mcp/prompts/system-prompt';
import { swaggerSpec } from '../config/swagger.config';

const router = Router();

// Inicializar componentes
const openaiClient = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://ebrecho.com.br',
    'X-Title': 'eBrecho AI Copilot'
  }
});

const parser = new OpenAPIParser();
const executor = new ToolExecutor();
const systemPrompts = new SystemPrompts();

// Schema de validação para chat
const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Mensagem é obrigatória'),
  conversationId: z.string().optional(),
  context: z.object({
    userRole: z.string().optional(),
    partnerId: z.string().nullable().optional(),
    currentPage: z.string().optional(),
  }).optional(),
});

// Schema de validação para execução de ferramenta
const ExecuteToolSchema = z.object({
  toolName: z.string().min(1, 'Nome da ferramenta é obrigatório'),
  parameters: z.record(z.any()).optional(),
});

/**
 * GET /api/mcp/tools
 * Lista todas as ferramentas disponíveis baseadas na API
 */
router.get('/tools', authMiddleware, async (req: Request, res: Response) => {
  try {
    const tools = await parser.generateTools(swaggerSpec);
    
    res.json({
      success: true,
      data: {
        tools: tools.map(tool => ({
          name: tool.name,
          description: tool.description,
          endpoint: {
            method: tool.endpoint.method,
            path: tool.endpoint.path,
          },
          inputSchema: tool.inputSchema,
        })),
        count: tools.length,
      },
    });
  } catch (error) {
    console.error('Erro ao listar ferramentas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao listar ferramentas',
    });
  }
});

/**
 * POST /api/mcp/execute
 * Executa uma ferramenta específica
 */
router.post('/execute', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { toolName, parameters } = ExecuteToolSchema.parse(req.body);
    
    // Buscar a ferramenta
    const tools = await parser.generateTools(swaggerSpec);
    const tool = tools.find(t => t.name === toolName);
    
    if (!tool) {
      return res.status(404).json({
        success: false,
        error: `Ferramenta '${toolName}' não encontrada`,
      });
    }

    // Adicionar token de autenticação aos parâmetros
    const authToken = req.headers.authorization;
    const execParameters = {
      ...parameters,
      authorization: authToken,
    };

    // Executar a ferramenta
    const result = await executor.executeTool(tool, execParameters);
    
    res.json({
      success: result.success,
      data: result.data,
      executionTime: result.executionTime,
      ...(result.error && { error: result.error }),
    });
  } catch (error) {
    console.error('Erro ao executar ferramenta:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno ao executar ferramenta',
    });
  }
});

/**
 * POST /api/mcp/chat
 * Endpoint principal do chat do copilot
 */
router.post('/chat', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { message, conversationId, context } = ChatRequestSchema.parse(req.body);
    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;
    
    // Definir configuração de stream
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Função para enviar eventos SSE
    const sendEvent = (event: string, data: any) => {
      console.log('📡 Sending SSE event:', event, 'with data:', data);
      res.write(`event: ${event}\\n`);
      res.write(`data: ${JSON.stringify(data)}\\n\\n`);
    };

    try {
      // Obter ferramentas disponíveis
      const tools = await parser.generateTools(swaggerSpec);
      
      // Preparar contexto do sistema
      const systemPrompt = systemPrompts.buildSystemPrompt({
        userRole: userRole || context?.userRole,
        partnerId: context?.partnerId,
        currentPage: context?.currentPage,
        availableTools: tools,
      });

      // Preparar mensagens
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ];

      // Converter ferramentas para formato OpenAI
      const openaiTools = tools.map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));

      sendEvent('start', { conversationId, message });

      // Chamar a IA com timeout
      console.log('🤖 Calling OpenRouter with model: anthropic/claude-3.5-sonnet');
      const response = await Promise.race([
        openaiClient.chat.completions.create({
          model: 'anthropic/claude-3.5-sonnet',
          messages,
          tools: openaiTools,
          tool_choice: 'auto',
          stream: true,
          temperature: 0.1,
          max_tokens: 2000,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('OpenRouter API timeout after 30 seconds')), 30000)
        )
      ]) as AsyncIterable<any>;

      let currentToolCall: any = null;
      let assistantMessage = '';

      console.log('🔄 Starting to process OpenRouter stream...');
      
      // Processar stream
      for await (const chunk of response) {
        console.log('📦 Received chunk:', chunk);
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          assistantMessage += delta.content;
          sendEvent('content', { content: delta.content });
        }

        if (delta?.tool_calls) {
          for (const toolCall of delta.tool_calls) {
            if (toolCall.id && toolCall.function?.name) {
              // Nova chamada de ferramenta
              currentToolCall = {
                id: toolCall.id,
                name: toolCall.function.name,
                arguments: toolCall.function.arguments || '',
              };
              sendEvent('tool_call_start', { 
                toolId: toolCall.id, 
                toolName: toolCall.function.name 
              });
            } else if (currentToolCall && toolCall.function?.arguments) {
              // Continuação dos argumentos
              currentToolCall.arguments += toolCall.function.arguments;
            }
          }
        }

        // Se a chamada de ferramenta está completa
        if (currentToolCall && chunk.choices[0]?.finish_reason === 'tool_calls') {
          try {
            const args = JSON.parse(currentToolCall.arguments);
            const tool = tools.find(t => t.name === currentToolCall.name);
            
            if (tool) {
              sendEvent('tool_executing', { 
                toolName: currentToolCall.name, 
                parameters: args 
              });

              // Adicionar autenticação
              const authToken = req.headers.authorization;
              const execParameters = { ...args, authorization: authToken };

              // Executar ferramenta
              const toolResult = await executor.executeTool(tool, execParameters);
              
              sendEvent('tool_result', {
                toolName: currentToolCall.name,
                success: toolResult.success,
                result: toolResult.data,
                executionTime: toolResult.executionTime,
                error: toolResult.error,
              });
            }
          } catch (error) {
            sendEvent('tool_error', {
              toolName: currentToolCall.name,
              error: 'Erro ao executar ferramenta',
            });
          }
          
          currentToolCall = null;
        }
      }

      sendEvent('end', { 
        conversationId,
        message: assistantMessage,
        timestamp: new Date().toISOString(),
      });

    } catch (aiError: any) {
      sendEvent('error', {
        error: 'Erro na IA',
        message: aiError.message,
      });
    }

    res.end();

  } catch (error) {
    console.error('Erro no chat do copilot:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados de entrada inválidos',
        details: error.errors,
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro interno no chat',
    });
  }
});

/**
 * GET /api/mcp/health
 * Health check do serviço MCP
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Testar parser
    const tools = await parser.generateTools(swaggerSpec);
    
    // Testar executor
    const healthCheck = await executor.healthCheck();
    
    res.json({
      success: true,
      data: {
        parser: { status: 'ok', toolsCount: tools.length },
        executor: { status: healthCheck.success ? 'ok' : 'error' },
        ai: { 
          provider: 'OpenRouter',
          model: 'anthropic/claude-3.5-sonnet',
          status: process.env.OPENROUTER_API_KEY ? 'configured' : 'not_configured',
        },
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Health check MCP falhou:', error);
    res.status(500).json({
      success: false,
      error: 'Health check falhou',
    });
  }
});

/**
 * GET /api/mcp/prompts
 * Lista os prompts do sistema (apenas admin)
 */
router.get('/prompts', authMiddleware, requireAdminRole, async (req: Request, res: Response) => {
  try {
    const prompts = systemPrompts.getAvailablePrompts();
    
    res.json({
      success: true,
      data: { prompts },
    });
  } catch (error) {
    console.error('Erro ao listar prompts:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno ao listar prompts',
    });
  }
});

export default router;