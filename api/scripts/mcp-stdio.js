#!/usr/bin/env node

/**
 * Standalone MCP Server for stdio transport
 * 
 * This script runs the MCP server in stdio mode, which is required
 * for connecting with MCP clients like Claude Code.
 */

const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import and start the MCP server
async function startMcpServer() {
  try {
    // Dynamic import since we're using ES modules
    const { ebrechoMcpServer } = await import('../dist/src/mcp/server.js');
    
    // Initialize database connection
    const { initDatabase } = await import('../dist/src/app.js');
    await initDatabase();
    
    console.error('🚀 Starting eBrecho MCP Server (stdio mode)');
    console.error('📡 Ready for MCP client connections');
    
    // Start the MCP server
    await ebrechoMcpServer.start();
    
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\n👋 Shutting down MCP server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\n👋 Shutting down MCP server...');
  process.exit(0);
});

// Start the server
startMcpServer();