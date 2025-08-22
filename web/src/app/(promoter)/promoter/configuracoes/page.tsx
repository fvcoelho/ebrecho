'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea, Checkbox } from '@/components/ui';
import { Settings, User, Bell, CreditCard, Shield, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { promoterService, UpdatePromoterData, PromoterProfile, authService } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ConfiguracoesPage() {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [promoterProfile, setPromoterProfile] = useState<PromoterProfile | null>(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    bio: '',
    businessName: '',
    territory: '',
    specialization: ''
  });

  const [notifications, setNotifications] = useState({
    newPartner: true,
    newSale: true,
    commission: true,
    events: false
  });

  const [paymentForm, setPaymentForm] = useState({
    pixKey: '',
    bankName: '',
    bankAgency: '',
    bankAccount: ''
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load promoter profile data on mount
  useEffect(() => {
    const loadPromoterProfile = async () => {
      try {
        const response = await promoterService.getProfile();
        console.log('Promoter profile response:', response);
        
        // Handle both direct data and wrapped response formats
        const profile = response.data || response;
        setPromoterProfile(profile);
        
        // Populate forms with existing data
        setProfileForm({
          name: profile.user?.name || user?.name || '',
          phone: '', // This would come from profile or user
          bio: profile.specialization || '',
          businessName: profile.businessName || '',
          territory: profile.territory || '',
          specialization: profile.specialization || ''
        });
      } catch (error) {
        console.error('Error loading promoter profile:', error);
        
        // Check if it's a 404 (promoter profile doesn't exist) or another error
        if (error.response?.status === 404) {
          console.log('No promoter profile found, user can apply');
          setPromoterProfile(null);
        }
        
        // Populate with user data for new promoter application
        setProfileForm({
          name: user?.name || '',
          phone: '', 
          bio: '',
          businessName: '',
          territory: '',
          specialization: ''
        });
      }
    };

    if (user) {
      loadPromoterProfile();
    }
  }, [user]);

  const handleProfileSubmit = async () => {
    setIsLoading(true);
    try {
      // First update user name if it has changed
      if (user && profileForm.name && profileForm.name !== user.name) {
        console.log('Updating user name from', user.name, 'to', profileForm.name);
        try {
          // Use the auth context updateProfile to update user data and refresh context
          await updateProfile({ name: profileForm.name });
          console.log('User name updated successfully and context refreshed');
        } catch (userError) {
          console.error('Error updating user name:', userError);
          // Continue with promoter update even if user update fails
        }
      }

      if (!promoterProfile) {
        // Create new promoter profile (apply for promoter)
        if (!profileForm.businessName || !profileForm.territory || !profileForm.specialization) {
          toast.error('Por favor, preencha Nome do Negócio, Território e Especialização para se candidatar a promotor.');
          setIsLoading(false);
          return;
        }

        console.log('Applying for promoter with data:', {
          businessName: profileForm.businessName,
          territory: profileForm.territory,
          specialization: profileForm.specialization
        });

        const response = await promoterService.createProfile({
          businessName: profileForm.businessName,
          territory: profileForm.territory,
          specialization: profileForm.specialization
        });

        console.log('Create promoter response:', response);
        
        // Handle response format from API
        const newProfile = response.promoter || response.data || response;
        setPromoterProfile(newProfile);
        toast.success('Candidatura para promotor enviada com sucesso! Aguarde aprovação.');
      } else {
        // Update existing promoter profile
        const updateData: UpdatePromoterData = {
          businessName: profileForm.businessName,
          territory: profileForm.territory,
          specialization: profileForm.specialization
        };

        console.log('Updating promoter profile with data:', updateData);

        const response = await promoterService.updateProfile(updateData);
        console.log('Update promoter response:', response);
        
        // Update local state with new data
        const updatedProfile = response.promoter || response.data || response;
        setPromoterProfile(updatedProfile);
        
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      
      // Better error handling based on API response
      if (error.response?.data?.errors) {
        // Handle validation errors
        const errors = error.response.data.errors;
        toast.error(`Erro de validação: ${errors.map(e => e.message).join(', ')}`);
      } else if (error.response?.data?.error) {
        // Handle general API errors
        toast.error(error.response.data.error);
      } else {
        toast.error('Erro ao salvar perfil. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationsSubmit = async () => {
    if (!promoterProfile) {
      toast.error('Você precisa ter um perfil de promotor ativo para alterar notificações.');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: UpdatePromoterData = {
        notificationSettings: notifications
      };

      const response = await promoterService.updateProfile(updateData);
      const updatedProfile = response.promoter || response.data || response;
      setPromoterProfile(updatedProfile);
      
      toast.success('Configurações de notificação atualizadas!');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Erro ao atualizar notificações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!promoterProfile) {
      toast.error('Você precisa ter um perfil de promotor ativo para alterar informações de pagamento.');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: UpdatePromoterData = {
        pixKey: paymentForm.pixKey,
        bankName: paymentForm.bankName,
        bankAgency: paymentForm.bankAgency,
        bankAccount: paymentForm.bankAccount
      };

      const response = await promoterService.updateProfile(updateData);
      const updatedProfile = response.promoter || response.data || response;
      setPromoterProfile(updatedProfile);
      
      toast.success('Informações de pagamento atualizadas!');
    } catch (error) {
      console.error('Error updating payment info:', error);
      toast.error('Erro ao atualizar informações de pagamento. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySubmit = async () => {
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('Nova senha e confirmação não coincidem.');
      return;
    }

    if (securityForm.newPassword.length < 6) {
      toast.error('Nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    // Note: Password change would need a separate API endpoint
    // For now, just show a success message
    toast.success('Funcionalidade de alteração de senha será implementada em breve.');
    
    // Clear form
    setSecurityForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

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
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <User className="h-5 w-5 mr-2 text-purple-600" />
                Perfil de Promotor
              </div>
              {promoterProfile && (
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    promoterProfile.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {promoterProfile.isActive ? 'Ativo' : 'Aguardando Aprovação'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Tier: {promoterProfile.tier || 'BRONZE'}
                  </span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  placeholder="(11) 99999-9999"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="businessName">Nome do Negócio</Label>
                <Input
                  id="businessName"
                  placeholder="Nome da sua empresa ou marca pessoal"
                  value={profileForm.businessName}
                  onChange={(e) => setProfileForm({...profileForm, businessName: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="territory">Região de Atuação</Label>
                <Input
                  id="territory"
                  placeholder="Ex: São Paulo - SP, Rio de Janeiro - RJ"
                  value={profileForm.territory}
                  onChange={(e) => setProfileForm({...profileForm, territory: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="specialization">Especialização</Label>
                <Input
                  id="specialization"
                  placeholder="Ex: Moda Feminina, Vintage, Streetwear"
                  value={profileForm.specialization}
                  onChange={(e) => setProfileForm({...profileForm, specialization: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="bio">Sobre Você</Label>
                <Textarea
                  id="bio"
                  placeholder="Conte um pouco sobre sua experiência e área de atuação..."
                  rows={4}
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({...profileForm, bio: e.target.value})}
                />
              </div>
              <Button onClick={handleProfileSubmit} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                {!promoterProfile ? 'Candidatar-se a Promotor' : 'Salvar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        {/* <Card>
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
                <Checkbox
                  checked={notifications.newPartner}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, newPartner: !!checked})
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
                <Checkbox
                  checked={notifications.newSale}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, newSale: !!checked})
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
                <Checkbox
                  checked={notifications.commission}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, commission: !!checked})
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
                <Checkbox
                  checked={notifications.events}
                  onCheckedChange={(checked) => 
                    setNotifications({...notifications, events: !!checked})
                  }
                />
              </div>
              <Button onClick={handleNotificationsSubmit} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Notificações
              </Button>
            </div>
          </CardContent>
        </Card> */}

        {/* Payment Settings */}
        {/* <Card>
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
                  value={paymentForm.pixKey}
                  onChange={(e) => setPaymentForm({...paymentForm, pixKey: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="bank">Banco</Label>
                <Input
                  id="bank"
                  placeholder="Nome do banco"
                  value={paymentForm.bankName}
                  onChange={(e) => setPaymentForm({...paymentForm, bankName: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="agency">Agência</Label>
                  <Input
                    id="agency"
                    placeholder="0000"
                    value={paymentForm.bankAgency}
                    onChange={(e) => setPaymentForm({...paymentForm, bankAgency: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="account">Conta</Label>
                  <Input
                    id="account"
                    placeholder="00000-0"
                    value={paymentForm.bankAccount}
                    onChange={(e) => setPaymentForm({...paymentForm, bankAccount: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={handlePaymentSubmit} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Dados Bancários
              </Button>
            </div>
          </CardContent>
        </Card> */}

        {/* Security Settings */}
        {/* <Card>
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
                  value={securityForm.currentPassword}
                  onChange={(e) => setSecurityForm({...securityForm, currentPassword: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="new-password">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={securityForm.newPassword}
                  onChange={(e) => setSecurityForm({...securityForm, newPassword: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={securityForm.confirmPassword}
                  onChange={(e) => setSecurityForm({...securityForm, confirmPassword: e.target.value})}
                />
              </div>
              <Button onClick={handleSecuritySubmit} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Alterar Senha
              </Button>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </DashboardLayout>
  );
}