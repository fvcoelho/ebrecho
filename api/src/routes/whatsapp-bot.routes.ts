import { Router } from 'express';
import { 
  enableWhatsAppBot,
  disableWhatsAppBot,
  getWhatsAppBotStatus,
  getQRCode,
  restartWhatsAppBot
} from '../controllers/whatsapp-bot.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/roles.middleware';

const router = Router();

// All WhatsApp bot routes require authentication
router.use(authMiddleware);

// WhatsApp bot management routes
router.post('/partners/:partnerId/whatsapp-bot/enable', authorize(['PARTNER_ADMIN', 'ADMIN']), enableWhatsAppBot);
router.post('/partners/:partnerId/whatsapp-bot/disable', authorize(['PARTNER_ADMIN', 'ADMIN']), disableWhatsAppBot);
router.get('/partners/:partnerId/whatsapp-bot/status', authorize(['PARTNER_ADMIN', 'ADMIN']), getWhatsAppBotStatus);
router.get('/partners/:partnerId/whatsapp-bot/qrcode', authorize(['PARTNER_ADMIN', 'ADMIN']), getQRCode);
router.post('/partners/:partnerId/whatsapp-bot/restart', authorize(['PARTNER_ADMIN', 'ADMIN']), restartWhatsAppBot);

export default router;