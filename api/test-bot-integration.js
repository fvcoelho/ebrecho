const { PrismaClient } = require('@prisma/client');

async function testBotIntegration() {
  const prisma = new PrismaClient();

  try {
    // Create a test store for development
    const testStore = await prisma.partner.upsert({
      where: { slug: 'test-store' },
      update: {
        name: 'Test Store',
        description: 'Test store for bot integration',
        isActive: true,
        isPublicActive: true,
        whatsappNumber: '+5511999999999',
        whatsappName: 'Test Bot',
        businessHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '09:00', close: '13:00' },
          sunday: { closed: true }
        },
        socialLinks: {
          instagram: '@teststore',
          facebook: 'teststore'
        },
        pixKey: 'test@example.com',
        aiInstructions: {
          greeting: 'Olá! Bem-vindo à Test Store! Como posso ajudá-lo?',
          tone: 'profissional e amigável',
          specialInstructions: 'Seja prestativo e sempre mencione nossas promoções.',
          faq: [
            {
              question: 'Quais são os horários de funcionamento?',
              answer: 'Funcionamos de segunda a sexta das 9h às 18h e sábado das 9h às 13h.'
            },
            {
              question: 'Como posso fazer uma compra?',
              answer: 'Você pode entrar em contato conosco pelo WhatsApp ou visitar nossa loja.'
            }
          ],
          productRecommendations: {
            enabled: true,
            maxSuggestions: 3,
            basedOn: ['category', 'price']
          },
          priceNegotiation: {
            enabled: false,
            maxDiscount: 0,
            requiresApproval: true
          }
        }
      },
      create: {
        id: 'test-store-id',
        name: 'Test Store',
        email: 'test@example.com',
        phone: '+5511999999999',
        document: '12345678000199',
        documentType: 'CNPJ',
        description: 'Test store for bot integration',
        slug: 'test-store',
        isActive: true,
        isPublicActive: true,
        whatsappNumber: '+5511999999999',
        whatsappName: 'Test Bot',
        businessHours: {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '09:00', close: '13:00' },
          sunday: { closed: true }
        },
        socialLinks: {
          instagram: '@teststore',
          facebook: 'teststore'
        },
        pixKey: 'test@example.com',
        aiInstructions: {
          greeting: 'Olá! Bem-vindo à Test Store! Como posso ajudá-lo?',
          tone: 'profissional e amigável',
          specialInstructions: 'Seja prestativo e sempre mencione nossas promoções.',
          faq: [
            {
              question: 'Quais são os horários de funcionamento?',
              answer: 'Funcionamos de segunda a sexta das 9h às 18h e sábado das 9h às 13h.'
            },
            {
              question: 'Como posso fazer uma compra?',
              answer: 'Você pode entrar em contato conosco pelo WhatsApp ou visitar nossa loja.'
            }
          ],
          productRecommendations: {
            enabled: true,
            maxSuggestions: 3,
            basedOn: ['category', 'price']
          },
          priceNegotiation: {
            enabled: false,
            maxDiscount: 0,
            requiresApproval: true
          }
        }
      }
    });

    // Create a test product
    const testProduct = await prisma.product.upsert({
      where: { 
        partnerId_sku: {
          partnerId: testStore.id,
          sku: 'TEST-001'
        }
      },
      update: {},
      create: {
        name: 'Vestido Teste',
        description: 'Lindo vestido para testes',
        price: 89.90,
        sku: 'TEST-001',
        category: 'Vestidos',
        brand: 'Test Brand',
        size: 'M',
        color: 'Azul',
        condition: 'LIKE_NEW',
        status: 'AVAILABLE',
        slug: 'vestido-teste',
        isPublicVisible: true,
        publicTags: ['teste', 'vestido'],
        partnerId: testStore.id
      }
    });

    console.log('✅ Test store and product created successfully!');
    console.log('Store ID:', testStore.id);
    console.log('Store Slug:', testStore.slug);
    console.log('Product ID:', testProduct.id);
    console.log('\nTest the bot integration endpoint:');
    console.log('curl http://localhost:3001/api/public/store/test-store/bot-integration | jq');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBotIntegration();