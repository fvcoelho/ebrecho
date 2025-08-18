import { PrismaClient } from '@prisma/client';
import { 
  CreateSessionInput, 
  CreatePageViewInput, 
  CreateActivityInput,
  AnalyticsQueryInput,
  DashboardStatsQueryInput 
} from '../schemas/analytics.schemas';

const prisma = new PrismaClient();

export class UserAnalyticsService {
  
  // Session management
  async createSession(data: CreateSessionInput) {
    // Use upsert to handle duplicate session creation attempts
    return await prisma.userSession.upsert({
      where: { sessionId: data.sessionId },
      update: {
        // Update with latest session info if it already exists
        ipAddress: data.ipAddress || undefined,
        userAgent: data.userAgent || undefined,
        referrer: data.referrer || undefined,
        browser: data.browser || undefined,
        city: data.city || undefined,
        country: data.country || undefined,
        device: data.device || undefined,
        headers: data.headers || undefined,
        language: data.language || undefined,
        os: data.os || undefined,
        region: data.region || undefined,
        colorDepth: data.colorDepth || undefined,
        screenResolution: data.screenResolution || undefined,
        timezone: data.timezone || undefined,
        viewport: data.viewport || undefined,
      },
      create: data as any,
    });
  }

  async getSession(sessionId: string) {
    return await prisma.userSession.findUnique({
      where: { sessionId },
      include: {
        pageViews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        partner: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async updateSession(sessionId: string, data: Partial<CreateSessionInput>) {
    return await prisma.userSession.update({
      where: { sessionId },
      data,
    });
  }

  // Tracking functions
  async trackPageView(data: CreatePageViewInput) {
    // First check if session exists
    const sessionExists = await prisma.userSession.findUnique({
      where: { sessionId: data.sessionId }
    });

    // If session doesn't exist, create it first
    if (!sessionExists) {
      await prisma.userSession.create({
        data: {
          sessionId: data.sessionId,
          partnerId: data.partnerId,
          // Basic session data, will be updated by frontend later
          landingPage: data.page,
        }
      });
    }

    return await prisma.pageView.create({
      data: data as any,
    });
  }

  async trackActivity(data: CreateActivityInput) {
    // First check if session exists
    const sessionExists = await prisma.userSession.findUnique({
      where: { sessionId: data.sessionId }
    });

    // If session doesn't exist, create it first
    if (!sessionExists) {
      await prisma.userSession.create({
        data: {
          sessionId: data.sessionId,
          partnerId: data.partnerId,
          // Basic session data, will be updated by frontend later
          landingPage: data.page,
        }
      });
    }

    return await prisma.userActivity.create({
      data: data as any,
    });
  }

  // Analytics queries
  async getRecentActivities(query: AnalyticsQueryInput) {
    const { 
      partnerId, 
      page: pageParam = 1, 
      limit: limitParam = 50, 
      orderBy = 'createdAt', 
      orderDirection = 'desc', 
      startDate, 
      endDate 
    } = query;

    const page = typeof pageParam === 'string' ? parseInt(pageParam) : pageParam;
    const limit = typeof limitParam === 'string' ? parseInt(limitParam) : limitParam;
    
    const whereClause: any = {};
    if (partnerId) whereClause.partnerId = partnerId;
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const activities = await prisma.userActivity.findMany({
      where: whereClause,
      include: {
        session: {
          select: {
            sessionId: true,
            ipAddress: true,
            userAgent: true,
            referrer: true,
            city: true,
            country: true,
            device: true,
          },
        },
      },
      orderBy: { [orderBy]: orderDirection },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.userActivity.count({ where: whereClause });

    return {
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRecentPageViews(query: AnalyticsQueryInput) {
    const { 
      partnerId, 
      page: pageParam = 1, 
      limit: limitParam = 50, 
      orderBy = 'createdAt', 
      orderDirection = 'desc', 
      startDate, 
      endDate 
    } = query;

    const page = typeof pageParam === 'string' ? parseInt(pageParam) : pageParam;
    const limit = typeof limitParam === 'string' ? parseInt(limitParam) : limitParam;
    
    const whereClause: any = {};
    if (partnerId) whereClause.partnerId = partnerId;
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const pageViews = await prisma.pageView.findMany({
      where: whereClause,
      include: {
        session: {
          select: {
            sessionId: true,
            ipAddress: true,
            userAgent: true,
            referrer: true,
            city: true,
            country: true,
            device: true,
          },
        },
      },
      orderBy: { [orderBy]: orderDirection },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.pageView.count({ where: whereClause });

    return {
      pageViews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSessions(query: AnalyticsQueryInput) {
    const { 
      partnerId, 
      page: pageParam = 1, 
      limit: limitParam = 50, 
      orderBy = 'createdAt', 
      orderDirection = 'desc', 
      startDate, 
      endDate 
    } = query;

    const page = typeof pageParam === 'string' ? parseInt(pageParam) : pageParam;
    const limit = typeof limitParam === 'string' ? parseInt(limitParam) : limitParam;
    
    const whereClause: any = {};
    if (partnerId) whereClause.partnerId = partnerId;
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const sessions = await prisma.userSession.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            pageViews: true,
            activities: true,
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { [orderBy]: orderDirection },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.userSession.count({ where: whereClause });

    return {
      sessions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Dashboard statistics
  async getDashboardStats(query: DashboardStatsQueryInput) {
    const { partnerId, timeframe = '7d' } = query;
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    const whereClause: any = {
      createdAt: { gte: startDate },
    };
    
    if (partnerId) whereClause.partnerId = partnerId;

    // Get basic counts
    const [totalPageViews, totalClicks, uniqueSessions] = await Promise.all([
      prisma.pageView.count({ where: whereClause }),
      prisma.userActivity.count({ where: whereClause }),
      prisma.userSession.count({
        where: {
          createdAt: { gte: startDate },
          ...(partnerId && { partnerId }),
        },
      }),
    ]);

    // Get most clicked elements
    const mostClickedElements = await prisma.userActivity.groupBy({
      by: ['elementText'],
      where: {
        ...whereClause,
        elementText: { not: null },
      },
      _count: true,
      orderBy: {
        _count: {
          elementText: 'desc',
        },
      },
      take: 10,
    });

    // Get most visited pages
    const mostVisitedPages = await prisma.pageView.groupBy({
      by: ['page'],
      where: whereClause,
      _count: true,
      orderBy: {
        _count: {
          page: 'desc',
        },
      },
      take: 10,
    });

    return {
      totalPageViews,
      totalClicks,
      uniqueSessions,
      mostClickedElements: mostClickedElements.map(item => ({
        elementText: item.elementText || 'Unknown',
        _count: item._count,
      })),
      mostVisitedPages: mostVisitedPages.map(item => ({
        page: item.page,
        _count: item._count,
      })),
      timeframe,
      dateRange: {
        start: startDate,
        end: now,
      },
    };
  }

  async getComprehensiveAnalytics(query: AnalyticsQueryInput) {
    const [activities, pageViews, stats] = await Promise.all([
      this.getRecentActivities(query),
      this.getRecentPageViews(query),
      this.getDashboardStats({
        partnerId: query.partnerId,
        timeframe: '7d',
      }),
    ]);

    return {
      activities: activities.activities,
      pageViews: pageViews.pageViews,
      stats,
    };
  }
}

export const userAnalyticsService = new UserAnalyticsService();