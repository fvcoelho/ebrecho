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
} from '@/components/ui';
import { DashboardLayout } from '@/components/dashboard';
import { productService, type CreateProductData, type Product } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { ImageUpload } from '@/components/products/image-upload';
import { imageApi, type ProductImage } from '@/lib/api/images';

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

const CATEGORY_OPTIONS = [
  'Roupas',
  'Calças',
  'Camisetas',
  'Vestidos',
  'Jaquetas',
  'Acessórios',
  'Bolsas',
  'Sapatos',
  'Joias',
  'Livros',
  'Eletrônicos',
  'Casa & Decoração',
  'Esportes',
  'Infantil',
  'Outros'
];

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);

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

  const onSubmit = async (data: ProductFormData) => {
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

  const handleImageUpload = async (files: File[]): Promise<ProductImage[]> => {
    const uploadedImages = await imageApi.uploadImages(productId, files);
    
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
                          <Input placeholder="Ex: CAM-001" {...field} />
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
                          <Input placeholder="Ex: Nike, Zara..." {...field} />
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
                  
                  <ImageUpload
                    productId={productId}
                    images={productImages}
                    onImagesChange={setProductImages}
                    onUpload={handleImageUpload}
                    onDelete={handleImageDelete}
                    onReorder={handleImageReorder}
                    maxImages={10}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
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
                        Salvar Alterações
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