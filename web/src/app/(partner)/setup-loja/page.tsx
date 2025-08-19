'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label } from '@/components/ui';
import { onboardingService, PartnerSetupData } from '@/lib/api';
import { Store, MapPin } from 'lucide-react';
import { 
  maskCEP, 
  maskCPF, 
  maskCNPJ, 
  maskPhone, 
  removeMask, 
  isValidCPF, 
  isValidCNPJ, 
  isValidCEP 
} from '@/lib/masks';

function PartnerSetupForm() {
  console.log('PartnerSetupForm: Component loading...');
  
  const router = useRouter();
  const { user, checkOnboardingStatus, refreshUserData, refreshToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  console.log('PartnerSetupForm: State initialized', { user: !!user, userEmail: user?.email });
  
  const [formData, setFormData] = useState<PartnerSetupData>({
    name: '',
    email: user?.email || '',
    phone: '',
    document: '',
    documentType: 'CNPJ',
    description: '',
    hasPhysicalStore: true,
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    console.log('handleInputChange: Field:', field, 'Value:', value, 'Type:', typeof value);
    
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      console.log('handleInputChange: Updating address field:', addressField);
      setFormData(prev => {
        const newData = {
          ...prev,
          address: {
            ...(prev.address || {
              street: '',
              number: '',
              complement: '',
              neighborhood: '',
              city: '',
              state: '',
              zipCode: ''
            }),
            [addressField]: value as string
          }
        };
        console.log('handleInputChange: Updated address data:', newData.address);
        return newData;
      });
    } else {
      console.log('handleInputChange: Updating main field:', field);
      setFormData(prev => {
        const newData = {
          ...prev,
          [field]: value
        };
        console.log('handleInputChange: Updated form data:', newData);
        if (field === 'hasPhysicalStore') {
          console.log('handleInputChange: Physical store toggled to:', value);
        }
        return newData;
      });
    }
  };

  const handleMaskedInput = (field: string, value: string, maskFunction: (val: string) => string) => {
    const maskedValue = maskFunction(value);
    handleInputChange(field, maskedValue);
  };

  // Limpar campo documento quando tipo de documento muda
  useEffect(() => {
    console.log('PartnerSetupForm: Document type changed to:', formData.documentType);
    setFormData(prev => ({
      ...prev,
      document: ''
    }));
  }, [formData.documentType]);

  // Log when component mounts
  useEffect(() => {
    console.log('PartnerSetupForm: Component mounted');
    console.log('PartnerSetupForm: Current user:', user);
    console.log('PartnerSetupForm: Current pathname:', window.location.pathname);
    
    return () => {
      console.log('PartnerSetupForm: Component unmounting');
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== PARTNER SETUP FORM SUBMISSION START ===');
    console.log('PartnerSetupForm: Form submission started');
    console.log('PartnerSetupForm: Current formData state:', JSON.stringify(formData, null, 2));
    console.log('PartnerSetupForm: hasPhysicalStore:', formData.hasPhysicalStore);
    console.log('PartnerSetupForm: address data:', formData.address);
    setLoading(true);
    setError(null);

    // Validações antes de enviar
    console.log('=== FORM VALIDATION START ===');
    console.log('PartnerSetupForm: Validating document type:', formData.documentType);
    console.log('PartnerSetupForm: Document value:', formData.document);
    
    if (formData.documentType === 'CPF' && !isValidCPF(formData.document)) {
      console.log('PartnerSetupForm: CPF validation failed');
      setError('CPF inválido. Verifique os números digitados.');
      setLoading(false);
      return;
    }

    if (formData.documentType === 'CNPJ' && !isValidCNPJ(formData.document)) {
      console.log('PartnerSetupForm: CNPJ validation failed');
      setError('CNPJ inválido. Verifique os números digitados.');
      setLoading(false);
      return;
    }

    console.log('PartnerSetupForm: Document validation passed');
    console.log('PartnerSetupForm: Checking address validation - hasPhysicalStore:', formData.hasPhysicalStore);
    
    // Skip address validation if no physical store
    if (formData.hasPhysicalStore && formData.address && !isValidCEP(formData.address.zipCode)) {
      console.log('PartnerSetupForm: CEP validation failed for physical store');
      setError('CEP inválido. Deve conter 8 dígitos.');
      setLoading(false);
      return;
    }
    
    if (formData.hasPhysicalStore) {
      console.log('PartnerSetupForm: Physical store - address validation passed');
    } else {
      console.log('PartnerSetupForm: Online only store - skipping address validation');
    }

    try {
      console.log('=== DATA CLEANING AND API CALL START ===');
      console.log('PartnerSetupForm: Removing masks from form data');
      console.log('PartnerSetupForm: Original document:', formData.document);
      console.log('PartnerSetupForm: Original phone:', formData.phone);
      console.log('PartnerSetupForm: Original zipCode:', formData.address?.zipCode);
      
      // Remover máscaras antes de enviar para a API
      const cleanFormData = {
        ...formData,
        document: removeMask(formData.document),
        phone: removeMask(formData.phone),
        hasPhysicalStore: formData.hasPhysicalStore,
        address: formData.hasPhysicalStore && formData.address ? {
          ...formData.address,
          zipCode: removeMask(formData.address.zipCode)
        } : null
      };

      console.log('PartnerSetupForm: Clean document:', cleanFormData.document);
      console.log('PartnerSetupForm: Clean phone:', cleanFormData.phone);
      console.log('PartnerSetupForm: Clean zipCode:', cleanFormData.address?.zipCode);
      console.log('PartnerSetupForm: Final address object:', cleanFormData.address);
      console.log('PartnerSetupForm: Complete clean data structure:');
      console.log(JSON.stringify(cleanFormData, null, 2));
      
      console.log('=== CALLING ONBOARDING API ===');
      const result = await onboardingService.completePartnerSetup(cleanFormData);
      console.log('PartnerSetupForm: API call successful!');
      console.log('PartnerSetupForm: API response:', result);
      
      // If a new token was provided, update the stored token
      if (result.token) {
        console.log('PartnerSetupForm: New token received, updating localStorage');
        console.log('PartnerSetupForm: New token (first 20 chars):', result.token.substring(0, 20) + '...');
        localStorage.setItem('token', result.token);
      } else {
        console.log('PartnerSetupForm: No new token in response');
      }
      
      // Refresh JWT token to ensure we have the latest user data with partnerId
      console.log('=== POST-SUBMISSION FLOW START ===');
      console.log('PartnerSetupForm: Refreshing JWT token...');
      await refreshToken();
      console.log('PartnerSetupForm: JWT token refreshed');
      
      // Atualizar o status do onboarding no contexto
      console.log('PartnerSetupForm: Updating onboarding status...');
      await checkOnboardingStatus();
      console.log('PartnerSetupForm: Onboarding status updated');
      
      // Pequeno delay para garantir que o contexto foi atualizado
      console.log('PartnerSetupForm: Waiting 200ms for context update...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if user has partnerId before redirecting
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('PartnerSetupForm: Current user after refresh:', currentUser);
      console.log('PartnerSetupForm: User partnerId:', currentUser.partnerId);
      
      if (!currentUser.partnerId) {
        console.error('PartnerSetupForm: Partner setup completed but partnerId not found in user data');
        setError('Erro: Configuração da loja não foi completada corretamente. Tente novamente.');
        return;
      }
      
      // Redirecionar para o dashboard após sucesso
      console.log('PartnerSetupForm: Partner setup completed successfully, redirecting to dashboard...');
      console.log('=== FORM SUBMISSION COMPLETED SUCCESSFULLY ===');
      router.push('/dashboard');
    } catch (err: unknown) {
      console.log('=== ERROR HANDLING START ===');
      console.error('PartnerSetupForm: Error completing partner setup:', err);
      
      const axiosError = err as any;
      console.error('PartnerSetupForm: Full error object:', axiosError);
      console.error('PartnerSetupForm: Error response status:', axiosError?.response?.status);
      console.error('PartnerSetupForm: Error response headers:', axiosError?.response?.headers);
      console.error('PartnerSetupForm: Error response data:', axiosError?.response?.data);
      console.error('PartnerSetupForm: Error config:', axiosError?.config);
      console.error('PartnerSetupForm: Error request:', axiosError?.request);
      
      let errorMessage = 'Erro ao completar cadastro. Tente novamente.';
      
      if (axiosError?.response?.data?.error) {
        console.log('PartnerSetupForm: Using error from response.data.error');
        errorMessage = axiosError.response.data.error;
      } else if (axiosError?.response?.data?.errors && Array.isArray(axiosError.response.data.errors)) {
        console.log('PartnerSetupForm: Using validation errors from response.data.errors');
        console.log('PartnerSetupForm: Validation errors:', axiosError.response.data.errors);
        errorMessage = axiosError.response.data.errors.map((e: any) => e.message).join(', ');
      } else if (axiosError?.response?.status === 400) {
        console.log('PartnerSetupForm: Using generic 400 error message');
        errorMessage = 'Dados inválidos. Verifique os campos e tente novamente.';
      } else if (axiosError?.response?.status === 500) {
        console.log('PartnerSetupForm: Server error detected');
        errorMessage = 'Erro interno do servidor. Tente novamente em alguns minutos.';
      } else if (axiosError?.code === 'NETWORK_ERROR') {
        console.log('PartnerSetupForm: Network error detected');
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      }
      
      console.log('PartnerSetupForm: Final error message:', errorMessage);
      console.log('=== ERROR HANDLING END ===');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Configure sua Loja</h1>
          <p className="text-gray-600">
            Complete as informações da sua loja para começar a vender no eBrecho
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Informações da Loja */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2 text-blue-600" />
                Informações da Loja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Loja *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Ex: Brechó da Maria"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email da Loja *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="contato@minhaloja.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleMaskedInput('phone', e.target.value, maskPhone)}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="documentType">Tipo de Documento *</Label>
                  <select
                    id="documentType"
                    value={formData.documentType}
                    onChange={(e) => handleInputChange('documentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="CNPJ">CNPJ</option>
                    <option value="CPF">CPF</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="document">
                  {formData.documentType === 'CNPJ' ? 'CNPJ' : 'CPF'} *
                </Label>
                <Input
                  id="document"
                  value={formData.document}
                  onChange={(e) => {
                    const maskFunction = formData.documentType === 'CNPJ' ? maskCNPJ : maskCPF;
                    handleMaskedInput('document', e.target.value, maskFunction);
                  }}
                  placeholder={formData.documentType === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                  maxLength={formData.documentType === 'CNPJ' ? 18 : 14}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição da Loja</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Descreva sua loja, especialidades, estilo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <input
                  type="checkbox"
                  id="hasPhysicalStore"
                  checked={formData.hasPhysicalStore}
                  onChange={(e) => handleInputChange('hasPhysicalStore', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="hasPhysicalStore" className="text-sm font-medium text-gray-700">
                  Minha loja possui endereço físico
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          {formData.hasPhysicalStore && (
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-green-600" />
                Endereço da Loja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    value={formData.address?.street || ''}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    placeholder="Rua das Flores"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    value={formData.address?.number || ''}
                    onChange={(e) => handleInputChange('address.number', e.target.value)}
                    placeholder="123"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.address?.complement || ''}
                    onChange={(e) => handleInputChange('address.complement', e.target.value)}
                    placeholder="Loja 2, Sala 301, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.address?.neighborhood || ''}
                    onChange={(e) => handleInputChange('address.neighborhood', e.target.value)}
                    placeholder="Centro"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">Cidade *</Label>
                  <Input
                    id="city"
                    value={formData.address?.city || ''}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    placeholder="São Paulo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    value={formData.address?.state || ''}
                    onChange={(e) => handleInputChange('address.state', e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">CEP *</Label>
                  <Input
                    id="zipCode"
                    value={formData.address?.zipCode || ''}
                    onChange={(e) => {
                      const maskedValue = maskCEP(e.target.value);
                      handleInputChange('address.zipCode', maskedValue);
                    }}
                    placeholder="01234-567"
                    maxLength={9}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Botões */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Salvando...' : 'Completar Cadastro'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function PartnerSetupPage() {
  console.log('PartnerSetupPage: Page component loading...');
  
  return (
    <ProtectedRoute allowedRoles={['PARTNER_ADMIN']} bypassOnboarding>
      <PartnerSetupForm />
    </ProtectedRoute>
  );
}