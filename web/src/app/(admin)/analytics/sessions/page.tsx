'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SpinningLogo from '@/components/SpinningLogo'

interface SessionSummary {
  id: string
  sessionId: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
  landingPage?: string
  country?: string
  city?: string
  device?: string
  browser?: string
  os?: string
  createdAt: string
  updatedAt: string
  _count: {
    pageViews: number
    activities: number
  }
}

export default function SessionsListPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [limit, setLimit] = useState(50)
  const [orderBy, setOrderBy] = useState('createdAt')
  const [orderDirection, setOrderDirection] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchSessions()
  }, [page, limit, orderBy, orderDirection])

  const fetchSessions = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        orderBy,
        orderDirection
      })
      const response = await fetch(`/api/analytics/sessions?${params}`)
      const data = await response.json()
      setSessions(data.sessions)
      setHasMore(data.sessions.length === limit)
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

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
          <SpinningLogo size="lg" color="blue" showText text="Carregando sessões..." className="text-gray-600" />
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
            <Link 
              href="/admin/analytics"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← Voltar para Analytics
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Todas as Sessões</h1>
            <p className="text-gray-600">Lista completa de sessões de usuários</p>
          </div>
        </div>
        
        {/* Controls */}
        <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow mb-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Limite:</label>
            <select 
              value={limit} 
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1) // Reset to first page when limit changes
              }}
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
              onChange={(e) => {
                setOrderBy(e.target.value)
                setPage(1) // Reset to first page when order changes
              }}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="createdAt">Data de Criação</option>
              <option value="updatedAt">Última Atividade</option>
              <option value="country">País</option>
              <option value="city">Cidade</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Direção:</label>
            <select 
              value={orderDirection} 
              onChange={(e) => {
                setOrderDirection(e.target.value as 'asc' | 'desc')
                setPage(1) // Reset to first page when direction changes
              }}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
            >
              <option value="desc">Decrescente</option>
              <option value="asc">Crescente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sessão
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dispositivo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Localização
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Atividade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Duração
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sessions.map((session) => (
              <tr key={session.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{session.sessionId.slice(0, 8)}...</div>
                  <div className="text-sm text-gray-500">{formatTime(session.createdAt)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{session.device || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">{session.browser} • {session.os}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {session.city || session.country || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-500">{session.ipAddress}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{session._count.pageViews} páginas</div>
                  <div className="text-sm text-gray-500">{session._count.activities} cliques</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDuration(session.createdAt, session.updatedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/admin/analytics/session/${session.sessionId}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Ver detalhes
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
            page === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Anterior
        </button>
        <span className="text-sm text-gray-700">
          Página {page}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!hasMore}
          className={`px-4 py-2 border border-gray-300 rounded-md text-sm font-medium ${
            !hasMore
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Próxima
        </button>
      </div>
    </div>
  )
}