'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import toast from 'react-hot-toast';
import { Save, Eye, Code, HelpCircle, RefreshCw } from 'lucide-react';

interface AiInstructions {
  id: string;
  prompt: string;
  partnerId: string;
  createdAt: string;
  updatedAt: string;
}

const defaultTemplate = `# Instruções do Assistente Virtual

## Função
Você é um agente virtual de atendimento ao cliente de uma loja. Seu papel é atender clientes de forma educada, clara e eficiente, ajudando em dúvidas sobre produtos, pedidos, prazos de entrega, formas de pagamento, promoções e políticas da loja.

## Instruções principais

- Sempre cumprimente o cliente de forma simpática e acolhedora
- Responda de maneira objetiva, mas cordial, adaptando o tom conforme a conversa
- Caso não tenha certeza sobre uma resposta, explique a limitação e ofereça ajuda alternativa

## Produtos da loja:
{{products.map(product => \`- \${product.name}: R$ \${product.price} (\${product.condition})\`).join('\\n')}}

## Horários de funcionamento:
{{Object.entries(store.businessHours).map(([day, hours]) => \`\${day}: \${hours.open || 'Fechado'} - \${hours.close || ''}\`).join('\\n')}}

## Endereço:
{{\`\${store.address.street}, \${store.address.number} - \${store.address.city}/\${store.address.state}\`}}

## Perguntas frequentes:
{{aiInstructions.faq.map(item => \`**Q: \${item.question}**\\nA: \${item.answer}\`).join('\\n\\n')}}

## Exemplo de início de conversa:
👋 Olá! Bem-vindo(a) à {{store.name}}. Como posso ajudar você hoje?

- Deseja informações sobre um produto?
- Consultar o status de um pedido?
- Ou conhecer nossas promoções atuais?`;

export default function AiInstructionsPage() {
  const { user } = useAuth();
  const [instructions, setInstructions] = useState<AiInstructions | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');

  useEffect(() => {
    if (user?.partnerId) {
      loadInstructions();
    }
  }, [user?.partnerId]);

  const loadInstructions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/partners/${user?.partnerId}/ai-instructions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setInstructions(data.data);
        setPrompt(data.data.prompt);
      } else if (response.status === 404) {
        // No instructions found, use default template
        setPrompt(defaultTemplate);
      } else {
        throw new Error('Failed to load instructions');
      }
    } catch (error) {
      console.error('Error loading AI instructions:', error);
      toast.error('Não foi possível carregar as instruções. Usando template padrão.');
      setPrompt(defaultTemplate);
    } finally {
      setIsLoading(false);
    }
  };

  const saveInstructions = async () => {
    if (!prompt.trim()) {
      toast.error('Por favor, forneça instruções para o assistente.');
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch(`/api/partners/${user?.partnerId}/ai-instructions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const data = await response.json();
        setInstructions(data.data);
        toast.success('Instruções do assistente atualizadas com sucesso!');
      } else {
        throw new Error('Failed to save instructions');
      }
    } catch (error) {
      console.error('Error saving AI instructions:', error);
      toast.error('Não foi possível salvar as instruções.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefault = () => {
    setPrompt(defaultTemplate);
    toast.success('Template padrão restaurado. Não se esqueça de salvar!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando instruções...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Instruções do Assistente IA</h1>
          <p className="text-muted-foreground mt-1">
            Configure como o assistente virtual deve responder aos clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetToDefault}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button onClick={saveInstructions} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Visualização
          </TabsTrigger>
          <TabsTrigger value="help" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Ajuda
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor">
          <Card>
            <CardHeader>
              <CardTitle>Editor de Instruções</CardTitle>
              <CardDescription>
                Edite as instruções em formato Markdown. Use variáveis de template para dados dinâmicos.
                {instructions && (
                  <div className="mt-2">
                    <Badge variant="secondary">
                      Última atualização: {new Date(instructions.updatedAt).toLocaleDateString('pt-BR')}
                    </Badge>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Digite as instruções para o assistente IA..."
                rows={20}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Visualização</CardTitle>
              <CardDescription>
                Pré-visualização das instruções renderizadas (sem substituição de variáveis)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none bg-muted/50 p-4 rounded-lg">
                <pre className="whitespace-pre-wrap font-mono text-xs">{prompt}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Variáveis de Template</CardTitle>
                <CardDescription>
                  Use estas variáveis para inserir dados dinâmicos nas instruções
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {'{{store.name}}'}
                  </code>
                  <p className="text-sm text-muted-foreground mt-1">Nome da loja</p>
                </div>

                <Separator />

                <div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {'{{products.map(...)}}'}
                  </code>
                  <p className="text-sm text-muted-foreground mt-1">Lista de produtos com map/forEach</p>
                </div>

                <Separator />

                <div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {'{{store.businessHours}}'}
                  </code>
                  <p className="text-sm text-muted-foreground mt-1">Horários de funcionamento</p>
                </div>

                <Separator />

                <div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {'{{store.address}}'}
                  </code>
                  <p className="text-sm text-muted-foreground mt-1">Endereço da loja</p>
                </div>

                <Separator />

                <div>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {'{{aiInstructions.faq}}'}
                  </code>
                  <p className="text-sm text-muted-foreground mt-1">Perguntas frequentes</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exemplos de Uso</CardTitle>
                <CardDescription>
                  Exemplos práticos de como usar as variáveis de template
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="font-medium text-sm mb-2">Lista de produtos:</p>
                  <code className="bg-muted px-2 py-1 rounded text-xs block whitespace-pre-wrap">
                    {`{{products.map(product => 
\`- \${product.name}: R$ \${product.price} (\${product.condition})\`
).join('\\n')}}`}
                  </code>
                </div>

                <Separator />

                <div>
                  <p className="font-medium text-sm mb-2">Horários:</p>
                  <code className="bg-muted px-2 py-1 rounded text-xs block whitespace-pre-wrap">
                    {`{{Object.entries(store.businessHours).map(([day, hours]) => 
\`\${day}: \${hours.open || 'Fechado'}\`
).join('\\n')}}`}
                  </code>
                </div>

                <Separator />

                <div>
                  <p className="font-medium text-sm mb-2">FAQ:</p>
                  <code className="bg-muted px-2 py-1 rounded text-xs block whitespace-pre-wrap">
                    {`{{aiInstructions.faq.map(item => 
\`Q: \${item.question}\\nA: \${item.answer}\`
).join('\\n\\n')}}`}
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert className="mt-6">
            <HelpCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Dica:</strong> As variáveis de template serão substituídas automaticamente 
              pelos dados da sua loja quando o assistente for usado. Use Markdown para formatação 
              e mantenha as instruções claras e objetivas.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}