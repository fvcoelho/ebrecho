import { Router } from 'express';
import {
  getPublicStoreBySlug,
  getStoreCategories,
  registerStoreView
} from '../../controllers/public/public-store.controller';
import { getBotIntegration, getBotIntegrationByWhatsApp } from '../../controllers/public/bot-integration.controller';

const router = Router();

// Public store routes - no authentication required
router.get('/store/:slug', getPublicStoreBySlug);
router.get('/store/:slug/categories', getStoreCategories);
router.post('/store/:slug/view', registerStoreView);
router.get('/store/:slug/bot-integration', getBotIntegration);
router.get('/store-by-whatsapp/:whatsappNumber/bot-integration', getBotIntegrationByWhatsApp);

export default router;