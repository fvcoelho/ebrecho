import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import {
  promoterInvitationsQuerySchema,
  promoterEventsQuerySchema,
  promoterCommissionsQuerySchema,
} from '../schemas/promoter.schema';

// Helper function to generate unique invitation codes
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to calculate tier quotas
function getTierQuota(tier: string): number {
  switch (tier) {
    case 'BRONZE': return 10;
    case 'SILVER': return 25;
    case 'GOLD': return 50;
    case 'PLATINUM': return -1; // Unlimited
    default: return 10;
  }
}

// Helper function to calculate tier commission rates
function getTierCommissionRate(tier: string): number {
  switch (tier) {
    case 'BRONZE': return 0.02; // 2%
    case 'SILVER': return 0.03; // 3%
    case 'GOLD': return 0.04; // 4%
    case 'PLATINUM': return 0.05; // 5%
    default: return 0.02;
  }
}

// Promoter Profile Management
/**
 * @swagger
 * /api/promoter/apply:
 *   post:
 *     tags:
 *       - Promoter
 *     summary: Apply to become a promoter
 *     description: Submit application to become a promoter. Creates a new promoter profile with immediate activation (auto-approval).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Name of the promoter's business
 *                 example: "Fashion Hub Promotions"
 *               territory:
 *                 type: string
 *                 description: Territory or region of operation (optional)
 *                 example: "São Paulo - Centro"
 *               specialization:
 *                 type: string
 *                 description: Specialization area in fashion (optional)
 *                 example: "vintage"
 *               phone:
 *                 type: string
 *                 description: Contact phone number (optional)
 *                 example: "(11) 99999-9999"
 *     responses:
 *       201:
 *         description: Promoter application submitted and approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Promoter application submitted successfully"
 *                 promoter:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     businessName:
 *                       type: string
 *                     territory:
 *                       type: string
 *                     specialization:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     tier:
 *                       type: string
 *                       enum: [BRONZE, SILVER, GOLD, PLATINUM]
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                       description: Promoters are automatically approved and activated
 *                     approvedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when promoter was approved (auto-set for new applications)
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const applyForPromoter = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user already has a promoter profile
    const existingPromoter = await prisma.promoter.findUnique({
      where: { userId },
    });

    if (existingPromoter) {
      return res.status(400).json({ error: 'User already has a promoter profile' });
    }

    // Check if user is eligible
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'PARTNER_USER') {
      return res.status(400).json({ error: 'Only partner administrators can become promoters' });
    }

    // Create promoter application with auto-approval
    const promoter = await prisma.promoter.create({
      data: {
        userId,
        businessName: data.businessName,
        territory: data.territory,
        specialization: data.specialization,
        phone: data.phone, // Add phone field support
        tier: 'BRONZE',
        commissionRate: getTierCommissionRate('BRONZE'),
        invitationQuota: getTierQuota('BRONZE'),
        isActive: true, // Auto-approval: immediately active
        approvedAt: new Date(), // Auto-approval: set approval timestamp
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      message: 'Promoter application submitted successfully',
      promoter,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error applying for promoter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/promoter/profile:
 *   get:
 *     tags:
 *       - Promoter
 *     summary: Get promoter profile
 *     description: Retrieve the authenticated promoter's profile with statistics
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Promoter profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 businessName:
 *                   type: string
 *                 territory:
 *                   type: string
 *                 specialization:
 *                   type: string
 *                 tier:
 *                   type: string
 *                   enum: [BRONZE, SILVER, GOLD, PLATINUM]
 *                 commissionRate:
 *                   type: number
 *                 invitationQuota:
 *                   type: integer
 *                 invitationsUsed:
 *                   type: integer
 *                 isActive:
 *                   type: boolean
 *                 monthlyCommissions:
 *                   type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Promoter profile not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const getPromoterProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const promoter = await prisma.promoter.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            invitations: true,
            events: true,
            commissions: true,
          },
        },
      },
    });

    if (!promoter) {
      return res.status(404).json({ error: 'Promoter profile not found' });
    }

    // Calculate current month statistics
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyStats = await prisma.promoterCommission.aggregate({
      where: {
        promoterId: promoter.id,
        createdAt: {
          gte: currentMonth,
        },
      },
      _sum: {
        amount: true,
      },
    });

    res.json({
      ...promoter,
      monthlyCommissions: monthlyStats._sum.amount || 0,
    });
  } catch (error) {
    console.error('Error getting promoter profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/promoter/profile:
 *   put:
 *     tags:
 *       - Promoter
 *     summary: Update promoter profile
 *     description: Update promoter profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Name of the promoter's business
 *               territory:
 *                 type: string
 *                 description: Territory or region of operation
 *               specialization:
 *                 type: string
 *                 description: Specialization area in fashion
 *               phone:
 *                 type: string
 *                 description: Contact phone number
 *                 example: "(11) 99999-9999"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const updatePromoterProfile = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const promoter = await prisma.promoter.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      message: 'Promoter profile updated successfully',
      promoter,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error updating promoter profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Invitation Management
/**
 * @swagger
 * /api/promoter/invitations:
 *   post:
 *     tags:
 *       - Promoter
 *     summary: Create new partner invitation
 *     description: Create invitation for potential partners to join the platform
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - targetEmail
 *               - targetName
 *               - targetBusinessName
 *               - invitationType
 *             properties:
 *               targetEmail:
 *                 type: string
 *                 format: email
 *               targetName:
 *                 type: string
 *               targetBusinessName:
 *                 type: string
 *               targetPhone:
 *                 type: string
 *               personalizedMessage:
 *                 type: string
 *               invitationType:
 *                 type: string
 *                 enum: [EMAIL, WHATSAPP, IN_PERSON]
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Invitation created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const createInvitation = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const promoter = await prisma.promoter.findUnique({
      where: { userId },
    });

    if (!promoter || !promoter.isActive) {
      return res.status(403).json({ error: 'Promoter not found or not active' });
    }

    // Check invitation quota
    if (promoter.invitationQuota !== -1 && promoter.invitationsUsed >= promoter.invitationQuota) {
      return res.status(400).json({ error: 'Invitation quota exceeded' });
    }

    // Check if email is already invited or registered
    const existingInvitation = await prisma.partnerInvitation.findFirst({
      where: {
        targetEmail: data.targetEmail,
        status: {
          in: ['PENDING', 'SENT', 'VIEWED'],
        },
      },
    });

    if (existingInvitation) {
      return res.status(400).json({ error: 'Email already has a pending invitation' });
    }

    const existingPartner = await prisma.partner.findUnique({
      where: { email: data.targetEmail },
    });

    if (existingPartner) {
      return res.status(400).json({ error: 'Email already registered as partner' });
    }

    // Set expiration date (default 30 days from now)
    const expiresAt = data.expiresAt ? new Date(data.expiresAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Generate unique invitation code
    let invitationCode: string;
    let isUnique = false;
    
    do {
      invitationCode = generateInvitationCode();
      const existing = await prisma.partnerInvitation.findUnique({
        where: { invitationCode },
      });
      isUnique = !existing;
    } while (!isUnique);

    const invitation = await prisma.partnerInvitation.create({
      data: {
        promoterId: promoter.id,
        invitationCode,
        targetEmail: data.targetEmail,
        targetPhone: data.targetPhone,
        targetName: data.targetName,
        targetBusinessName: data.targetBusinessName,
        personalizedMessage: data.personalizedMessage,
        invitationType: data.invitationType,
        expiresAt,
        commissionPercentage: promoter.commissionRate,
      },
    });

    // Update promoter invitation count
    await prisma.promoter.update({
      where: { id: promoter.id },
      data: {
        invitationsUsed: {
          increment: 1,
        },
      },
    });

    res.status(201).json({
      message: 'Invitation created successfully',
      invitation,
      invitationUrl: `${process.env.FRONTEND_URL}/cadastro/parceiro?convite=${invitationCode}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/promoter/invitations:
 *   get:
 *     tags:
 *       - Promoter
 *     summary: Get promoter invitations
 *     description: Retrieve list of invitations created by the promoter with pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SENT, VIEWED, ACCEPTED, EXPIRED]
 *       - in: query
 *         name: invitationType
 *         schema:
 *           type: string
 *           enum: [EMAIL, WHATSAPP, IN_PERSON]
 *     responses:
 *       200:
 *         description: Invitations retrieved successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const getInvitations = async (req: Request, res: Response) => {
  try {
    const query = promoterInvitationsQuerySchema.parse(req.query);
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const promoter = await prisma.promoter.findUnique({
      where: { userId },
    });

    if (!promoter) {
      return res.status(404).json({ error: 'Promoter not found' });
    }

    const where: any = {
      promoterId: promoter.id,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.invitationType) {
      where.invitationType = query.invitationType;
    }

    const [invitations, total] = await Promise.all([
      prisma.partnerInvitation.findMany({
        where,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          resultingPartner: {
            select: {
              id: true,
              name: true,
              email: true,
              isActive: true,
            },
          },
        },
      }),
      prisma.partnerInvitation.count({ where }),
    ]);

    res.json({
      invitations,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error getting invitations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/promoter/invitations/{id}:
 *   put:
 *     tags:
 *       - Promoter
 *     summary: Update invitation
 *     description: Update an existing invitation (only pending/sent invitations)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               targetName:
 *                 type: string
 *               targetPhone:
 *                 type: string
 *               personalizedMessage:
 *                 type: string
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Invitation updated successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Invitation not found or cannot be updated
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const updateInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const promoter = await prisma.promoter.findUnique({
      where: { userId },
    });

    if (!promoter) {
      return res.status(404).json({ error: 'Promoter not found' });
    }

    const invitation = await prisma.partnerInvitation.findFirst({
      where: {
        id,
        promoterId: promoter.id,
        status: {
          in: ['PENDING', 'SENT'],
        },
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or cannot be updated' });
    }

    const updatedInvitation = await prisma.partnerInvitation.update({
      where: { id },
      data,
    });

    res.json({
      message: 'Invitation updated successfully',
      invitation: updatedInvitation,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error updating invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * @swagger
 * /api/promoter/invitations/{id}:
 *   delete:
 *     tags:
 *       - Promoter
 *     summary: Cancel invitation
 *     description: Cancel an existing invitation by marking it as expired
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invitation cancelled successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Invitation not found or cannot be cancelled
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const cancelInvitation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const promoter = await prisma.promoter.findUnique({
      where: { userId },
    });

    if (!promoter) {
      return res.status(404).json({ error: 'Promoter not found' });
    }

    const invitation = await prisma.partnerInvitation.findFirst({
      where: {
        id,
        promoterId: promoter.id,
        status: {
          in: ['PENDING', 'SENT', 'VIEWED'],
        },
      },
    });

    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found or cannot be cancelled' });
    }

    await prisma.partnerInvitation.update({
      where: { id },
      data: {
        status: 'EXPIRED',
      },
    });

    res.json({
      message: 'Invitation cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Dashboard Analytics
/**
 * @swagger
 * /api/promoter/analytics:
 *   get:
 *     tags:
 *       - Promoter
 *     summary: Get promoter analytics
 *     description: Retrieve comprehensive analytics for promoter dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalInvitations:
 *                       type: integer
 *                     monthlyInvitations:
 *                       type: integer
 *                     successfulInvitations:
 *                       type: integer
 *                     conversionRate:
 *                       type: number
 *                     activeEvents:
 *                       type: integer
 *                     monthlyCommissions:
 *                       type: number
 *                     totalCommissions:
 *                       type: number
 *                     currentTier:
 *                       type: string
 *                       enum: [BRONZE, SILVER, GOLD, PLATINUM]
 *                 tierProgress:
 *                   type: object
 *                   nullable: true
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Promoter not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const getPromoterAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const promoter = await prisma.promoter.findUnique({
      where: { userId },
    });

    if (!promoter) {
      return res.status(404).json({ error: 'Promoter not found' });
    }

    // Get current month start
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    // Get various analytics
    const [
      totalInvitations,
      monthlyInvitations,
      successfulInvitations,
      activeEvents,
      monthlyCommissions,
      totalCommissions,
    ] = await Promise.all([
      prisma.partnerInvitation.count({
        where: { promoterId: promoter.id },
      }),
      prisma.partnerInvitation.count({
        where: {
          promoterId: promoter.id,
          createdAt: { gte: currentMonth },
        },
      }),
      prisma.partnerInvitation.count({
        where: {
          promoterId: promoter.id,
          status: 'ACCEPTED',
        },
      }),
      prisma.event.count({
        where: {
          promoterId: promoter.id,
          status: 'ACTIVE',
        },
      }),
      prisma.promoterCommission.aggregate({
        where: {
          promoterId: promoter.id,
          createdAt: { gte: currentMonth },
        },
        _sum: { amount: true },
      }),
      prisma.promoterCommission.aggregate({
        where: { promoterId: promoter.id },
        _sum: { amount: true },
      }),
    ]);

    // Calculate conversion rate
    const conversionRate = totalInvitations > 0 ? (successfulInvitations / totalInvitations) * 100 : 0;

    // Get tier progress
    const tierRequirements = {
      BRONZE: { invitations: 0, commissions: 0 },
      SILVER: { invitations: 25, commissions: 5000 },
      GOLD: { invitations: 100, commissions: 15000 },
      PLATINUM: { invitations: 500, commissions: 50000 },
    };

    const nextTier = promoter.tier === 'BRONZE' ? 'SILVER' : 
                   promoter.tier === 'SILVER' ? 'GOLD' : 
                   promoter.tier === 'GOLD' ? 'PLATINUM' : null;

    res.json({
      overview: {
        totalInvitations,
        monthlyInvitations,
        successfulInvitations,
        conversionRate: Math.round(conversionRate * 100) / 100,
        activeEvents,
        monthlyCommissions: monthlyCommissions._sum.amount || 0,
        totalCommissions: totalCommissions._sum.amount || 0,
        currentTier: promoter.tier,
        quotaUsage: {
          used: promoter.invitationsUsed,
          total: promoter.invitationQuota,
          percentage: promoter.invitationQuota === -1 ? 0 : 
                     Math.round((promoter.invitationsUsed / promoter.invitationQuota) * 100),
        },
      },
      tierProgress: nextTier ? {
        currentTier: promoter.tier,
        nextTier,
        requirements: tierRequirements[nextTier as keyof typeof tierRequirements],
        progress: {
          invitations: successfulInvitations,
          commissions: totalCommissions._sum.amount || 0,
        },
      } : null,
    });
  } catch (error) {
    console.error('Error getting promoter analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Commission Management
/**
 * @swagger
 * /api/promoter/commissions:
 *   get:
 *     tags:
 *       - Promoter
 *     summary: Get promoter commissions
 *     description: Retrieve list of commissions earned by the promoter
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: commissionType
 *         schema:
 *           type: string
 *           enum: [REFERRAL, SALES, EVENT]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PAID, CANCELLED]
 *       - in: query
 *         name: partnerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Commissions retrieved successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const getCommissions = async (req: Request, res: Response) => {
  try {
    const query = promoterCommissionsQuerySchema.parse(req.query);
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const promoter = await prisma.promoter.findUnique({
      where: { userId },
    });

    if (!promoter) {
      return res.status(404).json({ error: 'Promoter not found' });
    }

    const where: any = {
      promoterId: promoter.id,
    };

    if (query.commissionType) {
      where.commissionType = query.commissionType;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.partnerId) {
      where.partnerId = query.partnerId;
    }

    if (query.startDate) {
      where.createdAt = { gte: new Date(query.startDate) };
    }

    if (query.endDate) {
      where.createdAt = { 
        ...where.createdAt,
        lte: new Date(query.endDate),
      };
    }

    const [commissions, total] = await Promise.all([
      prisma.promoterCommission.findMany({
        where,
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          partner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.promoterCommission.count({ where }),
    ]);

    res.json({
      commissions,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        pages: Math.ceil(total / query.limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error getting commissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};