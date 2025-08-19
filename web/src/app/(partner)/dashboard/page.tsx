'use client';

import React, { useEffect, useState } from 'react';
import { OnboardingGuard } from '@/components/auth/onboarding-guard';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ChartCard, SimpleBarChart } from '@/components/dashboard/chart-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { 
  ShoppingBag, 
  TrendingUp,
  CheckCircle,
  Clock,
  Package,
  DollarSign,
  Activity
} from 'lucide-react';
import { dashboardService, PartnerStats } from '@/lib/dashboard';
import { useAuth } from '@/contexts/auth-context';

export default function DashboardPage() {
  const { user, onboardingStatus, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Debug: Log complete user details
    console.log('StoreOwnerDashboard - Current user details:', {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      partnerId: user?.partnerId,
      hasPartner: !!user?.partnerId,
      fullUser: user
    });

    console.log('StoreOwnerDashboard - Onboarding status:', {
      isComplete: onboardingStatus?.isComplete,
      requiresPartnerSetup: onboardingStatus?.requiresPartnerSetup,
      fullStatus: onboardingStatus
    });

    // Only load dashboard data when:
    // 1. Auth is not loading
    // 2. User is available
    // 3. Onboarding is complete and partner setup is done
    if (!authLoading && user && onboardingStatus?.isComplete && !onboardingStatus?.requiresPartnerSetup) {
      console.log('Dashboard: Loading data with valid user and onboarding status');
      loadDashboardData();
    } else {
      console.log('Dashboard: Waiting for auth context', {
        authLoading,
        hasUser: !!user,
        onboardingComplete: onboardingStatus?.isComplete,
        requiresPartnerSetup: onboardingStatus?.requiresPartnerSetup
      });
    }
  }, [authLoading, user, onboardingStatus]);

  const loadDashboardData = async () => {
    try {
      console.log('loadDashboardData - Starting to fetch dashboard stats');
      console.log('loadDashboardData - User info before API call:', {
        userId: user?.id,
        userRole: user?.role,
        userPartnerId: user?.partnerId,
        userEmail: user?.email
      });
      
      setLoading(true);
      const data = await dashboardService.getStats();
      console.log('loadDashboardData - Successfully fetched stats:', data);
      setStats(data);
    } catch (err: any) {
      console.error('loadDashboardData - Error loading dashboard data:', {
        error: err,
        message: err.message,
        response: err.response,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      
      // Se for erro 403, o usuário provavelmente não tem partner associado
      if (err.response?.status === 403) {
        console.error('loadDashboardData - 403 Forbidden error detected');
        setError('Complete o cadastro da sua loja para acessar o dashboard.');
      } else {
        setError('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !stats) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">{error || 'Failed to load data'}</div>
        </div>
      </DashboardLayout>
    );
  }

  const recentActivity = stats.recentSales.slice(0, 5).map((sale, index) => ({
    id: index + 1,
    action: `Venda: ${sale.name}`,
    time: new Date(sale.soldAt).toLocaleString('pt-BR'),
    type: 'success' as const
  }));

  const categoryData = Object.entries(stats.productDistribution.byCategory)
    .map(([category, count]) => ({
      label: category,
      value: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const topCategoriesRevenue = stats.topSellingCategories.map(cat => ({
    label: cat.category,
    value: cat.revenue
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{stats.partner.name}</h1>
          <p className="text-gray-600 mt-2">
            Gerencie seu brechó e acompanhe suas vendas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Itens"
            value={stats.overview.totalProducts.toLocaleString()}
            description={`${stats.overview.availableProducts} disponíveis`}
            icon={Package}
            trend={{ value: 5.2, isPositive: true }}
          />
          <StatsCard
            title="Vendas do Mês"
            value={stats.monthlyMetrics.soldThisMonth}
            description="Itens vendidos"
            icon={TrendingUp}
            trend={{ value: stats.monthlyMetrics.salesGrowth, isPositive: stats.monthlyMetrics.salesGrowth > 0 }}
          />
          <StatsCard
            title="Receita Mensal"
            value={`R$ ${stats.monthlyMetrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            description="Este mês"
            icon={DollarSign}
            trend={{ value: 12.8, isPositive: true }}
          />
          <StatsCard
            title="Produtos Vendidos"
            value={stats.overview.soldProducts.toLocaleString()}
            description="Total histórico"
            icon={ShoppingBag}
            trend={{ value: 8.7, isPositive: true }}
          />
        </div>

        {/* Monthly Metrics and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Métricas do Estoque
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Disponíveis</p>
                  <p className="text-2xl font-bold text-green-900">{stats.overview.availableProducts}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Vendidos</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.overview.soldProducts}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Reservados</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.overview.reservedProducts}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Novos (semana)</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.weeklyMetrics.newProducts}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">Valor Total do Estoque</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {(stats.overview.availableProducts * stats.overview.averagePrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">Preço médio: R$ {stats.overview.averagePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Sales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-blue-600" />
                Vendas Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma venda recente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Produtos por Categoria">
            <SimpleBarChart data={categoryData} height={200} valuePrefix="" />
          </ChartCard>

          <ChartCard title="Receita por Categoria (Top 5)">
            <SimpleBarChart data={topCategoriesRevenue} height={200} valuePrefix="R$ " />
          </ChartCard>
        </div>

        {/* Product Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.productDistribution.byCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{category}</span>
                    </div>
                    <span className="text-sm text-gray-600">{count} produtos</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Condição dos Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.productDistribution.byCondition).map(([condition, count]) => {
                  const conditionLabels: Record<string, string> = {
                    NEW: 'Novo',
                    LIKE_NEW: 'Como Novo',
                    GOOD: 'Bom',
                    FAIR: 'Regular'
                  };
                  return (
                    <div key={condition} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">{conditionLabels[condition] || condition}</span>
                      </div>
                      <span className="text-sm text-gray-600">{count} produtos</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <ShoppingBag className="h-6 w-6 text-blue-600 mb-2" />
                <h3 className="font-medium text-gray-900">Adicionar Produto</h3>
                <p className="text-sm text-gray-600">Cadastrar novo item no estoque</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <CheckCircle className="h-6 w-6 text-green-600 mb-2" />
                <h3 className="font-medium text-gray-900">Ver Vendas</h3>
                <p className="text-sm text-gray-600">Histórico de vendas detalhado</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors">
                <TrendingUp className="h-6 w-6 text-purple-600 mb-2" />
                <h3 className="font-medium text-gray-900">Análises</h3>
                <p className="text-sm text-gray-600">Insights sobre clientes</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}