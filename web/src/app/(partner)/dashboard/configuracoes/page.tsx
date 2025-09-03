'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input, 
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox
} from '@/components/ui';
import { Store, MapPin, Globe, AlertCircle, CheckCircle2, ExternalLink, Upload, X, Image as ImageIcon, MessageCircle } from 'lucide-react';
import { SpinningLogo } from '@/components/ui/spinning-logo';
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
import { partnerService, Partner, UpdatePartnerData } from '@/lib/api';

interface StoreConfigData {
  name: string;
  email: string;
  phone: string;
  document: string;
  documentType: 'CNPJ' | 'CPF';
  description: string;
  slug: string;
  whatsappNumber: string;
  whatsappName: string;
  isPublicActive: boolean;
  hasPhysicalStore: boolean;
  pixKey: string;
  whatsappBotEnabled: boolean;
  address: {
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

function StoreConfigForm() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
  
  // Logo upload states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<StoreConfigData>({
    name: '',
    email: user?.email || '',
    phone: '',
    document: '',
    documentType: 'CNPJ',
    description: '',
    slug: '',
    whatsappNumber: '',
    whatsappName: '',
    isPublicActive: true,
    hasPhysicalStore: true,
    pixKey: '',
    whatsappBotEnabled: false,
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

  // Load partner data on component mount
  useEffect(() => {
    loadPartnerData();
  }, []);

  // Handle logo file selection
  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem (JPEG, PNG, WebP)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 5MB');
        return;
      }
      
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  // Handle logo upload
  const handleLogoUpload = async () => {
    if (!logoFile || !partner) return;
    
    setLogoUploading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('logo', logoFile);
      
      const updatedPartner = await partnerService.uploadLogo(formData);
      setPartner(updatedPartner);
      setLogoFile(null);
      setLogoPreview(null);
      setSuccess('Logo atualizado com sucesso!');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: unknown) {
      console.error('Error uploading logo:', err);
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao fazer upload do logo. Tente novamente.';
      setError(errorMessage);
    } finally {
      setLogoUploading(false);
    }
  };

  // Remove logo preview
  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const loadPartnerData = async () => {
    try {
      setInitialLoading(true);
      const partnerData = await partnerService.getCurrentPartner();
      setPartner(partnerData);
      
      // Ensure document and documentType are properly handled
      const documentType = partnerData.documentType || 'CNPJ';
      const rawDocument = partnerData.document || '';
      
      // Apply appropriate mask based on document type
      let maskedDocument = '';
      if (rawDocument && rawDocument.trim() !== '') {
        maskedDocument = documentType === 'CNPJ' 
          ? maskCNPJ(rawDocument) 
          : maskCPF(rawDocument);
      }
      
      // Pre-populate form with existing data
      const formData = {
        name: partnerData.name || '',
        email: partnerData.email || '',
        phone: maskPhone(partnerData.phone || ''),
        document: maskedDocument || '',
        documentType: documentType,
        description: partnerData.description || '',
        slug: partnerData.slug || '',
        whatsappNumber: maskPhone(partnerData.whatsappNumber || ''),
        whatsappName: partnerData.whatsappName || '',
        isPublicActive: partnerData.isPublicActive ?? true,
        hasPhysicalStore: partnerData.hasPhysicalStore ?? true,
        pixKey: partnerData.pixKey || '',
        whatsappBotEnabled: partnerData.whatsappBotEnabled ?? false,
        address: {
          street: partnerData.address?.street || '',
          number: partnerData.address?.number || '',
          complement: partnerData.address?.complement || '',
          neighborhood: partnerData.address?.neighborhood || '',
          city: partnerData.address?.city || '',
          state: partnerData.address?.state || '',
          zipCode: maskCEP(partnerData.address?.zipCode || '')
        }
      };
      
      setFormData(formData);
      setInitialLoadComplete(true);
    } catch (err: unknown) {
      console.error('Error loading partner data:', err);
      setError('Erro ao carregar dados da loja. Tente novamente.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleMaskedInput = (field: string, value: string, maskFunction: (val: string) => string) => {
    const maskedValue = maskFunction(value);
    handleInputChange(field, maskedValue);
  };

  // Generate slug from store name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Keep only letters, numbers, spaces, and hyphens
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // Auto-generate slug when name changes (only if no existing slug)
  useEffect(() => {
    if (formData.name && !formData.slug && !partner?.slug) {
      const generatedSlug = generateSlug(formData.name);
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name, partner?.slug]);

  // Validate slug
  const validateSlug = (slug: string) => {
    const slugRegex = /^[a-z0-9-]+$/;
    const reservedWords = [
      'admin', 'api', 'login', 'cadastro', 'dashboard', 'produtos', 
      'verificar-email', 'recuperar-senha', 'sobre', 'contato', 
      'termos', 'privacidade', 'ajuda', 'buscar', 'categorias', 
      'carrinho', 'checkout'
    ];
    
    if (!slugRegex.test(slug)) {
      return 'Slug deve conter apenas letras minúsculas, números e hífens';
    }
    
    if (reservedWords.includes(slug)) {
      return 'Este slug é reservado pelo sistema. Escolha outro.';
    }
    
    if (slug.length < 3) {
      return 'Slug deve ter pelo menos 3 caracteres';
    }
    
    if (slug.length > 50) {
      return 'Slug deve ter no máximo 50 caracteres';
    }
    
    return null;
  };

  // Track if initial load is complete to prevent clearing document during load
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Handle document type change manually in the select onChange
  const handleDocumentTypeChange = (newType: 'CNPJ' | 'CPF') => {
    setFormData(prev => ({
      ...prev,
      documentType: newType,
      document: '' // Clear document when user changes type
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validate slug
    const slugValidationError = validateSlug(formData.slug);
    if (slugValidationError) {
      setError(slugValidationError);
      setLoading(false);
      return;
    }

    // Validate document
    if (!formData.document || formData.document.trim() === '') {
      setError(`${formData.documentType} é obrigatório. Por favor, preencha o campo.`);
      setLoading(false);
      return;
    }

    if (formData.documentType === 'CPF' && !isValidCPF(formData.document)) {
      setError('CPF inválido. Verifique os números digitados.');
      setLoading(false);
      return;
    }

    if (formData.documentType === 'CNPJ' && !isValidCNPJ(formData.document)) {
      setError('CNPJ inválido. Verifique os números digitados.');
      setLoading(false);
      return;
    }

    // Validate address if physical store is enabled
    if (formData.hasPhysicalStore) {
      if (!formData.address.street || !formData.address.number || 
          !formData.address.neighborhood || !formData.address.city || 
          !formData.address.state || !formData.address.zipCode) {
        setError('Por favor, preencha todos os campos obrigatórios do endereço.');
        setLoading(false);
        return;
      }
      
      if (!isValidCEP(formData.address.zipCode)) {
        setError('CEP inválido. Deve conter 8 dígitos.');
        setLoading(false);
        return;
      }
    }

    try {
      // Remove masks before sending to API
      const updateData: UpdatePartnerData = {
        name: formData.name,
        email: formData.email,
        phone: removeMask(formData.phone),
        document: removeMask(formData.document),
        documentType: formData.documentType,
        description: formData.description,
        slug: formData.slug,
        whatsappNumber: removeMask(formData.whatsappNumber),
        whatsappName: formData.whatsappName || undefined,
        isPublicActive: Boolean(formData.isPublicActive),
        hasPhysicalStore: Boolean(formData.hasPhysicalStore),
        pixKey: formData.pixKey || undefined,
        whatsappBotEnabled: Boolean(formData.whatsappBotEnabled),
        address: formData.hasPhysicalStore ? {
          street: formData.address.street,
          number: formData.address.number,
          complement: formData.address.complement,
          neighborhood: formData.address.neighborhood,
          city: formData.address.city,
          state: formData.address.state,
          zipCode: removeMask(formData.address.zipCode)
        } : null
      };

      // Call API to update partner data
      const updatedPartner = await partnerService.updateCurrentPartner(updateData);
      setPartner(updatedPartner);
      
      setSuccess('Configurações atualizadas com sucesso!');
      setError(null);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (err: unknown) {
      console.error('Error updating store configuration:', err);
      const errorMessage = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao atualizar configurações. Tente novamente.';
      setError(errorMessage);
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <SpinningLogo size="lg" speed="normal" />
            <p className="text-gray-600">Carregando configurações da loja...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configurações da Loja</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as informações da sua loja e configurações de vitrine pública
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              {success}
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
              {/* Logo Upload Section */}
              <div className="space-y-2">
                <Label>Logo da Loja</Label>
                <div className="flex items-start gap-4">
                  {/* Current/Preview Logo */}
                  <div className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    {logoPreview ? (
                      <>
                        <img
                          src={logoPreview}
                          alt="Preview do logo"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : partner?.publicLogo ? (
                      <img
                        src={partner.publicLogo}
                        alt="Logo atual"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <ImageIcon className="h-8 w-8 mb-2" />
                        <span className="text-xs">Sem logo</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1 space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleLogoSelect}
                      className="hidden"
                    />
                    
                    {!logoFile ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={logoUploading}
                        className="w-full sm:w-auto"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Selecionar Logo
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleLogoUpload}
                          disabled={logoUploading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {logoUploading ? (
                            <>
                              <SpinningLogo size="sm" speed="fast" className="mr-2" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Enviar Logo
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={removeLogo}
                          disabled={logoUploading}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Formatos aceitos: JPEG, PNG, WebP. Tamanho máximo: 5MB.
                      O logo será exibido na sua vitrine pública.
                    </p>
                  </div>
                </div>
              </div>

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
                  <Label htmlFor="whatsappNumber">WhatsApp</Label>
                  <Input
                    id="whatsappNumber"
                    value={formData.whatsappNumber}
                    onChange={(e) => handleMaskedInput('whatsappNumber', e.target.value, maskPhone)}
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Será usado para contato direto na vitrine pública
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="whatsappName">Nome no WhatsApp</Label>
                  <Input
                    id="whatsappName"
                    value={formData.whatsappName}
                    onChange={(e) => handleInputChange('whatsappName', e.target.value)}
                    placeholder="Ex: Maria, João, Equipe Brechó"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Nome que aparecerá na mensagem de WhatsApp ao cliente
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pixKey">Chave PIX</Label>
                  <Input
                    id="pixKey"
                    value={formData.pixKey}
                    onChange={(e) => handleInputChange('pixKey', e.target.value)}
                    placeholder="CPF, CNPJ, E-mail, Telefone ou Chave Aleatória"
                    maxLength={255}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Será usada para gerar QR codes de pagamento nos produtos
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="documentType">Tipo de Documento *</Label>
                  <Select
                    value={formData.documentType}
                    onValueChange={(value) => handleDocumentTypeChange(value as 'CNPJ' | 'CPF')}
                  >
                    <SelectTrigger id="documentType">
                      <SelectValue placeholder="Selecione o tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
                      <SelectItem value="CPF">CPF</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Checkbox
                  id="hasPhysicalStore"
                  checked={formData.hasPhysicalStore}
                  onCheckedChange={(checked) => handleInputChange('hasPhysicalStore', checked as boolean)}
                />
                <Label 
                  htmlFor="hasPhysicalStore" 
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
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
                  <MapPin className="h-5 w-5 mr-2 text-orange-600" />
                  Endereço da Loja
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="street">Rua *</Label>
                  <Input
                    id="street"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    placeholder="Rua das Flores"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número *</Label>
                  <Input
                    id="number"
                    value={formData.address.number}
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
                    value={formData.address.complement}
                    onChange={(e) => handleInputChange('address.complement', e.target.value)}
                    placeholder="Loja 2, Sala 301, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro *</Label>
                  <Input
                    id="neighborhood"
                    value={formData.address.neighborhood}
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
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    placeholder="São Paulo"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado *</Label>
                  <Input
                    id="state"
                    value={formData.address.state}
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
                    value={formData.address.zipCode}
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

          {/* Vitrine Pública */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-green-600" />
                Vitrine Pública
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div>
                <Label htmlFor="slug">URL da Loja *</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 bg-gray-50 px-3 py-2 border border-gray-300 rounded-l-md">
                    ebrecho.com.br/
                  </span>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => {
                      const newSlug = e.target.value.toLowerCase();
                      handleInputChange('slug', newSlug);
                      // Validate slug in real-time
                      if (newSlug) {
                        const error = validateSlug(newSlug);
                        setSlugError(error);
                      } else {
                        setSlugError(null);
                      }
                    }}
                    placeholder="minha-loja"
                    className={`rounded-l-none ${slugError ? 'border-red-500' : ''}`}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Este será o endereço da sua vitrine pública. Use apenas letras minúsculas, números e hífens.
                </p>
                {slugError && (
                  <p className="text-xs text-red-600 mt-1">{slugError}</p>
                )}
                {formData.slug && !slugError && (
                  <p className="text-xs mt-1">
                    <a 
                      href={`https://ebrecho.com.br/${formData.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Clique para ver sua loja: <strong>ebrecho.com.br/{formData.slug}</strong>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPublicActive"
                    checked={formData.isPublicActive}
                    onCheckedChange={(checked) => handleInputChange('isPublicActive', checked as boolean)}
                  />
                  <Label 
                    htmlFor="isPublicActive" 
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Ativar vitrine
                  </Label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Quando ativada, sua loja ficará visível na URL personalizada
                </p>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Bot */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-green-600" />
                Robô de Atendimento WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="whatsappBotEnabled"
                    checked={formData.whatsappBotEnabled || false}
                    onCheckedChange={(checked) => handleInputChange('whatsappBotEnabled', checked as boolean)}
                  />
                  <Label 
                    htmlFor="whatsappBotEnabled" 
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    Ativar robô de atendimento WhatsApp
                  </Label>
                </div>
                <p className="text-xs text-gray-500 ml-6">
                  Quando ativado, um robô responderá automaticamente às mensagens dos clientes
                </p>
              </div>
              
              {formData.whatsappBotEnabled && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 mb-3">
                    Configure o WhatsApp Bot na seção específica para este recurso.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/dashboard/bot-config')}
                    className="text-sm"
                  >
                    Configurar WhatsApp Bot
                  </Button>
                </div>
              )} 
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !!slugError}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function StoreConfigPage() {
  return (
    <ProtectedRoute allowedRoles={['PARTNER_ADMIN']}>
      <StoreConfigForm />
    </ProtectedRoute>
  );
}