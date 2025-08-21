'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { 
  ShoppingBag, 
  TrendingUp,
  CheckCircle,
  Package,
  DollarSign,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function PromoterDashboardPage() {
  const { user } = useAuth();

  console.log('PromoterDashboard - Rendering for user:', {
    id: user?.id,
    email: user?.email,
    name: user?.name,
    role: user?.role,
    partnerId: user?.partnerId
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Bem-vindo(a), {user?.name}! 🎉
          </h1>
          <p className="text-lg mb-4">
            Você é um Promotor do eBrecho - ajude a expandir nossa rede de parceiros!
          </p>
          <p className="text-sm opacity-90">
            Como promotor, você pode convidar novos parceiros, criar eventos promocionais e ganhar comissões sobre as vendas dos parceiros que você trouxer para a plataforma.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Parceiros Convidados"
            value="0"
            description="Total de convites"
            icon={Package}
            trend={{ value: 0, isPositive: true }}
          />
          <StatsCard
            title="Parceiros Ativos"
            value="0"
            description="Vendendo na plataforma"
            icon={CheckCircle}
            trend={{ value: 0, isPositive: true }}
          />
          <StatsCard
            title="Comissões do Mês"
            value="R$ 0,00"
            description="Ganhos este mês"
            icon={DollarSign}
            trend={{ value: 0, isPositive: true }}
          />
          <StatsCard
            title="Eventos Criados"
            value="0"
            description="Eventos promocionais"
            icon={Activity}
            trend={{ value: 0, isPositive: true }}
          />
        </div>

        {/* Getting Started Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
              Como Começar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Complete seu Perfil de Promotor</h3>
                  <p className="text-sm text-gray-600">
                    Adicione informações sobre sua área de atuação e experiência para aumentar sua credibilidade.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Convide Novos Parceiros</h3>
                  <p className="text-sm text-gray-600">
                    Use seu link de convite exclusivo para trazer novos brechós para a plataforma.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Crie Eventos Promocionais</h3>
                  <p className="text-sm text-gray-600">
                    Organize eventos para promover os produtos dos seus parceiros e aumentar as vendas.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Acompanhe suas Comissões</h3>
                  <p className="text-sm text-gray-600">
                    Ganhe comissões sobre as vendas dos parceiros que você trouxer. Quanto mais vendas, maior sua comissão!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <ShoppingBag className="h-10 w-10 text-purple-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Convidar Parceiro</h3>
              <p className="text-sm text-gray-600">
                Envie um convite para um novo brechó se juntar à plataforma
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Activity className="h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Criar Evento</h3>
              <p className="text-sm text-gray-600">
                Organize um evento promocional para seus parceiros
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <TrendingUp className="h-10 w-10 text-green-600 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Ver Relatórios</h3>
              <p className="text-sm text-gray-600">
                Acompanhe o desempenho dos seus parceiros e comissões
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tips and Resources */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Dicas para Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Foque em brechós com boa reputação e produtos de qualidade</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Ofereça suporte aos seus parceiros para ajudá-los a vender mais</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Crie eventos temáticos que atraiam o público-alvo dos seus parceiros</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Mantenha contato regular com seus parceiros para entender suas necessidades</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}