'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Bot, Plus, Trash2, Info, Copy, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface FAQ {
  question: string
  answer: string
}

interface BotInstructions {
  greeting: string
  tone: string
  specialInstructions: string
  faq: FAQ[]
  productRecommendations: {
    enabled: boolean
    maxSuggestions: number
    basedOn: string[]
  }
  priceNegotiation: {
    enabled: boolean
    maxDiscount: number
    requiresApproval: boolean
  }
}

interface BotConfigurationProps {
  partnerId: string
  slug: string
  initialInstructions?: BotInstructions
}

export function BotConfiguration({ partnerId, slug, initialInstructions }: BotConfigurationProps) {
  const [loading, setLoading] = useState(false)
  const [instructions, setInstructions] = useState<BotInstructions>(initialInstructions || {
    greeting: 'Olá! Bem-vindo à nossa loja! Como posso ajudá-lo hoje?',
    tone: 'profissional e amigável',
    specialInstructions: '',
    faq: [
      { question: 'Quais são os horários de funcionamento?', answer: '' },
      { question: 'Como posso fazer uma compra?', answer: '' }
    ],
    productRecommendations: {
      enabled: true,
      maxSuggestions: 3,
      basedOn: ['category', 'price']
    },
    priceNegotiation: {
      enabled: false,
      maxDiscount: 0,
      requiresApproval: true
    }
  })

  const integrationUrl = `${process.env.NEXT_PUBLIC_API_URL}/public/store/${slug}/bot-integration`
  const frontendUrl = `${window.location.origin}/${slug}/bot-integration`

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put(`/partners/${partnerId}/ai-instructions`, {
        aiInstructions: instructions
      })
      toast.success('Configurações do robô salvas com sucesso!')
    } catch (error) {
      console.error('Error saving bot configuration:', error)
      toast.error('Erro ao salvar configurações do robô')
    } finally {
      setLoading(false)
    }
  }

  const addFAQ = () => {
    setInstructions(prev => ({
      ...prev,
      faq: [...prev.faq, { question: '', answer: '' }]
    }))
  }

  const removeFAQ = (index: number) => {
    setInstructions(prev => ({
      ...prev,
      faq: prev.faq.filter((_, i) => i !== index)
    }))
  }

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    setInstructions(prev => ({
      ...prev,
      faq: prev.faq.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado para a área de transferência!')
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <CardTitle>Configurações do Robô de Atendimento</CardTitle>
          </div>
          <CardDescription>
            Configure como o robô de atendimento deve interagir com seus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Geral</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              {/* <TabsTrigger value="features">Recursos</TabsTrigger> */}
              {/* <TabsTrigger value="integration">Integração</TabsTrigger> */}
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="greeting">Mensagem de Boas-Vindas</Label>
                <Textarea
                  id="greeting"
                  value={instructions.greeting}
                  onChange={(e) => setInstructions(prev => ({ ...prev, greeting: e.target.value }))}
                  placeholder="Ex: Olá! Bem-vindo à nossa loja..."
                  rows={3}
                />
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="tone">Tom de Voz do Robô</Label>
                <Select
                  value={instructions.tone}
                  onValueChange={(value) => setInstructions(prev => ({ ...prev, tone: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tom de voz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="profissional e amigável">Profissional e Amigável</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="divertido">Divertido</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="special">Instruções Especiais</Label>
                <Textarea
                  id="special"
                  value={instructions.specialInstructions}
                  onChange={(e) => setInstructions(prev => ({ ...prev, specialInstructions: e.target.value }))}
                  placeholder="Ex: Sempre mencione nossa promoção atual, seja enfático sobre a qualidade dos produtos..."
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <Label>Perguntas Frequentes</Label>
                <Button onClick={addFAQ} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Pergunta
                </Button>
              </div>

              {instructions.faq.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Pergunta"
                          value={item.question}
                          onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                        />
                        <Textarea
                          placeholder="Resposta"
                          value={item.answer}
                          onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                          rows={2}
                        />
                      </div>
                      <Button
                        onClick={() => removeFAQ(index)}
                        size="sm"
                        variant="ghost"
                        className="ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
            
            {/* <TabsContent value="features" className="space-y-4">
              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Recomendações de Produtos</Label>
                      <p className="text-sm text-muted-foreground">
                        Permitir que o robô sugira produtos aos clientes
                      </p>
                    </div>
                    <Switch
                      checked={instructions.productRecommendations.enabled}
                      onCheckedChange={(checked) => 
                        setInstructions(prev => ({
                          ...prev,
                          productRecommendations: { ...prev.productRecommendations, enabled: checked }
                        }))
                      }
                    />
                  </div>

                  {instructions.productRecommendations.enabled && (
                    <div className="space-y-2 pl-6">
                      <div className="space-y-2">
                        <Label htmlFor="maxSuggestions">Máximo de Sugestões</Label>
                        <Input
                          id="maxSuggestions"
                          type="number"
                          min="1"
                          max="10"
                          value={instructions.productRecommendations.maxSuggestions}
                          onChange={(e) => 
                            setInstructions(prev => ({
                              ...prev,
                              productRecommendations: { 
                                ...prev.productRecommendations, 
                                maxSuggestions: parseInt(e.target.value) 
                              }
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Negociação de Preços</Label>
                      <p className="text-sm text-muted-foreground">
                        Permitir que o robô negocie descontos
                      </p>
                    </div>
                    <Switch
                      checked={instructions.priceNegotiation.enabled}
                      onCheckedChange={(checked) => 
                        setInstructions(prev => ({
                          ...prev,
                          priceNegotiation: { ...prev.priceNegotiation, enabled: checked }
                        }))
                      }
                    />
                  </div>

                  {instructions.priceNegotiation.enabled && (
                    <div className="space-y-2 pl-6">
                      <div className="space-y-2">
                        <Label htmlFor="maxDiscount">Desconto Máximo (%)</Label>
                        <Input
                          id="maxDiscount"
                          type="number"
                          min="0"
                          max="100"
                          value={instructions.priceNegotiation.maxDiscount}
                          onChange={(e) => 
                            setInstructions(prev => ({
                              ...prev,
                              priceNegotiation: { 
                                ...prev.priceNegotiation, 
                                maxDiscount: parseInt(e.target.value) 
                              }
                            }))
                          }
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="approval"
                          checked={instructions.priceNegotiation.requiresApproval}
                          onCheckedChange={(checked) => 
                            setInstructions(prev => ({
                              ...prev,
                              priceNegotiation: { 
                                ...prev.priceNegotiation, 
                                requiresApproval: checked 
                              }
                            }))
                          }
                        />
                        <Label htmlFor="approval">Requer aprovação manual</Label>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>
             */}
            
            
            {/* <TabsContent value="integration" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Use os endpoints abaixo para integrar com plataformas de chatbot como WhatsApp Business API, Telegram, ou outros.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Endpoint da API</Label>
                  <div className="flex gap-2">
                    <Input value={integrationUrl} readOnly />
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
                  <Label>Visualizar JSON</Label>
                  <div className="flex gap-2">
                    <Input value={frontendUrl} readOnly />
                    <Button 
                      size="icon" 
                      variant="outline"
                      onClick={() => window.open(frontendUrl, '_blank')}
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
            </TabsContent> */}
          </Tabs>

          <div className="flex justify-end mt-6">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}