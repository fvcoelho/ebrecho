'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { DollarSign, TrendingUp, Calendar, Download, ArrowUp, ArrowDown } from 'lucide-react';

export default function ComissoesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Comissões</h1>
            <p className="text-gray-600 mt-2">
              Acompanhe seus ganhos e histórico de comissões
            </p>
          </div>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>

        {/* Commission Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Comissão do Mês</p>
                  <p className="text-2xl font-bold">R$ 0,00</p>
                  <p className="text-xs text-gray-500 mt-1">0% vs mês anterior</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Comissão Pendente</p>
                  <p className="text-2xl font-bold">R$ 0,00</p>
                  <p className="text-xs text-gray-500 mt-1">A receber</p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Recebido</p>
                  <p className="text-2xl font-bold">R$ 0,00</p>
                  <p className="text-xs text-gray-500 mt-1">Desde o início</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa de Comissão</p>
                  <p className="text-2xl font-bold">5%</p>
                  <p className="text-xs text-gray-500 mt-1">Sobre vendas</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commission Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução das Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Gráfico de comissões será exibido aqui</p>
                <p className="text-sm text-gray-400 mt-2">
                  Quando você começar a gerar comissões
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Nenhuma comissão registrada ainda</p>
              <p className="text-sm text-gray-400 mt-2">
                Suas comissões aparecerão aqui quando seus parceiros realizarem vendas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Commission Rules */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funcionam as Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Convide Parceiros</h3>
                  <p className="text-sm text-gray-600">
                    Use seu link exclusivo para convidar brechós para a plataforma
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Parceiros Vendem</h3>
                  <p className="text-sm text-gray-600">
                    Quando seus parceiros realizam vendas, você ganha comissão
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Receba Comissões</h3>
                  <p className="text-sm text-gray-600">
                    Comissões são creditadas mensalmente em sua conta
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}