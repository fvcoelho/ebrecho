'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Combobox,
} from '@/components/ui';
import { DashboardLayout } from '@/components/dashboard';
import { productService, type CreateProductData, type Product, type ValidationSuggestion } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { BlobImageUpload } from '@/components/products/blob-image-upload';
import { imageApi, type ProductImage } from '@/lib/api/images';
import { CATEGORY_OPTIONS } from '@/lib/constants/categories';
import { BRAND_OPTIONS } from '@/lib/constants/brands';
import { GeminiSuggestionsDialog } from '@/components/products/gemini-suggestions-dialog';

const productFormSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  description: z.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  price: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Preço deve ser um número válido (ex: 29.90)')
    .refine((val) => parseFloat(val) > 0, 'Preço deve ser maior que zero'),
  sku: z.string()
    .max(50, 'SKU deve ter no máximo 50 caracteres')
    .optional(),
  category: z.string()
    .min(1, 'Categoria é obrigatória'),
  brand: z.string()
    .max(50, 'Marca deve ter no máximo 50 caracteres')
    .optional(),
  size: z.string()
    .max(20, 'Tamanho deve ter no máximo 20 caracteres')
    .optional(),
  color: z.string()
    .max(30, 'Cor deve ter no máximo 30 caracteres')
    .optional(),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR'], {
    errorMap: () => ({ message: 'Condição é obrigatória' })
  }),
  status: z.enum(['AVAILABLE', 'SOLD', 'RESERVED', 'INACTIVE'], {
    errorMap: () => ({ message: 'Status é obrigatório' })
  }).optional()
});

type ProductFormData = z.infer<typeof productFormSchema>;

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'Novo' },
  { value: 'LIKE_NEW', label: 'Seminovo' },
  { value: 'GOOD', label: 'Bom Estado' },
  { value: 'FAIR', label: 'Estado Regular' }
];

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'SOLD', label: 'Vendido' },
  { value: 'RESERVED', label: 'Reservado' },
  { value: 'INACTIVE', label: 'Inativo' }
];


export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ValidationSuggestion[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [imageError, setImageError] = useState(false);

  const productId = params.id as string;

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      sku: '',
      category: '',
      brand: '',
      size: '',
      color: '',
      condition: 'LIKE_NEW',
      status: 'AVAILABLE'
    }
  });

  // Load product data
  const loadProduct = async () => {
    try {
      setInitialLoading(true);
      const productData = await productService.getProductById(productId);
      setProduct(productData);
      
      // Load product images
      if (productData.images && productData.images.length > 0) {
        const formattedImages: ProductImage[] = productData.images.map((img: any) => ({
          id: img.id,
          productId: productData.id,
          originalUrl: imageApi.getImageUrl(img.originalUrl),
          processedUrl: imageApi.getImageUrl(img.processedUrl),
          thumbnailUrl: imageApi.getImageUrl(img.thumbnailUrl),
          order: img.order,
          createdAt: img.createdAt
        }));
        setProductImages(formattedImages);
      }
      
      // Update form with product data
      form.reset({
        name: productData.name,
        description: productData.description || '',
        price: productData.price.toString(),
        sku: productData.sku || '',
        category: productData.category,
        brand: productData.brand || '',
        size: productData.size || '',
        color: productData.color || '',
        condition: productData.condition,
        status: productData.status
      });
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert('Erro ao carregar produto. Tente novamente.');
      router.push('/produtos');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAIValidation = async (data: ProductFormData) => {
    try {
      setValidating(true);
      console.log('🤖 Starting AI validation for edit...');
      
      const validationResult = await productService.validateWithAI({
        name: data.name,
        description: data.description
      });
      
      console.log('✅ AI validation completed:', validationResult);
      
      if (validationResult.hasSuggestions && validationResult.suggestions.length > 0) {
        setSuggestions(validationResult.suggestions);
        setShowSuggestions(true);
        return false; // Don't proceed with product update yet
      } else {
        // No suggestions, proceed directly with product update
        return true;
      }
    } catch (error) {
      console.error('❌ Error in AI validation:', error);
      // Continue with product update even if validation fails
      return true;
    } finally {
      setValidating(false);
    }
  };

  const handleAcceptSuggestions = (acceptedSuggestions: ValidationSuggestion[]) => {
    console.log('✅ Applying accepted suggestions:', acceptedSuggestions);
    
    // Apply suggestions to form
    const currentValues = form.getValues();
    const updatedValues = { ...currentValues };
    
    acceptedSuggestions.forEach(suggestion => {
      if (suggestion.field === 'name') {
        updatedValues.name = suggestion.suggested;
        form.setValue('name', suggestion.suggested);
      } else if (suggestion.field === 'description') {
        updatedValues.description = suggestion.suggested;
        form.setValue('description', suggestion.suggested);
      }
    });
    
    setShowSuggestions(false);
    // Now proceed with product update
    updateProduct(updatedValues);
  };

  const updateProduct = async (data: ProductFormData) => {
    try {
      setLoading(true);
      
      const productData: Partial<CreateProductData> = {
        ...data,
        price: data.price // API expects string for price validation
      };

      await productService.updateProduct(productId, productData);
      
      router.push('/produtos');
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      // Validate that at least one image is uploaded
      if (productImages.length === 0) {
        setImageError(true);
        alert('Por favor, adicione pelo menos uma imagem do produto.');
        return;
      }
      
      setImageError(false);
      setLoading(true);
      
      console.log('🔍 Starting form submission with AI validation...');
      
      // First, validate with AI
      const shouldProceed = await handleAIValidation(data);
      
      if (shouldProceed) {
        // No suggestions or user wants to proceed, update product directly
        await updateProduct(data);
      }
      // If shouldProceed is false, the suggestions dialog will be shown
      // and the user can accept suggestions which will trigger updateProduct
      
    } catch (error) {
      console.error('❌ Error in form submission:', error);
      alert('Erro ao processar formulário. Tente novamente.');
    } finally {
      if (!showSuggestions) {
        // Only set loading to false if we're not showing suggestions dialog
        setLoading(false);
      }
    }
  };

  const handleImageUpload = async (files: File[]): Promise<ProductImage[]> => {
    const uploadedImages = await imageApi.uploadImages(productId, files);
    
    // Clear image error when images are uploaded
    setImageError(false);
    
    // Convert relative URLs to full URLs
    return uploadedImages.map(img => ({
      ...img,
      originalUrl: imageApi.getImageUrl(img.originalUrl),
      processedUrl: imageApi.getImageUrl(img.processedUrl),
      thumbnailUrl: imageApi.getImageUrl(img.thumbnailUrl)
    }));
  };

  const handleImageDelete = async (imageId: string): Promise<void> => {
    await imageApi.deleteImage(productId, imageId);
  };

  const handleImageReorder = async (images: ProductImage[]): Promise<void> => {
    await imageApi.reorderImages(productId, images);
  };

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  if (initialLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-20" />
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Produto</h1>
            <p className="text-muted-foreground">
              {product?.name}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Produto</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Produto *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Camiseta Vintage Rock Band" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CATEGORY_OPTIONS.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <textarea
                          className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Descreva o produto, suas características, estado de conservação..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Price and SKU */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                              R$
                            </span>
                            <Input
                              placeholder="29.90"
                              className="pl-8"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input readOnly placeholder="Ex: CAM-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="brand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marca</FormLabel>
                        <FormControl>
                          <Combobox
                            options={BRAND_OPTIONS}
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            placeholder="Selecione ou digite uma marca"
                            searchPlaceholder="Buscar marca..."
                            emptyMessage="Nenhuma marca encontrada."
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tamanho</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: M, 42, Único..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cor</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Azul, Floral..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Condition and Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condição *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a condição" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CONDITION_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'AVAILABLE'}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Imagens do Produto</h3>
                      <p className="text-sm text-muted-foreground">
                        Gerencie as imagens do produto. Arraste para reordenar.
                      </p>
                    </div>
                  </div>
                  
                  <BlobImageUpload
                    productId={productId}
                    existingImages={productImages}
                    onImagesChange={(images) => {
                      setProductImages(images);
                      // Clear image error when images are added/removed
                      if (images.length > 0) {
                        setImageError(false);
                      }
                    }}
                    onUploadComplete={(uploadedImages) => {
                      console.log('✅ Upload completed in EditProductPage:', uploadedImages);
                      setProductImages(prev => [...prev, ...uploadedImages]);
                      setImageError(false);
                    }}
                    maxImages={10}
                  />
                  
                  {imageError && (
                    <div className="rounded-md bg-red-50 p-4 border border-red-200">
                      <div className="flex">
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">
                            Imagem obrigatória
                          </h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>Por favor, adicione pelo menos uma imagem do produto antes de continuar.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading || validating}>
                    {validating ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                        Validando...
                      </>
                    ) : loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* AI Suggestions Dialog */}
        <GeminiSuggestionsDialog
          open={showSuggestions}
          onClose={() => {
            setShowSuggestions(false);
            setLoading(false);
          }}
          suggestions={suggestions}
          onAcceptSuggestions={handleAcceptSuggestions}
        />
      </div>
    </DashboardLayout>
  );
}