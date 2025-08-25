const crypto = require('crypto');
const axios = require('axios');

// Test payload for WhatsApp message webhook
const webhookPayload = {
  "object": "whatsapp_business_account",
  "entry": [
    {
      "id": "826543520541078", 
      "changes": [
        {
          "value": {
            "messaging_product": "whatsapp",
            "metadata": {
              "display_phone_number": "15551234567",
              "phone_number_id": "123456789"
            },
            "contacts": [
              {
                "profile": {
                  "name": "Maria Santos"
                },
                "wa_id": "5511987654321"
              }
            ],
            "messages": [
              {
                "from": "5511987654321",
                "id": "wamid.HBgNNTUxMTk4NzY1NDMyMRUCABIYFjNBODlBOUJDNzA4QUY3QThBODEwAA==",
                "timestamp": "1703456789",
                "text": {
                  "body": "Oi! Vi suas peças no Instagram e fiquei interessada. Vocês têm vestidos tamanho M?"
                },
                "type": "text"
              }
            ]
          },
          "field": "messages"
        }
      ]
    }
  ]
};

async function testProductionWebhook() {
  try {
    console.log('🚀 Testing production WhatsApp webhook endpoint...\n');
    
    // Convert payload to string (as it would be sent by Meta)
    const payloadString = JSON.stringify(webhookPayload);
    
    // Generate HMAC signature using the verify token
    const secret = '23e3d374a16eb5c880cf51c300c74afb1e6fb1240be99ebcdb8bab1894ef74fc';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payloadString)
      .digest('hex');
    
    console.log('🔍 Debug Info:');
    console.log('   Secret used:', secret.substring(0, 10) + '...');
    console.log('   Payload preview:', payloadString.substring(0, 100) + '...');
    console.log('   Signature length:', signature.length);
    
    console.log('📝 Payload size:', payloadString.length, 'bytes');
    console.log('🔐 Generated signature:', `sha256=${signature}`);
    console.log('📨 Sending to: POST /api/whatsapp/webhook\n');
    
    // Send the webhook request
    const response = await axios.post('http://localhost:3001/api/whatsapp/webhook', webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': `sha256=${signature}`
      },
      validateStatus: () => true // Don't throw on HTTP error codes
    });
    
    console.log('📡 Response Status:', response.status);
    console.log('📄 Response Data:', response.data);
    
    if (response.status === 200) {
      console.log('\n✅ SUCCESS: Webhook processed successfully!');
      console.log('   - Signature verification: PASSED');
      console.log('   - Payload validation: PASSED'); 
      console.log('   - Message processing: INITIATED');
      
      // Wait a moment for async processing
      console.log('\n⏳ Waiting for async processing...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return true;
    } else if (response.status === 403) {
      console.log('\n❌ FAILED: Invalid webhook signature');
      return false;
    } else {
      console.log(`\n⚠️  UNEXPECTED: HTTP ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ ERROR testing webhook:', error.message);
    return false;
  }
}

// Test different webhook event types
async function testTemplateStatusUpdate() {
  const templateUpdatePayload = {
    "object": "whatsapp_business_account",
    "entry": [
      {
        "id": "826543520541078",
        "changes": [
          {
            "value": {
              "message_template_id": "template_123456",
              "event": "APPROVED",
              "reason": "Template approved by WhatsApp"
            },
            "field": "message_template_status_update"
          }
        ]
      }
    ]
  };
  
  console.log('\n📋 Testing template status update webhook...');
  
  const payloadString = JSON.stringify(templateUpdatePayload);
  const secret = '23e3d374a16eb5c880cf51c300c74afb1e6fb1240be99ebcdb8bab1894ef74fc';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadString)
    .digest('hex');
  
  try {
    const response = await axios.post('http://localhost:3001/api/whatsapp/webhook', templateUpdatePayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': `sha256=${signature}`
      },
      validateStatus: () => true
    });
    
    console.log('📡 Template Update Response:', response.status, response.data);
    return response.status === 200;
  } catch (error) {
    console.error('❌ Template update test failed:', error.message);
    return false;
  }
}

// Run tests
async function runAllTests() {
  console.log('🧪 WhatsApp Production Webhook Test Suite\n');
  console.log('=' * 50);
  
  const messageTest = await testProductionWebhook();
  const templateTest = await testTemplateStatusUpdate();
  
  console.log('\n📊 Test Results Summary:');
  console.log('=' * 30);
  console.log('✅ Message Webhook:', messageTest ? 'PASSED' : 'FAILED');
  console.log('✅ Template Update Webhook:', templateTest ? 'PASSED' : 'FAILED');
  
  const overallSuccess = messageTest && templateTest;
  console.log('\n🎯 Overall Result:', overallSuccess ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  if (overallSuccess) {
    console.log('\n🚀 WhatsApp webhook integration is production ready!');
  }
}

runAllTests();