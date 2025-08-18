import { z } from 'zod';

// Session tracking schemas
export const createSessionSchema = z.object({
  body: z.object({
    sessionId: z.string(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    referrer: z.string().optional(),
    landingPage: z.string().optional(),
    browser: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    device: z.string().optional(),
    headers: z.record(z.string()).optional(),
    language: z.string().optional(),
    os: z.string().optional(),
    region: z.string().optional(),
    colorDepth: z.number().optional(),
    screenResolution: z.string().optional(),
    timezone: z.string().optional(),
    viewport: z.string().optional(),
    partnerId: z.string().optional(),
  })
});

export const createPageViewSchema = z.object({
  body: z.object({
    sessionId: z.string(),
    page: z.string(),
    title: z.string().optional(),
    timeSpent: z.number().optional(),
    partnerId: z.string().optional(),
  })
});

export const createActivitySchema = z.object({
  body: z.object({
    sessionId: z.string(),
    page: z.string(),
    elementId: z.string().optional(),
    elementText: z.string().optional(),
    elementType: z.string().optional(),
    partnerId: z.string().optional(),
  })
});

// Analytics query schemas
export const analyticsQuerySchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    partnerId: z.string().optional(),
    page: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseInt(val) || 1 : val).optional(),
    limit: z.union([z.string(), z.number()]).transform(val => typeof val === 'string' ? parseInt(val) || 50 : val).optional(),
    orderBy: z.enum(['createdAt', 'page', 'elementText']).optional(),
    orderDirection: z.enum(['asc', 'desc']).optional(),
  })
});

export const sessionDetailQuerySchema = z.object({
  params: z.object({
    sessionId: z.string(),
  })
});

export const dashboardStatsQuerySchema = z.object({
  query: z.object({
    partnerId: z.string().optional(),
    timeframe: z.enum(['24h', '7d', '30d', '90d']).optional(),
  })
});

// Type exports
export type CreateSessionInput = z.infer<typeof createSessionSchema>['body'];
export type CreatePageViewInput = z.infer<typeof createPageViewSchema>['body'];
export type CreateActivityInput = z.infer<typeof createActivitySchema>['body'];
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>['query'];
export type SessionDetailQueryInput = z.infer<typeof sessionDetailQuerySchema>['params'];
export type DashboardStatsQueryInput = z.infer<typeof dashboardStatsQuerySchema>['query'];