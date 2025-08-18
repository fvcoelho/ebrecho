'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SpinningLogo from '@/components/SpinningLogo'

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
  }
}

interface AnalyticsData {
  activities: Activity[]
  pageViews: PageView[]
  stats: {
    totalClicks: number
    totalPageViews: number
    uniqueSessions: number
    mostClickedElements: Array<{ elementText: string; _count: number }>
    mostVisitedPages: Array<{ page: string; _count: number }>
  }
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'clicks' | 'pages'>('overview')
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [limit, setLimit] = useState(100)
  const [orderBy, setOrderBy] = useState('createdAt')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  const fetchData = async () => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        orderBy,
        orderDirection
      })
      const response = await fetch(`/api/analytics/recent?${params}`)
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    setRefreshInterval(interval)
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [limit, orderBy, orderDirection])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getDeviceType = (userAgent?: string) => {
    if (!userAgent) return 'Unknown'
    if (userAgent.includes('Mobile')) return 'Mobile'
    if (userAgent.includes('Tablet')) return 'Tablet'
    return 'Desktop'
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <SpinningLogo size="lg" color="blue" showText text="Carregando dados..." className="text-gray-600" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Erro ao carregar dados de analytics</p>
          <button 
            onClick={fetchData}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Acompanhamento de atividade do site em tempo real</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Ao vivo</span>
            </div>
            <Link
              href="/admin/analytics/sessions"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              📊 Ver Todas Sessões
            </Link>
            <Link
              href="/admin/whatsapp"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              💬 WhatsApp
            </Link>
            <button
              onClick={fetchData}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Atualizar
            </button>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Limite:</label>
            <select 
              value={limit} 
              onChange={(e) => setLimit(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={150}>150</option>
              <option value={200}>200</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Ordenar por:</label>
            <select 
              value={orderBy} 
              onChange={(e) => setOrderBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="createdAt">Data de Criação</option>
              <option value="page">Página</option>
              <option value="elementText">Texto do Elemento</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Direção:</label>
            <select 
              value={orderDirection} 
              onChange={(e) => setOrderDirection(e.target.value as 'asc' | 'desc')}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="desc">Mais recente primeiro</option>
              <option value="asc">Mais antigo primeiro</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Visualizações</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.totalPageViews}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h4a1 1 0 011 1v2h4a1 1 0 011 1v14a1 1 0 01-1 1H6a1 1 0 01-1-1V5a1 1 0 011-1h4z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cliques</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.totalClicks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Sessões Únicas</p>
              <p className="text-2xl font-bold text-gray-900">{data.stats.uniqueSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa Conversão</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.stats.totalPageViews > 0 ? 
                  Math.round((data.stats.totalClicks / data.stats.totalPageViews) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Visão Geral' },
            { id: 'clicks', name: 'Cliques Recentes' },
            { id: 'pages', name: 'Visualizações' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Most Clicked Elements */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Elementos Mais Clicados</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.stats.mostClickedElements.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 truncate mr-4">
                      {item.elementText || 'Elemento sem texto'}
                    </span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(item._count / data.stats.mostClickedElements[0]._count) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {item._count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Most Visited Pages */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Páginas Mais Visitadas</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.stats.mostVisitedPages.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 truncate mr-4">
                      {item.page}
                    </span>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${(item._count / data.stats.mostVisitedPages[0]._count) * 100}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {item._count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clicks' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Atividade de Cliques Recente</h3>
            <p className="mt-1 text-sm text-gray-500">
              Últimos {data.activities.length} cliques registrados
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {data.activities.map((activity) => (
              <li key={activity.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656L4.05 13.95" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {activity.elementText || activity.elementId || 'Elemento sem identificação'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.page} • {activity.elementType}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900">{formatTime(activity.createdAt)}</div>
                    <div className="text-sm text-gray-500">
                      {getDeviceType(activity.session.userAgent)}
                    </div>
                    <Link
                      href={`/admin/analytics/session/${activity.session.sessionId}`}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Ver sessão →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900">Visualizações de Página Recentes</h3>
            <p className="mt-1 text-sm text-gray-500">
              Últimas {data.pageViews.length} visualizações registradas
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {data.pageViews.map((pageView) => (
              <li key={pageView.id} className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {pageView.title || pageView.page}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pageView.page}
                        {pageView.timeSpent && (
                          <span className="ml-2">• {pageView.timeSpent}s na página</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900">{formatTime(pageView.createdAt)}</div>
                    <div className="text-sm text-gray-500">
                      {getDeviceType(pageView.session.userAgent)}
                    </div>
                    <Link
                      href={`/admin/analytics/session/${pageView.session.sessionId}`}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Ver sessão →
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}