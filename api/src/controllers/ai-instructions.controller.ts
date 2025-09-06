import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/partners/{partnerId}/ai-instructions:
 *   get:
 *     tags:
 *       - Partners
 *     summary: Get AI instructions for partner
 *     description: Retrieve AI instructions for a partner's WhatsApp bot integration
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
 *         description: AI instructions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     prompt:
 *                       type: string
 *                     partnerId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: AI instructions not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export const getAiInstructions = async (req: Request<{ partnerId: string }>, res: Response) => {
  try {
    const { partnerId } = req.params;

    // Check if user has access to this partner
    if (req.user?.role !== 'ADMIN' && req.user?.partnerId !== partnerId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const aiInstructions = await prisma.aiInstructions.findUnique({
      where: {
        partnerId: partnerId
      }
    });

    if (!aiInstructions) {
      return res.status(404).json({
        success: false,
        error: 'AI instructions not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: aiInstructions
    });

  } catch (error) {
    console.error('Error fetching AI instructions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch AI instructions'
    });
  }
};

/**
 * @swagger
 * /api/partners/{partnerId}/ai-instructions:
 *   put:
 *     tags:
 *       - Partners
 *     summary: Update AI instructions for partner
 *     description: Create or update AI instructions for a partner's WhatsApp bot integration
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
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: AI instructions in markdown format with template variables
 *                 example: |
 *                   # AI Instructions for {{store.name}}
 *                   
 *                   Você é um assistente virtual especializado em atendimento ao cliente.
 *                   
 *                   ## Produtos disponíveis:
 *                   {{products.map(p => `- ${p.name}: R$ ${p.price}`).join('\n')}}
 *                   
 *                   ## Horários:
 *                   {{Object.entries(store.businessHours).map(([day, hours]) => `${day}: ${hours.open || 'Fechado'}`).join('\n')}}
 *     responses:
 *       200:
 *         description: AI instructions updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     prompt:
 *                       type: string
 *                     partnerId:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Partner not found
 */
export const updateAiInstructions = async (req: Request<{ partnerId: string }>, res: Response) => {
  try {
    const { partnerId } = req.params;
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string'
      });
    }

    // Check if user has access to this partner
    if (req.user?.role !== 'ADMIN' && req.user?.partnerId !== partnerId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Verify partner exists
    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    });

    if (!partner) {
      return res.status(404).json({
        success: false,
        error: 'Partner not found'
      });
    }

    // Upsert AI instructions
    const aiInstructions = await prisma.aiInstructions.upsert({
      where: {
        partnerId: partnerId
      },
      update: {
        prompt: prompt
      },
      create: {
        partnerId: partnerId,
        prompt: prompt
      }
    });

    return res.status(200).json({
      success: true,
      data: aiInstructions
    });

  } catch (error) {
    console.error('Error updating AI instructions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update AI instructions'
    });
  }
};

/**
 * @swagger
 * /api/partners/{partnerId}/ai-instructions:
 *   delete:
 *     tags:
 *       - Partners
 *     summary: Delete AI instructions for partner
 *     description: Delete AI instructions for a partner (will fallback to default instructions)
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
 *         description: AI instructions deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: AI instructions deleted successfully
 *       404:
 *         description: AI instructions not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export const deleteAiInstructions = async (req: Request<{ partnerId: string }>, res: Response) => {
  try {
    const { partnerId } = req.params;

    // Check if user has access to this partner
    if (req.user?.role !== 'ADMIN' && req.user?.partnerId !== partnerId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const deleted = await prisma.aiInstructions.delete({
      where: {
        partnerId: partnerId
      }
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'AI instructions not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'AI instructions deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting AI instructions:', error);
    
    // Check if error is because record doesn't exist
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'AI instructions not found'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to delete AI instructions'
    });
  }
};