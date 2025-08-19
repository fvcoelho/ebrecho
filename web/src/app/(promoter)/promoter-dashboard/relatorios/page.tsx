'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { BarChart3, Download, Filter, TrendingUp, Users, ShoppingBag, DollarSign } from 'lucide-react';

export default function RelatoriosPage() {
  const [period, setPeriod] = useState('month');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
            <p className="text-gray-600 mt-2">
              Análise detalhada do desempenho dos seus parceiros
            </p>
          </div>
          <div className="flex space-x-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última Semana</SelectItem>
                <SelectItem value="month">Último Mês</SelectItem>
                <SelectItem value="quarter">Último Trimestre</SelectItem>
                <SelectItem value="year">Último Ano</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Vendas</p>
                  <p className="text-2xl font-bold">R$ 0,00</p>
                  <p className="text-xs text-green-600 mt-1 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    0% vs período anterior
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Produtos Vendidos</p>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-gray-500 mt-1">No período</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Parceiros Ativos</p>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-xs text-gray-500 mt-1">Com vendas no período</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ticket Médio</p>
                  <p className="text-2xl font-bold">R$ 0,00</p>
                  <p className="text-xs text-gray-500 mt-1">Por venda</p>
                </div>
                <BarChart3 className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Gráfico de vendas será exibido aqui</p>
                <p className="text-sm text-gray-400 mt-2">
                  Quando seus parceiros começarem a vender
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partner Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho dos Parceiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhum dado de parceiros disponível</p>
              <p className="text-sm text-gray-400 mt-2">
                Os dados aparecerão quando você tiver parceiros ativos
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Category Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Análise por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Análise de categorias indisponível</p>
              <p className="text-sm text-gray-400 mt-2">
                Dados serão exibidos quando houver vendas
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}