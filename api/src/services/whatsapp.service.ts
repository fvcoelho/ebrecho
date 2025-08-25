import { PrismaClient, WhatsAppMessageType, WhatsAppMessageStatus } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  apiVersion: string;
  verifyToken: string;
}

interface SendMessageParams {
  to: string;
  message: string;
  partnerId: string;
}

interface SendTemplateParams {
  to: string;
  templateName: string;
  languageCode: string;
  parameters?: any[];
  partnerId: string;
}

interface SendMediaParams {
  to: string;
  mediaType: 'image' | 'document' | 'audio' | 'video';
  mediaId?: string;
  mediaUrl?: string;
  caption?: string;
  fileName?: string;
  partnerId: string;
}

interface WebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          image?: { id: string; mime_type: string; sha256: string; caption?: string };
          document?: { id: string; mime_type: string; sha256: string; caption?: string; filename?: string };
          audio?: { id: string; mime_type: string; sha256: string };
          video?: { id: string; mime_type: string; sha256: string; caption?: string };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
          conversation?: {
            id: string;
            origin: { type: string };
          };
          pricing?: {
            billable: boolean;
            pricing_model: string;
            category: string;
          };
        }>;
      };
      field: string;
    }>;
  }>;
}

class WhatsAppService {
  private config: WhatsAppConfig;
  private baseUrl: string;

  constructor() {
    this.config = {
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      apiVersion: process.env.WHATSAPP_API_VERSION || 'v22.0',
      verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    };
    this.baseUrl = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.phoneNumberId}/messages`;
  }

  /**
   * Verify webhook signature from Meta
   */
  verifyWebhook(signature: string, payload: string): boolean {
    try {
      if (!signature || !signature.startsWith('sha256=')) {
        return false;
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.config.verifyToken)
        .update(payload)
        .digest('hex');
      
      const providedSignature = signature.replace('sha256=', '');
      
      // Ensure both signatures have the same length before comparison
      if (expectedSignature.length !== providedSignature.length) {
        console.error('Signature length mismatch:', {
          expected: expectedSignature.length,
          provided: providedSignature.length
        });
        return false;
      }

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Send a text message
   */
  async sendTextMessage({ to, message, partnerId }: SendMessageParams) {
    try {
      const cleanPhone = this.formatPhoneNumber(to);
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: {
            body: message,
          },
        }),
      });

      const result = await response.json() as any;
      
      if (response.ok && result.messages?.[0]?.id) {
        // Log the message to database
        await this.logMessage({
          messageId: result.messages[0].id,
          partnerId,
          fromNumber: this.config.phoneNumberId,
          toNumber: cleanPhone,
          direction: 'outbound',
          messageType: WhatsAppMessageType.TEXT,
          textContent: message,
          timestamp: new Date(),
          status: WhatsAppMessageStatus.SENT,
        });
        
        return { success: true, messageId: result.messages[0].id, data: result };
      }
      
      throw new Error(result.error?.message || 'Failed to send message');
    } catch (error) {
      console.error('Error sending text message:', error);
      throw error;
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage({ to, templateName, languageCode, parameters = [], partnerId }: SendTemplateParams) {
    try {
      const cleanPhone = this.formatPhoneNumber(to);
      
      const templatePayload: any = {
        name: templateName,
        language: { code: languageCode },
      };

      if (parameters.length > 0) {
        templatePayload.components = [
          {
            type: 'body',
            parameters: parameters.map(param => ({
              type: 'text',
              text: param,
            })),
          },
        ];
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'template',
          template: templatePayload,
        }),
      });

      const result = await response.json() as any;
      
      if (response.ok && result.messages?.[0]?.id) {
        // Log the template message to database
        await this.logMessage({
          messageId: result.messages[0].id,
          partnerId,
          fromNumber: this.config.phoneNumberId,
          toNumber: cleanPhone,
          direction: 'outbound',
          messageType: WhatsAppMessageType.TEMPLATE,
          templateName,
          templateLanguage: languageCode,
          templateParams: parameters,
          timestamp: new Date(),
          status: WhatsAppMessageStatus.SENT,
        });
        
        return { success: true, messageId: result.messages[0].id, data: result };
      }
      
      throw new Error(result.error?.message || 'Failed to send template message');
    } catch (error) {
      console.error('Error sending template message:', error);
      throw error;
    }
  }

  /**
   * Send a media message
   */
  async sendMediaMessage({ to, mediaType, mediaId, mediaUrl, caption, fileName, partnerId }: SendMediaParams) {
    try {
      const cleanPhone = this.formatPhoneNumber(to);
      
      const mediaPayload: any = {};
      
      if (mediaId) {
        mediaPayload.id = mediaId;
      } else if (mediaUrl) {
        mediaPayload.link = mediaUrl;
      } else {
        throw new Error('Either mediaId or mediaUrl must be provided');
      }

      if (caption && ['image', 'video', 'document'].includes(mediaType)) {
        mediaPayload.caption = caption;
      }

      if (fileName && mediaType === 'document') {
        mediaPayload.filename = fileName;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: mediaType,
          [mediaType]: mediaPayload,
        }),
      });

      const result = await response.json() as any;
      
      if (response.ok && result.messages?.[0]?.id) {
        // Log the media message to database
        await this.logMessage({
          messageId: result.messages[0].id,
          partnerId,
          fromNumber: this.config.phoneNumberId,
          toNumber: cleanPhone,
          direction: 'outbound',
          messageType: mediaType.toUpperCase() as WhatsAppMessageType,
          mediaId: mediaId || undefined,
          mediaUrl: mediaUrl || undefined,
          caption,
          fileName,
          timestamp: new Date(),
          status: WhatsAppMessageStatus.SENT,
        });
        
        return { success: true, messageId: result.messages[0].id, data: result };
      }
      
      throw new Error(result.error?.message || 'Failed to send media message');
    } catch (error) {
      console.error('Error sending media message:', error);
      throw error;
    }
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(payload: WebhookPayload): Promise<void> {
    try {
      // Log the webhook for debugging
      await prisma.whatsAppWebhookLog.create({
        data: {
          webhookType: payload.entry[0]?.changes[0]?.field || 'unknown',
          payload: payload as any,
          processed: false,
        },
      });

      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          switch (change.field) {
            case 'messages':
              if (change.value.messages) {
                await this.processIncomingMessages(change.value);
              }
              if (change.value.statuses) {
                await this.processMessageStatuses(change.value);
              }
              break;

            case 'message_template_status_update':
              await this.processTemplateStatusUpdate(change.value);
              break;

            case 'message_template_quality_update':
              await this.processTemplateQualityUpdate(change.value);
              break;

            case 'phone_number_quality_update':
              await this.processPhoneQualityUpdate(change.value);
              break;

            case 'business_status_update':
              await this.processBusinessStatusUpdate(change.value);
              break;

            case 'account_alerts':
              await this.processAccountAlerts(change.value);
              break;

            case 'business_capability_update':
              await this.processBusinessCapabilityUpdate(change.value);
              break;

            case 'message_echoes':
              await this.processMessageEchoes(change.value);
              break;

            default:
              console.log(`Unhandled webhook field: ${change.field}`);
          }
        }
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  /**
   * Process incoming messages
   */
  private async processIncomingMessages(messageData: any): Promise<void> {
    const { messages, metadata, contacts } = messageData;
    
    for (const message of messages) {
      try {
        // Find partner by phone number ID
        const partner = await prisma.partner.findFirst({
          where: {
            whatsappPhoneNumberId: metadata.phone_number_id,
          },
        });

        if (!partner) {
          console.warn(`No partner found for phone number ID: ${metadata.phone_number_id}`);
          continue;
        }

        // Determine message type and content
        let messageType: WhatsAppMessageType = WhatsAppMessageType.TEXT;
        let textContent: string | undefined;
        let mediaId: string | undefined;
        let caption: string | undefined;
        let fileName: string | undefined;

        switch (message.type) {
          case 'text':
            messageType = WhatsAppMessageType.TEXT;
            textContent = message.text?.body;
            break;
          case 'image':
            messageType = WhatsAppMessageType.IMAGE;
            mediaId = message.image?.id;
            caption = message.image?.caption;
            break;
          case 'document':
            messageType = WhatsAppMessageType.DOCUMENT;
            mediaId = message.document?.id;
            caption = message.document?.caption;
            fileName = message.document?.filename;
            break;
          case 'audio':
            messageType = WhatsAppMessageType.AUDIO;
            mediaId = message.audio?.id;
            break;
          case 'video':
            messageType = WhatsAppMessageType.VIDEO;
            mediaId = message.video?.id;
            caption = message.video?.caption;
            break;
        }

        // Log the incoming message
        await this.logMessage({
          messageId: message.id,
          partnerId: partner.id,
          fromNumber: message.from,
          toNumber: metadata.display_phone_number,
          direction: 'inbound',
          messageType,
          textContent,
          mediaId,
          caption,
          fileName,
          timestamp: new Date(parseInt(message.timestamp) * 1000),
          status: WhatsAppMessageStatus.DELIVERED,
        });

      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
      }
    }
  }

  /**
   * Process message status updates
   */
  private async processMessageStatuses(statusData: any): Promise<void> {
    const { statuses } = statusData;
    
    for (const status of statuses) {
      try {
        let messageStatus: WhatsAppMessageStatus;
        
        switch (status.status) {
          case 'sent':
            messageStatus = WhatsAppMessageStatus.SENT;
            break;
          case 'delivered':
            messageStatus = WhatsAppMessageStatus.DELIVERED;
            break;
          case 'read':
            messageStatus = WhatsAppMessageStatus.READ;
            break;
          case 'failed':
            messageStatus = WhatsAppMessageStatus.FAILED;
            break;
          default:
            continue; // Skip unknown statuses
        }

        // Update message status
        await prisma.whatsAppMessage.updateMany({
          where: {
            messageId: status.id,
          },
          data: {
            status: messageStatus,
          },
        });

      } catch (error) {
        console.error(`Error updating message status ${status.id}:`, error);
      }
    }
  }

  /**
   * Log message to database
   */
  private async logMessage(data: {
    messageId: string;
    partnerId: string;
    fromNumber: string;
    toNumber: string;
    direction: string;
    messageType: WhatsAppMessageType;
    textContent?: string;
    mediaId?: string;
    mediaUrl?: string;
    caption?: string;
    fileName?: string;
    templateName?: string;
    templateLanguage?: string;
    templateParams?: any;
    timestamp: Date;
    status: WhatsAppMessageStatus;
    errorCode?: string;
    errorMessage?: string;
  }) {
    try {
      await prisma.whatsAppMessage.create({
        data: {
          messageId: data.messageId,
          partnerId: data.partnerId,
          fromNumber: data.fromNumber,
          toNumber: data.toNumber,
          direction: data.direction,
          messageType: data.messageType,
          textContent: data.textContent,
          mediaId: data.mediaId,
          mediaUrl: data.mediaUrl,
          caption: data.caption,
          fileName: data.fileName,
          templateName: data.templateName,
          templateLanguage: data.templateLanguage,
          templateParams: data.templateParams,
          timestamp: data.timestamp,
          status: data.status,
          errorCode: data.errorCode,
          errorMessage: data.errorMessage,
        },
      });
    } catch (error) {
      console.error('Error logging message to database:', error);
    }
  }

  /**
   * Format phone number for WhatsApp API
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming Brazil +55)
    if (!cleanNumber.startsWith('55') && cleanNumber.length === 11) {
      cleanNumber = '55' + cleanNumber;
    }
    
    return cleanNumber;
  }

  /**
   * Get conversation history for a partner
   */
  async getConversationHistory(partnerId: string, phoneNumber?: string, limit: number = 50) {
    try {
      const where: any = { partnerId };
      
      if (phoneNumber) {
        const cleanPhone = this.formatPhoneNumber(phoneNumber);
        where.OR = [
          { fromNumber: cleanPhone },
          { toNumber: cleanPhone },
        ];
      }

      const messages = await prisma.whatsAppMessage.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      return messages.reverse(); // Return chronological order
    } catch (error) {
      console.error('Error fetching conversation history:', error);
      throw error;
    }
  }

  /**
   * Get message analytics for a partner
   */
  async getMessageAnalytics(partnerId: string, startDate?: Date, endDate?: Date) {
    try {
      const where: any = { partnerId };
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = startDate;
        if (endDate) where.timestamp.lte = endDate;
      }

      const [totalMessages, messagesByType, messagesByStatus, messagesByDirection] = await Promise.all([
        prisma.whatsAppMessage.count({ where }),
        prisma.whatsAppMessage.groupBy({
          by: ['messageType'],
          where,
          _count: { messageType: true },
        }),
        prisma.whatsAppMessage.groupBy({
          by: ['status'],
          where,
          _count: { status: true },
        }),
        prisma.whatsAppMessage.groupBy({
          by: ['direction'],
          where,
          _count: { direction: true },
        }),
      ]);

      return {
        totalMessages,
        messagesByType,
        messagesByStatus,
        messagesByDirection,
      };
    } catch (error) {
      console.error('Error fetching message analytics:', error);
      throw error;
    }
  }

  /**
   * Process template status updates
   */
  private async processTemplateStatusUpdate(templateData: any): Promise<void> {
    try {
      console.log('Processing template status update:', templateData);
      
      if (templateData.message_template_id && templateData.event) {
        // Update template status in database
        await prisma.whatsAppTemplate.updateMany({
          where: {
            templateId: templateData.message_template_id,
          },
          data: {
            status: this.mapTemplateStatus(templateData.event),
          },
        });

        // Log the update
        await prisma.whatsAppWebhookLog.create({
          data: {
            webhookType: 'message_template_status_update',
            payload: { templateData } as any,
            processed: true,
          },
        });
      }
    } catch (error) {
      console.error('Error processing template status update:', error);
    }
  }

  /**
   * Process template quality updates
   */
  private async processTemplateQualityUpdate(qualityData: any): Promise<void> {
    try {
      console.log('Processing template quality update:', qualityData);
      
      if (qualityData.message_template_id && qualityData.quality_score) {
        // Log template quality update for now (will be implemented when schema is updated)
        await prisma.whatsAppWebhookLog.create({
          data: {
            webhookType: 'message_template_quality_update',
            payload: { qualityData } as any,
            processed: true,
          },
        });
      }
    } catch (error) {
      console.error('Error processing template quality update:', error);
    }
  }

  /**
   * Process phone number quality updates
   */
  private async processPhoneQualityUpdate(qualityData: any): Promise<void> {
    try {
      console.log('Processing phone quality update:', qualityData);
      
      if (qualityData.phone_number_id && qualityData.quality_score) {
        // Log phone quality update for now (will be implemented when schema is updated)
        await prisma.whatsAppWebhookLog.create({
          data: {
            webhookType: 'phone_number_quality_update',
            payload: { qualityData } as any,
            processed: true,
          },
        });
      }
    } catch (error) {
      console.error('Error processing phone quality update:', error);
    }
  }

  /**
   * Process business status updates
   */
  private async processBusinessStatusUpdate(statusData: any): Promise<void> {
    try {
      console.log('Processing business status update:', statusData);
      
      if (statusData.phone_number_id && statusData.event) {
        const isActive = statusData.event === 'APPROVED' || statusData.event === 'CONNECTED';
        
        // Update partner WhatsApp status
        await prisma.partner.updateMany({
          where: {
            whatsappPhoneNumberId: statusData.phone_number_id,
          },
          data: {
            whatsappApiEnabled: isActive,
            whatsappBusinessVerified: isActive,
          },
        });

        // Log the update
        await prisma.whatsAppWebhookLog.create({
          data: {
            webhookType: 'business_status_update',
            payload: { statusData } as any,
            processed: true,
          },
        });
      }
    } catch (error) {
      console.error('Error processing business status update:', error);
    }
  }

  /**
   * Process account alerts
   */
  private async processAccountAlerts(alertData: any): Promise<void> {
    try {
      console.log('Processing account alert:', alertData);
      
      // Log critical alerts for admin review
      if (alertData.alert_type && alertData.severity === 'HIGH') {
        await prisma.whatsAppWebhookLog.create({
          data: {
            webhookType: 'account_alert',
            payload: { alert: alertData } as any,
            processed: true,
          },
        });
      }
    } catch (error) {
      console.error('Error processing account alerts:', error);
    }
  }

  /**
   * Process business capability updates
   */
  private async processBusinessCapabilityUpdate(capabilityData: any): Promise<void> {
    try {
      console.log('Processing business capability update:', capabilityData);
      
      // Log capability changes for admin review
      await prisma.whatsAppWebhookLog.create({
        data: {
          webhookType: 'business_capability_update',
          payload: { capabilities: capabilityData } as any,
          processed: true,
        },
      });
    } catch (error) {
      console.error('Error processing business capability update:', error);
    }
  }

  /**
   * Process message echoes (messages sent from other apps)
   */
  private async processMessageEchoes(echoData: any): Promise<void> {
    try {
      console.log('Processing message echo:', echoData);
      
      // Log message echoes for tracking purposes
      if (echoData.messages) {
        for (const message of echoData.messages) {
          // Similar to processIncomingMessages but marked as echo
          await this.logMessage({
            messageId: message.id || `echo_${Date.now()}`,
            partnerId: 'system', // Will need to find partner by phone ID
            fromNumber: message.from || 'unknown',
            toNumber: message.to || 'unknown',
            direction: 'outbound_echo',
            messageType: message.type?.toUpperCase() as any || 'TEXT',
            textContent: message.text?.body,
            timestamp: new Date(parseInt(message.timestamp) * 1000),
            status: 'DELIVERED' as any,
          });
        }
      }
    } catch (error) {
      console.error('Error processing message echoes:', error);
    }
  }

  /**
   * Map WhatsApp template status to our enum
   */
  private mapTemplateStatus(status: string): any {
    switch (status.toUpperCase()) {
      case 'APPROVED':
        return 'APPROVED';
      case 'REJECTED':
        return 'REJECTED';
      case 'PENDING':
      case 'PENDING_REVIEW':
        return 'PENDING';
      case 'DISABLED':
        return 'DISABLED';
      default:
        return 'PENDING';
    }
  }
}

export default new WhatsAppService();