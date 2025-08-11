import { Router } from 'express';
import publicStoreRoutes from './public-store.routes';
import publicProductRoutes from './public-product.routes';
import publicInvitationRoutes from './public-invitation.routes';

const router = Router();

// Simple test endpoint for API connectivity
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