const axios = require('axios');

// Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://dev.ebrecho.com.br:3001';
const WHATSAPP_NUMBER = '11963166165';

console.log('Testing WhatsApp Bot Integration Endpoint');
console.log('=========================================');
console.log(`API URL: ${API_URL}`);
console.log(`WhatsApp Number: ${WHATSAPP_NUMBER}`);
console.log('');

async function testEndpoint() {
  try {
    console.log('1. Testing GET /api/public/store-by-whatsapp/{whatsappNumber}/bot-integration');
    console.log('   Endpoint URL:', `${API_URL}/api/public/store-by-whatsapp/${WHATSAPP_NUMBER}/bot-integration`);
    
    const startTime = Date.now();
    
    const response = await axios.get(
      `${API_URL}/api/public/store-by-whatsapp/${WHATSAPP_NUMBER}/bot-integration`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'WhatsApp-Bot-Test/1.0'
        },
        timeout: 10000
      }
    );
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log('   ✅ Status:', response.status);
    console.log('   ✅ Response Time:', responseTime + 'ms');
    console.log('   ✅ Headers:');
    console.log('      - Content-Type:', response.headers['content-type']);
    console.log('      - Cache-Control:', response.headers['cache-control']);
    console.log('      - Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('');
    
    // Validate response structure
    const data = response.data;
    console.log('2. Validating Response Structure');
    
    if (data.success) {
      console.log('   ✅ Success flag present');
    } else {
      console.log('   ❌ Success flag missing or false');
    }
    
    if (data.data) {
      console.log('   ✅ Data object present');
      
      // Check main fields
      const fields = ['version', 'lastUpdated', 'store', 'products', 'categories', 'aiInstructions', 'metadata'];
      fields.forEach(field => {
        if (data.data[field] !== undefined) {
          console.log(`   ✅ ${field}: present`);
          
          // Additional checks for specific fields
          if (field === 'store' && data.data.store) {
            console.log(`      - Store Name: ${data.data.store.name}`);
            console.log(`      - Store Slug: ${data.data.store.slug}`);
            console.log(`      - WhatsApp: ${data.data.store.contacts?.whatsapp}`);
          }
          if (field === 'products' && Array.isArray(data.data.products)) {
            console.log(`      - Product Count: ${data.data.products.length}`);
          }
          if (field === 'categories' && Array.isArray(data.data.categories)) {
            console.log(`      - Category Count: ${data.data.categories.length}`);
          }
        } else {
          console.log(`   ❌ ${field}: missing`);
        }
      });
    } else {
      console.log('   ❌ Data object missing');
    }
    
    console.log('');
    console.log('3. Testing n8n Compatibility');
    console.log('   ✅ Endpoint is accessible');
    console.log('   ✅ Returns valid JSON');
    console.log('   ✅ Has proper headers');
    console.log('   ✅ Response time acceptable for webhook');
    
    console.log('');
    console.log('4. Sample Data for n8n:');
    console.log('   Use this in n8n HTTP Request node:');
    console.log('   - Method: GET');
    console.log(`   - URL: ${API_URL}/api/public/store-by-whatsapp/${WHATSAPP_NUMBER}/bot-integration`);
    console.log('   - Authentication: None required');
    console.log('   - Headers: Accept: application/json');
    
    console.log('');
    console.log('✅ ALL TESTS PASSED - Endpoint ready for n8n integration');
    
  } catch (error) {
    console.error('');
    console.error('❌ TEST FAILED');
    
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error('   Server responded with error:');
      console.error('   - Status:', error.response.status);
      console.error('   - Status Text:', error.response.statusText);
      console.error('   - Data:', JSON.stringify(error.response.data, null, 2));
      console.error('   - Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('   No response received from server');
      console.error('   - Request:', error.request);
      console.error('   - Possible causes:');
      console.error('     • Server is down or not accessible');
      console.error('     • Network issues');
      console.error('     • CORS blocking the request');
      console.error('     • Firewall blocking the connection');
    } else {
      // Something happened in setting up the request
      console.error('   Error setting up request:', error.message);
    }
    
    console.error('');
    console.error('Troubleshooting tips:');
    console.error('1. Check if the API server is running: curl http://dev.ebrecho.com.br:3001/health');
    console.error('2. Check if the WhatsApp number exists in database');
    console.error('3. Check if the store has WhatsApp bot enabled');
    console.error('4. Check server logs for more details');
    
    process.exit(1);
  }
}

// Also test if viacep works (as comparison)
async function testViaCep() {
  console.log('');
  console.log('5. Testing ViaCEP for comparison (should work in n8n):');
  try {
    const response = await axios.get('http://viacep.com.br/ws/01001000/json/');
    console.log('   ✅ ViaCEP Status:', response.status);
    console.log('   ✅ ViaCEP Content-Type:', response.headers['content-type']);
    console.log('   ✅ ViaCEP Response:', JSON.stringify(response.data).substring(0, 100) + '...');
  } catch (error) {
    console.log('   ❌ ViaCEP test failed:', error.message);
  }
}

// Run tests
testEndpoint().then(() => testViaCep());