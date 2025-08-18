'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  Eye, 
  MousePointer, 
  Users, 
  TrendingUp,
  RefreshCw,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react'

interface Activity {
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

interface PageView {
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

interface AnalyticsStats {
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

interface AnalyticsData {
  activities: Activity[]
  pageViews: PageView[]
  stats: AnalyticsStats
}

export default function PartnerAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('7d')
  const [activeTab, setActiveTab] = useState<'overview' | 'traffic' | 'behavior'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      console.log('🔍 Analytics: Fetching data with token:', token ? 'Present' : 'Missing')
      
      // Use full API URL for backend requests
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      
      // Fetch dashboard stats
      const statsResponse = await fetch(`${apiUrl}/api/analytics/dashboard/stats?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📊 Stats Response Status:', statsResponse.status)
      
      if (!statsResponse.ok) {
        const errorText = await statsResponse.text()
        console.error('Stats fetch failed:', errorText)
        throw new Error(`Failed to fetch analytics stats: ${statsResponse.status}`)
      }
      
      const statsData = await statsResponse.json()
      console.log('📊 Stats Data:', statsData)
      
      // Fetch recent activities and page views
      const [activitiesResponse, pageViewsResponse] = await Promise.all([
        fetch(`${apiUrl}/api/analytics/activities/recent?limit=20`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${apiUrl}/api/analytics/page-views/recent?limit=20`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ])
      
      console.log('🖱️ Activities Response Status:', activitiesResponse.status)
      console.log('📄 PageViews Response Status:', pageViewsResponse.status)
      
      if (!activitiesResponse.ok || !pageViewsResponse.ok) {
        const activitiesError = !activitiesResponse.ok ? await activitiesResponse.text() : null
        const pageViewsError = !pageViewsResponse.ok ? await pageViewsResponse.text() : null
        console.error('Activities error:', activitiesError)
        console.error('PageViews error:', pageViewsError)
        throw new Error('Failed to fetch analytics data')
      }
      
      const [activitiesData, pageViewsData] = await Promise.all([
        activitiesResponse.json(),
        pageViewsResponse.json()
      ])
      
      console.log('🖱️ Activities Data:', activitiesData)
      console.log('📄 PageViews Data:', pageViewsData)
      
      setData({
        activities: activitiesData.data.activities,
        pageViews: pageViewsData.data.pageViews,
        stats: statsData.data
      })
      
      console.log('✅ Analytics data set successfully')
    } catch (error) {
      console.error('❌ Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [timeframe])

  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [autoRefresh, timeframe])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getDeviceIcon = (userAgent?: string) => {
    if (!userAgent) return <Monitor className="h-4 w-4" />
    if (userAgent.includes('Mobile')) return <Smartphone className="h-4 w-4" />
    if (userAgent.includes('Tablet')) return <Tablet className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  const getDeviceType = (userAgent?: string) => {
    if (!userAgent) return 'Desktop'
    if (userAgent.includes('Mobile')) return 'Mobile'
    if (userAgent.includes('Tablet')) return 'Tablet'
    return 'Desktop'
  }

  const formatTimeframe = (tf: string) => {
    switch (tf) {
      case '24h': return 'Últimas 24 horas'
      case '7d': return 'Últimos 7 dias'
      case '30d': return 'Últimos 30 dias'
      case '90d': return 'Últimos 90 dias'
      default: return 'Últimos 7 dias'
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Analytics</h1>
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-600">Carregando...</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">Erro ao carregar dados de analytics</p>
              <Button onClick={fetchData} className="mt-4">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-gray-600 mt-1">
              Acompanhe o desempenho do seu brechó • {formatTimeframe(timeframe)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* <div className="flex items-center space-x-2">
              {autoRefresh && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Pausar' : 'Retomar'} Auto-refresh
              </Button>
            </div> */}
            <Select value={timeframe} onValueChange={(value: any) => setTimeframe(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Últimas 24h</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchData} size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Eye className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Visualizações</p>
                  <p className="text-2xl font-bold">{data.stats.totalPageViews.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MousePointer className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Cliques</p>
                  <p className="text-2xl font-bold">{data.stats.totalClicks.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Sessões Únicas</p>
                  <p className="text-2xl font-bold">{data.stats.uniqueSessions.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                  <p className="text-2xl font-bold">
                    {data.stats.totalPageViews > 0 
                      ? ((data.stats.totalClicks / data.stats.totalPageViews) * 100).toFixed(1)
                      : '0'
                    }%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Content */}
        <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="traffic">Tráfego</TabsTrigger>
            <TabsTrigger value="behavior">Comportamento</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Most Visited Pages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Páginas Mais Visitadas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.stats.mostVisitedPages.slice(0, 5).map((page, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{page.page}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(page._count / data.stats.mostVisitedPages[0]._count) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <Badge variant="secondary">{page._count}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Most Clicked Elements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MousePointer className="h-5 w-5" />
                    <span>Elementos Mais Clicados</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.stats.mostClickedElements.slice(0, 5).map((element, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {element.elementText || 'Elemento sem texto'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ 
                                width: `${(element._count / data.stats.mostClickedElements[0]._count) * 100}%` 
                              }}
                            ></div>
                          </div>
                          <Badge variant="secondary">{element._count}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="traffic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Visualizações Recentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.pageViews.slice(0, 10).map((pageView) => (
                    <div key={pageView.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getDeviceIcon(pageView.session.userAgent)}
                        <div>
                          <p className="text-sm font-medium">{pageView.title || pageView.page}</p>
                          <p className="text-xs text-gray-500">
                            {pageView.page}
                            {pageView.timeSpent && ` • ${pageView.timeSpent}s`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{formatTime(pageView.createdAt)}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {getDeviceType(pageView.session.userAgent)}
                          </Badge>
                          {pageView.session.city && (
                            <Badge variant="outline" className="text-xs">
                              {pageView.session.city}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MousePointer className="h-5 w-5" />
                  <span>Atividades Recentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <MousePointer className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {activity.elementText || activity.elementId || 'Elemento sem identificação'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {activity.page} • {activity.elementType}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{formatTime(activity.createdAt)}</p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {getDeviceType(activity.session.userAgent)}
                          </Badge>
                          {activity.session.city && (
                            <Badge variant="outline" className="text-xs">
                              {activity.session.city}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}