'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, Plus, Filter, Grid, List, Eye, Edit, Trash2, Sparkles, User, UserPlus, Shirt } from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';
import { DashboardLayout } from '@/components/dashboard';
import { productService, type Product, type ProductFilters, type Category } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { imageApi } from '@/lib/api/images';
import { aiEnhancementAPI } from '@/lib/api/ai-enhancement';
import { TryOnComponent } from '@/components/products/try-on-component';

const CONDITION_LABELS = {
  NEW: 'Novo',
  LIKE_NEW: 'Seminovo',
  GOOD: 'Bom Estado',
  FAIR: 'Estado Regular'
};

const STATUS_LABELS = {
  AVAILABLE: 'Disponível',
  SOLD: 'Vendido',
  RESERVED: 'Reservado',
  INACTIVE: 'Inativo'
};

const STATUS_COLORS = {
  AVAILABLE: 'bg-green-100 text-green-800',
  SOLD: 'bg-gray-100 text-gray-800',
  RESERVED: 'bg-yellow-100 text-yellow-800',
  INACTIVE: 'bg-red-100 text-red-800'
};

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [enhancingProductId, setEnhancingProductId] = useState<string | null>(null);
  const [models, setModels] = useState<{id: string, name: string, imageUrl: string}[]>([
    { id: '1', name: 'Modelo 1', imageUrl: 'https://static.getglam.app/api_service/target.jpg' },
    { id: '2', name: 'Modelo 2', imageUrl: 'https://static.getglam.app/api_service/target.jpg' },
    { id: '3', name: 'Modelo 3', imageUrl: 'https://static.getglam.app/api_service/target.jpg' },
    { id: '4', name: 'Modelo 4', imageUrl: 'https://static.getglam.app/api_service/target.jpg' }
  ]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showTryOnDialog, setShowTryOnDialog] = useState(false);
  const [tryOnProduct, setTryOnProduct] = useState<Product | null>(null);
  const [tryOnStates, setTryOnStates] = useState<{[key: string]: {isProcessing: boolean, eventId: string | null, resultImage: string | null, error: string | null}}>({});

  // Filters
  const [filters, setFilters] = useState<ProductFilters>({
    page: parseInt(searchParams.get('page') || '1'),
    limit: 12,
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    status: (searchParams.get('status') as Product['status']) || undefined,
    sortBy: (searchParams.get('sortBy') as ProductFilters['sortBy']) || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as ProductFilters['sortOrder']) || 'desc'
  });

  // Load products
  const loadProducts = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading products with filters:', filters);
      const response = await productService.getProducts(filters);
      console.log('✅ Products loaded:', {
        productsCount: response.products.length,
        pagination: response.pagination,
        productsWithImages: response.products.filter(p => p.images.length > 0).length,
        productsWithoutImages: response.products.filter(p => p.images.length === 0).length,
        sampleProduct: response.products[0] ? {
          id: response.products[0].id,
          name: response.products[0].name,
          imagesCount: response.products[0].images.length,
          firstImageUrl: response.products[0].images[0]?.thumbnailUrl
        } : null
      });
      setProducts(response.products);
      setPagination(response.pagination);
    } catch (error) {
      console.error('❌ Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      const response = await productService.getCategories();
      setCategories(response);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  // Update URL with filters
  const updateURL = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '' && value !== 1) {
        params.set(key, value.toString());
      }
    });
    
    const newURL = `/produtos${params.toString() ? `?${params.toString()}` : ''}`;
    router.push(newURL, { scroll: false });
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof ProductFilters, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    if (key !== 'page') {
      newFilters.page = 1; // Reset to first page when changing filters
    }
    setFilters(newFilters);
  };

  // Handle search
  const handleSearch = (value: string) => {
    handleFilterChange('search', value);
  };

  // Clear filters
  const clearFilters = () => {
    const newFilters: ProductFilters = {
      page: 1,
      limit: 12,
      search: '',
      category: '',
      status: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setFilters(newFilters);
  };

  // Delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
      await productService.deleteProduct(productId);
      loadProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto. Tente novamente.');
    }
  };

  // Enhance product images with AI
  const handleEnhanceProductImages = async (productId: string) => {
    try {
      setEnhancingProductId(productId);
      const response = await aiEnhancementAPI.enhanceProductImages(productId, {
        quality: 'standard',
        backgroundRemoval: false,
        autoOptimize: true
      });
      
      if (response.success && response.data) {
        alert(`Imagens aprimoradas com sucesso! ${response.data.summary.successCount} de ${response.data.summary.totalImages} imagens foram melhoradas.`);
        loadProducts(); // Reload to show updated images
      } else {
        throw new Error(response.error || 'Erro ao aprimorar imagens');
      }
    } catch (error) {
      console.error('Erro ao aprimorar imagens:', error);
      alert('Erro ao aprimorar imagens. Tente novamente.');
    } finally {
      setEnhancingProductId(null);
    }
  };

  // Helper function to convert URL to File - with CORS fallback
  const urlToFile = async (url: string, filename: string): Promise<File> => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const blob = await response.blob();
      return new File([blob], filename, { type: blob.type });
    } catch (error) {
      console.warn('Direct fetch failed:', error);
      throw error; // Re-throw to handle in calling function
    }
  };

  // Handle direct try-on for a specific model
  const handleDirectTryOn = async (product: Product, model: {id: string, name: string, imageUrl: string}) => {
    const modelKey = `${product.id}-${model.id}`;
    
    setTryOnStates(prev => ({
      ...prev,
      [modelKey]: { isProcessing: true, eventId: null, resultImage: null, error: null }
    }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Get the product image URL - use the first image (prefer processedUrl for better quality)
      const firstImage = product.images[0];
      if (!firstImage) {
        throw new Error('Produto não possui imagens');
      }

      // Try to get the best quality image URL
      const productImageUrl = firstImage.processedUrl || firstImage.originalUrl;
      
      // Convert relative URLs to absolute URLs
      const garmentUrl = productImageUrl.startsWith('http') || productImageUrl.startsWith('blob:')
        ? productImageUrl
        : imageApi.getImageUrl(productImageUrl);

      console.log('🎨 Product image details:', {
        productId: product.id,
        originalUrl: firstImage.originalUrl,
        processedUrl: firstImage.processedUrl,
        thumbnailUrl: firstImage.thumbnailUrl,
        selectedUrl: productImageUrl,
        finalGarmentUrl: garmentUrl
      });

      console.log('🎨 Initiating direct try-on with file uploads:', {
        personUrl: model.imageUrl,
        garmentUrl,
        productName: product.name,
        modelName: model.name,
        modelKey
      });

      // Try to download images and convert to files for upload
      console.log('🎨 Attempting to download images...');
      let response: Response;
      
      try {
        const [personFile, garmentFile] = await Promise.all([
          urlToFile(model.imageUrl, 'person-image.jpg'),
          urlToFile(garmentUrl, 'garment-image.jpg')
        ]);

        console.log('🎨 Files prepared successfully:', {
          personFile: { name: personFile.name, size: personFile.size, type: personFile.type },
          garmentFile: { name: garmentFile.name, size: garmentFile.size, type: garmentFile.type }
        });

        // Use file upload mode for try-on
        const formData = new FormData();
        formData.append('person', personFile);
        formData.append('garment', garmentFile);
        formData.append('mask_type', 'overall');

        response = await fetch(`${apiUrl}/tryon`, {
          method: 'POST',
          body: formData
        });
      } catch (downloadError) {
        console.log('🎨 File download failed (likely CORS), using URL mode:', downloadError);
        
        // Fallback to URL mode for CORS-protected images
        response = await fetch(`${apiUrl}/tryon/url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mask_type: 'overall',
            media_url: model.imageUrl,
            garment_url: garmentUrl
          })
        });
      }

      console.log('🎨 Try-on response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🎨 Try-on error response:', errorText);
        throw new Error(`Try-on request failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('🎨 Try-on response received:', responseData);
      
      const event_id = responseData.data?.event_id;
      
      if (!event_id) {
        throw new Error('No event_id received from API response');
      }
      
      setTryOnStates(prev => ({
        ...prev,
        [modelKey]: { ...prev[modelKey], eventId: event_id }
      }));

      // Poll for result
      await pollForDirectTryOnResult(event_id, modelKey);

    } catch (error) {
      console.error('🎨 Direct try-on error:', error);
      setTryOnStates(prev => ({
        ...prev,
        [modelKey]: {
          isProcessing: false,
          eventId: null,
          resultImage: null,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }));
    }
  };

  // Save try-on result image to product
  const saveResultImageToProduct = async (modelKey: string, resultImageUrl: string) => {
    try {
      const productId = modelKey.split('-')[0]; // Extract product ID from modelKey
      console.log('🎨 Saving try-on result as main product image:', {
        productId,
        modelKey,
        resultImageUrl
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      
      // Download the result image and convert to blob
      const imageResponse = await fetch(resultImageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to download result image');
      }
      
      const imageBlob = await imageResponse.blob();
      const imageFile = new File([imageBlob], 'try-on-result.jpg', { type: 'image/jpeg' });
      
      // Upload the image to the product
      const formData = new FormData();
      formData.append('images', imageFile);
      
      const uploadResponse = await fetch(`${apiUrl}/images/products/${productId}/images`, {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to save try-on result to product');
      }
      
      const uploadResult = await uploadResponse.json();
      console.log('🎨 Try-on result uploaded successfully:', uploadResult);
      
      // Get the uploaded image ID and make it the main image by reordering
      const uploadedImages = uploadResult.data || uploadResult.images || [];
      if (uploadedImages.length > 0) {
        const newImageId = uploadedImages[0].id;
        
        // Get current product to know all image IDs
        const productResponse = await fetch(`${apiUrl}/products/${productId}`);
        if (productResponse.ok) {
          const productData = await productResponse.json();
          const product = productData.data || productData;
          
          // Create new order with the try-on result as first image
          const allImageIds = product.images.map((img: any) => img.id);
          const newOrder = [newImageId, ...allImageIds.filter((id: string) => id !== newImageId)];
          
          // Reorder images to make the try-on result the main image
          const reorderResponse = await fetch(`${apiUrl}/images/products/${productId}/images/reorder`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ imageIds: newOrder })
          });
          
          if (reorderResponse.ok) {
            console.log('🎨 Try-on result set as main image successfully');
          } else {
            console.warn('🎨 Failed to set try-on result as main image');
          }
        }
      }
      
      // Refresh the products list to show the new main image
      await loadProducts();
      
    } catch (error) {
      console.error('🎨 Error saving try-on result to product:', error);
      // Don't show error to user as this is a background operation
    }
  };

  // Poll for direct try-on result
  const pollForDirectTryOnResult = async (eventId: string, modelKey: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        attempts++;
        console.log(`🎨 Polling attempt ${attempts}/${maxAttempts} for event_id: ${eventId}, modelKey: ${modelKey}`);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/tryon/${eventId}`);
        
        if (!response.ok) {
          throw new Error(`Polling failed: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('🎨 Poll response:', responseData);
        
        const result = responseData.data || responseData;
        
        if ((result.status === 'completed' || result.status === 'READY') && result.result_url) {
          console.log('🎨 Try-on completed successfully for:', modelKey);
          
          const resultImageUrl = result.media_urls?.[0] || result.result_url;
          
          setTryOnStates(prev => ({
            ...prev,
            [modelKey]: {
              isProcessing: false,
              eventId: eventId,
              resultImage: resultImageUrl,
              error: null
            }
          }));

          // Save the result image as the main product image
          await saveResultImageToProduct(modelKey, resultImageUrl);
          
          return;
        }

        if (result.status === 'failed') {
          throw new Error(result.error || 'Try-on processing failed');
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        } else {
          throw new Error('Try-on processing timed out');
        }

      } catch (error) {
        console.error('🎨 Polling error:', error);
        setTryOnStates(prev => ({
          ...prev,
          [modelKey]: {
            isProcessing: false,
            eventId: null,
            resultImage: null,
            error: error instanceof Error ? error.message : 'Polling failed'
          }
        }));
      }
    };

    setTimeout(poll, 5000);
  };

  // Effects
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  useEffect(() => {
    updateURL();
    loadProducts();
  }, [filters]);

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
            <p className="text-muted-foreground">
              Gerencie o catálogo de produtos do seu brechó
            </p>
          </div>
          <Button onClick={() => router.push('/produtos/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Produto
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produtos..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-8"
                />
              </div>

              {/* Category */}
              <Select
                value={filters.category || ''}
                onValueChange={(value) => handleFilterChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Status */}
              <Select
                value={filters.status || ''}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort By */}
              <Select
                value={filters.sortBy || 'createdAt'}
                onValueChange={(value) => handleFilterChange('sortBy', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Data de criação</SelectItem>
                  <SelectItem value="updatedAt">Última atualização</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="price">Preço</SelectItem>
                </SelectContent>
              </Select>

              {/* Sort Order */}
              <Select
                value={filters.sortOrder || 'desc'}
                onValueChange={(value) => handleFilterChange('sortOrder', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ordem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Decrescente</SelectItem>
                  <SelectItem value="asc">Crescente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Limpar Filtros
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {pagination.total} produto{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
                </span>
                <div className="flex border rounded-md">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-r-none"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="rounded-l-none"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modelos Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Modelos
              </div>
              <Button size="sm" variant="outline">
                <UserPlus className="mr-2 h-4 w-4" />
                Adicionar Pessoa
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              {models.map((model) => {
                const modelKey = `${tryOnProduct?.id}-${model.id}`;
                const tryOnState = tryOnStates[modelKey] || { isProcessing: false, eventId: null, resultImage: null, error: null };
                
                return (
                  <div 
                    key={model.id} 
                    className="relative rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all"
                  >
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                      {tryOnState.resultImage ? (
                        <img
                          src={tryOnState.resultImage.startsWith('http') 
                            ? tryOnState.resultImage 
                            : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '')}${tryOnState.resultImage}`
                          }
                          alt={`Try-on result for ${model.name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={model.imageUrl}
                          alt={model.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-sm font-medium text-center mb-2">{model.name}</p>
                      {tryOnProduct && tryOnProduct.images.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700"
                          onClick={() => handleDirectTryOn(tryOnProduct, model)}
                          disabled={tryOnState.isProcessing}
                        >
                          {tryOnState.isProcessing ? (
                            <>
                              <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Processando...
                            </>
                          ) : tryOnState.resultImage ? (
                            'Imagem Salva ✓'
                          ) : (
                            <>
                              <Shirt className="mr-1 h-3 w-3" />
                              Experimente
                            </>
                          )}
                        </Button>
                      )}
                      {tryOnState.error && (
                        <div className="mt-1">
                          <p className="text-xs text-red-500 text-center">Erro</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-1 text-red-600 border-red-300"
                            onClick={() => {
                              const modelKey = `${tryOnProduct?.id}-${model.id}`;
                              setTryOnStates(prev => ({
                                ...prev,
                                [modelKey]: { isProcessing: false, eventId: null, resultImage: null, error: null }
                              }));
                            }}
                          >
                            Tentar Novamente
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {tryOnProduct && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-800">
                  <Shirt className="inline h-4 w-4 mr-1" />
                  Produto selecionado: {tryOnProduct.name}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  Clique nos botões &quot;Experimente&quot; para experimentar este produto em cada modelo
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className={`grid gap-6 ${viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'}`}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-0 pb-4">
                  <Skeleton className="h-48 w-full rounded-md" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-6 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                <Grid className="mx-auto h-12 w-12 mb-4" />
                Nenhum produto encontrado
              </div>
              <Button onClick={() => router.push('/produtos/novo')}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeiro Produto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className={`grid gap-6 ${viewMode === 'grid' 
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'}`}
          >
            {products.map((product) => (
              <Card 
                key={product.id} 
                className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
                  tryOnProduct?.id === product.id ? 'ring-2 ring-purple-500 border-purple-300' : ''
                }`}
                onClick={() => setTryOnProduct(tryOnProduct?.id === product.id ? null : product)}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="relative aspect-[4/3] bg-gray-100">
                      {product.images[0] ? (
                        <img
                          src={(() => {
                            const imageUrl = product.images[0].thumbnailUrl.startsWith('http') || product.images[0].thumbnailUrl.startsWith('blob:')
                              ? product.images[0].thumbnailUrl 
                              : imageApi.getImageUrl(product.images[0].thumbnailUrl);
                            console.log('🖼️ Rendering product image:', {
                              productId: product.id,
                              productName: product.name,
                              originalUrl: product.images[0].thumbnailUrl,
                              finalUrl: imageUrl,
                              isFullUrl: product.images[0].thumbnailUrl.startsWith('http')
                            });
                            return imageUrl;
                          })()}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover"
                          onLoad={() => console.log('✅ Image loaded successfully for product:', product.id)}
                          onError={(e) => {
                            console.error('❌ Image failed to load for product:', {
                              productId: product.id,
                              productName: product.name,
                              imageUrl: e.currentTarget.src,
                              error: e
                            });
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <Grid className="h-8 w-8" />
                        </div>
                      )}
                      <Badge className={`absolute top-2 right-2 ${STATUS_COLORS[product.status]}`}>
                        {STATUS_LABELS[product.status]}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-medium line-clamp-2 mb-1">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {product.category} • {CONDITION_LABELS[product.condition]}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          R$ {Number(product.price).toFixed(2)}
                        </span>
                        <div className="flex gap-1">
                          {product.images.length > 0 && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEnhanceProductImages(product.id)}
                              disabled={enhancingProductId === product.id}
                              title="Aprimorar imagens com IA"
                            >
                              {enhancingProductId === product.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => setSelectedProduct(product)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{selectedProduct?.name}</DialogTitle>
                                <DialogDescription>
                                  Detalhes do produto
                                </DialogDescription>
                              </DialogHeader>
                              {selectedProduct && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    {selectedProduct.images[0] && (
                                      <div className="relative aspect-square bg-gray-100 rounded-md overflow-hidden">
                                        <img
                                          src={selectedProduct.images[0].processedUrl.startsWith('http') || selectedProduct.images[0].processedUrl.startsWith('blob:') ? selectedProduct.images[0].processedUrl : imageApi.getImageUrl(selectedProduct.images[0].processedUrl)}
                                          alt={selectedProduct.name}
                                          className="absolute inset-0 w-full h-full object-cover"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-medium mb-2">Descrição</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedProduct.description || 'Sem descrição'}
                                      </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="font-medium">Preço:</span>
                                        <p className="text-green-600 font-bold">R$ {selectedProduct.price.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium">Categoria:</span>
                                        <p>{selectedProduct.category}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium">Condição:</span>
                                        <p>{CONDITION_LABELS[selectedProduct.condition]}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium">Status:</span>
                                        <Badge className={STATUS_COLORS[selectedProduct.status]}>
                                          {STATUS_LABELS[selectedProduct.status]}
                                        </Badge>
                                      </div>
                                      {selectedProduct.brand && (
                                        <div>
                                          <span className="font-medium">Marca:</span>
                                          <p>{selectedProduct.brand}</p>
                                        </div>
                                      )}
                                      {selectedProduct.size && (
                                        <div>
                                          <span className="font-medium">Tamanho:</span>
                                          <p>{selectedProduct.size}</p>
                                        </div>
                                      )}
                                      {selectedProduct.color && (
                                        <div>
                                          <span className="font-medium">Cor:</span>
                                          <p>{selectedProduct.color}</p>
                                        </div>
                                      )}
                                      {selectedProduct.sku && (
                                        <div>
                                          <span className="font-medium">SKU:</span>
                                          <p>{selectedProduct.sku}</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="outline" onClick={() => router.push(`/produtos/${product.id}/editar`)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDeleteProduct(product.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <div className="flex gap-4 p-4">
                    <div className="relative w-24 h-24 bg-gray-100 rounded-md flex-shrink-0">
                      {product.images[0] ? (
                        <img
                          src={product.images[0].thumbnailUrl.startsWith('http') || product.images[0].thumbnailUrl.startsWith('blob:') ? product.images[0].thumbnailUrl : imageApi.getImageUrl(product.images[0].thumbnailUrl)}
                          alt={product.name}
                          className="absolute inset-0 w-full h-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <Grid className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium truncate">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {product.category} • {CONDITION_LABELS[product.condition]}
                            {product.brand && ` • ${product.brand}`}
                          </p>
                          {product.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {product.description}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-4 ml-4">
                          <Badge className={STATUS_COLORS[product.status]}>
                            {STATUS_LABELS[product.status]}
                          </Badge>
                          <span className="text-lg font-bold text-green-600">
                            R$ {Number(product.price).toFixed(2)}
                          </span>
                          <div className="flex gap-1">
                            {product.images.length > 0 && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleEnhanceProductImages(product.id)}
                                disabled={enhancingProductId === product.id}
                                title="Aprimorar imagens com IA"
                              >
                                {enhancingProductId === product.id ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                ) : (
                                  <Sparkles className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedProduct(product)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                            </Dialog>
                            <Button size="sm" variant="outline" onClick={() => router.push(`/produtos/${product.id}/editar`)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteProduct(product.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => handleFilterChange('page', Math.max(1, pagination.page - 1))}
              disabled={pagination.page <= 1}
            >
              Anterior
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i;
                if (pageNum > pagination.totalPages) return null;
                
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('page', pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              onClick={() => handleFilterChange('page', Math.min(pagination.totalPages, pagination.page + 1))}
              disabled={pagination.page >= pagination.totalPages}
            >
              Próxima
            </Button>
          </div>
        )}

        {/* Try-On Dialog */}
        <Dialog open={showTryOnDialog} onOpenChange={setShowTryOnDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Experimente - Prova Virtual</DialogTitle>
              <DialogDescription>
                Experimente {tryOnProduct?.name} no modelo {models.find(m => m.id === selectedModel)?.name}
              </DialogDescription>
            </DialogHeader>
            {tryOnProduct && selectedModel && (
              <TryOnComponent
                product={tryOnProduct}
                model={models.find(m => m.id === selectedModel)!}
                onClose={() => setShowTryOnDialog(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProductsPageContent />
    </Suspense>
  );
}