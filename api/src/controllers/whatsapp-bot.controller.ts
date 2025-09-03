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
    const instanceName = EvolutionApiService.generateInstanceName(partnerId, partner.whatsappNumber);
    const webhookUrl = EvolutionApiService.generateWebhookUrl(partnerId, partner.whatsappNumber);

    console.log(`Creating Evolution API instance: ${instanceName}`);
    console.log(`Webhook URL: ${webhookUrl}`);

    // Create instance in Evolution API (temporarily without webhook to avoid server crash)
    const createResult = await evolutionApiService.createInstance({
      instanceName,
      token: 'default-token', // Evolution API requires a token
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS', // Required parameter
      number: partner.whatsappNumber, // Phone number for the instance
      // webhookUrl // Temporarily disabled due to Evolution API server crash
    });

    if (!createResult.success) {
      return res.status(500).json({
        success: false,
        error: `Failed to create Evolution API instance: ${createResult.error}`
      });
    }

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
      console.log(`Deleting Evolution API instance: ${partner.evolutionInstanceId}`);
      
      // Try to logout first
      await evolutionApiService.logoutInstance(partner.evolutionInstanceId);
      
      // Then delete the instance
      const deleteResult = await evolutionApiService.deleteInstance(partner.evolutionInstanceId);
      
      if (!deleteResult.success) {
        console.warn(`Failed to delete Evolution API instance: ${deleteResult.error}`);
        // Continue anyway to disable bot in database
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
        const statusMap: { [key: string]: string } = {
          'open': 'connected',
          'close': 'disconnected',
          'connecting': 'connecting'
        };

        const newStatus = statusMap[connectionState] || 'disconnected';
        
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