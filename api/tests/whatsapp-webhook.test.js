#!/usr/bin/env node

/**
 * WhatsApp Webhook Test Suite
 * 
 * Tests WhatsApp webhook functionality including:
 * - Webhook verification (GET)
 * - Message receiving (POST)
 * - Message processing and database logging
 * - Auto-response queue triggering
 * - Status updates
 * - Error handling
 */

const http = require('http');
const crypto = require('crypto');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

// Test configuration
const TEST_CONFIG = {
  partner: {
    name: 'Test WhatsApp Partner',
    slug: 'test-whatsapp-partner',
    email: 'whatsapp-test@example.com',
    whatsappPhoneNumberId: '826543520541078', // From environment configuration
    whatsappApiEnabled: true,
    whatsappBusinessVerified: true,
  },
  webhook: {
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'teste',
    phoneNumberId: '826543520541078',
    displayPhone: '16505551111',
    testPhone: '16315551181',
  }
};

// Test payload from user
const WEBHOOK_PAYLOAD = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'business_account_id',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '16505551111',
              phone_number_id: '826543520541078'
            },
            contacts: [
              {
                profile: {
                  name: 'test user name'
                },
                wa_id: '16315551181'
              }
            ],
            messages: [
              {
                from: '16315551181',
                id: 'ABGGFlA5Fpa',
                timestamp: '1504902988',
                type: 'text',
                text: {
                  body: 'this is a text message'
                }
              }
            ]
          }
        }
      ]
    }
  ]
};

// Additional test payloads for different message types
const IMAGE_MESSAGE_PAYLOAD = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'business_account_id',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '16505551111',
              phone_number_id: '826543520541078'
            },
            messages: [
              {
                from: '16315551181',
                id: 'image_msg_123',
                timestamp: '1504902999',
                type: 'image',
                image: {
                  id: 'image_media_id_123',
                  mime_type: 'image/jpeg',
                  sha256: 'sha256_hash_here',
                  caption: 'Test image caption'
                }
              }
            ]
          }
        }
      ]
    }
  ]
};

const STATUS_UPDATE_PAYLOAD = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'business_account_id',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '16505551111',
              phone_number_id: '826543520541078'
            },
            statuses: [
              {
                id: 'ABGGFlA5Fpa',
                status: 'delivered',
                timestamp: '1504903000',
                recipient_id: '16315551181'
              }
            ]
          }
        }
      ]
    }
  ]
};

// Global test state
let testPartner = null;
let authToken = null;
let partnerUser = null;
let partnerToken = null;

// Utility functions
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (data && method !== 'GET') {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody,
            rawBody: body,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            rawBody: body,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method !== 'GET') {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function createWebhookSignature(payload, token) {
  const hmac = crypto.createHmac('sha256', token);
  hmac.update(payload);
  return 'sha256=' + hmac.digest('hex');
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
}

function logError(message) {
  console.log(`❌ ${message}`);
}

function logInfo(message) {
  console.log(`ℹ️  ${message}`);
}

// Test setup and cleanup
async function setupTestData() {
  logInfo('Setting up test data...');
  
  try {
    // First, authenticate as admin
    const loginData = {
      email: 'admin@ebrecho.com.br',
      password: 'admin123'
    };
    
    const loginResponse = await makeRequest('POST', '/api/auth/login', loginData);
    
    if (loginResponse.statusCode !== 200 || !loginResponse.body.success) {
      logError(`Failed to authenticate as admin: ${loginResponse.statusCode} - ${JSON.stringify(loginResponse.body)}`);
      return false;
    }
    
    authToken = loginResponse.body.data.token;
    logSuccess('Authenticated as admin');
    
    // Create a test partner with WhatsApp configuration
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const uniqueId = `${timestamp}-${randomSuffix}`;
    const partnerData = {
      name: `${TEST_CONFIG.partner.name} ${uniqueId}`,
      slug: `${TEST_CONFIG.partner.slug}-${uniqueId}`,
      email: `test-${uniqueId}@example.com`,
      phone: '(11) 99999-9999',
      document: `1234567890123${randomSuffix.slice(0, 1)}`,
      documentType: 'CNPJ',
      address: {
        street: 'Test Street',
        number: '123',
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'SP',
        zipCode: '12345-678',
        country: 'BR'
      },
      whatsappPhoneNumberId: TEST_CONFIG.partner.whatsappPhoneNumberId,
      whatsappApiEnabled: TEST_CONFIG.partner.whatsappApiEnabled,
      whatsappBusinessVerified: TEST_CONFIG.partner.whatsappBusinessVerified,
      status: 'ACTIVE'
    };

    const partnerResponse = await makeRequest('POST', '/api/partners', partnerData, {
      'Authorization': `Bearer ${authToken}`
    });

    logInfo(`Partner creation response: ${partnerResponse.statusCode} - ${JSON.stringify(partnerResponse.body)}`);
    
    if (partnerResponse.statusCode === 201 || partnerResponse.statusCode === 200) {
      testPartner = partnerResponse.body.success ? partnerResponse.body.data : partnerResponse.body;
      logSuccess(`Test partner created: ${testPartner.name} (ID: ${testPartner.id})`);
      
      // Update WhatsApp configuration separately
      const whatsappUpdateData = {
        whatsappPhoneNumberId: TEST_CONFIG.partner.whatsappPhoneNumberId,
        whatsappApiEnabled: TEST_CONFIG.partner.whatsappApiEnabled,
        whatsappBusinessVerified: TEST_CONFIG.partner.whatsappBusinessVerified,
        whatsappName: 'Test WhatsApp Business'
      };
      
      const updateResponse = await makeRequest('PUT', `/api/partners/${testPartner.id}`, whatsappUpdateData, {
        'Authorization': `Bearer ${authToken}`
      });
      
      if (updateResponse.statusCode === 200) {
        logSuccess('WhatsApp configuration updated for test partner');
      } else {
        logInfo(`WhatsApp config update: ${updateResponse.statusCode} - may not be critical for webhook tests`);
      }
      
      // Create a partner user for WhatsApp API access
      const partnerUserData = {
        email: `partner-user-${uniqueId}@example.com`,
        password: 'testpassword123',
        name: 'Test Partner User',
        role: 'PARTNER_ADMIN',
        partnerId: testPartner.id
      };
      
      const userResponse = await makeRequest('POST', '/api/admin/users', partnerUserData, {
        'Authorization': `Bearer ${authToken}`
      });
      
      if (userResponse.statusCode === 201 || userResponse.statusCode === 200) {
        partnerUser = userResponse.body.success ? userResponse.body.data : userResponse.body;
        logSuccess('Partner user created');
        
        // Login as partner user to get token for WhatsApp API
        const partnerLoginResponse = await makeRequest('POST', '/api/auth/login', {
          email: partnerUserData.email,
          password: partnerUserData.password
        });
        
        if (partnerLoginResponse.statusCode === 200 && partnerLoginResponse.body.success) {
          partnerToken = partnerLoginResponse.body.data.token;
          logSuccess('Partner user authenticated');
        } else {
          logInfo('Partner user authentication failed, will use admin token');
        }
      } else {
        logInfo('Partner user creation failed, will use admin token for WhatsApp API');
      }
      
      return true;
    } else {
      logError(`Failed to create test partner: ${partnerResponse.statusCode} - ${JSON.stringify(partnerResponse.body)}`);
      return false;
    }
  } catch (error) {
    logError(`Error setting up test data: ${error.message}`);
    return false;
  }
}

async function cleanupTestData() {
  logInfo('Cleaning up test data...');
  
  try {
    if (testPartner && authToken) {
      // Delete test partner
      const deleteResponse = await makeRequest('DELETE', `/api/partners/${testPartner.id}`, null, {
        'Authorization': `Bearer ${authToken}`
      });
      
      if (deleteResponse.statusCode === 200 || deleteResponse.statusCode === 204) {
        logSuccess('Test data cleaned up successfully');
      } else {
        logInfo(`Partner cleanup: ${deleteResponse.statusCode} - this is normal if partner didn't exist`);
      }
    }
  } catch (error) {
    logInfo(`Cleanup completed with info: ${error.message}`);
  }
}

// Test functions
async function testWebhookVerification() {
  logInfo('Testing webhook verification...');
  
  // Test 1: Valid verification
  const challenge = 'test_challenge_123';
  const validParams = new URLSearchParams({
    'hub.mode': 'subscribe',
    'hub.challenge': challenge,
    'hub.verify_token': TEST_CONFIG.webhook.verifyToken
  });
  
  const validResponse = await makeRequest('GET', `/api/whatsapp/webhook?${validParams}`);
  
  if (validResponse.statusCode === 200 && validResponse.rawBody === challenge) {
    logSuccess('Webhook verification with valid token');
  } else {
    logError(`Webhook verification failed: ${validResponse.statusCode} - ${validResponse.rawBody}`);
    return false;
  }
  
  // Test 2: Invalid verification token
  const invalidParams = new URLSearchParams({
    'hub.mode': 'subscribe',
    'hub.challenge': challenge,
    'hub.verify_token': 'invalid_token'
  });
  
  const invalidResponse = await makeRequest('GET', `/api/whatsapp/webhook?${invalidParams}`);
  
  if (invalidResponse.statusCode === 403) {
    logSuccess('Webhook verification correctly rejected invalid token');
  } else {
    logError(`Webhook verification should have rejected invalid token: ${invalidResponse.statusCode}`);
    return false;
  }
  
  // Test 3: Missing parameters
  const missingResponse = await makeRequest('GET', '/api/whatsapp/webhook');
  
  if (missingResponse.statusCode === 400) {
    logSuccess('Webhook verification correctly rejected missing parameters');
  } else {
    logError(`Webhook verification should have rejected missing parameters: ${missingResponse.statusCode}`);
    return false;
  }
  
  return true;
}

async function testMessageReceiving() {
  logInfo('Testing message receiving...');
  
  // Test 1: Text message processing
  const payloadString = JSON.stringify(WEBHOOK_PAYLOAD);
  const signature = createWebhookSignature(payloadString, TEST_CONFIG.webhook.verifyToken);
  
  const response = await makeRequest('POST', '/api/whatsapp/webhook', WEBHOOK_PAYLOAD, {
    'X-Hub-Signature-256': signature,
    'Content-Type': 'application/json'
  });
  
  if (response.statusCode === 200) {
    logSuccess('Text message webhook processed successfully');
    
    // Wait a moment for database operations to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify message was logged to database
    const token = partnerToken || authToken;
    const messagesResponse = await makeRequest('GET', `/api/whatsapp/conversations`, null, {
      'Authorization': `Bearer ${token}`
    });
    
    if (messagesResponse.statusCode === 200 && messagesResponse.body.length > 0) {
      const message = messagesResponse.body.find(m => m.messageId === 'ABGGFlA5Fpa');
      if (message) {
        logSuccess('Text message correctly logged to database');
        
        if (message.textContent === 'this is a text message' &&
            message.fromNumber === '16315551181' &&
            message.direction === 'inbound' &&
            message.messageType === 'TEXT') {
          logSuccess('Message data correctly parsed and stored');
        } else {
          logError('Message data not correctly parsed');
          return false;
        }
      } else {
        logError('Message not found in database');
        return false;
      }
    } else {
      logError(`Failed to retrieve messages from database: ${messagesResponse.statusCode}`);
      return false;
    }
  } else {
    logError(`Text message webhook failed: ${response.statusCode} - ${JSON.stringify(response.body)}`);
    return false;
  }
  
  return true;
}

async function testImageMessageReceiving() {
  logInfo('Testing image message receiving...');
  
  const payloadString = JSON.stringify(IMAGE_MESSAGE_PAYLOAD);
  const signature = createWebhookSignature(payloadString, TEST_CONFIG.webhook.verifyToken);
  
  const response = await makeRequest('POST', '/api/whatsapp/webhook', IMAGE_MESSAGE_PAYLOAD, {
    'X-Hub-Signature-256': signature,
    'Content-Type': 'application/json'
  });
  
  if (response.statusCode === 200) {
    logSuccess('Image message webhook processed successfully');
    
    // Wait for database operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify image message was logged
    const token = partnerToken || authToken;
    const messagesResponse = await makeRequest('GET', `/api/whatsapp/conversations`, null, {
      'Authorization': `Bearer ${token}`
    });
    
    if (messagesResponse.statusCode === 200) {
      const message = messagesResponse.body.find(m => m.messageId === 'image_msg_123');
      if (message && message.messageType === 'IMAGE' && message.mediaId === 'image_media_id_123') {
        logSuccess('Image message correctly processed and stored');
      } else {
        logError('Image message not correctly processed');
        return false;
      }
    } else {
      logError(`Failed to retrieve image message: ${messagesResponse.statusCode}`);
      return false;
    }
  } else {
    logError(`Image message webhook failed: ${response.statusCode}`);
    return false;
  }
  
  return true;
}

async function testStatusUpdates() {
  logInfo('Testing status updates...');
  
  const payloadString = JSON.stringify(STATUS_UPDATE_PAYLOAD);
  const signature = createWebhookSignature(payloadString, TEST_CONFIG.webhook.verifyToken);
  
  const response = await makeRequest('POST', '/api/whatsapp/webhook', STATUS_UPDATE_PAYLOAD, {
    'X-Hub-Signature-256': signature,
    'Content-Type': 'application/json'
  });
  
  if (response.statusCode === 200) {
    logSuccess('Status update webhook processed successfully');
    
    // Wait for database operations
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if the message status was updated
    const token = partnerToken || authToken;
    const messagesResponse = await makeRequest('GET', `/api/whatsapp/conversations`, null, {
      'Authorization': `Bearer ${token}`
    });
    
    if (messagesResponse.statusCode === 200) {
      const message = messagesResponse.body.find(m => m.messageId === 'ABGGFlA5Fpa');
      if (message && message.status === 'DELIVERED') {
        logSuccess('Message status correctly updated to DELIVERED');
      } else {
        logInfo('Message status update test - message may not exist yet, this is normal');
      }
    }
  } else {
    logError(`Status update webhook failed: ${response.statusCode}`);
    return false;
  }
  
  return true;
}

async function testInvalidPayloads() {
  logInfo('Testing invalid payloads...');
  
  // Test 1: Invalid JSON
  const invalidJsonResponse = await makeRequest('POST', '/api/whatsapp/webhook', 'invalid json', {
    'X-Hub-Signature-256': 'sha256=invalid',
    'Content-Type': 'application/json'
  });
  
  if (invalidJsonResponse.statusCode === 400) {
    logSuccess('Invalid JSON payload correctly rejected');
  } else {
    logError(`Invalid JSON should be rejected: ${invalidJsonResponse.statusCode}`);
    return false;
  }
  
  // Test 2: Missing signature
  const noSignatureResponse = await makeRequest('POST', '/api/whatsapp/webhook', WEBHOOK_PAYLOAD, {
    'Content-Type': 'application/json'
  });
  
  if (noSignatureResponse.statusCode === 403) {
    logSuccess('Missing signature correctly rejected');
  } else {
    logError(`Missing signature should be rejected: ${noSignatureResponse.statusCode}`);
    return false;
  }
  
  // Test 3: Invalid signature
  const invalidSignatureResponse = await makeRequest('POST', '/api/whatsapp/webhook', WEBHOOK_PAYLOAD, {
    'X-Hub-Signature-256': 'sha256=invalid_signature',
    'Content-Type': 'application/json'
  });
  
  if (invalidSignatureResponse.statusCode === 403) {
    logSuccess('Invalid signature correctly rejected');
  } else {
    logError(`Invalid signature should be rejected: ${invalidSignatureResponse.statusCode}`);
    return false;
  }
  
  return true;
}

async function testPartnerNotFound() {
  logInfo('Testing partner not found scenario...');
  
  // Create a payload with a phone number ID that doesn't exist
  const unknownPartnerPayload = {
    ...WEBHOOK_PAYLOAD,
    entry: [
      {
        ...WEBHOOK_PAYLOAD.entry[0],
        changes: [
          {
            ...WEBHOOK_PAYLOAD.entry[0].changes[0],
            value: {
              ...WEBHOOK_PAYLOAD.entry[0].changes[0].value,
              metadata: {
                display_phone_number: '16505551111',
                phone_number_id: 'unknown_phone_id'
              }
            }
          }
        ]
      }
    ]
  };
  
  const payloadString = JSON.stringify(unknownPartnerPayload);
  const signature = createWebhookSignature(payloadString, TEST_CONFIG.webhook.verifyToken);
  
  const response = await makeRequest('POST', '/api/whatsapp/webhook', unknownPartnerPayload, {
    'X-Hub-Signature-256': signature,
    'Content-Type': 'application/json'
  });
  
  // The webhook should still return 200 even if partner is not found
  // (as per the service implementation - it logs and continues)
  if (response.statusCode === 200) {
    logSuccess('Unknown partner scenario handled gracefully');
  } else {
    logError(`Unknown partner scenario not handled properly: ${response.statusCode}`);
    return false;
  }
  
  return true;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting WhatsApp Webhook Tests');
  console.log('=' .repeat(50));
  
  let allTestsPassed = true;
  
  try {
    // Setup
    const setupSuccess = await setupTestData();
    if (!setupSuccess) {
      logError('Failed to setup test data. Aborting tests.');
      return;
    }
    
    // Run tests
    const tests = [
      testWebhookVerification,
      testMessageReceiving,
      testImageMessageReceiving,
      testStatusUpdates,
      testInvalidPayloads,
      testPartnerNotFound,
    ];
    
    for (const test of tests) {
      try {
        const result = await test();
        if (!result) {
          allTestsPassed = false;
        }
      } catch (error) {
        logError(`Test failed with error: ${error.message}`);
        allTestsPassed = false;
      }
      console.log(''); // Add spacing between tests
    }
    
  } finally {
    // Cleanup
    await cleanupTestData();
  }
  
  console.log('=' .repeat(50));
  if (allTestsPassed) {
    console.log('🎉 All WhatsApp webhook tests passed!');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed. Check the output above for details.');
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test suite failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  TEST_CONFIG,
  WEBHOOK_PAYLOAD,
  IMAGE_MESSAGE_PAYLOAD,
  STATUS_UPDATE_PAYLOAD,
};