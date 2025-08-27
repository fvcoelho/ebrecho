import { Router } from 'express';
import { raw } from 'express';
import { z } from 'zod';
import whatsappController from '../controllers/whatsapp.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validatePartnerAccess } from '../middlewares/partner.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  sendTextMessageSchema,
  sendTemplateMessageSchema,
  sendMediaMessageSchema,
  createTemplateSchema,
  updateTemplateSchema,
  getConversationHistorySchema,
  getAnalyticsSchema,
  updatePartnerWhatsAppConfigSchema,
  testMessageSchema,
  messageSearchSchema,
} from '../schemas/whatsapp.schema';

const router = Router();

/**
 * @swagger
 * /api/whatsapp/webhook:
 *   get:
 *     summary: Verify WhatsApp webhook
 *     description: Endpoint for Meta to verify the webhook URL
 *     tags: [WhatsApp]
 *     parameters:
 *       - in: query
 *         name: hub.mode
 *         required: true
 *         schema:
 *           type: string
 *           enum: [subscribe]
 *       - in: query
 *         name: hub.challenge
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Webhook verification successful
 *       403:
 *         description: Invalid verify token
 */
router.get('/webhook', whatsappController.verifyWebhook.bind(whatsappController));

/**
 * @swagger
 * /api/whatsapp/webhook:
 *   post:
 *     summary: Handle WhatsApp webhook events
 *     description: Endpoint for receiving WhatsApp webhook notifications
 *     tags: [WhatsApp]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       403:
 *         description: Invalid webhook signature
 */
// Use raw body parser for webhook signature verification
router.post('/webhook', 
  raw({ type: 'application/json' }), 
  (req: any, res, next) => {
    try {
      // Store raw body for signature verification
      req.rawBody = req.body;
      // Parse JSON for processing
      if (Buffer.isBuffer(req.body)) {
        req.body = JSON.parse(req.body.toString());
      }
      next();
    } catch (error) {
      console.error('Error parsing webhook body:', error);
      res.status(400).json({ success: false, error: 'Invalid JSON payload' });
    }
  },
  whatsappController.handleWebhook.bind(whatsappController)
);

/**
 * @swagger
 * /api/whatsapp/send-text:
 *   post:
 *     summary: Send text message
 *     description: Send a text message via WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient phone number
 *                 example: "5511963166165"
 *               message:
 *                 type: string
 *                 description: Text message content
 *                 maxLength: 4096
 *                 example: "Hello! Thanks for your interest in our products."
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: WhatsApp API not enabled for partner
 */
router.post('/send-text', 
  authenticate,
  validatePartnerAccess,
  validate(sendTextMessageSchema),
  whatsappController.sendTextMessage.bind(whatsappController)
);

/**
 * @swagger
 * /api/whatsapp/send-template:
 *   post:
 *     summary: Send template message
 *     description: Send a pre-approved template message via WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - templateName
 *               - languageCode
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient phone number
 *                 example: "5511963166165"
 *               templateName:
 *                 type: string
 *                 description: Name of the approved template
 *                 example: "hello_world"
 *               languageCode:
 *                 type: string
 *                 description: Language code (e.g., en_US, pt_BR)
 *                 example: "en_US"
 *               parameters:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Template parameters (if template has variables)
 *     responses:
 *       200:
 *         description: Template message sent successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: WhatsApp API not enabled for partner
 */
router.post('/send-template', 
  authenticate,
  validatePartnerAccess,
  validate(sendTemplateMessageSchema),
  whatsappController.sendTemplateMessage.bind(whatsappController)
);

/**
 * @swagger
 * /api/whatsapp/send-media:
 *   post:
 *     summary: Send media message
 *     description: Send a media message (image, document, audio, video) via WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - mediaType
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient phone number
 *                 example: "5511963166165"
 *               mediaType:
 *                 type: string
 *                 enum: [image, document, audio, video]
 *                 description: Type of media
 *               mediaId:
 *                 type: string
 *                 description: WhatsApp media ID (if media uploaded to WhatsApp)
 *               mediaUrl:
 *                 type: string
 *                 description: Public URL to media file
 *               caption:
 *                 type: string
 *                 description: Caption for the media
 *                 maxLength: 1024
 *               fileName:
 *                 type: string
 *                 description: File name (for document type)
 *     responses:
 *       200:
 *         description: Media message sent successfully
 *       400:
 *         description: Invalid request data
 *       403:
 *         description: WhatsApp API not enabled for partner
 */
router.post('/send-media', 
  authenticate,
  validatePartnerAccess,
  validate(sendMediaMessageSchema),
  whatsappController.sendMediaMessage.bind(whatsappController)
);

/**
 * @swagger
 * /api/whatsapp/conversations:
 *   get:
 *     summary: Get conversation history
 *     description: Retrieve WhatsApp conversation history for the partner
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: phoneNumber
 *         schema:
 *           type: string
 *         description: Filter by specific phone number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of messages to return
 *     responses:
 *       200:
 *         description: Conversation history retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       403:
 *         description: Access denied
 */
router.get('/conversations', 
  authenticate,
  validatePartnerAccess,
  validate(getConversationHistorySchema),
  whatsappController.getConversationHistory.bind(whatsappController)
);

/**
 * @swagger
 * /api/whatsapp/analytics:
 *   get:
 *     summary: Get message analytics
 *     description: Retrieve WhatsApp message analytics for the partner
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for analytics period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for analytics period
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       403:
 *         description: Access denied
 */
router.get('/analytics', 
  authenticate,
  validatePartnerAccess,
  validate(getAnalyticsSchema),
  whatsappController.getAnalytics.bind(whatsappController)
);

/**
 * @swagger
 * /api/whatsapp/templates:
 *   get:
 *     summary: Get message templates
 *     description: Retrieve all WhatsApp message templates for the partner
 *     tags: [WhatsApp Templates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/templates', 
  authenticate,
  validatePartnerAccess,
  whatsappController.getTemplates.bind(whatsappController)
);

/**
 * @swagger
 * /api/whatsapp/templates:
 *   post:
 *     summary: Create message template
 *     description: Create a new WhatsApp message template
 *     tags: [WhatsApp Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - language
 *               - category
 *               - bodyText
 *             properties:
 *               name:
 *                 type: string
 *                 pattern: ^[a-z0-9_]+$
 *                 description: Template name (lowercase, numbers, underscores only)
 *                 example: "order_confirmation"
 *               language:
 *                 type: string
 *                 pattern: ^[a-z]{2}(_[A-Z]{2})?$
 *                 description: Language code
 *                 example: "pt_BR"
 *               category:
 *                 type: string
 *                 enum: [AUTHENTICATION, MARKETING, UTILITY]
 *                 description: Template category
 *               bodyText:
 *                 type: string
 *                 maxLength: 1024
 *                 description: Template body text
 *                 example: "Olá! Seu pedido foi confirmado."
 *               headerText:
 *                 type: string
 *                 maxLength: 60
 *                 description: Optional header text
 *               footerText:
 *                 type: string
 *                 maxLength: 60
 *                 description: Optional footer text
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Invalid request data
 *       409:
 *         description: Template already exists
 */
router.post('/templates', 
  authenticate,
  validatePartnerAccess,
  validate(createTemplateSchema),
  whatsappController.createTemplate.bind(whatsappController)
);

/**
 * @swagger
 * /api/whatsapp/templates/{templateId}:
 *   put:
 *     summary: Update message template
 *     description: Update an existing WhatsApp message template
 *     tags: [WhatsApp Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bodyText:
 *                 type: string
 *                 maxLength: 1024
 *               headerText:
 *                 type: string
 *                 maxLength: 60
 *               footerText:
 *                 type: string
 *                 maxLength: 60
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       400:
 *         description: Invalid request data
 *       404:
 *         description: Template not found
 */
router.put('/templates/:templateId', 
  authenticate,
  validatePartnerAccess,
  validate(updateTemplateSchema),
  whatsappController.updateTemplate.bind(whatsappController)
);

/**
 * @swagger
 * /api/whatsapp/templates/{templateId}:
 *   delete:
 *     summary: Delete message template
 *     description: Delete a WhatsApp message template
 *     tags: [WhatsApp Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted successfully
 *       404:
 *         description: Template not found
 */
router.delete('/templates/:templateId', 
  authenticate,
  validatePartnerAccess,
  whatsappController.deleteTemplate.bind(whatsappController)
);

/**
 * @swagger
 * /api/whatsapp/config:
 *   get:
 *     summary: Get WhatsApp configuration
 *     description: Get partner's WhatsApp API configuration
 *     tags: [WhatsApp Configuration]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *       403:
 *         description: Access denied
 */
router.get('/config', 
  authenticate,
  validatePartnerAccess,
  whatsappController.getPartnerConfig.bind(whatsappController)
);

/**
 * @swagger
 * /api/whatsapp/config:
 *   put:
 *     summary: Update WhatsApp configuration
 *     description: Update partner's WhatsApp API configuration
 *     tags: [WhatsApp Configuration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               whatsappNumber:
 *                 type: string
 *                 description: WhatsApp business phone number
 *               whatsappName:
 *                 type: string
 *                 maxLength: 25
 *                 description: WhatsApp business name
 *               whatsappBusinessVerified:
 *                 type: boolean
 *                 description: Whether WhatsApp Business account is verified
 *               whatsappApiEnabled:
 *                 type: boolean
 *                 description: Whether WhatsApp API is enabled
 *               whatsappPhoneNumberId:
 *                 type: string
 *                 description: WhatsApp phone number ID from Meta
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       400:
 *         description: Invalid request data
 */
router.put('/config', 
  authenticate,
  validatePartnerAccess,
  validate(updatePartnerWhatsAppConfigSchema),
  whatsappController.updatePartnerConfig.bind(whatsappController)
);

/**
 * @swagger
 * /api/whatsapp/search:
 *   get:
 *     summary: Search messages
 *     description: Search and filter WhatsApp messages
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: phoneNumber
 *         schema:
 *           type: string
 *         description: Filter by phone number
 *       - in: query
 *         name: messageType
 *         schema:
 *           type: string
 *           enum: [TEXT, IMAGE, DOCUMENT, AUDIO, VIDEO, TEMPLATE, INTERACTIVE]
 *         description: Filter by message type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [SENT, DELIVERED, READ, FAILED]
 *         description: Filter by message status
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [inbound, outbound]
 *         description: Filter by message direction
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in message content
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Invalid query parameters
 */
router.get('/search', 
  authenticate,
  validatePartnerAccess,
  validate(messageSearchSchema),
  whatsappController.searchMessages.bind(whatsappController)
);

// Development/Testing routes (not available in production)
if (process.env.NODE_ENV !== 'production') {
  /**
   * @swagger
   * /api/whatsapp/test:
   *   post:
   *     summary: Test message sending (Development only)
   *     description: Send a test message via WhatsApp (development environment only)
   *     tags: [WhatsApp Testing]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - phoneNumber
   *             properties:
   *               phoneNumber:
   *                 type: string
   *                 description: Test recipient phone number
   *                 example: "5511963166165"
   *               messageType:
   *                 type: string
   *                 enum: [text, template]
   *                 default: text
   *               message:
   *                 type: string
   *                 description: Test message (for text type)
   *                 example: "This is a test message"
   *               templateName:
   *                 type: string
   *                 description: Template name (for template type)
   *                 example: "hello_world"
   *               languageCode:
   *                 type: string
   *                 description: Language code (for template type)
   *                 example: "en_US"
   *     responses:
   *       200:
   *         description: Test message sent successfully
   *       403:
   *         description: Not available in production
   */
  router.post('/test', 
    validate(z.object({ body: testMessageSchema })),
    whatsappController.testMessage.bind(whatsappController)
  );

}

export default router;