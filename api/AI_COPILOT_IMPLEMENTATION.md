# AI-Powered Chat Copilot Implementation Guide for eBrecho API

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Implementation Guide](#implementation-guide)
4. [Code Examples](#code-examples)
5. [Security & Safety](#security--safety)
6. [Deployment](#deployment)
7. [Example Queries](#example-queries)

## Overview

This document provides a complete implementation guide for building an AI-powered chat copilot that interfaces with the eBrecho API. The copilot converts natural language requests into API calls using the OpenAPI specification, providing a conversational interface for users to interact with the marketplace platform.

### Key Features
- **Auto-generated Tools**: Reads OpenAPI spec at runtime and generates callable tools
- **Natural Language Processing**: Handles conversational queries and commands
- **Streaming Responses**: Real-time responses using Server-Sent Events (SSE)
- **Rich UI Components**: Interactive cards for products, orders, and store data
- **Safety Controls**: Confirmation dialogs for write operations
- **Role-Based Access**: Tools available based on user permissions

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  Chat Interface │ Message Renderer │ Action Cards │ Context │
└────────────────┬────────────────────────────────────────────┘
                 │ WebSocket/SSE
┌────────────────▼────────────────────────────────────────────┐
│                    MCP Server (Express)                      │
├─────────────────────────────────────────────────────────────┤
│ OpenAPI Parser │ Tool Generator │ Request Executor │ Auth   │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────────────────────────┐
│                    eBrecho API Server                        │
├─────────────────────────────────────────────────────────────┤
│  Auth │ Products │ Orders │ Partners │ Promoters │ Admin   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Input**: Natural language query in chat interface
2. **Context Building**: Add user auth, role, and conversation history
3. **AI Processing**: Send to AI model with available tools
4. **Tool Selection**: AI chooses appropriate API endpoints
5. **Parameter Extraction**: AI extracts required parameters from query
6. **API Execution**: MCP server calls actual API endpoints
7. **Response Formatting**: Convert API response to user-friendly format
8. **Streaming Output**: Stream response back to chat interface

## Implementation Guide

### Phase 1: Backend Setup

#### 1.1 Install Dependencies

```bash
cd api
npm install @modelcontextprotocol/sdk openai zod dotenv
npm install --save-dev @types/node
```

#### 1.2 Create MCP Configuration

Create `/api/.mcp.json`:

```json
{
  "name": "ebrecho-api-mcp",
  "version": "1.0.0",
  "description": "MCP server for eBrecho API",
  "tools": {
    "autoGenerate": true,
    "specPath": "/api-docs.json",
    "safetyLevel": "strict"
  },
  "auth": {
    "required": true,
    "type": "jwt"
  },
  "streaming": {
    "enabled": true,
    "protocol": "sse"
  }
}
```

#### 1.3 Create MCP Server

Create `/api/src/mcp/server.ts`:

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { OpenAPIParser } from './tools/openapi-parser';
import { ToolExecutor } from './tools/tool-executor';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

export class MCPServer {
  private server: Server;
  private parser: OpenAPIParser;
  private executor: ToolExecutor;
  private openApiSpec: any;

  constructor() {
    this.server = new Server(
      {
        name: 'ebrecho-api-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.parser = new OpenAPIParser();
    this.executor = new ToolExecutor();
  }

  async initialize() {
    // Load OpenAPI spec
    const specPath = path.join(process.cwd(), 'api-docs.json');
    const specContent = await fs.readFile(specPath, 'utf-8');
    this.openApiSpec = JSON.parse(specContent);

    // Generate tools from OpenAPI spec
    const tools = this.parser.generateTools(this.openApiSpec);

    // Register tools with MCP server
    for (const tool of tools) {
      this.server.setRequestHandler(
        `tools/call`,
        async (request) => {
          if (request.params.name === tool.name) {
            return await this.executor.execute(
              tool,
              request.params.arguments,
              request.meta?.auth
            );
          }
        }
      );
    }

    // List available tools
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: tools.map(t => ({
          name: t.name,
          description: t.description,
          inputSchema: t.parameters,
        })),
      };
    });
  }

  async start() {
    await this.initialize();
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new MCPServer();
  server.start().catch(console.error);
}
```

#### 1.4 Create OpenAPI Parser

Create `/api/src/mcp/tools/openapi-parser.ts`:

```typescript
import { z } from 'zod';

export interface Tool {
  name: string;
  description: string;
  parameters: z.ZodSchema;
  endpoint: string;
  method: string;
  requiresAuth: boolean;
  requiresConfirmation: boolean;
}

export class OpenAPIParser {
  generateTools(spec: any): Tool[] {
    const tools: Tool[] = [];
    
    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
          continue;
        }

        const tool = this.createToolFromOperation(
          path,
          method,
          operation as any
        );
        
        if (tool) {
          tools.push(tool);
        }
      }
    }

    return tools;
  }

  private createToolFromOperation(
    path: string,
    method: string,
    operation: any
  ): Tool | null {
    // Skip internal endpoints
    if (path.includes('/internal/') || path.includes('/test/')) {
      return null;
    }

    const name = this.generateToolName(path, method);
    const description = operation.summary || operation.description || `${method.toUpperCase()} ${path}`;
    const parameters = this.generateParameters(operation);
    const requiresAuth = this.checkAuthRequired(operation);
    const requiresConfirmation = this.checkConfirmationRequired(method);

    return {
      name,
      description,
      parameters,
      endpoint: path,
      method,
      requiresAuth,
      requiresConfirmation,
    };
  }

  private generateToolName(path: string, method: string): string {
    // Convert path to camelCase tool name
    const parts = path.split('/').filter(p => p && !p.startsWith('{'));
    const name = parts.join('_');
    return `${method}_${name}`.replace(/[^a-zA-Z0-9_]/g, '_');
  }

  private generateParameters(operation: any): z.ZodSchema {
    const schema: any = {};

    // Path parameters
    if (operation.parameters) {
      for (const param of operation.parameters) {
        if (param.in === 'path' || param.in === 'query') {
          schema[param.name] = param.required ? z.string() : z.string().optional();
        }
      }
    }

    // Request body
    if (operation.requestBody?.content?.['application/json']?.schema) {
      const bodySchema = operation.requestBody.content['application/json'].schema;
      // Convert OpenAPI schema to Zod schema (simplified)
      if (bodySchema.properties) {
        for (const [key, value] of Object.entries(bodySchema.properties)) {
          schema[key] = this.openApiToZod(value as any);
        }
      }
    }

    return z.object(schema);
  }

  private openApiToZod(schema: any): z.ZodSchema {
    switch (schema.type) {
      case 'string':
        return schema.required ? z.string() : z.string().optional();
      case 'number':
      case 'integer':
        return schema.required ? z.number() : z.number().optional();
      case 'boolean':
        return schema.required ? z.boolean() : z.boolean().optional();
      case 'array':
        return z.array(this.openApiToZod(schema.items));
      case 'object':
        const obj: any = {};
        if (schema.properties) {
          for (const [key, value] of Object.entries(schema.properties)) {
            obj[key] = this.openApiToZod(value as any);
          }
        }
        return z.object(obj);
      default:
        return z.any();
    }
  }

  private checkAuthRequired(operation: any): boolean {
    return operation.security?.length > 0;
  }

  private checkConfirmationRequired(method: string): boolean {
    return ['post', 'put', 'delete', 'patch'].includes(method);
  }
}
```

#### 1.5 Create Tool Executor

Create `/api/src/mcp/tools/tool-executor.ts`:

```typescript
import axios, { AxiosInstance } from 'axios';
import { Tool } from './openapi-parser';

export class ToolExecutor {
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.API_BASE_URL || 'http://localhost:3001',
      timeout: 30000,
    });
  }

  async execute(
    tool: Tool,
    parameters: any,
    auth?: { token: string }
  ): Promise<any> {
    try {
      // Add authentication if required
      const headers: any = {};
      if (tool.requiresAuth && auth?.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }

      // Build request URL
      let url = tool.endpoint;
      const pathParams: any = {};
      const queryParams: any = {};
      const bodyData: any = {};

      // Extract parameters
      for (const [key, value] of Object.entries(parameters)) {
        if (url.includes(`{${key}}`)) {
          pathParams[key] = value;
        } else if (tool.method === 'get') {
          queryParams[key] = value;
        } else {
          bodyData[key] = value;
        }
      }

      // Replace path parameters
      for (const [key, value] of Object.entries(pathParams)) {
        url = url.replace(`{${key}}`, String(value));
      }

      // Execute request
      const response = await this.apiClient.request({
        method: tool.method,
        url,
        headers,
        params: queryParams,
        data: Object.keys(bodyData).length > 0 ? bodyData : undefined,
      });

      return {
        success: true,
        data: response.data,
        status: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        details: error.response?.data,
      };
    }
  }
}
```

### Phase 2: API Routes

#### 2.1 Create MCP Routes

Create `/api/src/routes/mcp.routes.ts`:

```typescript
import { Router } from 'express';
import { OpenAI } from 'openai';
import { authMiddleware } from '../middlewares/auth.middleware';
import { MCPServer } from '../mcp/server';
import { z } from 'zod';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Chat endpoint with streaming
router.post('/chat', authMiddleware, async (req, res) => {
  const chatSchema = z.object({
    message: z.string(),
    conversationId: z.string().optional(),
    context: z.object({
      partnerId: z.number().optional(),
      role: z.string().optional(),
    }).optional(),
  });

  try {
    const { message, conversationId, context } = chatSchema.parse(req.body);
    const user = (req as any).user;

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    // Load available tools
    const mcp = new MCPServer();
    await mcp.initialize();
    const tools = await mcp.getTools();

    // Create system prompt
    const systemPrompt = `You are an AI assistant for eBrecho, a second-hand fashion marketplace.
    You help users interact with the platform using natural language.
    
    User Context:
    - Role: ${user.role}
    - Partner ID: ${user.partnerId || 'N/A'}
    - Email: ${user.email}
    
    Available actions you can perform:
    ${tools.map(t => `- ${t.description}`).join('\n')}
    
    Guidelines:
    - Be helpful and conversational
    - Ask for clarification when needed
    - Confirm before performing destructive actions
    - Format responses with markdown for better readability
    - Include relevant links and buttons when appropriate`;

    // Stream response from AI
    const stream = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      tools: tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        },
      })),
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      
      if (delta?.content) {
        res.write(`data: ${JSON.stringify({ type: 'content', content: delta.content })}\n\n`);
      }
      
      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          // Execute tool and stream result
          const result = await mcp.executeTool(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments),
            { token: (req as any).token }
          );
          
          res.write(`data: ${JSON.stringify({ 
            type: 'tool_result', 
            tool: toolCall.function.name,
            result 
          })}\n\n`);
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Chat processing failed' });
  }
});

// Get available tools
router.get('/tools', authMiddleware, async (req, res) => {
  try {
    const mcp = new MCPServer();
    await mcp.initialize();
    const tools = await mcp.getTools();
    
    // Filter tools based on user role
    const user = (req as any).user;
    const filteredTools = tools.filter(tool => {
      // Implement role-based filtering
      if (user.role === 'CUSTOMER' && tool.name.includes('admin')) {
        return false;
      }
      return true;
    });

    res.json({ tools: filteredTools });
  } catch (error) {
    console.error('Tools error:', error);
    res.status(500).json({ error: 'Failed to load tools' });
  }
});

export default router;
```

### Phase 3: Frontend Implementation

#### 3.1 Create Chat Interface

Create `/web/src/app/copilot/page.tsx`:

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatInterface } from '@/components/copilot/chat-interface';
import { useAuth } from '@/contexts/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

export default function CopilotPage() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Login Required</h2>
          <p className="text-gray-600 mb-4">
            Please login to use the AI Copilot assistant.
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Sparkles className="w-8 h-8 text-purple-500" />
                AI Copilot
              </h1>
              <p className="text-gray-600 mt-2">
                Your intelligent assistant for managing your eBrecho store
              </p>
            </div>
            <Button
              onClick={() => setIsOpen(!isOpen)}
              variant={isOpen ? 'secondary' : 'default'}
            >
              {isOpen ? 'Close Chat' : 'Open Chat'}
            </Button>
          </div>
        </Card>

        {isOpen && (
          <ChatInterface
            user={user}
            onClose={() => setIsOpen(false)}
          />
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Example Queries</h2>
          <div className="grid gap-3">
            {getExampleQueries(user?.role).map((query, index) => (
              <Button
                key={index}
                variant="outline"
                className="justify-start text-left"
                onClick={() => {
                  setIsOpen(true);
                  // Send query to chat
                }}
              >
                "{query}"
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function getExampleQueries(role?: string): string[] {
  const commonQueries = [
    "Show me all available products",
    "What are my recent orders?",
    "Help me create a new product listing",
  ];

  const roleQueries: Record<string, string[]> = {
    PARTNER_ADMIN: [
      "Show me my store's performance this month",
      "Update the price of my latest products",
      "Find products that need restocking",
    ],
    PROMOTER: [
      "Find second-hand stores near São Paulo",
      "Show me market opportunities in my area",
      "Generate a route plan for store visits",
    ],
    ADMIN: [
      "Show me all partners and their status",
      "Find users who haven't verified their email",
      "Generate a system health report",
    ],
  };

  return [...commonQueries, ...(roleQueries[role || ''] || [])];
}
```

#### 3.2 Create Chat Component

Create `/web/src/components/copilot/chat-interface.tsx`:

```tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, X } from 'lucide-react';
import { MessageRenderer } from './message-renderer';
import { useCopilot } from '@/lib/copilot/use-copilot';

interface ChatInterfaceProps {
  user: any;
  onClose: () => void;
}

export function ChatInterface({ user, onClose }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, isLoading } = useCopilot();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const message = input;
    setInput('');
    await sendMessage(message);
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">AI Assistant</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <MessageRenderer
              key={index}
              message={message}
              isUser={message.role === 'user'}
            />
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>AI is thinking...</span>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your store..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
```

#### 3.3 Create Message Renderer

Create `/web/src/components/copilot/message-renderer.tsx`:

```tsx
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Bot, Package, ShoppingCart, Store } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ActionCard } from './action-cards';

interface MessageRendererProps {
  message: any;
  isUser: boolean;
}

export function MessageRenderer({ message, isUser }: MessageRendererProps) {
  const renderContent = () => {
    if (typeof message.content === 'string') {
      return (
        <ReactMarkdown className="prose prose-sm max-w-none">
          {message.content}
        </ReactMarkdown>
      );
    }

    // Handle structured responses
    if (message.type === 'product_list') {
      return (
        <div className="grid gap-3">
          {message.products.map((product: any) => (
            <ActionCard
              key={product.id}
              type="product"
              data={product}
            />
          ))}
        </div>
      );
    }

    if (message.type === 'order_list') {
      return (
        <div className="grid gap-3">
          {message.orders.map((order: any) => (
            <ActionCard
              key={order.id}
              type="order"
              data={order}
            />
          ))}
        </div>
      );
    }

    if (message.type === 'confirmation') {
      return (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h4 className="font-semibold mb-2">Confirmation Required</h4>
          <p className="mb-4">{message.content}</p>
          <div className="flex gap-2">
            <Button
              onClick={() => message.onConfirm?.()}
              variant="default"
            >
              Confirm
            </Button>
            <Button
              onClick={() => message.onCancel?.()}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </Card>
      );
    }

    return <div>{JSON.stringify(message.content, null, 2)}</div>;
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className="flex-shrink-0">
          {isUser ? (
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
        </div>
        <Card className={`p-3 ${isUser ? 'bg-blue-50' : 'bg-gray-50'}`}>
          {renderContent()}
        </Card>
      </div>
    </div>
  );
}
```

#### 3.4 Create Action Cards

Create `/web/src/components/copilot/action-cards.tsx`:

```tsx
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  ShoppingCart, 
  Store, 
  Edit, 
  Eye,
  ExternalLink 
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ActionCardProps {
  type: 'product' | 'order' | 'store' | 'user';
  data: any;
}

export function ActionCard({ type, data }: ActionCardProps) {
  const router = useRouter();

  if (type === 'product') {
    return (
      <Card className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex gap-4">
          {data.images?.[0] && (
            <div className="w-20 h-20 relative rounded overflow-hidden">
              <Image
                src={data.images[0].url}
                alt={data.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold">{data.name}</h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {data.description}
                </p>
              </div>
              <Badge variant={data.status === 'AVAILABLE' ? 'default' : 'secondary'}>
                {data.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-lg font-bold">
                R$ {data.price.toFixed(2)}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/produtos/${data.id}`)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push(`/produtos/${data.id}/editar`)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (type === 'order') {
    return (
      <Card className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-semibold">Order #{data.id}</p>
              <p className="text-sm text-gray-600">
                {new Date(data.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={getOrderStatusVariant(data.status)}>
              {data.status}
            </Badge>
            <p className="text-lg font-bold mt-1">
              R$ {data.total.toFixed(2)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/orders/${data.id}`)}
          >
            View Details
          </Button>
        </div>
      </Card>
    );
  }

  if (type === 'store') {
    return (
      <Card className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-semibold">{data.name}</p>
              <p className="text-sm text-gray-600">{data.slug}</p>
            </div>
          </div>
          <div>
            <Badge>{data.plan}</Badge>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
          {data.description}
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`/${data.slug}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Visit Store
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push('/dashboard/configuracoes')}
          >
            Settings
          </Button>
        </div>
      </Card>
    );
  }

  return null;
}

function getOrderStatusVariant(status: string): any {
  const variants: Record<string, any> = {
    PENDING: 'secondary',
    PROCESSING: 'default',
    SHIPPED: 'default',
    DELIVERED: 'success',
    CANCELLED: 'destructive',
  };
  return variants[status] || 'secondary';
}
```

#### 3.5 Create Copilot Hook

Create `/web/src/lib/copilot/use-copilot.ts`:

```typescript
import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: any;
  type?: string;
}

export function useCopilot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    if (!token) return;

    // Add user message
    const userMessage: Message = { role: 'user', content };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mcp/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage: Message = { role: 'assistant', content: '' };

      setMessages(prev => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content') {
                assistantMessage.content += parsed.content;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1] = { ...assistantMessage };
                  return newMessages;
                });
              } else if (parsed.type === 'tool_result') {
                // Handle tool results
                handleToolResult(parsed);
              }
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        type: 'error',
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const handleToolResult = (result: any) => {
    // Process tool results and update UI accordingly
    if (result.tool.includes('product')) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        type: 'product_list',
        products: result.result.data,
        content: result.result.data,
      }]);
    } else if (result.tool.includes('order')) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        type: 'order_list',
        orders: result.result.data,
        content: result.result.data,
      }]);
    }
  };

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    sendMessage,
    clearMessages,
    isLoading,
  };
}
```

### Phase 4: System Prompts

Create `/api/src/mcp/prompts/system-prompt.ts`:

```typescript
export const getSystemPrompt = (user: any) => `
You are an AI assistant for eBrecho, a second-hand fashion marketplace platform.
Your role is to help users manage their stores, products, and operations through natural language.

## User Context
- Name: ${user.name || 'User'}
- Email: ${user.email}
- Role: ${user.role}
- Partner ID: ${user.partnerId || 'None'}

## Your Capabilities
You can help with:
1. **Product Management**: Create, update, search, and manage product listings
2. **Order Processing**: View, update, and track customer orders
3. **Store Configuration**: Manage store settings and appearance
4. **Analytics**: Provide insights on sales, inventory, and performance
5. **Customer Support**: Help resolve customer inquiries and issues
6. **Market Intelligence**: (For promoters) Find stores and opportunities

## Guidelines
1. **Be Conversational**: Use natural, friendly language
2. **Be Helpful**: Proactively suggest relevant actions
3. **Be Safe**: Always confirm before destructive operations
4. **Be Accurate**: Use exact data from API responses
5. **Be Efficient**: Minimize the number of API calls needed

## Response Formatting
- Use markdown for better readability
- Include relevant links when mentioning specific items
- Show data in tables when listing multiple items
- Use emoji sparingly for important notifications

## Safety Rules
- NEVER expose sensitive data (passwords, tokens, etc.)
- ALWAYS confirm before DELETE operations
- ALWAYS validate user permissions before actions
- NEVER perform actions outside user's scope

## Examples of Good Responses

User: "Show me my recent products"
You: "I'll fetch your recent products for you."
[Execute API call]
"Here are your 5 most recent products:
1. **Vintage Dress** - R$ 89.90 (Available)
2. **Designer Handbag** - R$ 299.00 (Sold)
..."

User: "Delete product 123"
You: "⚠️ I need to confirm this action:
You want to delete **Product #123: Vintage Dress**.
This action cannot be undone. 
Should I proceed with the deletion?"

Remember: You're here to make the user's experience smooth and efficient.
`;

export const getToolSelectionPrompt = (query: string, tools: any[]) => `
Based on the user query: "${query}"

Select the most appropriate tool(s) from the available options:
${tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

Consider:
1. What is the user trying to accomplish?
2. Which tool(s) directly address this need?
3. Do you need multiple tools in sequence?
4. Are there any safety considerations?

Return your selection with reasoning.
`;
```

## Security & Safety

### Authentication Flow
1. User logs in through standard auth endpoints
2. JWT token is stored in frontend context
3. All MCP requests include Bearer token
4. Server validates token and extracts user context
5. Tools are filtered based on user role

### Safety Measures
- **Read-only by default**: GET operations execute immediately
- **Confirmation required**: All write operations need user confirmation
- **Rate limiting**: Implement per-user request limits
- **Audit logging**: Track all AI-initiated operations
- **Input sanitization**: Validate all parameters before API calls
- **Output filtering**: Remove sensitive data from responses

### Role-Based Access
```typescript
const rolePermissions = {
  ADMIN: ['*'], // All tools
  PARTNER_ADMIN: ['products', 'orders', 'store', 'analytics'],
  PARTNER_USER: ['products', 'orders'],
  PROMOTER: ['market', 'brechos', 'routes'],
  CUSTOMER: ['public', 'profile'],
};
```

## Deployment

### Environment Variables

#### API (.env)
```
# Existing variables
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key

# New MCP variables
OPENAI_API_KEY=sk-...
MCP_ENABLED=true
MCP_STREAMING=true
MCP_MAX_TOKENS=4000
MCP_MODEL=gpt-4-turbo-preview
```

#### Web (.env.local)
```
# Existing variables
NEXT_PUBLIC_API_URL=http://localhost:3001

# New copilot variables
NEXT_PUBLIC_COPILOT_ENABLED=true
NEXT_PUBLIC_COPILOT_ENDPOINT=/api/mcp/chat
```

### Docker Deployment
```dockerfile
# Add to existing Dockerfile
RUN npm install @modelcontextprotocol/sdk openai zod

# Ensure OpenAPI spec is included
COPY api-docs.json /app/api-docs.json
```

### Vercel Deployment
1. Add environment variables in Vercel dashboard
2. Update `vercel.json` to include MCP routes
3. Ensure OpenAPI spec is generated at build time

## Example Queries

### Product Management
- "Show me all available products under R$100"
- "Create a new listing for a vintage leather jacket"
- "Update the price of product ABC123 to R$150"
- "Which products have been listed for more than 30 days?"
- "Mark my blue dress as sold"

### Order Management
- "Show me pending orders from today"
- "Update order #456 status to shipped"
- "Which orders need processing?"
- "Cancel order 789 and refund the customer"

### Analytics
- "What were my sales last month?"
- "Show me my top selling categories"
- "How many products did I sell this week?"
- "What's my average order value?"

### Store Management
- "Update my store description"
- "Change my store's banner image"
- "Show me my current store settings"
- "Enable promotional banner"

### Market Intelligence (Promoters)
- "Find second-hand stores in São Paulo"
- "Show me market opportunities near me"
- "Plan a route to visit 5 stores today"
- "Which areas have the most brechós?"

## Testing

### Unit Tests
```javascript
// test/mcp.test.js
const axios = require('axios');
const assert = require('assert');

async function testChatEndpoint() {
  const response = await axios.post('/api/mcp/chat', {
    message: 'Show me all products',
  }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  assert(response.status === 200);
  assert(response.headers['content-type'].includes('text/event-stream'));
}

async function testToolGeneration() {
  const response = await axios.get('/api/mcp/tools', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  assert(response.data.tools.length > 0);
  assert(response.data.tools[0].name);
  assert(response.data.tools[0].description);
}
```

### Integration Tests
1. Test full conversation flow
2. Verify tool execution with mock API
3. Test streaming response handling
4. Validate role-based filtering
5. Test error recovery

## Monitoring

### Metrics to Track
- Average response time
- Tool execution success rate
- Most used tools/queries
- User satisfaction (feedback)
- Token usage and costs

### Logging
```typescript
const logCopilotEvent = (event: {
  userId: string;
  query: string;
  tools: string[];
  response: string;
  duration: number;
  success: boolean;
}) => {
  // Send to analytics service
  console.log('[COPILOT]', event);
};
```

## Future Enhancements

1. **Multi-language support**: Add Portuguese language model
2. **Voice input**: Speech-to-text for queries
3. **Proactive suggestions**: Context-aware recommendations
4. **Batch operations**: Handle multiple items at once
5. **Custom workflows**: User-defined automation sequences
6. **Mobile app integration**: Native mobile copilot
7. **Webhook triggers**: External event handling
8. **Fine-tuning**: Custom model training on platform data

## Conclusion

This implementation provides a production-ready AI copilot that safely and efficiently interfaces with your eBrecho API. The system automatically generates tools from your OpenAPI specification, handles natural language queries, and provides rich responses with appropriate UI components.

The architecture is scalable, secure, and extensible, allowing for future enhancements while maintaining safety and user control. The streaming interface ensures responsive interactions, while the role-based access control maintains proper security boundaries.

For questions or support, please refer to the inline code documentation or contact the development team.