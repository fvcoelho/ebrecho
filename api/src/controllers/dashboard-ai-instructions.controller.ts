import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../types';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/dashboard/ai-instructions:
 *   get:
 *     tags:
 *       - Dashboard - AI Instructions
 *     summary: Get AI instructions for current partner
 *     description: Retrieve AI instructions for the authenticated partner's WhatsApp bot
 *     security:
 *       - bearerAuth: []
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
export const getAiInstructions = async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = req.user?.partnerId;

    if (!partnerId) {
      return res.status(403).json({
        success: false,
        error: 'No partner associated with this user'
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
 * /api/dashboard/ai-instructions:
 *   post:
 *     tags:
 *       - Dashboard - AI Instructions
 *     summary: Create AI instructions for current partner
 *     description: Create new AI instructions for the authenticated partner's WhatsApp bot
 *     security:
 *       - bearerAuth: []
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
 *                 description: AI instructions in markdown format
 *                 example: |
 *                   # AI Assistant Instructions
 *                   
 *                   You are a helpful customer service assistant for {{store.name}}.
 *                   
 *                   ## Products
 *                   {{products.map(product => `- [${product.name}](${product.url}): R$ ${product.price}`).join('\n')}}
 *     responses:
 *       201:
 *         description: AI instructions created successfully
 *       409:
 *         description: AI instructions already exist for this partner
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export const createAiInstructions = async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = req.user?.partnerId;
    const { prompt } = req.body;

    if (!partnerId) {
      return res.status(403).json({
        success: false,
        error: 'No partner associated with this user'
      });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string'
      });
    }

    // Check if AI instructions already exist
    const existingInstructions = await prisma.aiInstructions.findUnique({
      where: {
        partnerId: partnerId
      }
    });

    if (existingInstructions) {
      return res.status(409).json({
        success: false,
        error: 'AI instructions already exist for this partner. Use PUT to update.'
      });
    }

    const aiInstructions = await prisma.aiInstructions.create({
      data: {
        prompt,
        partnerId
      }
    });

    return res.status(201).json({
      success: true,
      data: aiInstructions
    });

  } catch (error) {
    console.error('Error creating AI instructions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create AI instructions'
    });
  }
};

/**
 * @swagger
 * /api/dashboard/ai-instructions:
 *   put:
 *     tags:
 *       - Dashboard - AI Instructions
 *     summary: Update AI instructions for current partner
 *     description: Update existing AI instructions or create new ones for the authenticated partner's WhatsApp bot
 *     security:
 *       - bearerAuth: []
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
 *                 description: AI instructions in markdown format
 *                 example: |
 *                   # AI Assistant Instructions
 *                   
 *                   You are a helpful customer service assistant for {{store.name}}.
 *                   
 *                   ## Products
 *                   {{products.map(product => `- [${product.name}](${product.url}): R$ ${product.price}`).join('\n')}}
 *     responses:
 *       200:
 *         description: AI instructions updated successfully
 *       201:
 *         description: AI instructions created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export const updateAiInstructions = async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = req.user?.partnerId;
    const { prompt } = req.body;

    if (!partnerId) {
      return res.status(403).json({
        success: false,
        error: 'No partner associated with this user'
      });
    }

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Prompt is required and must be a string'
      });
    }

    // Use upsert to create or update
    const aiInstructions = await prisma.aiInstructions.upsert({
      where: {
        partnerId: partnerId
      },
      update: {
        prompt
      },
      create: {
        prompt,
        partnerId
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
 * /api/dashboard/ai-instructions:
 *   delete:
 *     tags:
 *       - Dashboard - AI Instructions
 *     summary: Delete AI instructions for current partner
 *     description: Delete AI instructions for the authenticated partner's WhatsApp bot
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: AI instructions deleted successfully
 *       404:
 *         description: AI instructions not found
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export const deleteAiInstructions = async (req: AuthRequest, res: Response) => {
  try {
    const partnerId = req.user?.partnerId;

    if (!partnerId) {
      return res.status(403).json({
        success: false,
        error: 'No partner associated with this user'
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

    await prisma.aiInstructions.delete({
      where: {
        partnerId: partnerId
      }
    });

    return res.status(200).json({
      success: true,
      message: 'AI instructions deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting AI instructions:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete AI instructions'
    });
  }
};