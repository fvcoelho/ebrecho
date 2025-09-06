import { Router } from 'express';
import { 
  enableWhatsAppBot,
  disableWhatsAppBot,
  getWhatsAppBotStatus,
  getQRCode,
  restartWhatsAppBot,
  sendTestMessage,
  getBotMessages,
  sendTypingIndicator
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

// WhatsApp bot testing routes
router.post('/partners/:partnerId/whatsapp-bot/test-message', authorize(['PARTNER_ADMIN', 'ADMIN']), sendTestMessage);
router.get('/partners/:partnerId/whatsapp-bot/messages', authorize(['PARTNER_ADMIN', 'ADMIN']), getBotMessages);
router.post('/partners/:partnerId/whatsapp-bot/send-typing', authorize(['PARTNER_ADMIN', 'ADMIN']), sendTypingIndicator);

export default router;