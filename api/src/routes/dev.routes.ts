import { Router } from 'express';
import WhatsAppService from '../services/whatsapp.service';

const router = Router();

/**
 * @swagger
 * /api/dev/test-webhook:
 *   post:
 *     summary: Test WhatsApp webhook processing (Development only)
 *     description: Simulate incoming WhatsApp message to test auto-response system
 *     tags: [Development]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 example: "5511999999999"
 *               message:
 *                 type: string
 *                 example: "Hello, testing auto-response!"
 *               partnerId:
 *                 type: string
 *                 example: "cme30a6s100023fl3nnkiwkaw"
 *     responses:
 *       200:
 *         description: Test webhook processed successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/test-webhook', async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({ error: 'This endpoint is only available in development mode' });
    }

    const { phoneNumber, message, partnerId } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'phoneNumber and message are required' });
    }

    // Create a mock WhatsApp webhook payload
    const mockWebhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "test_entry_id",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "5511999999998",
                  phone_number_id: "826543520541078" // Default phone number ID
                },
                contacts: [
                  {
                    profile: { name: "Test User" },
                    wa_id: phoneNumber
                  }
                ],
                messages: [
                  {
                    from: phoneNumber,
                    id: `test_msg_${Date.now()}`,
                    timestamp: String(Math.floor(Date.now() / 1000)),
                    type: "text",
                    text: { body: message }
                  }
                ]
              },
              field: "messages"
            }
          ]
        }
      ]
    };

    console.log('🧪 TEST: Processing mock webhook payload...');
    
    // Process the mock webhook
    await WhatsAppService.processWebhook(mockWebhookPayload);
    
    console.log('🧪 TEST: Mock webhook processed successfully');

    res.status(200).json({
      success: true,
      message: 'Test webhook processed successfully',
      mockPayload: mockWebhookPayload,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('🧪 TEST: Error processing test webhook:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;