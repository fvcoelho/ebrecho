'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea, Switch } from '@/components/ui';
import { Settings, User, Bell, CreditCard, Shield, Save } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export default function ConfiguracoesPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    newPartner: true,
    newSale: true,
    commission: true,
    events: false
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas preferências e informações de promotor
          </p>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Perfil de Promotor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  defaultValue={user?.name}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  defaultValue={user?.email}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <Label htmlFor="bio">Sobre Você</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre sua experiência e área de atuação..."
                  rows={4}
                />
              </div>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-purple-600" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Novo Parceiro</p>
                  <p className="text-sm text-gray-600">
                    Receber notificação quando um parceiro aceitar seu convite
                  </p>
                </div>
                <Switch
                  checked={notifications.newPartner}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, newPartner: checked})
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nova Venda</p>
                  <p className="text-sm text-gray-600">
                    Notificar quando seus parceiros realizarem vendas
                  </p>
                </div>
                <Switch
                  checked={notifications.newSale}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, newSale: checked})
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Comissões</p>
                  <p className="text-sm text-gray-600">
                    Avisar sobre pagamentos de comissões
                  </p>
                </div>
                <Switch
                  checked={notifications.commission}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, commission: checked})
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Eventos</p>
                  <p className="text-sm text-gray-600">
                    Lembrar sobre eventos próximos
                  </p>
                </div>
                <Switch
                  checked={notifications.events}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, events: checked})
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-purple-600" />
              Informações de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="pix">Chave PIX</Label>
                <Input
                  id="pix"
                  placeholder="CPF, Email, Telefone ou Chave Aleatória"
                />
              </div>
              <div>
                <Label htmlFor="bank">Banco</Label>
                <Input
                  id="bank"
                  placeholder="Nome do banco"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agency">Agência</Label>
                  <Input
                    id="agency"
                    placeholder="0000"
                  />
                </div>
                <div>
                  <Label htmlFor="account">Conta</Label>
                  <Input
                    id="account"
                    placeholder="00000-0"
                  />
                </div>
              </div>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Salvar Dados Bancários
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2 text-purple-600" />
              Segurança
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-password">Senha Atual</Label>
                <Input
                  id="current-password"
                  type="password"
                />
              </div>
              <div>
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                />
              </div>
              <Button>
                <Save className="h-4 w-4 mr-2" />
                Alterar Senha
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}