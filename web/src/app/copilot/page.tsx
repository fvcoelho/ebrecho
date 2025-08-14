"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { ChatInterface } from '@/components/copilot/chat-interface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bot, Zap, Shield, Cpu, ChevronRight } from 'lucide-react';

function CopilotPageContent() {
  const { user } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="text-lg text-gray-600">Iniciando Copilot...</p>
        </div>
      </div>
    );
  }

  if (showChat) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ChatInterface onClose={() => setShowChat(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-indigo-100 p-3 rounded-xl">
                <Bot className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Copilot eBrecho
                </h1>
                <p className="text-gray-600 mt-1">
                  Assistente inteligente para automação da sua loja
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-indigo-600 border-indigo-200">
              Powered by xAI Grok
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Boas-vindas */}
        <Card className="mb-8 border-0 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Bot className="mr-3 h-8 w-8" />
              Bem-vindo, {user?.email}!
            </CardTitle>
            <CardDescription className="text-indigo-100 text-lg">
              Seu assistente pessoal está pronto para automatizar tarefas, 
              gerar relatórios e otimizar sua operação na eBrecho.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowChat(true)}
              size="lg"
              className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold px-8 py-3"
            >
              Iniciar Conversa
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recursos */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-indigo-600">
                <Zap className="mr-2 h-6 w-6" />
                Automação Inteligente
              </CardTitle>
              <CardDescription>
                Execute operações complexas com comandos simples em português
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Gerenciar produtos e estoque</li>
                <li>• Processar pedidos automaticamente</li>
                <li>• Gerar relatórios personalizados</li>
                <li>• Configurar promoções e descontos</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <Shield className="mr-2 h-6 w-6" />
                Segurança Avançada
              </CardTitle>
              <CardDescription>
                Protegemos seus dados com autenticação robusta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Controle de acesso baseado em perfis</li>
                <li>• Logs de auditoria completos</li>
                <li>• Criptografia end-to-end</li>
                <li>• Compliance com LGPD</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center text-purple-600">
                <Cpu className="mr-2 h-6 w-6" />
                IA Especializada
              </CardTitle>
              <CardDescription>
                Treinada especificamente para e-commerce de moda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Análise de tendências de moda</li>
                <li>• Otimização de preços</li>
                <li>• Recomendações personalizadas</li>
                <li>• Insights de mercado</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Exemplos de uso */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-gray-900">
              O que você pode fazer com o Copilot?
            </CardTitle>
            <CardDescription>
              Alguns exemplos de comandos que você pode usar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-indigo-600 mb-3">
                  🛍️ Gestão de Produtos
                </h4>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    "Criar um produto vestido floral tamanho M por R$ 89,90"
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    "Buscar todos os produtos com estoque baixo"
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    "Atualizar preço dos sapatos para promoção de 30% off"
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-green-600 mb-3">
                  📦 Pedidos e Vendas
                </h4>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    "Mostrar pedidos pendentes de hoje"
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    "Gerar relatório de vendas do último mês"
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    "Confirmar entrega do pedido #12345"
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-purple-600 mb-3">
                  👥 Clientes e Promoters
                </h4>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    "Listar clientes VIP com mais de R$ 500 em compras"
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    "Cadastrar novo promoter na região Sul"
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    "Calcular comissões dos promoters em dezembro"
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-orange-600 mb-3">
                  📊 Relatórios e Analytics
                </h4>
                <div className="space-y-2">
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    "Dashboard de performance da loja"
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    "Produtos mais vendidos por categoria"
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    "Análise de satisfação dos clientes"
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Call to action */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Pronto para revolucionar sua loja?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Combine o poder da inteligência artificial com a praticidade 
            de comandos em português brasileiro. Experimente agora!
          </p>
          <Button 
            onClick={() => setShowChat(true)}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3 text-lg"
          >
            <Bot className="mr-2 h-6 w-6" />
            Conversar com o Copilot
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CopilotPage() {
  return (
    <ProtectedRoute>
      <CopilotPageContent />
    </ProtectedRoute>
  );
}