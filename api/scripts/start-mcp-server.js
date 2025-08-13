#!/usr/bin/env node

/**
 * MCP Server Startup Script
 * 
 * This script starts the eBrecho MCP server in standalone mode for testing
 * and development purposes. It can run in both HTTP and stdio modes.
 */

const { spawn } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const mode = args.includes('--http') ? 'http' : 'stdio';
const port = args.find(arg => arg.startsWith('--port='))?.split('=')[1] || '3002';

console.log('🚀 Starting eBrecho MCP Server');
console.log(`📡 Mode: ${mode}`);
if (mode === 'http') {
  console.log(`🌐 Port: ${port}`);
}

if (mode === 'http') {
  // Start Express server with MCP endpoints
  console.log('Starting HTTP server with MCP endpoints...');
  
  const serverPath = path.join(__dirname, '..', 'src', 'server.ts');
  const env = { ...process.env, MCP_HTTP_MODE: 'true', PORT: port };
  
  const server = spawn('npx', ['tsx', 'watch', serverPath], {
    env,
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  server.on('error', (error) => {
    console.error('❌ Failed to start MCP HTTP server:', error);
    process.exit(1);
  });
  
  server.on('close', (code) => {
    console.log(`🛑 MCP HTTP server exited with code ${code}`);
    process.exit(code);
  });
  
} else {
  // Start stdio mode for MCP client connections
  console.log('Starting stdio mode for MCP client connections...');
  
  const mcpServerPath = path.join(__dirname, 'mcp-stdio.js');
  
  const server = spawn('node', [mcpServerPath], {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: path.join(__dirname, '..')
  });
  
  server.on('error', (error) => {
    console.error('❌ Failed to start MCP stdio server:', error);
    process.exit(1);
  });
  
  server.on('close', (code) => {
    console.log(`🛑 MCP stdio server exited with code ${code}`);
    process.exit(code);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down MCP server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down MCP server...');
  process.exit(0);
});