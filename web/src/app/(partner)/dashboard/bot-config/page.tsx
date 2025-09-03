'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { BotConfiguration } from '@/components/dashboard/bot-configuration'
import { WhatsAppBotConfig } from '@/components/whatsapp-bot-config'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { api } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function BotConfigPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [partner, setPartner] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user?.partnerId) {
      loadPartnerData()
    }
  }, [user])

  const loadPartnerData = async () => {
    try {
      const response = await api.get(`/api/partners/${user?.partnerId}`)
      setPartner(response.data.data)
    } catch (err) {
      console.error('Error loading partner data:', err)
      setError('Erro ao carregar dados da loja')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['PARTNER_ADMIN']}>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-96 w-full" />
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['PARTNER_ADMIN']}>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!partner) {
    return (
      <ProtectedRoute allowedRoles={['PARTNER_ADMIN']}>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
            <Alert>
              <AlertDescription>
                Você precisa configurar sua loja primeiro antes de configurar o robô de atendimento.
              </AlertDescription>
            </Alert>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['PARTNER_ADMIN']}>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configuração do WhatsApp Bot</h1>
            <p className="text-gray-600 mt-2">
              Configure e gerencie o robô de atendimento via WhatsApp
            </p>
          </div>

          <WhatsAppBotConfig 
            partnerId={partner.id}
            whatsappNumber={partner.whatsappNumber}
          />

          <BotConfiguration 
            partnerId={partner.id}
            slug={partner.slug || partner.id}
            initialInstructions={partner.aiInstructions}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}