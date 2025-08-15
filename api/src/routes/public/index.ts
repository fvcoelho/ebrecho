import { Router } from 'express';
import publicStoreRoutes from './public-store.routes';
import publicProductRoutes from './public-product.routes';
import publicInvitationRoutes from './public-invitation.routes';

const router = Router();

/**
 * @swagger
 * /api/public/test:
 *   get:
 *     summary: Test public API connectivity
 *     description: Simple endpoint to test if the public API is accessible
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: API is working
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
 *                   example: Public API endpoint is working
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Public API endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mount public routes
router.use(publicStoreRoutes);
router.use(publicProductRoutes);
router.use('/invitations', publicInvitationRoutes);

export default router;