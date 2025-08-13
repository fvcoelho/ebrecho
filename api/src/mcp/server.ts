import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequest, ReadResourceRequest, ListResourcesRequest, ListToolsRequest, Resource } from '@modelcontextprotocol/sdk/types.js';
import express from 'express';
import { prisma } from '../prisma/index.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

export class EbrechoMcpServer {
  private server: McpServer;
  private app: express.Application;

  constructor() {
    this.server = new McpServer(
      {
        name: 'ebrecho-mcp-server',
        version: '1.0.0',
        description: 'MCP server for eBrecho fashion marketplace'
      },
      {
        capabilities: {
          resources: {},
          tools: {},
          prompts: {}
        }
      }
    );
    
    this.app = express();
    this.initializeHandlers();
  }

  private initializeHandlers() {
    // Handlers are called directly from routes instead of through MCP server
    // This approach provides more flexibility for Express integration
  }

  public async handleListResources() {
    const resources = [
      {
        uri: 'ebrecho://partners',
        name: 'Partner Stores',
        description: 'List of all partner stores in the marketplace',
        mimeType: 'application/json'
      },
      {
        uri: 'ebrecho://products',
        name: 'Product Catalog',
        description: 'Complete product catalog across all stores',
        mimeType: 'application/json'
      },
      {
        uri: 'ebrecho://analytics/summary',
        name: 'Marketplace Analytics',
        description: 'High-level marketplace statistics and metrics',
        mimeType: 'application/json'
      }
    ];

    return { resources };
  }

  public async handleGetResource(request: ReadResourceRequest) {
    const { uri } = request.params;

    try {
      switch (uri) {
        case 'ebrecho://partners': {
          const partners = await prisma.partner.findMany({
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              logo: true,
              publicBanner: true,
              phone: true,
              email: true,
              publicEmail: true,
              whatsappNumber: true,
              isActive: true,
              createdAt: true,
              _count: {
                select: {
                  products: true,
                  users: true
                }
              }
            }
          });

          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(partners, null, 2)
            }]
          };
        }

        case 'ebrecho://products': {
          const products = await prisma.product.findMany({
            where: { status: 'AVAILABLE' },
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              price: true,
              category: true,
              brand: true,
              size: true,
              color: true,
              condition: true,
              status: true,
              createdAt: true,
              partner: {
                select: {
                  name: true,
                  slug: true
                }
              }
            },
            take: 100,
            orderBy: { createdAt: 'desc' }
          });

          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(products, null, 2)
            }]
          };
        }

        case 'ebrecho://analytics/summary': {
          const [totalPartners, totalProducts, totalUsers] = await Promise.all([
            prisma.partner.count({ where: { isActive: true } }),
            prisma.product.count({ where: { status: 'AVAILABLE' } }),
            prisma.user.count()
          ]);

          const analytics = {
            marketplace: {
              totalPartners,
              totalProducts,
              totalUsers,
              generatedAt: new Date().toISOString()
            },
            categories: await prisma.product.groupBy({
              by: ['category'],
              where: { status: 'AVAILABLE' },
              _count: { category: true }
            })
          };

          return {
            contents: [{
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(analytics, null, 2)
            }]
          };
        }

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    } catch (error) {
      throw new Error(`Failed to get resource ${uri}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async handleListTools() {
    const tools = [
      {
        name: 'search-stores',
        description: 'Search for partner stores by name, location, or category',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for store name or description'
            },
            location: {
              type: 'string',
              description: 'Filter by location/address'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'search-products',
        description: 'Search for products across all stores with advanced filters',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query for product name, brand, or description'
            },
            category: {
              type: 'string',
              description: 'Filter by product category'
            },
            priceMin: {
              type: 'number',
              description: 'Minimum price filter'
            },
            priceMax: {
              type: 'number',
              description: 'Maximum price filter'
            },
            partnerId: {
              type: 'string',
              description: 'Filter by specific partner/store'
            }
          },
          required: ['query']
        }
      },
      {
        name: 'get-store-analytics',
        description: 'Get analytics for a specific store including product counts, categories, and performance metrics',
        inputSchema: {
          type: 'object',
          properties: {
            partnerId: {
              type: 'string',
              description: 'Partner/store ID to analyze'
            }
          },
          required: ['partnerId']
        }
      }
    ];

    return { tools };
  }

  public async handleCallTool(request: CallToolRequest) {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'search-stores': {
          const { query, location } = args as { query: string; location?: string };
          
          const whereClause: any = {
            isActive: true,
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          };

          if (location) {
            whereClause.address = { contains: location, mode: 'insensitive' };
          }

          const stores = await prisma.partner.findMany({
            where: whereClause,
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              phone: true,
              email: true,
              publicEmail: true,
              whatsappNumber: true,
              _count: {
                select: { products: true }
              }
            },
            take: 20
          });

          return {
            content: [{
              type: 'text',
              text: `Found ${stores.length} stores matching "${query}":\n\n${stores.map(store => 
                `**${store.name}** (${store.slug})\n` +
                `${store.description || 'No description'}\n` +
                `Products: ${store._count.products}\n` +
                `Contact: ${store.publicEmail || store.email || 'N/A'} | ${store.phone || 'N/A'}\n` +
                `WhatsApp: ${store.whatsappNumber || 'N/A'}\n`
              ).join('\n')}`
            }]
          };
        }

        case 'search-products': {
          const { query, category, priceMin, priceMax, partnerId } = args as {
            query: string;
            category?: string;
            priceMin?: number;
            priceMax?: number;
            partnerId?: string;
          };

          const whereClause: any = {
            status: 'AVAILABLE',
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { brand: { contains: query, mode: 'insensitive' } }
            ]
          };

          if (category) {
            whereClause.category = { contains: category, mode: 'insensitive' };
          }

          if (priceMin !== undefined) {
            whereClause.price = { gte: priceMin };
          }

          if (priceMax !== undefined) {
            whereClause.price = { ...whereClause.price, lte: priceMax };
          }

          if (partnerId) {
            whereClause.partnerId = partnerId;
          }

          const products = await prisma.product.findMany({
            where: whereClause,
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              price: true,
              category: true,
              brand: true,
              size: true,
              color: true,
              condition: true,
              status: true,
              partner: {
                select: {
                  name: true,
                  slug: true
                }
              }
            },
            take: 50,
            orderBy: { createdAt: 'desc' }
          });

          return {
            content: [{
              type: 'text',
              text: `Found ${products.length} products matching "${query}":\n\n${products.map(product =>
                `**${product.name}** - R$ ${product.price}\n` +
                `Store: ${product.partner.name}\n` +
                `Category: ${product.category} | Brand: ${product.brand || 'N/A'}\n` +
                `Size: ${product.size || 'N/A'} | Color: ${product.color || 'N/A'}\n` +
                `Condition: ${product.condition}\n` +
                `${product.description ? product.description.substring(0, 100) + '...' : ''}\n`
              ).join('\n')}`
            }]
          };
        }

        case 'get-store-analytics': {
          const { partnerId } = args as { partnerId: string };

          const partner = await prisma.partner.findUnique({
            where: { id: partnerId },
            include: {
              _count: {
                select: {
                  products: true,
                  users: true
                }
              }
            }
          });

          if (!partner) {
            throw new Error(`Store with ID ${partnerId} not found`);
          }

          const productsByCategory = await prisma.product.groupBy({
            by: ['category'],
            where: { partnerId, status: 'AVAILABLE' },
            _count: { category: true },
            _avg: { price: true }
          });

          const analytics = {
            store: {
              name: partner.name,
              slug: partner.slug,
              totalProducts: partner._count.products,
              totalUsers: partner._count.users,
              isActive: partner.isActive
            },
            productAnalytics: {
              byCategory: productsByCategory.map(cat => ({
                category: cat.category,
                count: cat._count.category,
                averagePrice: Math.round(Number(cat._avg.price || 0) * 100) / 100
              }))
            },
            generatedAt: new Date().toISOString()
          };

          return {
            content: [{
              type: 'text',
              text: `Analytics for **${partner.name}**:\n\n` +
                `Total Products: ${analytics.store.totalProducts}\n` +
                `Total Users: ${analytics.store.totalUsers}\n` +
                `Status: ${analytics.store.isActive ? 'Active' : 'Inactive'}\n\n` +
                `**Products by Category:**\n` +
                analytics.productAnalytics.byCategory.map(cat =>
                  `- ${cat.category}: ${cat.count} products (avg R$ ${cat.averagePrice})`
                ).join('\n')
            }]
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      throw new Error(`Failed to execute tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async handleListPrompts() {
    const prompts = [
      {
        name: 'analyze-store-performance',
        description: 'Generate a comprehensive analysis of store performance including products, categories, and recommendations',
        arguments: [{
          name: 'partnerId',
          description: 'ID of the partner store to analyze',
          required: true
        }]
      },
      {
        name: 'recommend-products',
        description: 'Generate product recommendations based on category, price range, and market trends',
        arguments: [{
          name: 'category',
          description: 'Product category to focus on',
          required: true
        }, {
          name: 'priceRange',
          description: 'Price range (e.g., "100-500")',
          required: false
        }]
      },
      {
        name: 'market-research',
        description: 'Conduct market research analysis for the eBrecho marketplace',
        arguments: [{
          name: 'focusArea',
          description: 'Area to focus on (categories, pricing, competition, etc.)',
          required: true
        }]
      }
    ];

    return { prompts };
  }

  public async handleGetPrompt(request: any) {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'analyze-store-performance':
        return {
          description: 'Comprehensive store performance analysis',
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: `Please analyze the performance of store ID: ${args?.partnerId || '[PARTNER_ID]'}. 

Use the get-store-analytics tool to gather data, then provide insights on:
1. Product diversity and category distribution
2. Pricing strategy effectiveness
3. Inventory health
4. Recommendations for improvement
5. Market positioning

Present the analysis in a clear, actionable format that the store owner can understand and implement.`
            }
          }]
        };

      case 'recommend-products':
        return {
          description: 'Product recommendation engine',
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: `Generate product recommendations for category: ${args?.category || '[CATEGORY]'}${args?.priceRange ? ` in price range: R$ ${args.priceRange}` : ''}.

Use the search-products tool to analyze current market offerings, then provide:
1. Popular products in this category
2. Price trends and competitive analysis
3. Gap opportunities
4. Seasonal considerations
5. Target customer insights

Format recommendations as actionable insights for store owners.`
            }
          }]
        };

      case 'market-research':
        return {
          description: 'Market research analysis template',
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: `Conduct comprehensive market research focusing on: ${args?.focusArea || '[FOCUS_AREA]'}.

Use available tools to gather data on:
1. Current market landscape in the eBrecho platform
2. Competitor analysis and positioning
3. Pricing strategies across different stores
4. Product category performance
5. Growth opportunities and trends

Provide strategic recommendations based on the data analysis.`
            }
          }]
        };

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  }

  public async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log('eBrecho MCP Server running on stdio');
  }

  public getExpressApp() {
    return this.app;
  }

  public getMcpServer() {
    return this.server;
  }
}

export const ebrechoMcpServer = new EbrechoMcpServer();