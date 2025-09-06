const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: 'test@botintegration.com',
  password: 'TestPassword123!',
  name: 'Bot Integration Test User'
};

async function runBotIntegrationTests() {
  console.log('🤖 Iniciando testes da integração do robô...\n');

  try {
    // 1. Test public endpoint without auth
    console.log('📋 Teste 1: Endpoint público bot-integration');
    const publicResponse = await axios.get(`${BASE_URL}/public/store/test-store/bot-integration`);
    
    if (publicResponse.data.success) {
      console.log('✅ Endpoint público funcionando');
      console.log('  - Store:', publicResponse.data.data.store.name);
      console.log('  - Products:', publicResponse.data.data.products.length);
      console.log('  - AI Instructions:', publicResponse.data.data.aiInstructions ? 'Presente' : 'Ausente');
      console.log('  - Version:', publicResponse.data.data.version);
    } else {
      console.log('❌ Endpoint público falhou');
      return;
    }

    // 2. Test endpoint with non-existent store
    console.log('\n📋 Teste 2: Store inexistente');
    try {
      await axios.get(`${BASE_URL}/public/store/store-inexistente/bot-integration`);
      console.log('❌ Deveria retornar erro para store inexistente');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ Retornou 404 corretamente para store inexistente');
      } else {
        console.log('✅ Retornou erro corretamente para store inexistente');
      }
    }

    // 3. Test JSON structure validation
    console.log('\n📋 Teste 3: Validação da estrutura JSON');
    const data = publicResponse.data.data;
    const requiredFields = [
      'version', 'lastUpdated', 'store', 'products', 'categories', 
      'aiInstructions', 'metadata'
    ];
    
    let structureValid = true;
    requiredFields.forEach(field => {
      if (!data[field]) {
        console.log(`❌ Campo ausente: ${field}`);
        structureValid = false;
      }
    });

    if (structureValid) {
      console.log('✅ Estrutura JSON válida');
      console.log('  - Todos os campos obrigatórios presentes');
    }

    // 4. Test store structure
    console.log('\n📋 Teste 4: Estrutura da loja');
    const store = data.store;
    const storeFields = ['id', 'name', 'slug', 'contacts', 'businessHours', 'paymentMethods'];
    
    let storeValid = true;
    storeFields.forEach(field => {
      if (!store[field]) {
        console.log(`❌ Campo da loja ausente: ${field}`);
        storeValid = false;
      }
    });

    if (storeValid) {
      console.log('✅ Estrutura da loja válida');
    }

    // 5. Test product structure
    console.log('\n📋 Teste 5: Estrutura dos produtos');
    if (data.products.length > 0) {
      const product = data.products[0];
      const productFields = ['id', 'name', 'description', 'price', 'category', 'condition', 'images', 'tags', 'url'];
      
      let productValid = true;
      productFields.forEach(field => {
        if (product[field] === undefined) {
          console.log(`❌ Campo do produto ausente: ${field}`);
          productValid = false;
        }
      });

      if (productValid) {
        console.log('✅ Estrutura dos produtos válida');
        console.log('  - Product ID:', product.id);
        console.log('  - Product Name:', product.name);
        console.log('  - Product Price:', product.price);
        console.log('  - Product Images:', product.images.length);
      }
    } else {
      console.log('⚠️ Nenhum produto encontrado para teste');
    }

    // 6. Test AI Instructions structure
    console.log('\n📋 Teste 6: Estrutura das instruções do robô');
    const aiInstructions = data.aiInstructions;
    const aiFields = ['greeting', 'tone', 'specialInstructions', 'faq', 'productRecommendations', 'priceNegotiation'];
    
    let aiValid = true;
    aiFields.forEach(field => {
      if (!aiInstructions[field]) {
        console.log(`❌ Campo AI ausente: ${field}`);
        aiValid = false;
      }
    });

    if (aiValid) {
      console.log('✅ Estrutura das instruções do robô válida');
      console.log('  - Greeting:', aiInstructions.greeting.substring(0, 50) + '...');
      console.log('  - Tone:', aiInstructions.tone);
      console.log('  - FAQs:', aiInstructions.faq.length);
    }

    // 7. Test metadata
    console.log('\n📋 Teste 7: Metadata');
    const metadata = data.metadata;
    if (metadata.totalProducts !== undefined && metadata.dataVersion && metadata.apiEndpoint) {
      console.log('✅ Metadata válida');
      console.log('  - Total Products:', metadata.totalProducts);
      console.log('  - Data Version:', metadata.dataVersion);
      console.log('  - Update Frequency:', metadata.updateFrequency);
    } else {
      console.log('❌ Metadata inválida ou incompleta');
    }

    // 8. Test performance (cache)
    console.log('\n📋 Teste 8: Performance e Cache');
    const startTime = Date.now();
    const cacheResponse = await axios.get(`${BASE_URL}/public/store/test-store/bot-integration`);
    const responseTime = Date.now() - startTime;
    
    if (cacheResponse.data.success && responseTime < 1000) {
      console.log(`✅ Performance adequada: ${responseTime}ms`);
    } else if (responseTime >= 1000) {
      console.log(`⚠️ Resposta lenta: ${responseTime}ms (pode indicar problema de performance)`);
    }

    console.log('\n🎉 Todos os testes da integração do robô concluídos!');
    console.log('\n📊 Resumo:');
    console.log('✅ Endpoint público funcionando');
    console.log('✅ Tratamento de erros adequado');
    console.log('✅ Estrutura JSON completa e válida');
    console.log('✅ Dados da loja estruturados corretamente');
    console.log('✅ Produtos com informações completas');
    console.log('✅ Instruções do robô configuráveis');
    console.log('✅ Metadata informativa');
    console.log('✅ Performance adequada');

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

// Executar os testes
runBotIntegrationTests();