'use client';

import React, { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { ChartCard, SimpleLineChart, SimpleBarChart } from '@/components/dashboard/chart-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { 
  Users, 
  Store, 
  ShoppingBag, 
  Activity,
  DollarSign,
  Package,
  UserCheck
} from 'lucide-react';
import { adminService, AdminStats } from '@/lib/api';

interface SalesData {
  salesTrend?: Array<{ date: string; revenue: number }>;
  categorySales?: Record<string, { revenue: number }>;
}

function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [adminStats, salesStats] = await Promise.all([
        adminService.getStats(),
        adminService.getSalesStats('30d')
      ]);
      setStats(adminStats);
      setSalesData(salesStats);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  const userGrowthTrend = stats.growth.userGrowthRate > 0;
  const partnerGrowthTrend = stats.growth.partnerGrowthRate > 0;

  const salesTrendData = salesData?.salesTrend
    ? salesData.salesTrend
        .slice(-7)
        .map((item) => ({
          date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
          value: item.revenue
        }))
    : [];

  const categoryData = salesData?.categorySales 
    ? Object.entries(salesData.categorySales)
        .map(([category, data]) => ({
          label: category,
          value: data.revenue
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Sistema de gerenciamento e análise do eBrecho
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Usuários"
            value={stats.overview.totalUsers.toLocaleString()}
            description={`${stats.overview.activeUsers} ativos`}
            icon={Users}
            trend={{ 
              value: stats.growth.userGrowthRate, 
              isPositive: userGrowthTrend 
            }}
          />
          <StatsCard
            title="Parceiros"
            value={stats.overview.totalPartners.toLocaleString()}
            description={`${stats.overview.activePartners} ativos`}
            icon={Store}
            trend={{ 
              value: stats.growth.partnerGrowthRate, 
              isPositive: partnerGrowthTrend 
            }}
          />
          <StatsCard
            title="Produtos"
            value={stats.overview.totalProducts.toLocaleString()}
            description={`${stats.overview.totalSales} vendidos`}
            icon={Package}
            trend={{ value: 12.5, isPositive: true }}
          />
          <StatsCard
            title="Receita Total"
            value={`R$ ${stats.overview.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            description="Vendas totais"
            icon={DollarSign}
            trend={{ value: 18.2, isPositive: true }}
          />
        </div>

        {/* Monthly Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Métricas Mensais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Novos Usuários</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.monthlyMetrics.newUsers}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Novos Parceiros</p>
                  <p className="text-2xl font-bold text-green-900">{stats.monthlyMetrics.newPartners}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Produtos Adicionados</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.monthlyMetrics.newProducts}</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-orange-600 font-medium">Vendas do Mês</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.monthlyMetrics.sales}</p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 font-medium">Receita Mensal</p>
                <p className="text-3xl font-bold text-gray-900">
                  R$ {stats.monthlyMetrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Top Partners */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2 text-green-600" />
                Top Parceiros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topPartners.map((partner, index) => (
                  <div key={partner.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{partner.name}</p>
                        <p className="text-sm text-gray-500">{partner.productCount} produtos</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Tendência de Receita (Últimos 7 dias)">
            <SimpleLineChart data={salesTrendData} height={250} valuePrefix="R$ " />
          </ChartCard>

          <ChartCard title="Vendas por Categoria">
            <SimpleBarChart data={categoryData} height={250} valuePrefix="R$ " />
          </ChartCard>
        </div>

        {/* Distribution Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.distributions.usersByRole).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{role}</span>
                    </div>
                    <span className="text-sm text-gray-600">{count} usuários</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status dos Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.distributions.productsByStatus).map(([status, count]) => {
                  const statusColors: Record<string, string> = {
                    AVAILABLE: 'text-green-600',
                    SOLD: 'text-blue-600',
                    RESERVED: 'text-orange-600',
                    INACTIVE: 'text-gray-600'
                  };
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <ShoppingBag className={`h-4 w-4 ${statusColors[status] || 'text-gray-500'}`} />
                        <span className="text-sm font-medium">{status}</span>
                      </div>
                      <span className="text-sm text-gray-600">{count} produtos</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function AdminPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminDashboard />
    </ProtectedRoute>
  );
}