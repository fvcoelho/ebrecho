// THIS FILE IS DEPRECATED - Use bot-integration.controller.ts with slug-based route instead
// Keeping code for reference but it's not being used
/*
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
*/

/**
 * @swagger
 * /api/public/store-by-whatsapp/{whatsappNumber}/bot-integration:
 *   get:
 *     tags:
 *       - Public
 *     summary: Get bot integration data by WhatsApp number
 *     description: Retrieve store data and AI instructions for WhatsApp bot integration using phone number
 *     parameters:
 *       - in: path
 *         name: whatsappNumber
 *         required: true
 *         schema:
 *           type: string
 *         description: WhatsApp phone number
 *         example: 11963166165
 *     responses:
 *       200:
 *         description: Bot integration data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     version:
 *                       type: string
 *                       example: "1.0"
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                     store:
 *                       type: object
 *                     products:
 *                       type: array
 *                     categories:
 *                       type: array
 *                     aiInstructions:
 *                       type: object
 *                     metadata:
 *                       type: object
 *       404:
 *         description: Store not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Store not found or WhatsApp bot not enabled for this number
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Failed to fetch bot integration data
 */
// export const getBotIntegrationByWhatsApp = async (req: Request<{ whatsappNumber: string }>, res: Response) => {
const getBotIntegrationByWhatsApp = async (req: any, res: any) => {
  try {
    const { whatsappNumber } = req.params;

    if (!whatsappNumber) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp number is required'
      });
    }

    // Clean the WhatsApp number (remove any formatting)
    const cleanNumber = whatsappNumber.replace(/\D/g, '');

    const store = await prisma.partner.findFirst({
      where: {
        whatsappNumber: {
          contains: cleanNumber
        },
        isActive: true, 
        isPublicActive: true,
        whatsappBotEnabled: true
      },
      include: {
        address: true,
        aiInstructionsModel: true,
        products: {
          where: {
            status: 'AVAILABLE'
          },
          include: {
            images: {
              select: {
                originalUrl: true,
                processedUrl: true,
                thumbnailUrl: true,
                order: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found or WhatsApp bot not enabled for this number'
      });
    }

    const categoryCount = await prisma.product.groupBy({
      by: ['category'],
      where: {
        partnerId: store.id,
        status: 'AVAILABLE'
      },
      _count: {
        category: true
      }
    });

    const categories = categoryCount.map(cat => ({
      name: cat.category,
      count: cat._count.category
    }));

    const defaultAiInstructions = {
      prompt: `Função:
Você é um agente virtual de atendimento ao cliente de uma loja. Seu papel é atender clientes de forma educada, clara e eficiente, ajudando em dúvidas sobre produtos, pedidos, prazos de entrega, formas de pagamento, promoções e políticas da loja.

Instruções principais:

Sempre cumprimente o cliente de forma simpática e acolhedora.

Responda de maneira objetiva, mas cordial, adaptando o tom conforme a conversa.

Caso não tenha certeza sobre uma resposta, explique a limitação e ofereça ajuda alternativa (ex: "posso encaminhar para um atendente humano").

Priorize:

Informações sobre produtos disponíveis (descrição, variações, preços, promoções).

Status de pedidos (pagamento, envio, prazo de entrega, rastreamento).

Políticas da loja (trocas, devoluções, garantia, formas de pagamento).

Atendimento personalizado (recomendar produtos, auxiliar na finalização da compra).

Seja sempre educado e positivo, mesmo diante de reclamações.

Utilize linguagem simples e próxima, evitando termos técnicos desnecessários.

Quando possível, faça perguntas para entender melhor a necessidade do cliente.

Exemplo de início de conversa:
👋 Olá! Bem-vindo(a) à ${store.name}. Como posso ajudar você hoje?

Deseja informações sobre um produto?

Consultar o status de um pedido?

Ou conhecer nossas promoções atuais?`,

      greeting: `Olá! Bem-vindo à ${store.name}! Como posso ajudá-lo hoje?`,
      tone: 'profissional e amigável',
      specialInstructions: 'Seja prestativo e informativo sobre os produtos disponíveis.',
      faq: [
        {
          question: 'Quais são os horários de funcionamento?',
          answer: store.businessHours ? 'Nossos horários estão disponíveis na seção de informações da loja.' : 'Entre em contato para saber nossos horários.'
        },
        {
          question: 'Como posso fazer uma compra?',
          answer: 'Você pode entrar em contato conosco pelo WhatsApp ou visitar nossa loja física.'
        },
        {
          question: 'Vocês aceitam devoluções?',
          answer: 'Sim, aceitamos devoluções conforme nossa política. Entre em contato para mais informações.'
        }
      ],
      productRecommendations: {
        enabled: true,
        maxSuggestions: 3,
        basedOn: ['category', 'price', 'condition']
      },
      priceNegotiation: {
        enabled: false,
        maxDiscount: 0,
        requiresApproval: true
      }
    };

    // Use database AiInstructions model if available, otherwise fall back to JSON field or default
    let aiInstructions;
    if (store.aiInstructionsModel?.prompt) {
      // Use database model with structured data
      aiInstructions = {
        prompt: store.aiInstructionsModel.prompt,
        greeting: `Olá! Bem-vindo à ${store.name}! Como posso ajudá-lo hoje?`,
        tone: 'profissional e amigável', 
        specialInstructions: 'Seja prestativo e informativo sobre os produtos disponíveis.',
        faq: [
          {
            question: 'Quais são os horários de funcionamento?',
            answer: store.businessHours ? 'Nossos horários estão disponíveis na seção de informações da loja.' : 'Entre em contato para saber nossos horários.'
          },
          {
            question: 'Como posso fazer uma compra?',
            answer: 'Você pode entrar em contato conosco pelo WhatsApp ou visitar nossa loja física.'
          },
          {
            question: 'Vocês aceitam devoluções?',
            answer: 'Sim, aceitamos devoluções conforme nossa política. Entre em contato para mais informações.'
          }
        ],
        productRecommendations: {
          enabled: true,
          maxSuggestions: 3,
          basedOn: ['category', 'price', 'condition']
        },
        priceNegotiation: {
          enabled: false,
          maxDiscount: 0,
          requiresApproval: true
        }
      };
    } else {
      // Fall back to JSON field or default instructions
      aiInstructions = store.aiInstructions || defaultAiInstructions;
    }

    const botIntegrationData = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description || `Bem-vindo à ${store.name}`,
        logo: store.publicLogo || store.logo,
        banner: store.publicBanner,
        contacts: {
          whatsapp: store.whatsappNumber,
          whatsappName: store.whatsappName,
          email: store.publicEmail || store.email,
          phone: store.phone
        },
        address: store.address ? {
          street: store.address.street,
          number: store.address.number,
          complement: store.address.complement,
          neighborhood: store.address.neighborhood,
          city: store.address.city,
          state: store.address.state,
          zipCode: store.address.zipCode
        } : null,
        businessHours: store.businessHours || {
          monday: { open: '09:00', close: '18:00' },
          tuesday: { open: '09:00', close: '18:00' },
          wednesday: { open: '09:00', close: '18:00' },
          thursday: { open: '09:00', close: '18:00' },
          friday: { open: '09:00', close: '18:00' },
          saturday: { open: '09:00', close: '13:00' },
          sunday: { closed: true }
        },
        socialLinks: store.socialLinks || {},
        paymentMethods: {
          pix: store.pixKey ? {
            enabled: true,
            key: store.pixKey
          } : { enabled: false },
          cards: true,
          cash: true,
          transfer: false
        }
      },
      products: store.products.map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        category: product.category,
        brand: product.brand,
        size: product.size,
        color: product.color,
        condition: product.condition,
        sku: product.sku,
        slug: product.slug,
        images: product.images?.map(img => ({
          original: img.originalUrl,
          processed: img.processedUrl,
          thumbnail: img.thumbnailUrl,
          order: img.order
        })) || [],
        tags: product.publicTags || [],
        viewCount: product.viewCount,
        url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/${store.slug}/produto/${product.slug || product.id}`,
        addedDate: product.createdAt,
        lastUpdated: product.updatedAt
      })),
      categories: categories,
      aiInstructions: aiInstructions,
      metadata: {
        totalProducts: store.products.length,
        availableProducts: store.products.length,
        storeCreatedAt: store.createdAt,
        dataVersion: '1.0.0',
        apiEndpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/store/${store.slug}/bot-integration`,
        updateFrequency: 'realtime'
      }
    };

    res.set('Cache-Control', 'public, max-age=300');
    
    return res.status(200).json({
      success: true,
      data: botIntegrationData
    });

  } catch (error) {
    console.error('Error in getBotIntegrationByWhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Export empty object to avoid import errors
export {};