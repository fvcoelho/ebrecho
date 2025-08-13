# eBrecho MCP Server

This directory contains the Model Context Protocol (MCP) server implementation for the eBrecho fashion marketplace API. The MCP server allows AI assistants like Claude Code to interact with the eBrecho platform data and functionality.

## Overview

The MCP server provides three main types of capabilities:

### 🗂️ Resources (Read-only data access)
- **Partner Stores** (`ebrecho://partners`): Access to partner store information
- **Product Catalog** (`ebrecho://products`): Browse and search products across stores  
- **Marketplace Analytics** (`ebrecho://analytics/summary`): High-level marketplace statistics

### 🛠️ Tools (AI-callable functions)
- **search-stores**: Find stores by name, location, or category
- **search-products**: Advanced product search with filters (price, category, partner)
- **get-store-analytics**: Generate analytics for specific stores

### 📝 Prompts (Pre-built templates)
- **analyze-store-performance**: Template for store performance analysis
- **recommend-products**: Generate product recommendations
- **market-research**: Marketplace trend analysis template

## Quick Start

### 1. Development Setup

Start the development server with MCP endpoints:

```bash
cd api
npm run dev
```

The MCP endpoints will be available at `http://localhost:3001/api/mcp/*`

### 2. Test MCP Functionality

Run the MCP test suite:

```bash
npm run mcp:test
```

### 3. Start Standalone MCP Server

For stdio mode (required for MCP clients):

```bash
npm run mcp:start
```

For HTTP mode (testing/development):

```bash
npm run mcp:start:http
```

## API Endpoints

### Base URL: `/api/mcp`

#### Server Information
- `GET /info` - Get MCP server information and capabilities
- `GET /health` - MCP server health check

#### Resources
- `GET /resources` - List available resources
- `GET /resources/:resourceId` - Get specific resource data

#### Tools
- `GET /tools` - List available tools
- `POST /tools/:toolName/call` - Execute a tool with parameters

#### Prompts
- `GET /prompts` - List available prompts
- `POST /prompts/:promptName` - Get prompt template with parameters

## Usage Examples

### Using Resources

```javascript
// Get partner stores
const partners = await fetch('/api/mcp/resources/partners');

// Get product catalog
const products = await fetch('/api/mcp/resources/products');

// Get marketplace analytics
const analytics = await fetch('/api/mcp/resources/analytics/summary');
```

### Using Tools

```javascript
// Search for stores
const storeSearch = await fetch('/api/mcp/tools/search-stores/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    arguments: {
      query: 'fashion boutique',
      location: 'São Paulo'
    }
  })
});

// Search for products
const productSearch = await fetch('/api/mcp/tools/search-products/call', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    arguments: {
      query: 'summer dress',
      category: 'clothing',
      priceMin: 50,
      priceMax: 200
    }
  })
});

// Get store analytics (requires authentication)
const analytics = await fetch('/api/mcp/tools/get-store-analytics/call', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    arguments: {
      partnerId: 'partner-uuid-here'
    }
  })
});
```

### Using Prompts

```javascript
// Get store analysis prompt
const prompt = await fetch('/api/mcp/prompts/analyze-store-performance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    arguments: {
      partnerId: 'partner-uuid-here'
    }
  })
});
```

## Authentication

The MCP server integrates with the existing eBrecho JWT authentication system:

- **Public Access**: Resources, tools list, and prompts are publicly accessible
- **Authenticated Access**: Some tools (like store analytics) require a valid JWT token
- **Role-based Access**: Respects existing user roles and partner scoping

Include the JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## MCP Client Integration

### Claude Code Integration

1. Build the project:
```bash
npm run build
```

2. Add to your Claude Code MCP configuration:
```json
{
  "mcpServers": {
    "ebrecho": {
      "command": "node",
      "args": ["scripts/mcp-stdio.js"],
      "cwd": "/path/to/ebrecho/api"
    }
  }
}
```

3. Restart Claude Code to load the MCP server

### HTTP Transport (for testing)

You can also access the MCP server via HTTP for testing:

```bash
# Start HTTP mode
npm run mcp:start:http

# Test with curl
curl http://localhost:3002/api/mcp/info
```

## File Structure

```
src/mcp/
├── server.ts                    # Main MCP server implementation
├── middleware/
│   └── mcp-auth.middleware.ts   # Authentication middleware
├── resources/                   # Resource providers (auto-loaded)
├── tools/                      # Tool implementations (auto-loaded)
└── prompts/                    # Prompt templates (auto-loaded)

scripts/
├── start-mcp-server.js         # MCP server startup script
└── mcp-stdio.js               # Stdio transport script

tests/
└── mcp.test.js                # MCP functionality tests

.mcp.json                      # MCP client configuration
```

## Configuration

### Environment Variables

The MCP server uses the same environment variables as the main API:

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NODE_ENV=development|production
```

### CORS Configuration

The MCP server is configured to allow requests from:
- Local development origins
- Claude Code and Anthropic clients
- Production eBrecho domains

## Troubleshooting

### Common Issues

1. **"MCP server not found"**
   - Ensure the project is built: `npm run build`
   - Check the MCP configuration file path
   - Verify Node.js and dependencies are installed

2. **"Database connection failed"**
   - Check `DATABASE_URL` environment variable
   - Ensure PostgreSQL is running
   - Run database migrations: `npm run prisma:migrate`

3. **"Authentication failed"**
   - Verify `JWT_SECRET` is configured
   - Check token format and expiration
   - Ensure user has appropriate role/permissions

### Debug Mode

Enable debug logging by setting:

```bash
export DEBUG=mcp:*
npm run mcp:start
```

### Testing

Run comprehensive tests:

```bash
# Test MCP functionality
npm run mcp:test

# Test main API (includes MCP endpoints)
node tests/all-tests.js
```

## Contributing

When adding new MCP capabilities:

1. **Resources**: Add to the `handleListResources` and `handleGetResource` methods
2. **Tools**: Add to the `handleListTools` and `handleCallTool` methods  
3. **Prompts**: Add to the `handleListPrompts` and `handleGetPrompt` methods
4. **Tests**: Update `tests/mcp.test.js` with new test cases
5. **Documentation**: Update this README with new capabilities

## Security Considerations

- The MCP server respects existing authentication and authorization
- Sensitive data is only accessible to authenticated users
- Partner data is scoped to the user's partner association
- All database queries use Prisma for SQL injection protection

## Performance Notes

- Resources are cached when possible
- Database queries use appropriate indexes
- Large datasets are paginated (default 100 items)
- Connection pooling is enabled for serverless environments