'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import SpinningLogo from '@/components/SpinningLogo'

interface SessionDetail {
  id: string
  sessionId: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
  landingPage?: string
  headers?: Record<string, string>
  country?: string
  city?: string
  region?: string
  language?: string
  device?: string
  browser?: string
  os?: string
  screenResolution?: string
  viewport?: string
  colorDepth?: number
  timezone?: string
  createdAt: string
  updatedAt: string
  pageViews: Array<{
    id: string
    page: string
    title?: string
    timeSpent?: number
    createdAt: string
  }>
  activities: Array<{
    id: string
    page: string
    elementId?: string
    elementText?: string
    elementType?: string
    createdAt: string
  }>
}

export default function SessionDetailPage() {
  const params = useParams()
  const [session, setSession] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'technical'>('overview')

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch(`/api/analytics/session/${params.id}`)
        if (!response.ok) throw new Error('Failed to fetch session')
        const data = await response.json()
        setSession(data)
      } catch (error) {
        console.error('Error fetching session:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [params.id])

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatDuration = (start: string, end: string) => {
    const duration = new Date(end).getTime() - new Date(start).getTime()
    const minutes = Math.floor(duration / 60000)
    const seconds = Math.floor((duration % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <SpinningLogo size="lg" color="blue" showText text="Carregando sessão..." className="text-gray-600" />
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Sessão não encontrada</p>
          <Link 
            href="/admin/analytics"
            className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Voltar para Analytics
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/admin/analytics"
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Voltar para Analytics
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Detalhes da Sessão</h1>
        <p className="text-gray-600 mt-2">ID: {session.sessionId}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Dispositivo</p>
          <p className="text-lg font-semibold text-gray-900">{session.device || 'Unknown'}</p>
          <p className="text-sm text-gray-500">{session.browser} • {session.os}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Localização</p>
          <p className="text-lg font-semibold text-gray-900">
            {session.city || session.country || 'Unknown'}
          </p>
          <p className="text-sm text-gray-500">{session.language || 'Unknown'}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Páginas Visitadas</p>
          <p className="text-lg font-semibold text-gray-900">{session.pageViews.length}</p>
          <p className="text-sm text-gray-500">{session.activities.length} interações</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm font-medium text-gray-600">Duração</p>
          <p className="text-lg font-semibold text-gray-900">
            {formatDuration(session.createdAt, session.updatedAt)}
          </p>
          <p className="text-sm text-gray-500">
            {formatTime(session.createdAt).split(' ')[1]}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', name: 'Visão Geral' },
            { id: 'timeline', name: 'Timeline' },
            { id: 'technical', name: 'Dados Técnicos' }
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
          {/* Session Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informações da Sessão</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-600">IP Address</dt>
                <dd className="text-sm text-gray-900">{session.ipAddress || 'Unknown'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Referrer</dt>
                <dd className="text-sm text-gray-900">{session.referrer || 'Direct'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Landing Page</dt>
                <dd className="text-sm text-gray-900">{session.landingPage || '/'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Resolução</dt>
                <dd className="text-sm text-gray-900">
                  {session.screenResolution || 'Unknown'} 
                  {session.viewport && ` (viewport: ${session.viewport})`}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-600">Timezone</dt>
                <dd className="text-sm text-gray-900">{session.timezone || 'Unknown'}</dd>
              </div>
            </dl>
          </div>

          {/* Page Views Summary */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Páginas Mais Visitadas</h3>
            <div className="space-y-3">
              {Object.entries(
                session.pageViews.reduce((acc, pv) => {
                  acc[pv.page] = (acc[pv.page] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([page, count]) => (
                  <div key={page} className="flex items-center justify-between">
                    <span className="text-sm text-gray-900">{page}</span>
                    <span className="text-sm font-medium text-gray-600">{count}x</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Timeline de Atividades</h3>
            <div className="flow-root">
              <ul className="-mb-8">
                {[...session.pageViews, ...session.activities]
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .map((event, idx, array) => (
                    <li key={event.id}>
                      <div className="relative pb-8">
                        {idx !== array.length - 1 && (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                              'page' in event ? 'bg-blue-500' : 'bg-green-500'
                            }`}>
                              {'page' in event && !('elementId' in event) ? (
                                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2z" />
                                </svg>
                              )}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-900">
                                {'elementId' in event ? (
                                  <>Clicou em: {event.elementText || event.elementId || 'elemento'}</>
                                ) : (
                                  <>Visitou: {'title' in event ? event.title || event.page : event.page}</>
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {event.page}
                                {'timeSpent' in event && event.timeSpent && (
                                  <span className="ml-2">• {event.timeSpent}s na página</span>
                                )}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {formatTime(event.createdAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'technical' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Agent */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Agent</h3>
            <p className="text-sm text-gray-700 font-mono break-all">
              {session.userAgent || 'Not available'}
            </p>
          </div>

          {/* Headers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">HTTP Headers</h3>
            <div className="max-h-96 overflow-y-auto">
              {session.headers ? (
                <dl className="space-y-2">
                  {Object.entries(session.headers)
                    .filter(([key]) => !key.toLowerCase().includes('cookie'))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-xs font-medium text-gray-600">{key}</dt>
                        <dd className="text-sm text-gray-900 font-mono break-all">{value}</dd>
                      </div>
                    ))}
                </dl>
              ) : (
                <p className="text-sm text-gray-500">No headers available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}