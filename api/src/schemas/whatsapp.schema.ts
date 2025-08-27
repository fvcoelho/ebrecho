import { z } from 'zod';

// Phone number validation
const phoneNumberSchema = z.string()
  .min(10, 'Phone number must have at least 10 digits')
  .max(15, 'Phone number cannot exceed 15 digits')
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');

// WhatsApp webhook verification schema
export const webhookVerificationSchema = z.object({
  'hub.mode': z.string().refine(val => val === 'subscribe', {
    message: 'hub.mode must be "subscribe"',
  }),
  'hub.challenge': z.string().min(1, 'Challenge is required'),
  'hub.verify_token': z.string().min(1, 'Verify token is required'),
});

// Send text message schema
export const sendTextMessageSchema = z.object({
  to: phoneNumberSchema,
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(4096, 'Message cannot exceed 4096 characters'),
});

// Send template message schema
export const sendTemplateMessageSchema = z.object({
  to: phoneNumberSchema,
  templateName: z.string()
    .min(1, 'Template name is required')
    .max(512, 'Template name too long'),
  languageCode: z.string()
    .regex(/^[a-z]{2}(_[A-Z]{2})?$/, 'Invalid language code format (e.g., en_US, pt_BR)'),
  parameters: z.array(z.string()).optional(),
});

// Send media message schema
export const sendMediaMessageSchema = z.object({
  to: phoneNumberSchema,
  mediaType: z.enum(['image', 'document', 'audio', 'video']),
  mediaId: z.string().optional(),
  mediaUrl: z.string().url().optional(),
  caption: z.string().max(1024, 'Caption cannot exceed 1024 characters').optional(),
  fileName: z.string().max(255, 'File name too long').optional(),
}).refine(data => data.mediaId || data.mediaUrl, {
  message: 'Either mediaId or mediaUrl must be provided',
});

// Create template schema
export const createTemplateSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .max(512, 'Template name too long')
    .regex(/^[a-z0-9_]+$/, 'Template name can only contain lowercase letters, numbers, and underscores'),
  language: z.string()
    .regex(/^[a-z]{2}(_[A-Z]{2})?$/, 'Invalid language code format'),
  category: z.enum(['AUTHENTICATION', 'MARKETING', 'UTILITY']),
  bodyText: z.string()
    .min(1, 'Body text is required')
    .max(1024, 'Body text cannot exceed 1024 characters'),
  headerText: z.string()
    .max(60, 'Header text cannot exceed 60 characters')
    .optional(),
  footerText: z.string()
    .max(60, 'Footer text cannot exceed 60 characters')
    .optional(),
  buttonConfig: z.object({
    type: z.enum(['quick_reply', 'call_to_action']),
    buttons: z.array(z.object({
      type: z.enum(['quick_reply', 'url', 'phone_number']),
      text: z.string().max(20, 'Button text cannot exceed 20 characters'),
      url: z.string().url().optional(),
      phone_number: phoneNumberSchema.optional(),
    })).max(3, 'Cannot have more than 3 buttons'),
  }).optional(),
});

// Update template schema
export const updateTemplateSchema = createTemplateSchema.partial().omit({ name: true });

// Get conversation history schema
export const getConversationHistorySchema = z.object({
  phoneNumber: phoneNumberSchema.optional(),
  limit: z.coerce.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(50),
  offset: z.coerce.number()
    .int()
    .min(0, 'Offset cannot be negative')
    .default(0),
});

// Get analytics schema
export const getAnalyticsSchema = z.object({
  startDate: z.string()
    .datetime()
    .optional()
    .transform(val => val ? new Date(val) : undefined),
  endDate: z.string()
    .datetime()
    .optional()
    .transform(val => val ? new Date(val) : undefined),
  phoneNumber: phoneNumberSchema.optional(),
});

// Webhook payload schema (for validation)
export const webhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messaging_product: z.string(),
        metadata: z.object({
          display_phone_number: z.string(),
          phone_number_id: z.string(),
        }),
        contacts: z.array(z.object({
          profile: z.object({
            name: z.string(),
          }),
          wa_id: z.string(),
        })).optional(),
        messages: z.array(z.object({
          from: z.string(),
          id: z.string(),
          timestamp: z.string(),
          type: z.string(),
          text: z.object({
            body: z.string(),
          }).optional(),
          image: z.object({
            id: z.string(),
            mime_type: z.string(),
            sha256: z.string(),
            caption: z.string().optional(),
          }).optional(),
          document: z.object({
            id: z.string(),
            mime_type: z.string(),
            sha256: z.string(),
            caption: z.string().optional(),
            filename: z.string().optional(),
          }).optional(),
          audio: z.object({
            id: z.string(),
            mime_type: z.string(),
            sha256: z.string(),
          }).optional(),
          video: z.object({
            id: z.string(),
            mime_type: z.string(),
            sha256: z.string(),
            caption: z.string().optional(),
          }).optional(),
          context: z.object({
            from: z.string(),
            id: z.string(),
          }).optional(),
        })).optional(),
        statuses: z.array(z.object({
          id: z.string(),
          status: z.string(),
          timestamp: z.string(),
          recipient_id: z.string(),
          conversation: z.object({
            id: z.string(),
            origin: z.object({
              type: z.string(),
            }),
          }).optional(),
          pricing: z.object({
            billable: z.boolean(),
            pricing_model: z.string(),
            category: z.string(),
          }).optional(),
          errors: z.array(z.object({
            code: z.number(),
            title: z.string(),
            message: z.string(),
            error_data: z.object({
              details: z.string(),
            }).optional(),
          })).optional(),
        })).optional(),
      }),
      field: z.string(),
    })),
  })),
});

// Partner WhatsApp configuration schema
export const updatePartnerWhatsAppConfigSchema = z.object({
  whatsappNumber: phoneNumberSchema.optional(),
  whatsappName: z.string()
    .max(25, 'WhatsApp name cannot exceed 25 characters')
    .optional(),
  whatsappBusinessVerified: z.boolean().optional(),
  whatsappApiEnabled: z.boolean().optional(),
  whatsappPhoneNumberId: z.string().optional(),
});

// Test message schema
export const testMessageSchema = z.object({
  phoneNumber: phoneNumberSchema,
  messageType: z.enum(['text', 'template']).default('text'),
  message: z.string()
    .min(1, 'Message is required')
    .max(4096, 'Message too long')
    .optional(),
  templateName: z.string().optional(),
  languageCode: z.string()
    .regex(/^[a-z]{2}(_[A-Z]{2})?$/, 'Invalid language code format')
    .optional(),
  debug: z.boolean().default(false).optional(),
}).refine(data => {
  if (data.messageType === 'text') {
    return !!data.message;
  }
  if (data.messageType === 'template') {
    return !!data.templateName && !!data.languageCode;
  }
  return true;
}, {
  message: 'Required fields missing for the selected message type',
});

// Message search/filter schema
export const messageSearchSchema = z.object({
  phoneNumber: phoneNumberSchema.optional(),
  messageType: z.enum(['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'TEMPLATE', 'INTERACTIVE']).optional(),
  status: z.enum(['SENT', 'DELIVERED', 'READ', 'FAILED']).optional(),
  direction: z.enum(['inbound', 'outbound']).optional(),
  startDate: z.string()
    .datetime()
    .optional()
    .transform(val => val ? new Date(val) : undefined),
  endDate: z.string()
    .datetime()
    .optional()
    .transform(val => val ? new Date(val) : undefined),
  search: z.string()
    .max(100, 'Search term too long')
    .optional(),
  limit: z.coerce.number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .default(25),
  offset: z.coerce.number()
    .int()
    .min(0, 'Offset cannot be negative')
    .default(0),
});

// Export types
export type WebhookVerification = z.infer<typeof webhookVerificationSchema>;
export type SendTextMessage = z.infer<typeof sendTextMessageSchema>;
export type SendTemplateMessage = z.infer<typeof sendTemplateMessageSchema>;
export type SendMediaMessage = z.infer<typeof sendMediaMessageSchema>;
export type CreateTemplate = z.infer<typeof createTemplateSchema>;
export type UpdateTemplate = z.infer<typeof updateTemplateSchema>;
export type GetConversationHistory = z.infer<typeof getConversationHistorySchema>;
export type GetAnalytics = z.infer<typeof getAnalyticsSchema>;
export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;
export type UpdatePartnerWhatsAppConfig = z.infer<typeof updatePartnerWhatsAppConfigSchema>;
export type TestMessage = z.infer<typeof testMessageSchema>;
export type MessageSearch = z.infer<typeof messageSearchSchema>;