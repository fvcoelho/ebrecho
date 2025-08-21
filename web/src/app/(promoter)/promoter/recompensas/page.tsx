'use client';

import React from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '@/components/ui';
import { Gift, Trophy, Star, Target, Award, Zap, Users } from 'lucide-react';

export default function RecompensasPage() {
  const rewards = [
    {
      id: 1,
      title: 'Primeiro Parceiro',
      description: 'Convide seu primeiro parceiro para a plataforma',
      points: 100,
      icon: Users,
      status: 'locked',
      progress: 0,
      total: 1
    },
    {
      id: 2,
      title: 'Rede de 5 Parceiros',
      description: 'Tenha 5 parceiros ativos na sua rede',
      points: 500,
      icon: Trophy,
      status: 'locked',
      progress: 0,
      total: 5
    },
    {
      id: 3,
      title: 'Primeira Venda',
      description: 'Seu parceiro realiza a primeira venda',
      points: 200,
      icon: Star,
      status: 'locked',
      progress: 0,
      total: 1
    },
    {
      id: 4,
      title: 'Meta Mensal',
      description: 'Alcance R$ 5.000 em vendas dos parceiros',
      points: 1000,
      icon: Target,
      status: 'locked',
      progress: 0,
      total: 5000
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recompensas</h1>
          <p className="text-gray-600 mt-2">
            Ganhe pontos e desbloqueie benefícios exclusivos
          </p>
        </div>

        {/* Points Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Pontos Totais</p>
                  <p className="text-3xl font-bold">0</p>
                  <p className="text-xs opacity-75 mt-1">Pontos acumulados</p>
                </div>
                <Zap className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Nível Atual</p>
                  <p className="text-2xl font-bold">Iniciante</p>
                  <p className="text-xs text-gray-500 mt-1">0/1000 pontos</p>
                </div>
                <Award className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Conquistas</p>
                  <p className="text-2xl font-bold">0/12</p>
                  <p className="text-xs text-gray-500 mt-1">Desbloqueadas</p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Rewards */}
        <Card>
          <CardHeader>
            <CardTitle>Conquistas Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.map((reward) => {
                const Icon = reward.icon || Gift;
                return (
                  <div
                    key={reward.id}
                    className={`border rounded-lg p-4 ${
                      reward.status === 'locked' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`p-3 rounded-lg ${
                        reward.status === 'locked' 
                          ? 'bg-gray-100' 
                          : 'bg-purple-100'
                      }`}>
                        <Icon className={`h-6 w-6 ${
                          reward.status === 'locked'
                            ? 'text-gray-400'
                            : 'text-purple-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">
                            {reward.title}
                          </h3>
                          <Badge variant={reward.status === 'locked' ? 'outline' : 'default'}>
                            {reward.points} pts
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {reward.description}
                        </p>
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progresso</span>
                            <span>{reward.progress}/{reward.total}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-600 h-2 rounded-full"
                              style={{ width: `${(reward.progress / reward.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Níveis de Promotor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 border rounded-lg bg-purple-50 border-purple-200">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Iniciante</h4>
                  <p className="text-sm text-gray-600">0 - 999 pontos</p>
                </div>
                <Badge>Atual</Badge>
              </div>
              <div className="flex items-center space-x-4 p-4 border rounded-lg opacity-60">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Star className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Bronze</h4>
                  <p className="text-sm text-gray-600">1.000 - 4.999 pontos</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 border rounded-lg opacity-60">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Star className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Prata</h4>
                  <p className="text-sm text-gray-600">5.000 - 14.999 pontos</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 p-4 border rounded-lg opacity-60">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Star className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">Ouro</h4>
                  <p className="text-sm text-gray-600">15.000+ pontos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

