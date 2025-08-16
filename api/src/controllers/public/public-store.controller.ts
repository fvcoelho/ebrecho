import { Request, Response } from 'express';
import { prisma } from '../../prisma';

/**
 * @swagger
 * /api/public/store/{slug}:
 *   get:
 *     tags:
 *       - Public Store
 *     summary: Get public store information by slug
 *     description: Retrieve public store data including basic information, address, and product count. No authentication required.
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
 *         description: Store information retrieved successfully
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
 *                     id:
 *                       type: string
 *                       example: cmdv0f2m80006sb9bnap4hmg9
 *                     slug:
 *                       type: string
 *                       example: eco-fashion
 *                     name:
 *                       type: string
 *                       example: Eco Fashion
 *                     publicDescription:
 *                       type: string
 *                       nullable: true
 *                       example: Sustainable fashion for conscious consumers
 *                     publicBanner:
 *                       type: string
 *                       nullable: true
 *                       example: https://example.com/banner.jpg
 *                     publicLogo:
 *                       type: string
 *                       nullable: true
 *                       example: https://example.com/logo.jpg
 *                     whatsappNumber:
 *                       type: string
 *                       nullable: true
 *                       example: +5511999999999
 *                     publicEmail:
 *                       type: string
 *                       nullable: true
 *                       example: contact@ecofashion.com
 *                     businessHours:
 *                       type: object
 *                       nullable: true
 *                       example: {"monday": "09:00-18:00", "tuesday": "09:00-18:00"}
 *                     socialLinks:
 *                       type: object
 *                       nullable: true
 *                       example: {"instagram": "@ecofashion", "facebook": "ecofashion"}
 *                     pixKey:
 *                       type: string
 *                       nullable: true
 *                       example: "user@example.com"
 *                     productCount:
 *                       type: integer
 *                       example: 42
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2025-08-03T01:35:34.010Z
 *                     address:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         street:
 *                           type: string
 *                           example: Rua das Flores
 *                         number:
 *                           type: string
 *                           example: 123
 *                         complement:
 *                           type: string
 *                           nullable: true
 *                           example: Loja 2
 *                         neighborhood:
 *                           type: string
 *                           example: Centro
 *                         city:
 *                           type: string
 *                           example: São Paulo
 *                         state:
 *                           type: string
 *                           example: SP
 *                         zipCode:
 *                           type: string
 *                           example: 01234-567
 *       400:
 *         description: Bad request - slug is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: Slug is required
 *       404:
 *         description: Store not found or not public
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: Store not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: Internal server error
 */
export const getPublicStoreBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    console.log('[DEBUG] getPublicStoreBySlug called with slug:', slug);
    
    if (!slug) {
      console.log('[DEBUG] No slug provided');
      return res.status(400).json({
        success: false,
        error: 'Slug is required'
      });
    }

    console.log('[DEBUG] Searching for store with conditions:', {
      slug: slug.toLowerCase(),
      isActive: true,
      isPublicActive: true
    });

    // Find store by slug that is active and public
    const store = await prisma.partner.findFirst({
      where: {
        slug: slug.toLowerCase(),
        isActive: true,
        isPublicActive: true
      },
      select: {
        id: true,
        slug: true,
        name: true,
        publicDescription: true,
        publicBanner: true,
        publicLogo: true,
        whatsappNumber: true,
        publicEmail: true,
        businessHours: true,
        socialLinks: true,
        pixKey: true,
        address: {
          select: {
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
            zipCode: true
          }
        },
        _count: {
          select: {
            products: {
              where: {
                isPublicVisible: true,
                status: 'AVAILABLE'
              }
            }
          }
        },
        createdAt: true
      }
    });

    console.log('[DEBUG] Database query result:', store);

    if (!store) {
      console.log('[DEBUG] Store not found in database');
      
      // Let's also check if the store exists but doesn't meet the conditions
      const storeCheck = await prisma.partner.findFirst({
        where: {
          slug: slug.toLowerCase()
        },
        select: {
          id: true,
          slug: true,
          name: true,
          isActive: true,
          isPublicActive: true
        }
      });
      
      console.log('[DEBUG] Store exists check:', storeCheck);
      
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    console.log('[DEBUG] Store found:', store.name, 'ID:', store.id);

    // Format response
    const publicStore = {
      ...store,
      productCount: store._count.products,
      _count: undefined,
      address: store.address ? {
        street: store.address.street,
        number: store.address.number,
        complement: store.address.complement,
        neighborhood: store.address.neighborhood,
        city: store.address.city,
        state: store.address.state,
        zipCode: store.address.zipCode
      } : undefined
    };

    console.log('[DEBUG] Sending response:', JSON.stringify(publicStore, null, 2));

    res.json({
      success: true,
      data: publicStore
    });

  } catch (error) {
    console.error('Error fetching public store:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /api/public/store/{slug}/categories:
 *   get:
 *     tags:
 *       - Public Store
 *     summary: Get store product categories
 *     description: Retrieve available product categories for a public store with product counts. No authentication required.
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
 *         description: Store categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         example: Vestidos
 *                       count:
 *                         type: integer
 *                         example: 15
 *             example:
 *               success: true
 *               data:
 *                 - name: Vestidos
 *                   count: 15
 *                 - name: Blusas
 *                   count: 12
 *                 - name: Calças
 *                   count: 8
 *       404:
 *         description: Store not found or not public
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: Store not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getStoreCategories = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // First verify the store exists and is public
    const store = await prisma.partner.findFirst({
      where: {
        slug: slug.toLowerCase(),
        isActive: true,
        isPublicActive: true
      },
      select: {
        id: true
      }
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    // Get categories with product counts
    const categories = await prisma.product.groupBy({
      by: ['category'],
      where: {
        partnerId: store.id,
        isPublicVisible: true,
        status: 'AVAILABLE'
      },
      _count: {
        category: true
      },
      orderBy: {
        _count: {
          category: 'desc'
        }
      }
    });

    const formattedCategories = categories.map(cat => ({
      name: cat.category,
      count: cat._count.category
    }));

    res.json({
      success: true,
      data: formattedCategories
    });

  } catch (error) {
    console.error('Error fetching store categories:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /api/public/store/{slug}/view:
 *   post:
 *     tags:
 *       - Public Store
 *     summary: Register store view for analytics
 *     description: Track store page views for analytics purposes. No authentication required.
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *           example: eco-fashion
 *         description: Unique store slug identifier
 *     requestBody:
 *       description: Optional analytics data
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referrer:
 *                 type: string
 *                 example: https://google.com
 *                 description: URL of the page that referred to this store
 *               userAgent:
 *                 type: string
 *                 example: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
 *                 description: Browser user agent string
 *     responses:
 *       200:
 *         description: Store view registered successfully
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
 *                   example: View registered
 *       404:
 *         description: Store not found or not public
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error: Store not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const registerStoreView = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { referrer, userAgent } = req.body;

    // Verify store exists
    const store = await prisma.partner.findFirst({
      where: {
        slug: slug.toLowerCase(),
        isActive: true,
        isPublicActive: true
      },
      select: {
        id: true
      }
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        error: 'Store not found'
      });
    }

    // TODO: Implement analytics tracking
    // For now, just return success
    res.json({
      success: true,
      message: 'View registered'
    });

  } catch (error) {
    console.error('Error registering store view:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};