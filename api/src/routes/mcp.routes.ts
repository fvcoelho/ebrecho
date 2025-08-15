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
 * @swagger
 * /api/mcp/tools:
 *   get:
 *     summary: List available AI copilot tools
 *     description: Get all available tools that the AI copilot can execute based on the API
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tools retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         tools:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               name:
 *                                 type: string
 *                                 description: Tool name
 *                               description:
 *                                 type: string
 *                                 description: Tool description
 *                               endpoint:
 *                                 type: object
 *                                 properties:
 *                                   method:
 *                                     type: string
 *                                     enum: [GET, POST, PUT, PATCH, DELETE]
 *                                   path:
 *                                     type: string
 *                               inputSchema:
 *                                 type: object
 *                                 description: JSON schema for tool parameters
 *                         count:
 *                           type: integer
 *                           description: Total number of available tools
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/mcp/execute:
 *   post:
 *     summary: Execute AI copilot tool
 *     description: Execute a specific tool available to the AI copilot
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - toolName
 *             properties:
 *               toolName:
 *                 type: string
 *                 description: Name of the tool to execute
 *                 example: getProducts
 *               parameters:
 *                 type: object
 *                 description: Parameters to pass to the tool
 *                 additionalProperties: true
 *                 example:
 *                   page: 1
 *                   limit: 10
 *                   category: "clothing"
 *     responses:
 *       200:
 *         description: Tool executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   description: Tool execution result
 *                 executionTime:
 *                   type: number
 *                   description: Execution time in milliseconds
 *                 error:
 *                   type: string
 *                   description: Error message if execution failed
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Tool not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Tool 'invalidTool' not found"
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/mcp/chat:
 *   post:
 *     summary: AI copilot chat
 *     description: Chat with the AI copilot that can execute tools and provide assistance
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message to the AI copilot
 *                 example: "Show me the latest products in my store"
 *               conversationId:
 *                 type: string
 *                 description: Optional conversation ID to maintain context
 *                 example: "conv_123456"
 *               context:
 *                 type: object
 *                 description: Additional context for the AI
 *                 properties:
 *                   userRole:
 *                     type: string
 *                     description: User role override
 *                     example: "PARTNER_ADMIN"
 *                   partnerId:
 *                     type: string
 *                     nullable: true
 *                     description: Partner ID for context
 *                   currentPage:
 *                     type: string
 *                     description: Current page/section in the app
 *                     example: "/dashboard/products"
 *     responses:
 *       200:
 *         description: Server-Sent Events stream with AI responses
 *         headers:
 *           Content-Type:
 *             schema:
 *               type: string
 *               example: text/event-stream
 *           Cache-Control:
 *             schema:
 *               type: string
 *               example: no-cache
 *           Connection:
 *             schema:
 *               type: string
 *               example: keep-alive
 *         content:
 *           text/event-stream:
 *             schema:
 *               type: string
 *               description: |
 *                 Stream of events including:
 *                 - start: Chat session started
 *                 - content: AI response content chunks
 *                 - tool_call_start: AI started calling a tool
 *                 - tool_executing: Tool is being executed
 *                 - tool_result: Tool execution result
 *                 - tool_error: Tool execution error
 *                 - end: Chat session ended
 *                 - error: Error occurred
 *               example: |
 *                 event: start
 *                 data: {"conversationId":"conv_123","message":"Show me products"}
 *                 
 *                 event: content
 *                 data: {"content":"I'll help you find products..."}
 *                 
 *                 event: tool_call_start
 *                 data: {"toolId":"call_1","toolName":"getProducts"}
 *                 
 *                 event: tool_result
 *                 data: {"toolName":"getProducts","success":true,"result":{...}}
 *                 
 *                 event: end
 *                 data: {"conversationId":"conv_123","message":"Here are your products..."}
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * @swagger
 * /api/mcp/health:
 *   get:
 *     summary: MCP service health check
 *     description: Check the health status of the AI copilot service components
 *     tags: [AI]
 *     responses:
 *       200:
 *         description: Health check successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         parser:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [ok, error]
 *                             toolsCount:
 *                               type: integer
 *                               description: Number of parsed tools
 *                         executor:
 *                           type: object
 *                           properties:
 *                             status:
 *                               type: string
 *                               enum: [ok, error]
 *                         ai:
 *                           type: object
 *                           properties:
 *                             provider:
 *                               type: string
 *                               example: OpenRouter
 *                             model:
 *                               type: string
 *                               example: anthropic/claude-3.5-sonnet
 *                             status:
 *                               type: string
 *                               enum: [configured, not_configured]
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *       500:
 *         description: Health check failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Health check failed
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
 * @swagger
 * /api/mcp/prompts:
 *   get:
 *     summary: List system prompts (Admin only)
 *     description: Get available system prompts used by the AI copilot
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Prompts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         prompts:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 description: Prompt identifier
 *                               name:
 *                                 type: string
 *                                 description: Prompt name
 *                               description:
 *                                 type: string
 *                                 description: Prompt description
 *                               category:
 *                                 type: string
 *                                 description: Prompt category
 *                               template:
 *                                 type: string
 *                                 description: Prompt template
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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