import express from 'express';
import { ebrechoMcpServer } from '../mcp/server.js';
import { mcpAuthMiddleware, mcpRequireRole } from '../mcp/middleware/mcp-auth.middleware.js';

interface AuthenticatedRequest extends express.Request {
  mcpSession?: {
    authenticated: boolean;
    userId?: string;
    role?: string;
    partnerId?: string;
  };
}

const router = express.Router();

// MCP Server Information
router.get('/info', (req, res) => {
  res.json({
    name: 'ebrecho-mcp-server',
    version: '1.0.0',
    description: 'Model Context Protocol server for eBrecho fashion marketplace',
    capabilities: {
      resources: {
        'ebrecho://partners': 'List of partner stores',
        'ebrecho://products': 'Product catalog',
        'ebrecho://analytics/summary': 'Marketplace analytics'
      },
      tools: {
        'search-stores': 'Search partner stores',
        'search-products': 'Search products with filters',
        'get-store-analytics': 'Get store performance metrics'
      },
      prompts: {
        'analyze-store-performance': 'Store performance analysis template',
        'recommend-products': 'Product recommendation template',
        'market-research': 'Market research analysis template'
      }
    },
    endpoints: {
      resources: '/api/mcp/resources',
      tools: '/api/mcp/tools',
      prompts: '/api/mcp/prompts'
    }
  });
});

// MCP Resources endpoints
router.get('/resources', mcpAuthMiddleware, async (req, res) => {
  try {
    const result = await ebrechoMcpServer.handleListResources();
    res.json(result);
  } catch (error) {
    console.error('MCP resources list error:', error);
    res.status(500).json({ 
      error: 'Failed to list MCP resources',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.get('/resources/:resourceId', mcpAuthMiddleware, async (req, res) => {
  try {
    const { resourceId } = req.params;
    const uri = `ebrecho://${resourceId}`;
    
    const result = await ebrechoMcpServer.handleGetResource({ params: { uri } } as any);
    res.json(result);
  } catch (error) {
    console.error('MCP resource read error:', error);
    res.status(500).json({ 
      error: 'Failed to read MCP resource',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// MCP Tools endpoints
router.get('/tools', mcpAuthMiddleware, async (req, res) => {
  try {
    const result = await ebrechoMcpServer.handleListTools();
    
    res.json(result);
  } catch (error) {
    console.error('MCP tools list error:', error);
    res.status(500).json({ 
      error: 'Failed to list MCP tools',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/tools/:toolName/call', mcpAuthMiddleware, async (req, res) => {
  try {
    const { toolName } = req.params;
    const { arguments: toolArgs } = req.body;
    
    // Some tools might require authentication
    if (toolName === 'get-store-analytics') {
      if (!(req as AuthenticatedRequest).mcpSession?.authenticated) {
        return res.status(401).json({
          error: 'Authentication required for store analytics'
        });
      }
    }
    
    const result = await ebrechoMcpServer.handleCallTool({
      params: {
        name: toolName,
        arguments: toolArgs || {}
      }
    } as any);
    
    res.json(result);
  } catch (error) {
    console.error('MCP tool call error:', error);
    res.status(500).json({ 
      error: 'Failed to execute MCP tool',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// MCP Prompts endpoints
router.get('/prompts', mcpAuthMiddleware, async (req, res) => {
  try {
    const result = await ebrechoMcpServer.handleListPrompts();
    
    res.json(result);
  } catch (error) {
    console.error('MCP prompts list error:', error);
    res.status(500).json({ 
      error: 'Failed to list MCP prompts',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

router.post('/prompts/:promptName', mcpAuthMiddleware, async (req, res) => {
  try {
    const { promptName } = req.params;
    const { arguments: promptArgs } = req.body;
    
    const result = await ebrechoMcpServer.handleGetPrompt({
      params: {
        name: promptName,
        arguments: promptArgs || {}
      }
    });
    
    res.json(result);
  } catch (error) {
    console.error('MCP prompt get error:', error);
    res.status(500).json({ 
      error: 'Failed to get MCP prompt',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check for MCP server
router.get('/health', (req, res) => {
  try {
    const mcpServer = ebrechoMcpServer.getMcpServer();
    res.json({
      status: 'healthy',
      server: 'ebrecho-mcp-server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      capabilities: ['resources', 'tools', 'prompts']
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;