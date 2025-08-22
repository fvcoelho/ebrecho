'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea, Checkbox } from '@/components/ui';
import { SpinningLogo } from '@/components/ui/spinning-logo';
import { Settings, User, Bell, CreditCard, Shield, Save, Phone, MapPin, Briefcase, UserCheck, AlertCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { promoterService, UpdatePromoterData, PromoterProfile, authService } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ConfiguracoesPage() {
  const { user, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [promoterProfile, setPromoterProfile] = useState<PromoterProfile | null>(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    whatsappNumber: '',
    businessName: '',
    territory: '',
    specialization: '',
    pixKey: ''
  });

  const [notifications, setNotifications] = useState({
    newPartner: true,
    newSale: true,
    commission: true,
    events: false
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Phone formatting function
  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  // Load promoter profile data on mount
  useEffect(() => {
    const loadPromoterProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const response = await promoterService.getProfile();
        console.log('Promoter profile response:', response);
        
        // Handle both direct data and wrapped response formats
        const profile = response.data || response;
        setPromoterProfile(profile);
        
        // Populate forms with existing data
        setProfileForm({
          name: profile.user?.name || user?.name || '',
          phone: profile.phone || '',
          whatsappNumber: profile.whatsappNumber || '',
          businessName: profile.businessName || '',
          territory: profile.territory || '',
          specialization: profile.specialization || '',
          pixKey: profile.pixKey || ''
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
          whatsappNumber: '',
          businessName: '',
          territory: '',
          specialization: '',
          pixKey: ''
        });
      } finally {
        setIsLoadingProfile(false);
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
        if (!profileForm.businessName) {
          toast.error('Nome do Negócio é obrigatório.');
          setIsLoading(false);
          return;
        }

        console.log('Creating promoter profile with data:', profileForm);

        const promoterData = {
          businessName: profileForm.businessName,
          territory: profileForm.territory || undefined,
          specialization: profileForm.specialization || undefined,
          phone: profileForm.phone || undefined,
          whatsappNumber: profileForm.whatsappNumber || undefined,
          pixKey: profileForm.pixKey || undefined,
        };

        const response = await promoterService.createProfile(promoterData);

        console.log('Create promoter response:', response);
        
        // Handle response format from API
        const newProfile = response.promoter || response.data || response;
        setPromoterProfile(newProfile);
        toast.success('Perfil de promotor criado com sucesso!');
      } else {
        // Update existing promoter profile
        const updateData: UpdatePromoterData = {
          businessName: profileForm.businessName,
          territory: profileForm.territory || undefined,
          specialization: profileForm.specialization || undefined,
          phone: profileForm.phone || undefined,
          whatsappNumber: profileForm.whatsappNumber || undefined,
          pixKey: profileForm.pixKey || undefined,
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

  // Loading state
  if (isLoadingProfile) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <SpinningLogo size="lg" speed="normal" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas informações de promotor e preferências
          </p>
        </div>

        {/* Status Banner */}
        {promoterProfile && (
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <UserCheck className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Status do Promotor</h3>
                    <p className="text-sm text-gray-600">Sua conta de promotor está ativa</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                    promoterProfile.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {promoterProfile.isActive ? 'Ativo' : 'Aguardando Aprovação'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Tier: {promoterProfile.tier || 'BRONZE'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              Informações Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 mb-2 block">
                  Nome Completo *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                    className="pl-10"
                    placeholder="Seu nome completo"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                  Telefone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    placeholder="(11) 99999-9999"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({...profileForm, phone: formatPhone(e.target.value)})}
                    className="pl-10"
                    maxLength={15}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="whatsappNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                  WhatsApp
                </Label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="whatsappNumber"
                    placeholder="(11) 99999-8888"
                    value={profileForm.whatsappNumber}
                    onChange={(e) => setProfileForm({...profileForm, whatsappNumber: formatPhone(e.target.value)})}
                    className="pl-10"
                    maxLength={15}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2 text-purple-600" />
              Informações do Negócio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label htmlFor="businessName" className="text-sm font-medium text-gray-700 mb-2 block">
                  Nome do Negócio *
                </Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="businessName"
                    placeholder="Nome da sua empresa ou marca pessoal"
                    value={profileForm.businessName}
                    onChange={(e) => setProfileForm({...profileForm, businessName: e.target.value})}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="territory" className="text-sm font-medium text-gray-700 mb-2 block">
                    Região de Atuação
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="territory"
                      placeholder="Ex: São Paulo - SP"
                      value={profileForm.territory}
                      onChange={(e) => setProfileForm({...profileForm, territory: e.target.value})}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialization" className="text-sm font-medium text-gray-700 mb-2 block">
                    Especialização
                  </Label>
                  <Input
                    id="specialization"
                    placeholder="Ex: Moda Feminina, Vintage"
                    value={profileForm.specialization}
                    onChange={(e) => setProfileForm({...profileForm, specialization: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="pixKey" className="text-sm font-medium text-gray-700 mb-2 block">
                  Chave PIX
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="pixKey"
                    placeholder="CPF, email, telefone ou chave aleatória"
                    value={profileForm.pixKey}
                    onChange={(e) => setProfileForm({...profileForm, pixKey: e.target.value})}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Chave PIX para recebimento de comissões
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleProfileSubmit} 
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
          >
            {isLoading ? (
              <SpinningLogo size="sm" speed="fast" className="mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {!promoterProfile ? 'Criar Perfil de Promotor' : 'Salvar Alterações'}
          </Button>
        </div>

      </div>
    </DashboardLayout>
  );
}