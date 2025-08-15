import { Router } from 'express';
import {
  getPublicProducts,
  getPublicProductBySlug,
  registerProductView
} from '../../controllers/public/public-product.controller';

const router = Router();

/**
 * @swagger
 * /api/public/store/{slug}/products:
 *   get:
 *     summary: Get public products from store
 *     description: Get list of public products from a specific store
 *     tags: [Public Store]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Store slug identifier
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *         description: Filter by subcategory
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: condition
 *         schema:
 *           type: string
 *           enum: [NEW, LIKE_NEW, GOOD, FAIR]
 *         description: Filter by condition
 *       - in: query
 *         name: size
 *         schema:
 *           type: string
 *         description: Filter by size
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, price_asc, price_desc, popular]
 *           default: newest
 *         description: Sort order
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Products retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         products:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Product'
 *                         meta:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *                         filters:
 *                           type: object
 *                           properties:
 *                             categories:
 *                               type: array
 *                             brands:
 *                               type: array
 *                             sizes:
 *                               type: array
 *                             priceRange:
 *                               type: object
 *                               properties:
 *                                 min:
 *                                   type: number
 *                                 max:
 *                                   type: number
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/store/:slug/products', getPublicProducts);

/**
 * @swagger
 * /api/public/store/{slug}/product/{productSlug}:
 *   get:
 *     summary: Get public product by slug
 *     description: Get detailed information about a specific product
 *     tags: [Public Store]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Store slug identifier
 *       - in: path
 *         name: productSlug
 *         required: true
 *         schema:
 *           type: string
 *         description: Product slug identifier
 *     responses:
 *       200:
 *         description: Product retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       allOf:
 *                         - $ref: '#/components/schemas/Product'
 *                         - type: object
 *                           properties:
 *                             store:
 *                               type: object
 *                               properties:
 *                                 id:
 *                                   type: string
 *                                 name:
 *                                   type: string
 *                                 slug:
 *                                   type: string
 *                                 logo:
 *                                   type: string
 *                             relatedProducts:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Product'
 *                             recommendations:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/Product'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/store/:slug/product/:productSlug', getPublicProductBySlug);

/**
 * @swagger
 * /api/public/store/{slug}/product/{productId}/view:
 *   post:
 *     summary: Register product view
 *     description: Register a product view for analytics tracking
 *     tags: [Public Store]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Store slug identifier
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referrer:
 *                 type: string
 *                 description: Referrer URL
 *               userAgent:
 *                 type: string
 *                 description: User agent string
 *               sessionId:
 *                 type: string
 *                 description: Session identifier
 *     responses:
 *       200:
 *         description: View registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post('/store/:slug/product/:productId/view', registerProductView);

export default router;