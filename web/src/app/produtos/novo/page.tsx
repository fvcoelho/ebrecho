'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { DashboardLayout } from '@/components/dashboard';
import { productService, type CreateProductData } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { BlobImageUpload } from '@/components/products/blob-image-upload';
import { imageApi, type ProductImage } from '@/lib/api/images';
import { productRefreshManager } from '@/lib/product-refresh';
import { BRAND_OPTIONS } from '@/lib/constants/brands';
import { CATEGORY_OPTIONS } from '@/lib/constants/categories';

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


export default function NewProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [createdProductId, setCreatedProductId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isReorganizationComplete, setIsReorganizationComplete] = useState(false);

  // Debug logging initialization
  console.log('🔧 NewProductPage initialized with debug logging enabled. Look for these emojis in console:', {
    '🔍': 'Function calls and parameters',
    '📷': 'Image operations',
    '🔄': 'State updates',
    '✅': 'Successful operations',
    '❌': 'Errors',
    '⚠️': 'Warnings',
    '🎨': 'AI/temporary operations',
    '📤': 'Uploads',
    '🗑️': 'Deletions'
  });

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

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);
      
      console.log('🔍 Submitting product form:', {
        formData: data,
        hasImages: productImages.length > 0,
        imageCount: productImages.length,
        uploadedFilesCount: uploadedFiles.length,
        currentProductId: createdProductId,
        productImagesDetails: productImages.map(img => ({
          id: img.id,
          hasOriginalUrl: !!img.originalUrl,
          hasThumbnailUrl: !!img.thumbnailUrl,
          isTemp: img.originalUrl?.includes('/temp-') || false
        }))
      });
      
      const productData: CreateProductData = {
        ...data,
        price: data.price // API expects string for price validation
      };

      console.log('📤 Creating product with data:', productData);
      console.log('📊 Current state before product creation:', {
        uploadedImages: productImages.length,
        uploadedFiles: uploadedFiles.length,
        tempImages: productImages.filter(img => img.originalUrl?.includes('/temp-')).length,
        finalImages: productImages.filter(img => !img.originalUrl?.includes('/temp-')).length
      });
      
      // Create product first
      const product = await productService.createProduct(productData);
      const productId = product.id;
      setCreatedProductId(productId);
      
      console.log('✅ Product created successfully:', {
        productId,
        product
      });
      
      // The BlobImageUpload component will automatically handle temp image reorganization
      // when it detects that productId has changed from undefined to a real value
      console.log('🔄 Product created, BlobImageUpload will auto-reorganize any temp images');
      
      // Handle legacy uploadedFiles if any (backup system)
      if (uploadedFiles.length > 0) {
        try {
          await imageApi.uploadImages(productId, uploadedFiles);
        } catch (uploadError) {
          console.error('Erro ao fazer upload das imagens legadas:', uploadError);
        }
      }
      
      // Wait for image reorganization if there are uploaded images
      if (productImages.length > 0) {
        console.log('🔄 Waiting for image reorganization to complete before navigation...');
        setIsReorganizationComplete(false);
        
        // Wait for reorganization with a timeout
        const waitForReorganization = async () => {
          return new Promise<void>((resolve) => {
            let timeoutReached = false;
            
            // Set a maximum wait time of 10 seconds
            const timeout = setTimeout(() => {
              timeoutReached = true;
              console.log('⏰ Timeout reached, proceeding with navigation');
              resolve();
            }, 10000);
            
            // Check periodically if reorganization is complete
            const checkInterval = setInterval(() => {
              if (isReorganizationComplete && !timeoutReached) {
                clearTimeout(timeout);
                clearInterval(checkInterval);
                console.log('✅ Image reorganization completed, proceeding with navigation');
                resolve();
              }
            }, 500);
          });
        };
        
        await waitForReorganization();
      }
      
      // Trigger products list refresh
      productRefreshManager.refresh();
      
      // Add small delay to allow refresh to propagate
      setTimeout(() => {
        router.push('/produtos');
      }, 500);
    } catch (error: any) {
      console.error('Erro ao criar produto:', error);
      
      // Extract error message from axios response
      let errorMessage = 'Erro ao criar produto. Tente novamente.';
      
      console.error('❌ Product creation error details:', {
        status: error.response?.status,
        data: error.response?.data,
        error: error.response?.data?.error
      });
      
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        
        // Provide more specific messages for common fields
        if (errorMessage.includes('sku')) {
          errorMessage = 'Este SKU já está em uso. Por favor, escolha outro código SKU.';
        } else if (errorMessage.includes('slug')) {
          errorMessage = 'Já existe um produto com nome similar. Por favor, altere o nome do produto.';
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 409) {
        errorMessage = 'Já existe um produto com essas informações. Verifique se o SKU ou nome já está em uso.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (files: File[]): Promise<ProductImage[]> => {
    console.log('🔍 NewProductPage.handleImageUpload called:', {
      filesCount: files.length,
      createdProductId,
      currentProductImagesCount: productImages.length,
      currentUploadedFilesCount: uploadedFiles.length,
      fileNames: files.map(f => f.name)
    });

    if (!createdProductId) {
      console.log('🆕 Creating temporary images for new product');
      // For new products, store files and create preview
      const newFiles = [...uploadedFiles, ...files];
      setUploadedFiles(newFiles);
      console.log('💾 Updated uploadedFiles:', { newCount: newFiles.length });
      
      const tempImages = files.map((file, index) => {
        const objectUrl = URL.createObjectURL(file);
        const tempImage = {
          id: `temp-${Date.now()}-${index}`,
          productId: '',
          originalUrl: objectUrl,
          processedUrl: objectUrl,
          thumbnailUrl: objectUrl,
          order: productImages.length + index,
          createdAt: new Date().toISOString()
        };
        console.log('🆕 Created temp image:', { id: tempImage.id, order: tempImage.order, url: objectUrl });
        return tempImage;
      });
      
      console.log('✅ Returning temp images:', { count: tempImages.length });
      return tempImages;
    }
    
    console.log('📤 Uploading to existing product:', createdProductId);
    // Upload to existing product
    const result = await imageApi.uploadImages(createdProductId, files);
    console.log('✅ Upload to existing product completed:', { uploadedCount: result.length });
    return result;
  };

  const handleImageDelete = async (imageId: string): Promise<void> => {
    console.log('🗑️ NewProductPage.handleImageDelete called:', {
      imageId,
      createdProductId,
      isTemp: imageId.startsWith('temp-'),
      currentProductImagesCount: productImages.length,
      currentUploadedFilesCount: uploadedFiles.length
    });

    if (!createdProductId || imageId.startsWith('temp-')) {
      console.log('🆕 Deleting temp image from local state');
      // Remove from local state and files array for new products
      const imageIndex = productImages.findIndex(img => img.id === imageId);
      console.log('🔍 Found image at index:', imageIndex);
      
      if (imageIndex !== -1) {
        const newUploadedFiles = uploadedFiles.filter((_, index) => index !== imageIndex);
        setUploadedFiles(newUploadedFiles);
        console.log('💾 Updated uploadedFiles after delete:', { newCount: newUploadedFiles.length });
      }
      return;
    }
    
    console.log('📤 Deleting image from server:', { createdProductId, imageId });
    await imageApi.deleteImage(createdProductId, imageId);
    console.log('✅ Server delete completed');
  };

  const handleImageReorder = async (images: ProductImage[]): Promise<void> => {
    console.log('🔄 NewProductPage.handleImageReorder called:', {
      createdProductId,
      imagesCount: images.length,
      imageOrders: images.map(img => ({ id: img.id, order: img.order }))
    });

    if (!createdProductId) {
      console.log('🆕 Reordering temp images (local state only)');
      // Just update local state for new products
      return;
    }
    
    console.log('📤 Reordering images on server:', createdProductId);
    await imageApi.reorderImages(createdProductId, images);
    console.log('✅ Server reorder completed');
  };

  // Redirect if not authenticated
  if (!user) {
    return null;
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
            <h1 className="text-3xl font-bold tracking-tight">Novo Produto</h1>
            <p className="text-muted-foreground">
              Adicione um novo produto ao seu catálogo
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Informações Básicas</h3>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                </div>

                <Separator />

                {/* Description */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Descrição</h3>
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o produto, suas características, estado de conservação..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>

                <Separator />

                {/* Pricing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Preço e Identificação</h3>
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
                          <Input placeholder="Ex: CAM-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  </div>
                </div>

                <Separator />

                {/* Product Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Detalhes do Produto</h3>
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
                </div>

                <Separator />

                {/* Status */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Status e Condição</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="condition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condição *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value || 'AVAILABLE'}>
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
                </div>

                <Separator />

                {/* Image Upload */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Imagens do Produto</h3>
                      <p className="text-sm text-muted-foreground">
                        Adicione até 10 imagens do produto. A primeira imagem será a principal.
                      </p>
                    </div>
                  </div>
                  
                  <BlobImageUpload
                    productId={createdProductId || undefined}
                    existingImages={productImages}
                    onImagesChange={(newImages) => {
                      console.log('🖼️ Blob Upload onImagesChange called:', {
                        newImagesCount: newImages.length,
                        previousCount: productImages.length
                      });
                      setProductImages(newImages);
                    }}
                    onUploadComplete={(uploadedImages) => {
                      console.log('✅ Upload completed in NewProductPage:', uploadedImages);
                      setProductImages(prev => [...prev, ...uploadedImages]);
                    }}
                    onReorganizationComplete={() => {
                      console.log('🎉 Image reorganization completed in NewProductPage');
                      setIsReorganizationComplete(true);
                    }}
                    maxImages={10}
                    disabled={false}
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Produto
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}