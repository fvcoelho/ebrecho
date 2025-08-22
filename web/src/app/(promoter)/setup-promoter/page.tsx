'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea } from '@/components/ui';
import { UserPlus, MapPin, Briefcase, Phone, User, MessageCircle, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { SpinningLogo } from '@/components/ui/spinning-logo';
import { promoterService } from '@/lib/api';
import toast from 'react-hot-toast';

interface PromoterSetupForm {
  businessName: string;
  territory: string;
  specialization: string;
  phone: string;
  whatsappNumber: string;
  pixKey: string;
}

function PromoterSetupForm() {
  const { user, refreshToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<PromoterSetupForm>({
    businessName: '',
    territory: '',
    specialization: '',
    phone: '',
    whatsappNumber: '',
    pixKey: '',
  });

  // Pre-populate with user data when component mounts
  useEffect(() => {
    if (user) {
      console.log('Pre-populating form with user data:', user);
      // Keep existing form data but can add user-specific defaults if needed
    }
  }, [user]);

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return value;
  };

  const handleInputChange = (field: keyof PromoterSetupForm, value: string) => {
    if (field === 'phone' || field === 'whatsappNumber') {
      value = formatPhone(value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.businessName.trim()) {
      toast.error('Nome do Negócio é obrigatório');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Submitting promoter setup:', formData);
      
      const promoterData = {
        businessName: formData.businessName,
        territory: formData.territory || undefined,
        specialization: formData.specialization || undefined,
        phone: formData.phone || undefined,
        whatsappNumber: formData.whatsappNumber || undefined,
        pixKey: formData.pixKey || undefined,
      };

      await promoterService.createProfile(promoterData);
      
      toast.success('Perfil de promotor criado com sucesso!');
      
      // Refresh token to include updated promoter information
      try {
        await refreshToken();
        console.log('Token refreshed successfully after promoter setup');
      } catch (tokenError) {
        console.warn('Token refresh failed after promoter setup:', tokenError);
        // Continue with redirect even if token refresh fails
      }
      
      // Redirect to promoter dashboard
      router.push('/promoter');
    } catch (error: any) {
      console.error('Error creating promoter profile:', error);
      
      const errorMessage = error?.response?.data?.error || 
                          error?.message || 
                          'Erro ao criar perfil de promotor. Tente novamente.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white mb-4">
              <UserPlus className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Configure seu Perfil de Promotor
            </h1>
            <p className="text-gray-600">
              Complete as informações abaixo para ativar sua conta de promotor
            </p>
          </div>

          {/* User Welcome Card */}
          {user && (
            <Card className="mb-6 border-l-4 border-l-purple-500">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Bem-vindo, {user.name}!
                    </h3>
                    <p className="text-sm text-gray-600">
                      Conta: {user.email} • Tipo: {user.role}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Setup Form */}
          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Informações do Promotor
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Business Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Informações do Negócio</h3>
                  </div>

                  <div>
                    <Label htmlFor="businessName" className="text-sm font-medium text-gray-700 mb-2 block">
                      Nome do Negócio *
                    </Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="businessName"
                        type="text"
                        placeholder="Ex: Moda Vintage SP"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Nome que identificará seu negócio como promotor
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="territory" className="text-sm font-medium text-gray-700 mb-2 block">
                        Território de Atuação
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="territory"
                          type="text"
                          placeholder="Ex: São Paulo - SP"
                          value={formData.territory}
                          onChange={(e) => handleInputChange('territory', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Região onde você pretende atuar
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="specialization" className="text-sm font-medium text-gray-700 mb-2 block">
                        Especialização
                      </Label>
                      <Input
                        id="specialization"
                        placeholder="Ex: Moda Feminina, Vintage"
                        value={formData.specialization}
                        onChange={(e) => handleInputChange('specialization', e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Sua área de especialização
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                    <Phone className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Informações de Contato</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                        Telefone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="text"
                          placeholder="(11) 99999-9999"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="pl-10"
                          maxLength={15}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Número de contato principal
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="whatsappNumber" className="text-sm font-medium text-gray-700 mb-2 block">
                        WhatsApp
                      </Label>
                      <div className="relative">
                        <MessageCircle className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="whatsappNumber"
                          type="text"
                          placeholder="(11) 99999-8888"
                          value={formData.whatsappNumber}
                          onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                          className="pl-10"
                          maxLength={15}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        WhatsApp para atendimento
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Information Section */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 pb-2 border-b border-gray-200">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Informações de Pagamento</h3>
                  </div>

                  <div>
                    <Label htmlFor="pixKey" className="text-sm font-medium text-gray-700 mb-2 block">
                      Chave PIX
                    </Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="pixKey"
                        type="text"
                        placeholder="email@exemplo.com, CPF, celular ou chave aleatória"
                        value={formData.pixKey}
                        onChange={(e) => handleInputChange('pixKey', e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Chave PIX para recebimento de comissões e pagamentos
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-105"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <SpinningLogo size="sm" speed="fast" className="mr-2" />
                        Criando Perfil...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Ativar Conta de Promotor
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Após a criação, seu perfil de promotor será ativado imediatamente. 
              <br />
              Você poderá começar a trabalhar e gerenciar sua rede de contatos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SetupPromoterPage() {
  return <PromoterSetupForm />;
}