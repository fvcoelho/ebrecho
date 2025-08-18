import { api } from '@/lib/api'

export interface SessionData {
  sessionId: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
  landingPage?: string
  browser?: string
  city?: string
  country?: string
  device?: string
  headers?: Record<string, string>
  language?: string
  os?: string
  region?: string
  colorDepth?: number
  screenResolution?: string
  timezone?: string
  viewport?: string
  partnerId?: string
}

export interface PageViewData {
  sessionId: string
  page: string
  title?: string
  timeSpent?: number
  partnerId?: string
}

export interface ActivityData {
  sessionId: string
  page: string
  elementId?: string
  elementText?: string
  elementType?: string
  partnerId?: string
}

export interface AnalyticsQuery {
  startDate?: string
  endDate?: string
  partnerId?: string
  page?: number
  limit?: number
  orderBy?: 'createdAt' | 'page' | 'elementText'
  orderDirection?: 'asc' | 'desc'
}

export interface DashboardStatsQuery {
  partnerId?: string
  timeframe?: '24h' | '7d' | '30d' | '90d'
}

export interface AnalyticsStats {
  totalClicks: number
  totalPageViews: number
  uniqueSessions: number
  mostClickedElements: Array<{ elementText: string; _count: number }>
  mostVisitedPages: Array<{ page: string; _count: number }>
  timeframe: string
  dateRange: {
    start: string
    end: string
  }
}

export interface Activity {
  id: string
  page: string
  elementId?: string
  elementText?: string
  elementType?: string
  createdAt: string
  session: {
    sessionId: string
    ipAddress?: string
    userAgent?: string
    referrer?: string
    city?: string
    country?: string
    device?: string
  }
}

export interface PageView {
  id: string
  page: string
  title?: string
  timeSpent?: number
  createdAt: string
  session: {
    sessionId: string
    ipAddress?: string
    userAgent?: string
    referrer?: string
    city?: string
    country?: string
    device?: string
  }
}

export interface Session {
  id: string
  sessionId: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
  landingPage?: string
  createdAt: string
  updatedAt: string
  browser?: string
  city?: string
  country?: string
  device?: string
  _count: {
    pageViews: number
    activities: number
  }
  partner?: {
    id: string
    name: string
    slug: string
  }
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class AnalyticsService {
  // Session management
  async createSession(data: SessionData) {
    const response = await api.post('/analytics/sessions', data)
    return response.data
  }

  async getSession(sessionId: string) {
    const response = await api.get(`/analytics/sessions/${sessionId}`)
    return response.data
  }

  async updateSession(sessionId: string, data: Partial<SessionData>) {
    const response = await api.put(`/analytics/sessions/${sessionId}`, data)
    return response.data
  }

  // Tracking
  async trackPageView(data: PageViewData) {
    const response = await api.post('/analytics/page-views', data)
    return response.data
  }

  async trackActivity(data: ActivityData) {
    const response = await api.post('/analytics/activities', data)
    return response.data
  }

  // Analytics queries
  async getRecentActivities(query: AnalyticsQuery = {}): Promise<PaginatedResponse<Activity>> {
    const params = new URLSearchParams()
    
    if (query.startDate) params.append('startDate', query.startDate)
    if (query.endDate) params.append('endDate', query.endDate)
    if (query.partnerId) params.append('partnerId', query.partnerId)
    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.orderBy) params.append('orderBy', query.orderBy)
    if (query.orderDirection) params.append('orderDirection', query.orderDirection)

    const response = await api.get(`/analytics/activities/recent?${params.toString()}`)
    return response.data
  }

  async getRecentPageViews(query: AnalyticsQuery = {}): Promise<PaginatedResponse<PageView>> {
    const params = new URLSearchParams()
    
    if (query.startDate) params.append('startDate', query.startDate)
    if (query.endDate) params.append('endDate', query.endDate)
    if (query.partnerId) params.append('partnerId', query.partnerId)
    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.orderBy) params.append('orderBy', query.orderBy)
    if (query.orderDirection) params.append('orderDirection', query.orderDirection)

    const response = await api.get(`/analytics/page-views/recent?${params.toString()}`)
    return response.data
  }

  async getSessions(query: AnalyticsQuery = {}): Promise<PaginatedResponse<Session>> {
    const params = new URLSearchParams()
    
    if (query.startDate) params.append('startDate', query.startDate)
    if (query.endDate) params.append('endDate', query.endDate)
    if (query.partnerId) params.append('partnerId', query.partnerId)
    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.orderBy) params.append('orderBy', query.orderBy)
    if (query.orderDirection) params.append('orderDirection', query.orderDirection)

    const response = await api.get(`/analytics/sessions/recent?${params.toString()}`)
    return response.data
  }

  async getDashboardStats(query: DashboardStatsQuery = {}): Promise<AnalyticsStats> {
    const params = new URLSearchParams()
    
    if (query.partnerId) params.append('partnerId', query.partnerId)
    if (query.timeframe) params.append('timeframe', query.timeframe)

    const response = await api.get(`/analytics/dashboard/stats?${params.toString()}`)
    return response.data
  }

  async getComprehensiveAnalytics(query: AnalyticsQuery = {}) {
    const params = new URLSearchParams()
    
    if (query.startDate) params.append('startDate', query.startDate)
    if (query.endDate) params.append('endDate', query.endDate)
    if (query.partnerId) params.append('partnerId', query.partnerId)
    if (query.page) params.append('page', query.page.toString())
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.orderBy) params.append('orderBy', query.orderBy)
    if (query.orderDirection) params.append('orderDirection', query.orderDirection)

    const response = await api.get(`/analytics/comprehensive?${params.toString()}`)
    return response.data
  }

  // Public analytics endpoint (for existing frontend compatibility)
  async getRecentAnalytics(query: Partial<AnalyticsQuery> = {}) {
    const params = new URLSearchParams()
    
    if (query.limit) params.append('limit', query.limit.toString())
    if (query.orderBy) params.append('orderBy', query.orderBy)
    if (query.orderDirection) params.append('orderDirection', query.orderDirection)

    const response = await api.get(`/analytics/recent?${params.toString()}`)
    return response.data
  }

  // Analytics utilities
  formatTimeframe(timeframe: string): string {
    switch (timeframe) {
      case '24h': return 'Últimas 24 horas'
      case '7d': return 'Últimos 7 dias'
      case '30d': return 'Últimos 30 dias'
      case '90d': return 'Últimos 90 dias'
      default: return 'Período customizado'
    }
  }

  calculateConversionRate(clicks: number, pageViews: number): number {
    if (pageViews === 0) return 0
    return Math.round((clicks / pageViews) * 100)
  }

  getDeviceType(userAgent?: string): string {
    if (!userAgent) return 'Unknown'
    if (userAgent.includes('Mobile')) return 'Mobile'
    if (userAgent.includes('Tablet')) return 'Tablet'
    return 'Desktop'
  }

  getBrowserName(userAgent?: string): string {
    if (!userAgent) return 'Unknown'
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Other'
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  groupByTimeOfDay(data: Array<{ createdAt: string }>): Record<string, number> {
    const hours = Array.from({ length: 24 }, (_, i) => i)
    const grouped = hours.reduce((acc, hour) => {
      acc[`${hour}:00`] = 0
      return acc
    }, {} as Record<string, number>)

    data.forEach(item => {
      const hour = new Date(item.createdAt).getHours()
      grouped[`${hour}:00`]++
    })

    return grouped
  }

  groupByDay(data: Array<{ createdAt: string }>): Record<string, number> {
    const grouped: Record<string, number> = {}

    data.forEach(item => {
      const date = new Date(item.createdAt).toISOString().split('T')[0]
      grouped[date] = (grouped[date] || 0) + 1
    })

    return grouped
  }

  getTopItems<T extends { _count: number }>(items: T[], limit: number = 5): T[] {
    return items
      .sort((a, b) => b._count - a._count)
      .slice(0, limit)
  }
}

export const analyticsService = new AnalyticsService()
export default analyticsService