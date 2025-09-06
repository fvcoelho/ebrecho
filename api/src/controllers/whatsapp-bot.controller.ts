import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { evolutionApiService, EvolutionApiService } from '../services/evolution-api.service';

/**
 * @swagger
 * /api/partners/{partnerId}/whatsapp-bot/enable:
 *   post:
 *     tags:
 *       - WhatsApp Bot
 *     summary: Enable WhatsApp bot for a partner
 *     description: Create Evolution API instance and enable WhatsApp bot integration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     responses:
 *       200:
 *         description: Bot enabled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     instanceId:
 *                       type: string
 *                     qrcode:
 *                       type: string
 *                     status:
 *                       type: string
 */
export const enableWhatsAppBot = async (req: Request<{ partnerId: string }>, res: Response) => {
  try {
    const { partnerId } = req.params;

    // Get partner details
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { 
        id: true, 
        name: true,
        slug: true,
        whatsappNumber: true, 
        whatsappBotEnabled: true,
        evolutionInstanceId: true 
      }
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }

    if (!partner.whatsappNumber) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp number is required. Please configure your WhatsApp number first.'
      });
    }

    if (partner.whatsappBotEnabled) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp bot is already enabled for this partner'
      });
    }

    // Generate instance name and webhook URL
    const instanceName = EvolutionApiService.generateInstanceName(partner.slug, partner.whatsappNumber);
    const webhookUrl = EvolutionApiService.generateWebhookUrl(partnerId, partner.whatsappNumber);

    console.log(`Creating Evolution API instance: ${instanceName}`);
    console.log(`Webhook URL: ${webhookUrl}`);

    // Create instance in Evolution API with webhook configuration
    const createResult = await evolutionApiService.createInstance({
      instanceName,
      token: 'default-token', // Evolution API requires a token
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS', // Required parameter
      number: partner.whatsappNumber, // Phone number for the instance
      webhookUrl // Enable webhook with proper configuration
    });

    if (!createResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to create Evolution API instance: ${createResult.error}`
      });
    }

    // Optional: Set webhook separately if needed (as a fallback)
    // This can be useful if the webhook wasn't set during instance creation
    // await evolutionApiService.setWebhook(instanceName, webhookUrl);

    // Connect to instance to get QR code
    const connectResult = await evolutionApiService.connectInstance(instanceName);
    
    if (!connectResult.success) {
      // Try to delete the created instance on failure
      await evolutionApiService.deleteInstance(instanceName);
      
      return res.status(500).json({
        success: false,
        error: `Failed to connect to Evolution API instance: ${connectResult.error}`
      });
    }

    // Update partner with bot enabled and instance ID
    const updatedPartner = await prisma.partner.update({
      where: { id: partnerId },
      data: {
        whatsappBotEnabled: true,
        evolutionInstanceId: instanceName,
        whatsappConnectionStatus: 'connecting'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'WhatsApp bot enabled successfully',
      data: {
        instanceId: instanceName,
        qrcode: connectResult.data?.qrcode || connectResult.data?.code,
        status: 'connecting',
        partner: {
          id: updatedPartner.id,
          name: updatedPartner.name,
          whatsappBotEnabled: updatedPartner.whatsappBotEnabled,
          whatsappConnectionStatus: updatedPartner.whatsappConnectionStatus
        }
      }
    });

  } catch (error) {
    console.error('Error enabling WhatsApp bot:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to enable WhatsApp bot'
    });
  }
};

/**
 * @swagger
 * /api/partners/{partnerId}/whatsapp-bot/disable:
 *   post:
 *     tags:
 *       - WhatsApp Bot
 *     summary: Disable WhatsApp bot for a partner
 *     description: Disconnect and delete Evolution API instance, disable bot integration
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 */
export const disableWhatsAppBot = async (req: Request<{ partnerId: string }>, res: Response) => {
  try {
    const { partnerId } = req.params;

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { 
        id: true, 
        name: true,
        whatsappBotEnabled: true,
        evolutionInstanceId: true 
      }
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }

    if (!partner.whatsappBotEnabled) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp bot is not enabled for this partner'
      });
    }

    // Logout and delete instance if exists
    if (partner.evolutionInstanceId) {
      console.log(`Disabling Evolution API instance: ${partner.evolutionInstanceId}`);
      
      // Step 1: Logout instance (disconnect WhatsApp session)
      console.log('Step 1: Logging out WhatsApp session...');
      const logoutResult = await evolutionApiService.logoutInstance(partner.evolutionInstanceId);
      if (!logoutResult.success) {
        console.warn(`Failed to logout Evolution API instance: ${logoutResult.error}`);
        // Continue anyway - instance might already be logged out
      } else {
        console.log('✅ WhatsApp session logged out successfully');
      }
      
      // Step 2: Delete the instance completely
      console.log('Step 2: Deleting instance from Evolution API...');
      const deleteResult = await evolutionApiService.deleteInstance(partner.evolutionInstanceId);
      if (!deleteResult.success) {
        console.warn(`Failed to delete Evolution API instance: ${deleteResult.error}`);
        // Continue anyway to disable bot in database
      } else {
        console.log('✅ Instance deleted successfully from Evolution API');
      }
    }

    // Update partner to disable bot
    const updatedPartner = await prisma.partner.update({
      where: { id: partnerId },
      data: {
        whatsappBotEnabled: false,
        evolutionInstanceId: null,
        whatsappConnectionStatus: 'disconnected'
      }
    });

    return res.status(200).json({
      success: true,
      message: 'WhatsApp bot disabled successfully',
      data: {
        partner: {
          id: updatedPartner.id,
          name: updatedPartner.name,
          whatsappBotEnabled: updatedPartner.whatsappBotEnabled,
          whatsappConnectionStatus: updatedPartner.whatsappConnectionStatus
        }
      }
    });

  } catch (error) {
    console.error('Error disabling WhatsApp bot:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to disable WhatsApp bot'
    });
  }
};

/**
 * @swagger
 * /api/partners/{partnerId}/whatsapp-bot/status:
 *   get:
 *     tags:
 *       - WhatsApp Bot
 *     summary: Get WhatsApp bot status
 *     description: Get current connection status and QR code if needed
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 */
export const getWhatsAppBotStatus = async (req: Request<{ partnerId: string }>, res: Response) => {
  try {
    const { partnerId } = req.params;

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { 
        id: true,
        name: true,
        whatsappNumber: true,
        whatsappBotEnabled: true,
        evolutionInstanceId: true,
        whatsappConnectionStatus: true
      }
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }

    let connectionState = null;
    let qrcode = null;

    // If bot is enabled and has instance, check Evolution API status
    if (partner.whatsappBotEnabled && partner.evolutionInstanceId) {
      const stateResult = await evolutionApiService.getConnectionState(partner.evolutionInstanceId);
      
      if (stateResult.success) {
        connectionState = stateResult.data?.state;
        
        // If not connected, try to get QR code
        if (connectionState !== 'open') {
          const connectResult = await evolutionApiService.connectInstance(partner.evolutionInstanceId);
          if (connectResult.success) {
            qrcode = connectResult.data?.qrcode || connectResult.data?.code;
          }
        }

        // Update database with current status
        // Evolution API v2 states: 'open' = connected, 'close' = disconnected
        const statusMap: { [key: string]: string } = {
          'open': 'connected',
          'close': 'disconnected',
          'connecting': 'connecting',
          'connected': 'connected',  // Handle if API returns 'connected' directly
          'disconnected': 'disconnected'  // Handle if API returns 'disconnected' directly
        };

        // Log the state mapping for debugging
        console.log(`Mapping Evolution state '${connectionState}' to '${statusMap[connectionState] || 'disconnected'}'`);

        const newStatus = statusMap[connectionState?.toLowerCase()] || 'disconnected';
        
        if (newStatus !== partner.whatsappConnectionStatus) {
          await prisma.partner.update({
            where: { id: partnerId },
            data: { whatsappConnectionStatus: newStatus }
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        botEnabled: partner.whatsappBotEnabled,
        connectionStatus: partner.whatsappConnectionStatus || 'disconnected',
        instanceId: partner.evolutionInstanceId,
        whatsappNumber: partner.whatsappNumber,
        evolutionState: connectionState,
        qrcode: qrcode,
        partner: {
          id: partner.id,
          name: partner.name
        }
      }
    });

  } catch (error) {
    console.error('Error getting WhatsApp bot status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get WhatsApp bot status'
    });
  }
};

/**
 * @swagger
 * /api/partners/{partnerId}/whatsapp-bot/qrcode:
 *   get:
 *     tags:
 *       - WhatsApp Bot
 *     summary: Get QR code for WhatsApp connection
 *     description: Get fresh QR code for connecting WhatsApp to bot instance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 */
export const getQRCode = async (req: Request<{ partnerId: string }>, res: Response) => {
  try {
    const { partnerId } = req.params;

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { 
        id: true,
        whatsappBotEnabled: true,
        evolutionInstanceId: true 
      }
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }

    if (!partner.whatsappBotEnabled || !partner.evolutionInstanceId) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp bot is not enabled for this partner'
      });
    }

    // Get fresh QR code from Evolution API
    const connectResult = await evolutionApiService.connectInstance(partner.evolutionInstanceId);
    
    if (!connectResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to get QR code: ${connectResult.error}`
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        qrcode: connectResult.data?.qrcode || connectResult.data?.code,
        instanceId: partner.evolutionInstanceId
      }
    });

  } catch (error) {
    console.error('Error getting QR code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get QR code'
    });
  }
};

/**
 * @swagger
 * /api/partners/{partnerId}/whatsapp-bot/restart:
 *   post:
 *     tags:
 *       - WhatsApp Bot
 *     summary: Restart WhatsApp bot instance
 *     description: Restart Evolution API instance for the partner
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 */
export const restartWhatsAppBot = async (req: Request<{ partnerId: string }>, res: Response) => {
  try {
    const { partnerId } = req.params;

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { 
        id: true,
        whatsappBotEnabled: true,
        evolutionInstanceId: true 
      }
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }

    if (!partner.whatsappBotEnabled || !partner.evolutionInstanceId) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp bot is not enabled for this partner'
      });
    }

    // Restart instance in Evolution API
    const restartResult = await evolutionApiService.restartInstance(partner.evolutionInstanceId);
    
    if (!restartResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to restart instance: ${restartResult.error}`
      });
    }

    // Update status to connecting
    await prisma.partner.update({
      where: { id: partnerId },
      data: { whatsappConnectionStatus: 'connecting' }
    });

    return res.status(200).json({
      success: true,
      message: 'WhatsApp bot instance restarted successfully',
      data: {
        instanceId: partner.evolutionInstanceId,
        status: 'connecting'
      }
    });

  } catch (error) {
    console.error('Error restarting WhatsApp bot:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to restart WhatsApp bot'
    });
  }
};

/**
 * @swagger
 * /api/partners/{partnerId}/whatsapp-bot/test-message:
 *   post:
 *     tags:
 *       - WhatsApp Bot
 *     summary: Send a test message via WhatsApp bot
 *     description: Send a test message to validate bot configuration and connectivity
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 description: WhatsApp number to send message to (with country code)
 *                 example: "5511999999999"
 *               message:
 *                 type: string
 *                 description: Message content
 *                 example: "This is a test message from your WhatsApp bot!"
 *               messageType:
 *                 type: string
 *                 enum: [text, image, document]
 *                 default: text
 *               mediaUrl:
 *                 type: string
 *                 description: URL of media file (for image/document messages)
 *               caption:
 *                 type: string
 *                 description: Caption for media messages
 */
export const sendTestMessage = async (req: Request<{ partnerId: string }>, res: Response) => {
  try {
    const { partnerId } = req.params;
    const { to, message, messageType = 'text', mediaUrl, caption } = req.body;

    // Validate input
    if (!to || (!message && messageType === 'text')) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to and message are required for text messages'
      });
    }

    if ((messageType === 'image' || messageType === 'document') && !mediaUrl) {
      return res.status(400).json({
        success: false,
        error: 'Media URL is required for image/document messages'
      });
    }

    // Get partner details
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { 
        id: true,
        whatsappBotEnabled: true,
        evolutionInstanceId: true,
        whatsappConnectionStatus: true
      }
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }

    if (!partner.whatsappBotEnabled || !partner.evolutionInstanceId) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp bot is not enabled for this partner'
      });
    }

    if (partner.whatsappConnectionStatus !== 'connected') {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp bot is not connected. Please connect the bot first.'
      });
    }

    // Send message based on type
    let result;
    if (messageType === 'text') {
      result = await evolutionApiService.sendTextMessage(
        partner.evolutionInstanceId,
        to,
        message
      );
    } else if (messageType === 'image' || messageType === 'document') {
      result = await evolutionApiService.sendMediaMessage(
        partner.evolutionInstanceId,
        to,
        mediaUrl,
        messageType as 'image' | 'document',
        caption || message
      );
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid message type. Supported types: text, image, document'
      });
    }

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send test message'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Test message sent successfully',
      data: result.data
    });

  } catch (error) {
    console.error('Error sending test message:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send test message'
    });
  }
};

/**
 * @swagger
 * /api/partners/{partnerId}/whatsapp-bot/messages:
 *   get:
 *     tags:
 *       - WhatsApp Bot
 *     summary: Get WhatsApp bot messages
 *     description: Retrieve message history from a WhatsApp chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *       - in: query
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID or phone number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 50
 *         description: Maximum number of messages to retrieve
 */
export const getBotMessages = async (req: Request<{ partnerId: string }>, res: Response) => {
  try {
    const { partnerId } = req.params;
    const { chatId, limit = 50 } = req.query;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required'
      });
    }

    // Get partner details
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { 
        id: true,
        whatsappBotEnabled: true,
        evolutionInstanceId: true
      }
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }

    if (!partner.whatsappBotEnabled || !partner.evolutionInstanceId) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp bot is not enabled for this partner'
      });
    }

    // Get messages from Evolution API
    const result = await evolutionApiService.getMessages(
      partner.evolutionInstanceId,
      chatId as string,
      Number(limit)
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to get messages'
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error getting bot messages:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get messages'
    });
  }
};

/**
 * @swagger
 * /api/partners/{partnerId}/whatsapp-bot/send-typing:
 *   post:
 *     tags:
 *       - WhatsApp Bot
 *     summary: Send typing indicator
 *     description: Show typing indicator in WhatsApp chat
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *         description: Partner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *                 description: WhatsApp number to show typing to
 *               duration:
 *                 type: number
 *                 description: Duration in milliseconds
 *                 default: 3000
 */
export const sendTypingIndicator = async (req: Request<{ partnerId: string }>, res: Response) => {
  try {
    const { partnerId } = req.params;
    const { to, duration = 3000 } = req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Recipient number is required'
      });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { 
        id: true,
        whatsappBotEnabled: true,
        evolutionInstanceId: true
      }
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }

    if (!partner.whatsappBotEnabled || !partner.evolutionInstanceId) {
      return res.status(400).json({
        success: false,
        error: 'WhatsApp bot is not enabled for this partner'
      });
    }

    const result = await evolutionApiService.sendTyping(
      partner.evolutionInstanceId,
      to,
      duration
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to send typing indicator'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Typing indicator sent',
      data: result.data
    });

  } catch (error) {
    console.error('Error sending typing indicator:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send typing indicator'
    });
  }
};