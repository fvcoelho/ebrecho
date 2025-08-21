'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { Users, Store, TrendingUp, Eye, MessageCircle } from 'lucide-react';

export default function ParceirosPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meus Parceiros</h1>
          <p className="text-gray-600 mt-2">
            Acompanhe o desempenho dos brechós que você trouxe para a plataforma
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Parceiros</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Parceiros Ativos</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
                <Store className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vendas do Mês</p>
                  <p className="text-2xl font-bold">R$ 0,00</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Comissão do Mês</p>
                  <p className="text-2xl font-bold">R$ 0,00</p>
                </div>
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Partners List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Parceiros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">Você ainda não tem parceiros cadastrados</p>
              <p className="text-sm text-gray-400 mt-2">
                Convide brechós para começar a expandir sua rede
              </p>
              <Button className="mt-4" onClick={() => window.location.href = '/promoter/convites'}>
                Convidar Parceiros
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}