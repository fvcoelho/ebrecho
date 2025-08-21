import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { PromoterTier } from '@prisma/client';

// Schema for approving promoter applications
const approvePromoterSchema = z.object({
  body: z.object({
    promoterId: z.string().cuid(),
    approved: z.boolean(),
    notes: z.string().optional(),
  }),
});

// Schema for creating promoter (admin only)
const createPromoterSchema = z.object({
  body: z.object({
    userId: z.string().cuid(),
    businessName: z.string().min(2, 'Business name must be at least 2 characters'),
    territory: z.string().optional(),
    specialization: z.string().optional(),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).default('BRONZE'),
    commissionRate: z.number().min(0).max(1).optional(),
    invitationQuota: z.number().int().min(-1).optional(),
    isActive: z.boolean().default(true),
  }),
});

// Schema for updating promoter (admin only)
const updatePromoterSchema = z.object({
  body: z.object({
    businessName: z.string().min(2, 'Business name must be at least 2 characters').optional(),
    territory: z.string().optional(),
    specialization: z.string().optional(),
    tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
    commissionRate: z.number().min(0).max(1).optional(),
    invitationQuota: z.number().int().min(-1).optional(),
    isActive: z.boolean().optional(),
  }),
});

// Query schema for listing promoters
const promotersQuerySchema = z.object({
  page: z.string().transform(Number).default('1'),
  limit: z.string().transform(Number).default('10'),
  sortBy: z.enum(['createdAt', 'businessName', 'tier', 'totalCommissionsEarned']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  tier: z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']).optional(),
  isActive: z.string().transform((val) => val === 'true' ? true : val === 'false' ? false : undefined).optional(),
  search: z.string().optional(),
});

// Admin function to approve promoter applications
export const approvePromoterApplication = async (req: Request, res: Response) => {
  try {
    const { promoterId, approved, notes } = req.body;

    // Get promoter with user info
    const promoter = await prisma.promoter.findUnique({
      where: { id: promoterId },
      include: {
        user: {
          include: {
            partner: true,
          },
        },
      },
    });

    if (!promoter) {
      return res.status(404).json({ error: 'Promoter application not found' });
    }

    if (promoter.isActive) {
      return res.status(400).json({ error: 'Promoter is already active' });
    }

    if (!approved) {
      // If not approved, just update the promoter record with notes
      await prisma.promoter.update({
        where: { id: promoterId },
        data: {
          // Store notes in a field if available, or just log for now
          // metadata: {
          //   ...(promoter as any).metadata,
          //   rejectionNotes: notes,
          //   rejectedAt: new Date(),
          // },
        },
      });

      return res.json({
        message: 'Promoter application rejected',
        promoter,
      });
    }

    // Determine new role based on current role
    let newRole = promoter.user.role;
    
    if (promoter.user.role === 'PARTNER_ADMIN') {
      // Partner admin becomes partner promoter
      newRole = 'PARTNER_PROMOTER';
    } else if (promoter.user.role === 'CUSTOMER') {
      // Customer becomes regular promoter
      newRole = 'PROMOTER';
    }

    // Start transaction to update both user role and promoter status
    const result = await prisma.$transaction(async (tx) => {
      // Update user role
      const updatedUser = await tx.user.update({
        where: { id: promoter.userId },
        data: {
          role: newRole,
        },
      });

      // Activate promoter profile
      const updatedPromoter = await tx.promoter.update({
        where: { id: promoterId },
        data: {
          isActive: true,
          approvedAt: new Date(),
        },
      });

      return { updatedUser, updatedPromoter };
    });

    res.json({
      message: 'Promoter application approved successfully',
      user: {
        id: result.updatedUser.id,
        email: result.updatedUser.email,
        role: result.updatedUser.role,
      },
      promoter: result.updatedPromoter,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error approving promoter application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// CREATE: Create new promoter (admin only)
export const createPromoter = async (req: Request, res: Response) => {
  try {
    const data = createPromoterSchema.parse(req).body;

    // Check if user exists and doesn't already have a promoter profile
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      include: { promoter: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.promoter) {
      return res.status(400).json({ error: 'User already has a promoter profile' });
    }

    // Set default values based on tier if not provided
    const tier = data.tier || 'BRONZE';
    const commissionRate = data.commissionRate ?? getTierCommissionRate(tier);
    const invitationQuota = data.invitationQuota ?? getTierQuota(tier);

    // Create promoter
    const promoter = await prisma.promoter.create({
      data: {
        userId: data.userId,
        businessName: data.businessName,
        territory: data.territory,
        specialization: data.specialization,
        tier: tier as PromoterTier,
        commissionRate,
        invitationQuota,
        isActive: data.isActive,
        approvedAt: data.isActive ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            partner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Update user role if promoter is active
    if (data.isActive) {
      const newRole = user.role === 'PARTNER_ADMIN' ? 'PARTNER_PROMOTER' : 'PROMOTER';
      await prisma.user.update({
        where: { id: data.userId },
        data: { role: newRole },
      });
    }

    res.status(201).json({
      message: 'Promoter created successfully',
      promoter,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error creating promoter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// READ: Get all promoters with pagination and filters
export const getAllPromoters = async (req: Request, res: Response) => {
  try {
    const query = promotersQuerySchema.parse(req.query);

    const where: any = {};

    // Apply filters
    if (query.tier) {
      where.tier = query.tier;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        { businessName: { contains: query.search, mode: 'insensitive' } },
        { territory: { contains: query.search, mode: 'insensitive' } },
        { specialization: { contains: query.search, mode: 'insensitive' } },
        { user: { name: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [promoters, total] = await Promise.all([
      prisma.promoter.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              partner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
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
        orderBy: {
          [query.sortBy]: query.sortOrder,
        },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.promoter.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        promoters,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages: Math.ceil(total / query.limit),
        },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error getting all promoters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// READ: Get single promoter by ID
export const getPromoterById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const promoter = await prisma.promoter.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            partner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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
      return res.status(404).json({ error: 'Promoter not found' });
    }

    // Get commission statistics
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [monthlyCommissions, paidCommissions, pendingCommissions] = await Promise.all([
      prisma.promoterCommission.aggregate({
        where: {
          promoterId: promoter.id,
          createdAt: { gte: currentMonth },
        },
        _sum: { amount: true },
      }),
      prisma.promoterCommission.aggregate({
        where: {
          promoterId: promoter.id,
          status: 'PAID',
        },
        _sum: { amount: true },
      }),
      prisma.promoterCommission.aggregate({
        where: {
          promoterId: promoter.id,
          status: 'PENDING',
        },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        ...promoter,
        statistics: {
          monthlyCommissions: monthlyCommissions._sum.amount || 0,
          paidCommissions: paidCommissions._sum.amount || 0,
          pendingCommissions: pendingCommissions._sum.amount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error getting promoter by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all pending promoter applications
export const getPendingPromoterApplications = async (req: Request, res: Response) => {
  try {
    const pendingApplications = await prisma.promoter.findMany({
      where: {
        isActive: false,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            partner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      applications: pendingApplications,
      total: pendingApplications.length,
    });
  } catch (error) {
    console.error('Error getting pending promoter applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// UPDATE: Update promoter (admin only)
export const updatePromoter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updatePromoterSchema.parse(req).body;

    // Check if promoter exists
    const existingPromoter = await prisma.promoter.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingPromoter) {
      return res.status(404).json({ error: 'Promoter not found' });
    }

    // Prepare update data
    const updateData: any = {};

    if (data.businessName !== undefined) {
      updateData.businessName = data.businessName;
    }

    if (data.territory !== undefined) {
      updateData.territory = data.territory;
    }

    if (data.specialization !== undefined) {
      updateData.specialization = data.specialization;
    }

    if (data.tier !== undefined) {
      updateData.tier = data.tier;
      // Update commission rate and quota based on new tier if not explicitly provided
      if (data.commissionRate === undefined) {
        updateData.commissionRate = getTierCommissionRate(data.tier);
      }
      if (data.invitationQuota === undefined) {
        updateData.invitationQuota = getTierQuota(data.tier);
      }
    }

    if (data.commissionRate !== undefined) {
      updateData.commissionRate = data.commissionRate;
    }

    if (data.invitationQuota !== undefined) {
      updateData.invitationQuota = data.invitationQuota;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
      
      // Set approval date when activating
      if (data.isActive && !existingPromoter.approvedAt) {
        updateData.approvedAt = new Date();
      }
    }

    // Update promoter in transaction with user role update if needed
    const result = await prisma.$transaction(async (tx) => {
      const updatedPromoter = await tx.promoter.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              partner: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      // Update user role if activation status changed
      if (data.isActive !== undefined) {
        let newRole = existingPromoter.user.role;
        
        if (data.isActive) {
          // Activating promoter - set appropriate promoter role
          if (existingPromoter.user.role === 'PARTNER_ADMIN') {
            newRole = 'PARTNER_PROMOTER';
          } else if (existingPromoter.user.role === 'CUSTOMER') {
            newRole = 'PROMOTER';
          }
        } else {
          // Deactivating promoter - revert to original role
          if (existingPromoter.user.role === 'PARTNER_PROMOTER') {
            newRole = 'PARTNER_ADMIN';
          } else if (existingPromoter.user.role === 'PROMOTER') {
            newRole = 'CUSTOMER';
          }
        }

        if (newRole !== existingPromoter.user.role) {
          await tx.user.update({
            where: { id: existingPromoter.userId },
            data: { role: newRole },
          });
        }
      }

      return updatedPromoter;
    });

    res.json({
      message: 'Promoter updated successfully',
      promoter: result,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error('Error updating promoter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE: Delete promoter (admin only)
export const deletePromoter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if promoter exists
    const existingPromoter = await prisma.promoter.findUnique({
      where: { id },
      include: {
        user: true,
        invitations: true,
        commissions: true,
        events: true,
      },
    });

    if (!existingPromoter) {
      return res.status(404).json({ error: 'Promoter not found' });
    }

    // Check if promoter has active invitations or unpaid commissions
    const hasActiveInvitations = existingPromoter.invitations.some(
      inv => ['PENDING', 'SENT', 'VIEWED'].includes(inv.status)
    );

    const hasUnpaidCommissions = existingPromoter.commissions.some(
      comm => ['PENDING', 'APPROVED'].includes(comm.status)
    );

    if (hasActiveInvitations || hasUnpaidCommissions) {
      return res.status(400).json({
        error: 'Cannot delete promoter with active invitations or unpaid commissions. Please resolve these first.',
        details: {
          activeInvitations: hasActiveInvitations,
          unpaidCommissions: hasUnpaidCommissions,
        },
      });
    }

    // Delete promoter in transaction and update user role
    await prisma.$transaction(async (tx) => {
      // Delete promoter (cascade will handle related records)
      await tx.promoter.delete({
        where: { id },
      });

      // Revert user role
      let newRole = existingPromoter.user.role;
      if (existingPromoter.user.role === 'PARTNER_PROMOTER') {
        newRole = 'PARTNER_ADMIN';
      } else if (existingPromoter.user.role === 'PROMOTER') {
        newRole = 'CUSTOMER';
      }

      if (newRole !== existingPromoter.user.role) {
        await tx.user.update({
          where: { id: existingPromoter.userId },
          data: { role: newRole },
        });
      }
    });

    res.json({
      message: 'Promoter deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting promoter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// LEGACY: Update promoter tier (backward compatibility)
export const updatePromoterTier = async (req: Request, res: Response) => {
  try {
    const { promoterId, tier } = req.body;

    if (!['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(tier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const promoter = await prisma.promoter.update({
      where: { id: promoterId },
      data: {
        tier,
        commissionRate: getTierCommissionRate(tier),
        invitationQuota: getTierQuota(tier),
      },
    });

    res.json({
      message: 'Promoter tier updated successfully',
      promoter,
    });
  } catch (error) {
    console.error('Error updating promoter tier:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper functions
function getTierCommissionRate(tier: string): number {
  switch (tier) {
    case 'BRONZE': return 0.02;
    case 'SILVER': return 0.03;
    case 'GOLD': return 0.04;
    case 'PLATINUM': return 0.05;
    default: return 0.02;
  }
}

function getTierQuota(tier: string): number {
  switch (tier) {
    case 'BRONZE': return 10;
    case 'SILVER': return 25;
    case 'GOLD': return 50;
    case 'PLATINUM': return -1; // Unlimited
    default: return 10;
  }
}