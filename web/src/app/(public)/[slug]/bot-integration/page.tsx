'use client'

import { use, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, Download, ExternalLink, Bot, Package, Store, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface StorePageProps {
  params: Promise<{ slug: string }>
}

export default function BotIntegrationPage({ params }: StorePageProps) {
  const { slug } = use(params)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrationData()
  }, [slug])

  const fetchIntegrationData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/store/${slug}/bot-integration`)
      if (!response.ok) {
        throw new Error('Failed to fetch integration data')
      }
      const result = await response.json()
      setData(result.data)
    } catch (err) {
      console.error('Error fetching integration data:', err)
      setError('Erro ao carregar dados de integração')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência!')
  }

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug}-bot-integration.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('JSON baixado com sucesso!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-8">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Dados de integração não disponíveis'}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-2xl md:text-3xl font-bold">Bot Integration API</h1>
            </div>
            <p className="text-muted-foreground">
              Endpoint de integração para {data.store.name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={downloadJSON} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Baixar JSON
            </Button>
            <Button onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar JSON
            </Button>
          </div>
        </div>

        {/* Metadata Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Versão</p>
                  <p className="text-xl font-semibold">{data.version}</p>
                </div>
                <Badge variant="outline">API v1.0</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Produtos</p>
                  <p className="text-xl font-semibold">{data.metadata.totalProducts}</p>
                </div>
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Categorias</p>
                  <p className="text-xl font-semibold">{data.categories.length}</p>
                </div>
                <Store className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Atualização</p>
                  <p className="text-xl font-semibold">Tempo Real</p>
                </div>
                <Clock className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Store Info Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Loja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Nome</p>
                <p>{data.store.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Slug</p>
                <code className="text-sm bg-muted px-2 py-1 rounded">{data.store.slug}</code>
              </div>
              {data.store.contacts.whatsapp && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">WhatsApp</p>
                  <p>{data.store.contacts.whatsapp}</p>
                </div>
              )}
              {data.store.contacts.email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                  <p>{data.store.contacts.email}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Instruções do Robô</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Saudação</p>
                <p className="bg-muted p-3 rounded">{data.aiInstructions.greeting}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Tom de Voz</p>
                <Badge>{data.aiInstructions.tone}</Badge>
              </div>
              {data.aiInstructions.specialInstructions && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Instruções Especiais</p>
                  <p className="bg-muted p-3 rounded">{data.aiInstructions.specialInstructions}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* JSON Preview */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>JSON Preview</CardTitle>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded overflow-x-auto text-sm">
              <code>{JSON.stringify(data, null, 2)}</code>
            </pre>
          </CardContent>
        </Card>

        {/* API Usage Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Como Usar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-medium mb-2">Endpoint</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
                  {`${process.env.NEXT_PUBLIC_API_URL}/api/public/store/${slug}/bot-integration`}
                </code>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => copyToClipboard(`${process.env.NEXT_PUBLIC_API_URL}/api/public/store/${slug}/bot-integration`)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <p className="font-medium mb-2">Método</p>
              <Badge>GET</Badge>
            </div>

            <div>
              <p className="font-medium mb-2">Exemplo de Uso</p>
              <pre className="bg-muted p-3 rounded overflow-x-auto">
                <code>{`fetch('${process.env.NEXT_PUBLIC_API_URL}/api/public/store/${slug}/bot-integration')
  .then(res => res.json())
  .then(data => console.log(data));`}</code>
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}