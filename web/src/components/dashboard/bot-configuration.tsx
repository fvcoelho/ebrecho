'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Bot, Save, Trash2, AlertCircle, CheckCircle, Copy, Eye, Info, ExternalLink } from 'lucide-react'
import { aiInstructionsService, type AiInstructions } from '@/lib/api'
import toast from 'react-hot-toast'

interface BotConfigurationProps {
  partnerId: string
  slug: string
  initialInstructions?: any // Legacy prop, no longer used
}

export function BotConfiguration({ partnerId, slug }: BotConfigurationProps) {
  const [aiInstructions, setAiInstructions] = useState<AiInstructions | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const integrationUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/public/store/${slug}/bot-integration`
  const aiInstructionsUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${slug}/ai-instructions`

  // Load AI instructions on component mount
  useEffect(() => {
    loadAiInstructions()
  }, [])

  // Track changes to prompt
  useEffect(() => {
    if (aiInstructions) {
      setHasUnsavedChanges(prompt !== aiInstructions.prompt)
    } else {
      setHasUnsavedChanges(prompt.length > 0)
    }
  }, [prompt, aiInstructions])

  const loadAiInstructions = async () => {
    try {
      setLoading(true)
      const instructions = await aiInstructionsService.getAiInstructions()
      setAiInstructions(instructions)
      setPrompt(instructions.prompt)
    } catch (error: any) {
      if (error.response?.status === 404) {
        // No AI instructions found, this is normal for new partners
        setAiInstructions(null)
        setPrompt('')
      } else {
        console.error('Error loading AI instructions:', error)
        toast.error('Erro ao carregar instruções do bot')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!prompt.trim()) {
      toast.error('As instruções não podem estar vazias')
      return
    }

    try {
      setSaving(true)
      let savedInstructions: AiInstructions

      if (aiInstructions) {
        // Update existing instructions
        savedInstructions = await aiInstructionsService.updateAiInstructions({ prompt })
        toast.success('Instruções atualizadas com sucesso')
      } else {
        // Create new instructions
        savedInstructions = await aiInstructionsService.createAiInstructions({ prompt })
        toast.success('Instruções criadas com sucesso')
      }

      setAiInstructions(savedInstructions)
      setHasUnsavedChanges(false)
    } catch (error: any) {
      console.error('Error saving AI instructions:', error)
      toast.error('Erro ao salvar instruções do bot')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!aiInstructions) return

    if (!confirm('Tem certeza que deseja excluir as instruções do bot? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setDeleting(true)
      await aiInstructionsService.deleteAiInstructions()
      setAiInstructions(null)
      setPrompt('')
      setHasUnsavedChanges(false)
      toast.success('Instruções excluídas com sucesso')
    } catch (error: any) {
      console.error('Error deleting AI instructions:', error)
      toast.error('Erro ao excluir instruções do bot')
    } finally {
      setDeleting(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência!')
  }

  const copyDefaultTemplate = () => {
    const defaultTemplate = `# Instruções do Assistente Virtual

## Função
Você é um agente virtual de atendimento ao cliente de uma loja. Seu papel é atender clientes de forma educada, clara e eficiente, ajudando em dúvidas sobre produtos, pedidos, prazos de entrega, formas de pagamento, promoções e políticas da loja.

## Instruções principais

- Sempre cumprimente o cliente de forma simpática e acolhedora
- Responda de maneira objetiva, mas cordial, adaptando o tom conforme a conversa
- Caso não tenha certeza sobre uma resposta, explique a limitação e ofereça ajuda alternativa

## Produtos da loja:
{{products.map(product => \`- [\${product.name}](\${product.url}): R$ \${product.price} (\${product.condition})\`).join('\\\\n')}}

## Horários de funcionamento:
{{Object.entries(store.businessHours).map(([day, hours]) => \`\${day}: \${hours.open || 'Fechado'} - \${hours.close || ''}\`).join('\\\\n')}}

## Endereço:
{{\`\${store.address.street}, \${store.address.number} - \${store.address.city}/\${store.address.state}\`}}

## Perguntas frequentes:
{{aiInstructions.faq.map(item => \`**Q: \${item.question}**\\\\nA: \${item.answer}\`).join('\\\\n\\\\n')}}

## Exemplo de início de conversa:
👋 Olá! Bem-vindo(a) à {{store.name}}. Como posso ajudar você hoje?

- Deseja informações sobre um produto?
- Consultar o status de um pedido?
- Ou conhecer nossas promoções atuais?`

    setPrompt(defaultTemplate)
    toast.success('Template padrão copiado para o editor')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {hasUnsavedChanges && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você tem alterações não salvas. Não esqueça de salvar suas modificações.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="editor" className="space-y-4">
        <TabsList>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          <TabsTrigger value="help">Ajuda & Templates</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="integration">Integração</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  <div>
                    <CardTitle>Instruções do Bot</CardTitle>
                    <CardDescription>
                      Configure como seu assistente virtual deve se comportar e responder aos clientes
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {aiInstructions && (
                    <Badge variant="secondary">
                      Criado em {new Date(aiInstructions.createdAt).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="prompt">Prompt de Instruções (Markdown)</Label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Digite as instruções do seu bot aqui..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    onClick={copyDefaultTemplate}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Usar Template Padrão
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {aiInstructions && (
                    <Button
                      onClick={handleDelete}
                      variant="destructive"
                      size="sm"
                      disabled={deleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {deleting ? 'Excluindo...' : 'Excluir'}
                    </Button>
                  )}
                  
                  <Button
                    onClick={handleSave}
                    disabled={saving || !hasUnsavedChanges}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Variáveis de Template</CardTitle>
              <CardDescription>
                Use estas variáveis para personalizar dinamicamente as instruções
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <h4 className="font-medium mb-2">Informações da Loja</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><code>{'{'}{'{'}{'{'}store.name{'}'}{'}'}{'}'}</code> - Nome da loja</p>
                    <p><code>{'{'}{'{'}{'{'}store.address.street{'}'}, {'{'}store.address.number{'}'}{'}'}{'}'}</code> - Endereço</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Lista de Produtos</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><code>{'{'}{'{'}{'{'}products.map(product =&gt; \`- [\${'{'}product.name{'}'}](\${'{'}product.url{'}'}): R$ \${'{'}product.price{'}'}\`).join('\\n'){'}'}{'}'}{'}'}</code></p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Horários de Funcionamento</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><code>{'{'}{'{'}{'{'}Object.entries(store.businessHours).map([day, hours]) =&gt; \`\${'{'}day{'}'}: \${'{'}hours.open{'}'} - \${'{'}hours.close{'}'}\`).join('\\n'){'}'}{'}'}{'}'}</code></p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preview das Instruções</CardTitle>
              <CardDescription>
                Visualize como as instruções aparecerão para o bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prompt ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg">
                    {prompt}
                  </pre>
                </div>
              ) : (
                <div className="text-muted-foreground text-center py-8">
                  Nenhuma instrução configurada ainda
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Integração</CardTitle>
              <CardDescription>
                URLs e endpoints para integração com plataformas de chatbot
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Use os endpoints abaixo para integrar com plataformas de chatbot como WhatsApp Business API, Telegram, ou outros.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Endpoint da API (JSON)</Label>
                  <div className="flex gap-2">
                    <input 
                      value={integrationUrl} 
                      readOnly 
                      className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
                    />
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={() => copyToClipboard(integrationUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Instruções Processadas (Texto)</Label>
                  <div className="flex gap-2">
                    <input 
                      value={aiInstructionsUrl} 
                      readOnly 
                      className="flex-1 px-3 py-2 border rounded-md bg-muted text-sm"
                    />
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={() => copyToClipboard(aiInstructionsUrl)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={() => window.open(aiInstructionsUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Status da Integração</Label>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      API Ativa
                    </Badge>
                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                      Versão 1.0
                    </Badge>
                  </div>
                </div>

                <Alert className="mt-4">
                  <AlertDescription className="text-sm">
                    <strong>Dica:</strong> Os dados são atualizados em tempo real. Sempre que você adicionar ou modificar produtos, as mudanças serão refletidas automaticamente na integração.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}