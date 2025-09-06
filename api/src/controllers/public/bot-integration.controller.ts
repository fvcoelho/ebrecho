import { Request, Response } from 'express';
import { prisma } from '../../prisma';

/**
 * @swagger
 * /api/public/store/{slug}/bot-integration:
 *   get:
 *     tags:
 *       - Public Store
 *     summary: Get bot integration data for a store
 *     description: Retrieve complete store data formatted for chatbot integration, including products, AI instructions, and store information. No authentication required.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: eco-fashion
 *         description: Unique store slug identifier
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
 *                       example: "2025-01-15T10:30:00.000Z"
 *                     store:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: cmdv0f2m80006sb9bnap4hmg9
 *                         name:
 *                           type: string
 *                           example: Eco Fashion
 *                         slug:
 *                           type: string
 *                           example: eco-fashion
 *                         description:
 *                           type: string
 *                           example: Sustainable fashion for conscious consumers
 *                         logo:
 *                           type: string
 *                           nullable: true
 *                           example: https://example.com/logo.jpg
 *                         banner:
 *                           type: string
 *                           nullable: true
 *                           example: https://example.com/banner.jpg
 *                         contacts:
 *                           type: object
 *                           properties:
 *                             whatsapp:
 *                               type: string
 *                               nullable: true
 *                               example: "+5511999999999"
 *                             whatsappName:
 *                               type: string
 *                               nullable: true
 *                               example: "Atendimento Eco Fashion"
 *                             email:
 *                               type: string
 *                               nullable: true
 *                               example: contact@ecofashion.com
 *                             phone:
 *                               type: string
 *                               example: "+5511999999999"
 *                         address:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             street:
 *                               type: string
 *                               example: Rua das Flores
 *                             number:
 *                               type: string
 *                               example: "123"
 *                             complement:
 *                               type: string
 *                               nullable: true
 *                               example: Loja 2
 *                             neighborhood:
 *                               type: string
 *                               example: Centro
 *                             city:
 *                               type: string
 *                               example: São Paulo
 *                             state:
 *                               type: string
 *                               example: SP
 *                             zipCode:
 *                               type: string
 *                               example: "01234-567"
 *                             latitude:
 *                               type: number
 *                               nullable: true
 *                               example: -23.5505
 *                             longitude:
 *                               type: number
 *                               nullable: true
 *                               example: -46.6333
 *                         businessHours:
 *                           type: object
 *                           example: {"monday": {"open": "09:00", "close": "18:00"}, "sunday": {"closed": true}}
 *                         socialLinks:
 *                           type: object
 *                           example: {"instagram": "@ecofashion", "facebook": "ecofashion"}
 *                         paymentMethods:
 *                           type: object
 *                           properties:
 *                             pix:
 *                               type: object
 *                               properties:
 *                                 enabled:
 *                                   type: boolean
 *                                   example: true
 *                                 key:
 *                                   type: string
 *                                   nullable: true
 *                                   example: user@example.com
 *                             cash:
 *                               type: boolean
 *                               example: true
 *                             card:
 *                               type: boolean
 *                               example: true
 *                     products:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: cmdv0f2m80006sb9bnap4hmg9
 *                           name:
 *                             type: string
 *                             example: Vestido Floral Vintage
 *                           description:
 *                             type: string
 *                             example: Lindo vestido com estampa floral
 *                           price:
 *                             type: number
 *                             example: 89.90
 *                           category:
 *                             type: string
 *                             example: Vestidos
 *                           brand:
 *                             type: string
 *                             nullable: true
 *                             example: Zara
 *                           size:
 *                             type: string
 *                             nullable: true
 *                             example: M
 *                           color:
 *                             type: string
 *                             nullable: true
 *                             example: Azul
 *                           condition:
 *                             type: string
 *                             enum: [NEW, LIKE_NEW, GOOD, FAIR]
 *                             example: LIKE_NEW
 *                           photos:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["https://example.com/photo1.jpg"]
 *                           tags:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["vintage", "floral"]
 *                           viewCount:
 *                             type: integer
 *                             example: 25
 *                           url:
 *                             type: string
 *                             example: https://example.com/eco-fashion/produto/cmdv0f2m80006sb9bnap4hmg9
 *                           addedDate:
 *                             type: string
 *                             format: date-time
 *                           lastUpdated:
 *                             type: string
 *                             format: date-time
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: Vestidos
 *                           count:
 *                             type: integer
 *                             example: 15
 *                     aiInstructions:
 *                       type: object
 *                       properties:
 *                         greeting:
 *                           type: string
 *                           example: "Olá! Bem-vindo à Eco Fashion! Como posso ajudá-lo hoje?"
 *                         tone:
 *                           type: string
 *                           example: "profissional e amigável"
 *                         specialInstructions:
 *                           type: string
 *                           example: "Seja prestativo e informativo sobre os produtos disponíveis."
 *                         faq:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               question:
 *                                 type: string
 *                                 example: "Quais são os horários de funcionamento?"
 *                               answer:
 *                                 type: string
 *                                 example: "Funcionamos de segunda a sexta das 9h às 18h."
 *                         productRecommendations:
 *                           type: object
 *                           properties:
 *                             enabled:
 *                               type: boolean
 *                               example: true
 *                             maxSuggestions:
 *                               type: integer
 *                               example: 3
 *                             basedOn:
 *                               type: array
 *                               items:
 *                                 type: string
 *                               example: ["category", "price", "condition"]
 *                         priceNegotiation:
 *                           type: object
 *                           properties:
 *                             enabled:
 *                               type: boolean
 *                               example: false
 *                             maxDiscount:
 *                               type: number
 *                               example: 0
 *                             requiresApproval:
 *                               type: boolean
 *                               example: true
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         totalProducts:
 *                           type: integer
 *                           example: 42
 *                         availableProducts:
 *                           type: integer
 *                           example: 42
 *                         storeCreatedAt:
 *                           type: string
 *                           format: date-time
 *                         dataVersion:
 *                           type: string
 *                           example: "1.0.0"
 *                         apiEndpoint:
 *                           type: string
 *                           example: "http://localhost:3001/api/public/store/eco-fashion/bot-integration"
 *                         updateFrequency:
 *                           type: string
 *                           example: "realtime"
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
 *                   example: Store not found
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
export const getBotIntegration = async (req: Request<{ slug: string }>, res: Response) => {
  try {
    const { slug } = req.params;

    const store = await prisma.partner.findFirst({
      where: {
        slug: slug.toLowerCase(),
        isActive: true,
        isPublicActive: true
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
        error: 'Store not found'
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
          cash: true,
          card: true,
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
    console.error('Error fetching bot integration data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch bot integration data'
    });
  }
};

/**
 * @swagger
 * /api/partners/{partnerId}/ai-instructions:
 *   put:
 *     tags:
 *       - Partners
 *     summary: Update AI instructions for bot integration
 *     description: Update the AI instructions that control chatbot behavior for a partner store. Requires PARTNER_ADMIN or ADMIN role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *         example: cmdv0f2m80006sb9bnap4hmg9
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - aiInstructions
 *             properties:
 *               aiInstructions:
 *                 type: object
 *                 properties:
 *                   greeting:
 *                     type: string
 *                     example: "Olá! Bem-vindo à nossa loja! Como posso ajudá-lo hoje?"
 *                     description: Welcome message for customers
 *                   tone:
 *                     type: string
 *                     example: "profissional e amigável"
 *                     description: Bot's tone of voice
 *                   specialInstructions:
 *                     type: string
 *                     example: "Sempre mencione nossa promoção atual e enfatize a qualidade dos produtos."
 *                     description: Special instructions for bot behavior
 *                   faq:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         question:
 *                           type: string
 *                           example: "Quais são os horários de funcionamento?"
 *                         answer:
 *                           type: string
 *                           example: "Funcionamos de segunda a sexta das 9h às 18h."
 *                     description: Frequently asked questions and answers
 *                   productRecommendations:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                         example: true
 *                         description: Enable product recommendations
 *                       maxSuggestions:
 *                         type: integer
 *                         example: 3
 *                         minimum: 1
 *                         maximum: 10
 *                         description: Maximum number of product suggestions
 *                       basedOn:
 *                         type: array
 *                         items:
 *                           type: string
 *                           enum: [category, price, condition, brand, size]
 *                         example: ["category", "price", "condition"]
 *                         description: Criteria for product recommendations
 *                   priceNegotiation:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                         example: false
 *                         description: Allow price negotiation
 *                       maxDiscount:
 *                         type: number
 *                         example: 10
 *                         minimum: 0
 *                         maximum: 100
 *                         description: Maximum discount percentage
 *                       requiresApproval:
 *                         type: boolean
 *                         example: true
 *                         description: Require manual approval for discounts
 *     responses:
 *       200:
 *         description: AI instructions updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "AI instructions updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: cmdv0f2m80006sb9bnap4hmg9
 *                     name:
 *                       type: string
 *                       example: "Eco Fashion"
 *                     aiInstructions:
 *                       type: object
 *                       description: Updated AI instructions object
 *       400:
 *         description: Invalid AI instructions format
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
 *                   example: "Invalid AI instructions format"
 *       401:
 *         description: Authentication required
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
 *                   example: "Unauthorized"
 *       403:
 *         description: Insufficient permissions
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
 *                   example: "Forbidden"
 *       404:
 *         description: Partner not found
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
 *                   example: "Partner not found"
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
 *                   example: "Failed to update AI instructions"
 */
/**
 * @swagger
 * /api/public/store-by-whatsapp/{whatsappNumber}/bot-integration:
 *   get:
 *     tags:
 *       - Public Store
 *     summary: Get bot integration data by WhatsApp number
 *     description: Retrieve complete store data formatted for chatbot integration using WhatsApp number. Used by Evolution API webhooks.
 *     parameters:
 *       - in: path
 *         name: whatsappNumber
 *         required: true
 *         schema:
 *           type: string
 *           example: 5511963166165
 *         description: Store WhatsApp number (digits only)
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
 *                   description: Same structure as getBotIntegration endpoint
 *       404:
 *         description: Store not found or WhatsApp bot not enabled
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
 */
export const getBotIntegrationByWhatsApp = async (req: Request<{ whatsappNumber: string }>, res: Response) => {
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

    const aiInstructions = store.aiInstructions || defaultAiInstructions;

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
          cash: true,
          card: true,
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
        apiEndpoint: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/public/store-by-whatsapp/${whatsappNumber}/bot-integration`,
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

export const updateAiInstructions = async (req: Request<{ partnerId: string }>, res: Response) => {
  try {
    const { partnerId } = req.params;
    const { aiInstructions } = req.body;

    if (!aiInstructions || typeof aiInstructions !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid AI instructions format'
      });
    }

    const updatedPartner = await prisma.partner.update({
      where: {
        id: partnerId
      },
      data: {
        aiInstructions: aiInstructions
      },
      select: {
        id: true,
        name: true,
        aiInstructions: true
      }
    });

    return res.status(200).json({
      success: true,
      message: 'AI instructions updated successfully',
      data: updatedPartner
    });

  } catch (error) {
    console.error('Error updating AI instructions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update AI instructions'
    });
  }
};