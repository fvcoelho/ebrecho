import { Router } from 'express';
import {
  getPublicStoreBySlug,
  getStoreCategories,
  registerStoreView
} from '../../controllers/public/public-store.controller';

const router = Router();

/**
 * @swagger
 * /api/public/store/{slug}:
 *   get:
 *     summary: Get public store by slug
 *     description: Get public store information and settings
 *     tags: [Public Store]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Store slug identifier
 *     responses:
 *       200:
 *         description: Store information retrieved successfully
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
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         slug:
 *                           type: string
 *                         description:
 *                           type: string
 *                         logo:
 *                           type: string
 *                         banner:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         website:
 *                           type: string
 *                         instagram:
 *                           type: string
 *                         businessHours:
 *                           type: object
 *                         settings:
 *                           type: object
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/store/:slug', getPublicStoreBySlug);

/**
 * @swagger
 * /api/public/store/{slug}/categories:
 *   get:
 *     summary: Get store product categories
 *     description: Get available product categories for a specific store
 *     tags: [Public Store]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Store slug identifier
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           category:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           subcategories:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 name:
 *                                   type: string
 *                                 count:
 *                                   type: integer
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get('/store/:slug/categories', getStoreCategories);

/**
 * @swagger
 * /api/public/store/{slug}/view:
 *   post:
 *     summary: Register store view
 *     description: Register a view for analytics tracking
 *     tags: [Public Store]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Store slug identifier
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
 *               ipAddress:
 *                 type: string
 *                 description: Client IP address
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
router.post('/store/:slug/view', registerStoreView);

export default router;