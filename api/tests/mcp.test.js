const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

// Test data
let authToken = null;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(method, url, data = null) {
  const config = {
    method,
    url: `${API_BASE}${url}`,
    headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
}

// Test authentication first
async function testAuthentication() {
  log(colors.blue, '\n=== Testing Authentication ===');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@ebrecho.com.br',
      password: 'admin123'
    });
    
    if (response.data.token) {
      authToken = response.data.token;
      log(colors.green, '✓ Authentication successful');
      return true;
    } else {
      log(colors.red, '✗ Authentication failed: No token received');
      return false;
    }
  } catch (error) {
    log(colors.red, `✗ Authentication failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test MCP Server Info
async function testMcpInfo() {
  log(colors.blue, '\n=== Testing MCP Server Info ===');
  
  try {
    const response = await axios.get(`${API_BASE}/mcp/info`);
    
    if (response.status === 200) {
      log(colors.green, '✓ MCP server info retrieved successfully');
      console.log('MCP Server Name:', response.data.name);
      console.log('MCP Server Version:', response.data.version);
      console.log('Available Capabilities:', Object.keys(response.data.capabilities));
      return true;
    }
  } catch (error) {
    log(colors.red, `✗ MCP info failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test MCP Health Check
async function testMcpHealth() {
  log(colors.blue, '\n=== Testing MCP Health Check ===');
  
  try {
    const response = await axios.get(`${API_BASE}/mcp/health`);
    
    if (response.status === 200 && response.data.status === 'healthy') {
      log(colors.green, '✓ MCP server is healthy');
      console.log('Server Status:', response.data.status);
      console.log('Capabilities:', response.data.capabilities);
      return true;
    }
  } catch (error) {
    log(colors.red, `✗ MCP health check failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test MCP Resources
async function testMcpResources() {
  log(colors.blue, '\n=== Testing MCP Resources ===');
  
  try {
    // List resources
    const listResponse = await makeAuthenticatedRequest('GET', '/mcp/resources');
    
    if (listResponse.status === 200) {
      log(colors.green, '✓ MCP resources listed successfully');
      console.log('Available Resources:', listResponse.data.resources?.length || 0);
      
      // Test getting a specific resource (partners)
      try {
        const resourceResponse = await makeAuthenticatedRequest('GET', '/mcp/resources/partners');
        
        if (resourceResponse.status === 200) {
          log(colors.green, '✓ Partners resource retrieved successfully');
          const content = resourceResponse.data.contents?.[0]?.text;
          if (content) {
            const partners = JSON.parse(content);
            console.log('Partners found:', partners.length);
          }
        }
      } catch (error) {
        log(colors.yellow, `⚠ Partners resource test failed: ${error.response?.data?.message || error.message}`);
      }
      
      return true;
    }
  } catch (error) {
    log(colors.red, `✗ MCP resources test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test MCP Tools
async function testMcpTools() {
  log(colors.blue, '\n=== Testing MCP Tools ===');
  
  try {
    // List tools
    const listResponse = await makeAuthenticatedRequest('GET', '/mcp/tools');
    
    if (listResponse.status === 200) {
      log(colors.green, '✓ MCP tools listed successfully');
      console.log('Available Tools:', listResponse.data.tools?.length || 0);
      
      // Test search-stores tool
      try {
        const toolResponse = await makeAuthenticatedRequest('POST', '/mcp/tools/search-stores/call', {
          arguments: {
            query: 'fashion'
          }
        });
        
        if (toolResponse.status === 200) {
          log(colors.green, '✓ search-stores tool executed successfully');
          console.log('Search results type:', typeof toolResponse.data.content?.[0]?.text);
        }
      } catch (error) {
        log(colors.yellow, `⚠ search-stores tool test failed: ${error.response?.data?.message || error.message}`);
      }
      
      // Test search-products tool
      try {
        const toolResponse = await makeAuthenticatedRequest('POST', '/mcp/tools/search-products/call', {
          arguments: {
            query: 'dress'
          }
        });
        
        if (toolResponse.status === 200) {
          log(colors.green, '✓ search-products tool executed successfully');
        }
      } catch (error) {
        log(colors.yellow, `⚠ search-products tool test failed: ${error.response?.data?.message || error.message}`);
      }
      
      return true;
    }
  } catch (error) {
    log(colors.red, `✗ MCP tools test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test MCP Prompts
async function testMcpPrompts() {
  log(colors.blue, '\n=== Testing MCP Prompts ===');
  
  try {
    // List prompts
    const listResponse = await makeAuthenticatedRequest('GET', '/mcp/prompts');
    
    if (listResponse.status === 200) {
      log(colors.green, '✓ MCP prompts listed successfully');
      console.log('Available Prompts:', listResponse.data.prompts?.length || 0);
      
      // Test getting a specific prompt
      try {
        const promptResponse = await makeAuthenticatedRequest('POST', '/mcp/prompts/analyze-store-performance', {
          arguments: {
            partnerId: 'test-partner-id'
          }
        });
        
        if (promptResponse.status === 200) {
          log(colors.green, '✓ analyze-store-performance prompt retrieved successfully');
          console.log('Prompt has messages:', promptResponse.data.messages?.length > 0);
        }
      } catch (error) {
        log(colors.yellow, `⚠ Prompt test failed: ${error.response?.data?.message || error.message}`);
      }
      
      return true;
    }
  } catch (error) {
    log(colors.red, `✗ MCP prompts test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Test unauthenticated access
async function testUnauthenticatedAccess() {
  log(colors.blue, '\n=== Testing Unauthenticated Access ===');
  
  let results = {
    info: false,
    health: false,
    resources: false,
    tools: false
  };
  
  // Test info endpoint (should work without auth)
  try {
    const response = await axios.get(`${API_BASE}/mcp/info`);
    if (response.status === 200) {
      results.info = true;
      log(colors.green, '✓ MCP info accessible without authentication');
    }
  } catch (error) {
    log(colors.red, '✗ MCP info failed without authentication');
  }
  
  // Test health endpoint (should work without auth)
  try {
    const response = await axios.get(`${API_BASE}/mcp/health`);
    if (response.status === 200) {
      results.health = true;
      log(colors.green, '✓ MCP health accessible without authentication');
    }
  } catch (error) {
    log(colors.red, '✗ MCP health failed without authentication');
  }
  
  // Test resources endpoint (should work with limited data)
  try {
    const response = await axios.get(`${API_BASE}/mcp/resources`);
    if (response.status === 200) {
      results.resources = true;
      log(colors.green, '✓ MCP resources accessible without authentication');
    }
  } catch (error) {
    log(colors.yellow, '⚠ MCP resources require authentication');
  }
  
  // Test tools endpoint (should work)
  try {
    const response = await axios.get(`${API_BASE}/mcp/tools`);
    if (response.status === 200) {
      results.tools = true;
      log(colors.green, '✓ MCP tools list accessible without authentication');
    }
  } catch (error) {
    log(colors.yellow, '⚠ MCP tools require authentication');
  }
  
  return results;
}

// Main test runner
async function runMcpTests() {
  log(colors.blue, '🧪 Starting eBrecho MCP Server Tests');
  log(colors.blue, '=====================================');
  
  const results = {
    auth: false,
    info: false,
    health: false,
    resources: false,
    tools: false,
    prompts: false,
    unauth: false
  };
  
  // Run tests
  results.auth = await testAuthentication();
  results.info = await testMcpInfo();
  results.health = await testMcpHealth();
  results.resources = await testMcpResources();
  results.tools = await testMcpTools();
  results.prompts = await testMcpPrompts();
  results.unauth = await testUnauthenticatedAccess();
  
  // Summary
  log(colors.blue, '\n=== Test Summary ===');
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  log(colors.blue, `Tests passed: ${passed}/${total}`);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✓' : '✗';
    const color = passed ? colors.green : colors.red;
    log(color, `${status} ${test}`);
  });
  
  if (passed === total) {
    log(colors.green, '\n🎉 All MCP tests passed!');
  } else {
    log(colors.yellow, '\n⚠ Some MCP tests failed. Check the output above for details.');
  }
  
  return results;
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runMcpTests().catch(error => {
    log(colors.red, `Test runner error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runMcpTests };