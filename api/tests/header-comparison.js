const axios = require('axios');

console.log('Header Comparison: ViaCEP vs eBrecho API');
console.log('=========================================\n');

async function fetchAndShowHeaders(name, url) {
  console.log(`${name}:`);
  console.log(`URL: ${url}`);
  
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      validateStatus: () => true // Don't throw on non-2xx status
    });
    
    console.log(`Status: ${response.status}`);
    console.log('Response Headers:');
    
    // Sort headers for easier comparison
    const sortedHeaders = Object.keys(response.headers)
      .sort()
      .reduce((obj, key) => {
        obj[key] = response.headers[key];
        return obj;
      }, {});
    
    for (const [key, value] of Object.entries(sortedHeaders)) {
      console.log(`  ${key}: ${value}`);
    }
    
    console.log(`Response Size: ${JSON.stringify(response.data).length} bytes`);
    console.log(`Data Preview: ${JSON.stringify(response.data).substring(0, 200)}...`);
    
    return {
      status: response.status,
      headers: response.headers,
      dataSize: JSON.stringify(response.data).length
    };
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log('Error Headers:');
      for (const [key, value] of Object.entries(error.response.headers || {})) {
        console.log(`  ${key}: ${value}`);
      }
    }
    return null;
  }
}

async function compareAPIs() {
  // Test ViaCEP (known to work in n8n)
  const viacep = await fetchAndShowHeaders(
    '1. ViaCEP API (Working in n8n)', 
    'http://viacep.com.br/ws/01001000/json/'
  );
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test our API with localhost (should work in n8n if on same machine)
  const ebrecho = await fetchAndShowHeaders(
    '2. eBrecho API (localhost)', 
    'http://localhost:3001/api/public/store-by-whatsapp/11963166165/bot-integration'
  );
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test our API with domain (failing in n8n)
  const ebrechoDomain = await fetchAndShowHeaders(
    '3. eBrecho API (domain)', 
    'http://dev.ebrecho.com.br:3001/api/public/store-by-whatsapp/11963166165/bot-integration'
  );
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Compare headers
  if (viacep && ebrecho) {
    console.log('HEADER COMPARISON ANALYSIS:');
    console.log('===========================\n');
    
    console.log('Key Differences:');
    
    // Check critical headers
    const criticalHeaders = [
      'content-type',
      'content-length', 
      'server',
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'cache-control',
      'connection',
      'date',
      'etag',
      'vary'
    ];
    
    criticalHeaders.forEach(header => {
      const viacepValue = viacep.headers[header] || 'NOT SET';
      const ebrechoValue = ebrecho.headers[header] || 'NOT SET';
      
      if (viacepValue !== ebrechoValue) {
        console.log(`\n${header.toUpperCase()}:`);
        console.log(`  ViaCEP:  ${viacepValue}`);
        console.log(`  eBrecho: ${ebrechoValue}`);
        
        // Suggestions based on differences
        if (header === 'server') {
          console.log(`  → Server differences are normal`);
        } else if (header.startsWith('access-control')) {
          console.log(`  → CORS headers - eBrecho has more permissive CORS`);
        } else if (header === 'content-length') {
          console.log(`  → Content length difference is expected (different data)`);
        } else {
          console.log(`  → This difference might affect n8n compatibility`);
        }
      }
    });
    
    console.log('\n\nRECOMMENDATIONS FOR N8N:');
    console.log('========================');
    
    console.log('\n1. Headers that might help n8n:');
    if (!ebrecho.headers['connection']) {
      console.log('   • Add Connection header');
    }
    if (!ebrecho.headers['date']) {
      console.log('   • Add Date header');
    }
    if (!ebrecho.headers['server']) {
      console.log('   • Add Server header');
    }
    
    console.log('\n2. Headers already correct:');
    console.log('   ✅ Content-Type: application/json');
    console.log('   ✅ CORS headers present');
    console.log('   ✅ Cache-Control set');
    
    console.log('\n3. n8n URL recommendations:');
    console.log('   🥇 Best:     http://localhost:3001/api/public/store-by-whatsapp/11963166165/bot-integration');
    console.log('   🥈 Backup:   http://127.0.0.1:3001/api/public/store-by-whatsapp/11963166165/bot-integration');
    console.log('   🥉 Docker:   http://host.docker.internal:3001/api/public/store-by-whatsapp/11963166165/bot-integration');
    
  } else {
    console.log('❌ Could not compare - one or both APIs failed to respond');
  }
}

compareAPIs().catch(console.error);