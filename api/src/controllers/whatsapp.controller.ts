import { Request, Response } from 'express';
import { prisma } from '../prisma/index.js';
import whatsappService from '../services/whatsapp.service';
import {
  webhookVerificationSchema,
  sendTextMessageSchema,
  sendTemplateMessageSchema,
  sendMediaMessageSchema,
  createTemplateSchema,
  updateTemplateSchema,
  getConversationHistorySchema,
  getAnalyticsSchema,
  webhookPayloadSchema,
  updatePartnerWhatsAppConfigSchema,
  testMessageSchema,
  messageSearchSchema,
} from '../schemas/whatsapp.schema';


export class WhatsAppController {
  /**
   * Verify webhook (GET request from Meta)
   */
  async verifyWebhook(req: Request, res: Response) {
    try {
      const validation = webhookVerificationSchema.safeParse(req.query);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid webhook verification parameters',
          details: validation.error.format(),
        });
      }

      const { 'hub.mode': mode, 'hub.challenge': challenge, 'hub.verify_token': verifyToken } = validation.data;
      
      const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;
      if (verifyToken !== expectedToken) {
        return res.status(403).json({ error: 'Invalid verify token' });
      }

      // Return the challenge to verify the webhook
      res.status(200).send(challenge);
    } catch (error) {
      console.error('Webhook verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Handle webhook events (POST request from Meta)
   */
  async handleWebhook(req: Request, res: Response) {
    try {
      // Log complete request details for debugging
      console.log('🔍 WEBHOOK DEBUG - Complete Request Details:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
      console.log('📦 Complete Body:', JSON.stringify(req.body, null, 2));
      console.log('🔗 Method:', req.method);
      console.log('🔗 URL:', req.url);
      console.log('📏 Body Size:', JSON.stringify(req.body).length, 'characters');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const validation = webhookPayloadSchema.safeParse(req.body);
      
      if (!validation.success) {
        console.error('❌ WEBHOOK DEBUG - Validation Failed:');
        console.error('📋 Validation errors:', JSON.stringify(validation.error, null, 2));
        console.error('📦 Original body that failed:', JSON.stringify(req.body, null, 2));
        return res.status(400).json({ error: 'Invalid webhook payload' });
      }

      console.log('✅ WEBHOOK DEBUG - Validation Success, starting processing...');

      // Process the webhook SYNCHRONOUSLY to ensure proper error handling
      try {
        await whatsappService.processWebhook(validation.data as any);
        console.log('✅ WEBHOOK DEBUG - Processing completed successfully');
      } catch (processingError) {
        // Log the error but still return 200 to Meta to avoid retries
        console.error('❌ WEBHOOK DEBUG - Processing Error:', processingError);
        console.error('📦 Failed payload:', JSON.stringify(req.body, null, 2));
        console.error('Stack trace:', processingError instanceof Error ? processingError.stack : 'No stack trace');
      }

      // Always respond with 200 OK to acknowledge receipt (Meta requirement)
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ WEBHOOK DEBUG - Handler Error:', error);
      console.error('📦 Request body when error occurred:', JSON.stringify(req.body, null, 2));
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Send text message
   */
  async sendTextMessage(req: Request, res: Response) {
    try {
      const validation = sendTextMessageSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: validation.error.format(),
        });
      }

      const { to, message } = validation.data;
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      // Check if partner has WhatsApp API enabled
      const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        select: { whatsappApiEnabled: true, whatsappPhoneNumberId: true },
      });

      if (!partner?.whatsappApiEnabled || !partner?.whatsappPhoneNumberId) {
        return res.status(403).json({ 
          error: 'WhatsApp API not enabled for this partner' 
        });
      }

      const result = await whatsappService.sendTextMessage({ to, message, partnerId });
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Send text message error:', error);
      res.status(500).json({ 
        error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(req: Request, res: Response) {
    try {
      const validation = sendTemplateMessageSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: validation.error.format(),
        });
      }

      const { to, templateName, languageCode, parameters } = validation.data;
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      // Check if partner has WhatsApp API enabled
      const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        select: { whatsappApiEnabled: true, whatsappPhoneNumberId: true },
      });

      if (!partner?.whatsappApiEnabled || !partner?.whatsappPhoneNumberId) {
        return res.status(403).json({ 
          error: 'WhatsApp API not enabled for this partner' 
        });
      }

      const result = await whatsappService.sendTemplateMessage({ 
        to, 
        templateName, 
        languageCode, 
        parameters,
        partnerId 
      });
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Send template message error:', error);
      res.status(500).json({ 
        error: 'Failed to send template message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send media message
   */
  async sendMediaMessage(req: Request, res: Response) {
    try {
      const validation = sendMediaMessageSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: validation.error.format(),
        });
      }

      const { to, mediaType, mediaId, mediaUrl, caption, fileName } = validation.data;
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      // Check if partner has WhatsApp API enabled
      const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        select: { whatsappApiEnabled: true, whatsappPhoneNumberId: true },
      });

      if (!partner?.whatsappApiEnabled || !partner?.whatsappPhoneNumberId) {
        return res.status(403).json({ 
          error: 'WhatsApp API not enabled for this partner' 
        });
      }

      const result = await whatsappService.sendMediaMessage({ 
        to,
        mediaType,
        mediaId,
        mediaUrl,
        caption,
        fileName,
        partnerId 
      });
      
      res.status(200).json(result);
    } catch (error) {
      console.error('Send media message error:', error);
      res.status(500).json({ 
        error: 'Failed to send media message',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(req: Request, res: Response) {
    try {
      const validation = getConversationHistorySchema.safeParse(req.query);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.error.format(),
        });
      }

      const { phoneNumber, limit } = validation.data;
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      const messages = await whatsappService.getConversationHistory(partnerId, phoneNumber, limit);
      
      res.status(200).json({ 
        success: true,
        data: messages,
        count: messages.length,
      });
    } catch (error) {
      console.error('Get conversation history error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch conversation history',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get message analytics
   */
  async getAnalytics(req: Request, res: Response) {
    try {
      const validation = getAnalyticsSchema.safeParse(req.query);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.error.format(),
        });
      }

      const { startDate, endDate } = validation.data;
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      const analytics = await whatsappService.getMessageAnalytics(partnerId, startDate, endDate);
      
      res.status(200).json({ 
        success: true,
        data: analytics,
      });
    } catch (error) {
      console.error('Get analytics error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Create message template
   */
  async createTemplate(req: Request, res: Response) {
    try {
      const validation = createTemplateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: validation.error.format(),
        });
      }

      const templateData = validation.data;
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      // Check if template with same name and language already exists
      const existingTemplate = await prisma.whatsAppTemplate.findUnique({
        where: {
          partnerId_name_language: {
            partnerId,
            name: templateData.name,
            language: templateData.language,
          },
        },
      });

      if (existingTemplate) {
        return res.status(409).json({ 
          error: 'Template with this name and language already exists' 
        });
      }

      const template = await prisma.whatsAppTemplate.create({
        data: {
          partnerId,
          name: templateData.name,
          language: templateData.language,
          category: templateData.category,
          headerText: templateData.headerText,
          bodyText: templateData.bodyText,
          footerText: templateData.footerText,
          buttonConfig: templateData.buttonConfig,
        },
      });
      
      res.status(201).json({ 
        success: true,
        data: template,
      });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ 
        error: 'Failed to create template',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get partner templates
   */
  async getTemplates(req: Request, res: Response) {
    try {
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      const templates = await prisma.whatsAppTemplate.findMany({
        where: { partnerId },
        orderBy: { createdAt: 'desc' },
      });
      
      res.status(200).json({ 
        success: true,
        data: templates,
        count: templates.length,
      });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update template
   */
  async updateTemplate(req: Request, res: Response) {
    try {
      const { templateId } = req.params;
      const validation = updateTemplateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: validation.error.format(),
        });
      }

      const updateData = validation.data;
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      const template = await prisma.whatsAppTemplate.findFirst({
        where: { 
          id: templateId,
          partnerId 
        },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const updatedTemplate = await prisma.whatsAppTemplate.update({
        where: { id: templateId },
        data: updateData,
      });
      
      res.status(200).json({ 
        success: true,
        data: updatedTemplate,
      });
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({ 
        error: 'Failed to update template',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(req: Request, res: Response) {
    try {
      const { templateId } = req.params;
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      const template = await prisma.whatsAppTemplate.findFirst({
        where: { 
          id: templateId,
          partnerId 
        },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      await prisma.whatsAppTemplate.delete({
        where: { id: templateId },
      });
      
      res.status(200).json({ 
        success: true,
        message: 'Template deleted successfully',
      });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ 
        error: 'Failed to delete template',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Update partner WhatsApp configuration
   */
  async updatePartnerConfig(req: Request, res: Response) {
    try {
      const validation = updatePartnerWhatsAppConfigSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: validation.error.format(),
        });
      }

      const configData = validation.data;
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      const updatedPartner = await prisma.partner.update({
        where: { id: partnerId },
        data: configData,
        select: {
          whatsappNumber: true,
          whatsappName: true,
          whatsappBusinessVerified: true,
          whatsappApiEnabled: true,
          whatsappPhoneNumberId: true,
        },
      });
      
      res.status(200).json({ 
        success: true,
        data: updatedPartner,
      });
    } catch (error) {
      console.error('Update partner config error:', error);
      res.status(500).json({ 
        error: 'Failed to update WhatsApp configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get partner WhatsApp configuration
   */
  async getPartnerConfig(req: Request, res: Response) {
    try {
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      const partner = await prisma.partner.findUnique({
        where: { id: partnerId },
        select: {
          whatsappNumber: true,
          whatsappName: true,
          whatsappBusinessVerified: true,
          whatsappApiEnabled: true,
          whatsappPhoneNumberId: true,
        },
      });

      if (!partner) {
        return res.status(404).json({ error: 'Partner not found' });
      }
      
      res.status(200).json({ 
        success: true,
        data: partner,
      });
    } catch (error) {
      console.error('Get partner config error:', error);
      res.status(500).json({ 
        error: 'Failed to fetch WhatsApp configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Test message sending (development only)
   */
  async testMessage(req: Request, res: Response) {
    const startTime = Date.now();
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      requestId: Math.random().toString(36).substring(7),
    };

    try {
      const validation = testMessageSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid request data',
          details: validation.error.format(),
          debug: debugInfo
        });
      }

      const { phoneNumber, messageType, message, templateName, languageCode, debug } = validation.data;
      
      if (debug) {
        debugInfo.request = {
          phoneNumber,
          messageType,
          message: message ? message.substring(0, 100) + '...' : null,
          templateName,
          languageCode
        };
        console.log('🔍 WhatsApp Test Debug - Request:', JSON.stringify(debugInfo, null, 2));
      }

      let partnerId = req.user?.partnerId;
      
      // If no authenticated user, try to find any existing partner for testing
      if (!partnerId) {
        const firstPartner = await prisma.partner.findFirst({
          select: { 
            id: true, 
            name: true,
            whatsappApiEnabled: true,
            whatsappPhoneNumberId: true 
          }
        });
        
        if (firstPartner) {
          partnerId = firstPartner.id;
          if (debug) {
            debugInfo.partner = {
              id: firstPartner.id,
              name: firstPartner.name,
              whatsappEnabled: firstPartner.whatsappApiEnabled,
              hasPhoneNumberId: !!firstPartner.whatsappPhoneNumberId
            };
            console.log('🔍 WhatsApp Test Debug - Using Partner:', debugInfo.partner);
          }
        } else {
          return res.status(400).json({ 
            error: 'No partner available for testing',
            message: 'Please create a partner first or authenticate with a partner account.',
            debug: debug ? debugInfo : undefined
          });
        }
      }

      let result;
      const apiStartTime = Date.now();

      if (messageType === 'text') {
        if (debug) {
          console.log('🔍 WhatsApp Test Debug - Sending text message...');
        }
        result = await whatsappService.sendTextMessage({ 
          to: phoneNumber, 
          message: message!, 
          partnerId 
        });
      } else if (messageType === 'template') {
        if (debug) {
          console.log('🔍 WhatsApp Test Debug - Sending template message...');
        }
        result = await whatsappService.sendTemplateMessage({ 
          to: phoneNumber, 
          templateName: templateName!, 
          languageCode: languageCode!, 
          partnerId 
        });
      }

      const apiDuration = Date.now() - apiStartTime;
      const totalDuration = Date.now() - startTime;

      if (debug) {
        debugInfo.response = {
          success: result?.success || false,
          messageId: result?.messageId,
          apiDuration: `${apiDuration}ms`,
          totalDuration: `${totalDuration}ms`
        };
        console.log('🔍 WhatsApp Test Debug - Response:', JSON.stringify(debugInfo.response, null, 2));
      }
      
      res.status(200).json({
        ...result,
        debug: debug ? {
          ...debugInfo,
          timings: {
            apiCall: `${apiDuration}ms`,
            total: `${totalDuration}ms`
          }
        } : undefined
      });
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error('❌ WhatsApp Test Error:', error);
      
      debugInfo.error = {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error && process.env.NODE_ENV !== 'production' ? error.stack : undefined,
        duration: `${totalDuration}ms`
      };

      res.status(500).json({ 
        error: 'Failed to send test message',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: req.body.debug ? debugInfo : undefined
      });
    }
  }

  /**
   * Search messages
   */
  async searchMessages(req: Request, res: Response) {
    try {
      const validation = messageSearchSchema.safeParse(req.query);
      
      if (!validation.success) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: validation.error.format(),
        });
      }

      const { 
        phoneNumber, 
        messageType, 
        status, 
        direction, 
        startDate, 
        endDate, 
        search, 
        limit, 
        offset 
      } = validation.data;
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      const where: any = { partnerId };

      if (phoneNumber) {
        const cleanPhone = phoneNumber.replace(/\D/g, '');
        where.OR = [
          { fromNumber: { contains: cleanPhone } },
          { toNumber: { contains: cleanPhone } },
        ];
      }

      if (messageType) where.messageType = messageType;
      if (status) where.status = status;
      if (direction) where.direction = direction;

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }

      if (search) {
        where.textContent = { contains: search, mode: 'insensitive' };
      }

      const [messages, total] = await Promise.all([
        prisma.whatsAppMessage.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.whatsAppMessage.count({ where }),
      ]);
      
      res.status(200).json({ 
        success: true,
        data: messages,
        pagination: {
          total,
          limit,
          offset,
          pages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1,
        },
      });
    } catch (error) {
      console.error('Search messages error:', error);
      res.status(500).json({ 
        error: 'Failed to search messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Reset conversation state for a phone number (manual reset)
   */
  async resetConversationState(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.params;
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      console.log(`🔄 Manual conversation reset requested:`, {
        phoneNumber,
        partnerId,
        requestedBy: req.user?.email || 'Unknown'
      });

      // Import services
      const RedisService = (await import('../services/redis.service')).default;

      // Release response lock in Redis
      console.log(`🔓 Releasing response lock...`);
      const lockReleased = await RedisService.releaseResponseLock(partnerId, phoneNumber);
      console.log(`   Lock release result: ${lockReleased ? 'SUCCESS' : 'NO LOCK FOUND'}`);

      // Reset conversation state in database
      console.log(`📝 Resetting conversation state in database...`);
      const conversation = await prisma.whatsAppConversation.upsert({
        where: {
          partnerId_phoneNumber: {
            partnerId,
            phoneNumber
          }
        },
        create: {
          partnerId,
          phoneNumber,
          state: 'WAITING_FIRST_MESSAGE' as any, // WhatsAppConversationState.WAITING_FIRST_MESSAGE
          totalMessages: 0,
          totalAutoResponses: 0,
          totalHumanResponses: 0
        },
        update: {
          state: 'WAITING_FIRST_MESSAGE' as any, // WhatsAppConversationState.WAITING_FIRST_MESSAGE
          lastAutoResponseId: null,
          lastAutoResponseAt: null,
          lastHumanResponseId: null,
          lastHumanResponseAt: null,
          lastInboundMessageId: null,
          lastInboundMessageAt: null
        }
      });

      console.log(`✅ Conversation state reset successfully for ${phoneNumber}`);
      
      res.status(200).json({
        success: true,
        message: 'Conversation state reset successfully',
        data: {
          phoneNumber,
          partnerId,
          previousState: conversation.state,
          newState: 'WAITING_FIRST_MESSAGE',
          lockReleased,
          canReceiveAutoResponse: true
        }
      });

    } catch (error) {
      console.error('Reset conversation state error:', error);
      res.status(500).json({
        error: 'Failed to reset conversation state',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get conversation state for a phone number
   */
  async getConversationState(req: Request, res: Response) {
    try {
      const { phoneNumber } = req.params;
      const partnerId = req.user?.partnerId;

      if (!partnerId) {
        return res.status(403).json({ error: 'Partner ID required' });
      }

      if (!phoneNumber) {
        return res.status(400).json({ error: 'Phone number is required' });
      }

      console.log(`🔍 Getting conversation state:`, { phoneNumber, partnerId });

      // Import services
      const RedisService = (await import('../services/redis.service')).default;

      // Check Redis lock state
      const hasLock = await RedisService.hasResponseLock(partnerId, phoneNumber);

      // Get database conversation state
      const conversation = await prisma.whatsAppConversation.findUnique({
        where: {
          partnerId_phoneNumber: {
            partnerId,
            phoneNumber
          }
        }
      });

      const state = {
        phoneNumber,
        partnerId,
        databaseState: conversation?.state || 'WAITING_FIRST_MESSAGE',
        redisLocked: hasLock,
        canReceiveAutoResponse: !hasLock,
        lastAutoResponseAt: conversation?.lastAutoResponseAt,
        lastHumanResponseAt: conversation?.lastHumanResponseAt,
        lastInboundMessageAt: conversation?.lastInboundMessageAt,
        totalMessages: conversation?.totalMessages || 0,
        totalAutoResponses: conversation?.totalAutoResponses || 0,
        totalHumanResponses: conversation?.totalHumanResponses || 0,
        createdAt: conversation?.createdAt,
        updatedAt: conversation?.updatedAt
      };

      console.log(`✅ Conversation state retrieved:`, state);
      
      res.status(200).json({
        success: true,
        data: state
      });

    } catch (error) {
      console.error('Get conversation state error:', error);
      res.status(500).json({
        error: 'Failed to get conversation state',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

}

export default new WhatsAppController();