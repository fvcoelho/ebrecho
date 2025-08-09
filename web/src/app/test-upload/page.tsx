'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { ImageUpload } from '@/components/products/image-upload';
import { imageApi, type ProductImage } from '@/lib/api/images';

export default function TestUploadPage() {
  const router = useRouter();
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  // Debug logging initialization
  console.log('🔧 TestUploadPage initialized with debug logging enabled');

  const handleImageUpload = async (files: File[]): Promise<ProductImage[]> => {
    console.log('🔍 TestUploadPage.handleImageUpload called:', {
      filesCount: files.length,
      currentProductImagesCount: productImages.length,
      currentUploadedFilesCount: uploadedFiles.length,
      fileNames: files.map(f => f.name)
    });

    // For test page, we'll create temporary images with preview URLs
    console.log('🆕 Creating temporary images for test upload');
    
    // Store files for potential future upload
    const newFiles = [...uploadedFiles, ...files];
    setUploadedFiles(newFiles);
    console.log('💾 Updated uploadedFiles:', { newCount: newFiles.length });
    
    const tempImages = files.map((file, index) => {
      const objectUrl = URL.createObjectURL(file);
      const tempImage = {
        id: `temp-${Date.now()}-${index}`,
        productId: 'test',
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
  };

  const handleImageDelete = async (imageId: string): Promise<void> => {
    console.log('🗑️ TestUploadPage.handleImageDelete called:', {
      imageId,
      isTemp: imageId.startsWith('temp-'),
      currentProductImagesCount: productImages.length,
      currentUploadedFilesCount: uploadedFiles.length
    });

    if (imageId.startsWith('temp-')) {
      console.log('🆕 Deleting temp image from local state');
      // Remove from local state and files array
      const imageIndex = productImages.findIndex(img => img.id === imageId);
      console.log('🔍 Found image at index:', imageIndex);
      
      if (imageIndex !== -1) {
        // Clean up the object URL
        const image = productImages[imageIndex];
        if (image.originalUrl.startsWith('blob:')) {
          URL.revokeObjectURL(image.originalUrl);
        }
        
        const newUploadedFiles = uploadedFiles.filter((_, index) => index !== imageIndex);
        setUploadedFiles(newUploadedFiles);
        console.log('💾 Updated uploadedFiles after delete:', { newCount: newUploadedFiles.length });
      }
      return;
    }
    
    console.log('📤 Would delete from server if this was a real product:', imageId);
  };

  const handleImageReorder = async (images: ProductImage[]): Promise<void> => {
    console.log('🔄 TestUploadPage.handleImageReorder called:', {
      imagesCount: images.length,
      imageOrders: images.map(img => ({ id: img.id, order: img.order }))
    });

    console.log('🆕 Reordering temp images (local state only)');
    // Just update local state for test page
    return;
  };

  const handleTestUpload = async () => {
    if (uploadedFiles.length === 0) {
      alert('Nenhum arquivo selecionado para upload');
      return;
    }

    console.log('🚀 Starting test upload for files:', uploadedFiles.map(f => f.name));

    const results: any[] = [];
    const errors: string[] = [];

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      
      try {
        console.log(`📤 Uploading file ${i + 1}/${uploadedFiles.length}:`, file.name);
        
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/test-upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        console.log(`✅ Upload successful for ${file.name}:`, data);
        results.push({ file: file.name, success: true, data });
      } catch (err) {
        console.error(`❌ Upload failed for ${file.name}:`, err);
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        errors.push(`${file.name}: ${errorMessage}`);
        results.push({ file: file.name, success: false, error: errorMessage });
      }
    }

    // Show results
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    let message = `Upload concluído!\n`;
    message += `✅ Sucesso: ${successCount} arquivo(s)\n`;
    if (failureCount > 0) {
      message += `❌ Falha: ${failureCount} arquivo(s)\n\nErros:\n`;
      message += errors.join('\n');
    }
    
    alert(message);
    
    // Log detailed results
    console.log('📊 Upload results:', { results, successCount, failureCount });
  };

  const handleReset = () => {
    console.log('🧹 Resetting test upload page');
    
    // Clean up object URLs
    productImages.forEach(image => {
      if (image.originalUrl.startsWith('blob:')) {
        URL.revokeObjectURL(image.originalUrl);
      }
    });
    
    setProductImages([]);
    setUploadedFiles([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.push('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Test Image Upload</h1>
              <p className="text-muted-foreground">
                Teste de upload de imagens usando o componente ImageUpload
              </p>
            </div>
          </div>

          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle>Upload de Imagens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Upload Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Imagens de Teste</h3>
                    <p className="text-sm text-muted-foreground">
                      Adicione até 10 imagens para testar o upload. Use o botão "Fazer Upload Real" para enviar para o servidor.
                    </p>
                  </div>
                </div>
                
                <ImageUpload
                  productId={undefined} // No product ID for test
                  images={productImages}
                  onImagesChange={(newImages) => {
                    console.log('🖼️ Test Upload onImagesChange called:', {
                      newImagesCount: newImages.length,
                      previousCount: productImages.length,
                      newImageIds: newImages.map(img => ({ id: img.id, order: img.order }))
                    });
                    setProductImages(newImages);
                  }}
                  onUpload={handleImageUpload}
                  onDelete={handleImageDelete}
                  onReorder={handleImageReorder}
                  maxImages={10}
                />
              </div>

              {/* Test Actions */}
              <div className="flex gap-4 pt-4 border-t">
                <Button
                  onClick={handleTestUpload}
                  disabled={uploadedFiles.length === 0}
                  className="flex-1"
                >
                  Fazer Upload Real ({uploadedFiles.length} arquivo(s))
                </Button>
                
                {(productImages.length > 0 || uploadedFiles.length > 0) && (
                  <Button variant="outline" onClick={handleReset}>
                    Limpar Tudo
                  </Button>
                )}
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-sm font-medium text-blue-800 mb-2">Como funciona:</h3>
                <div className="text-xs text-blue-700 space-y-1">
                  <p>1. <strong>Adicionar Imagens:</strong> Use o componente ImageUpload para selecionar imagens</p>
                  <p>2. <strong>Preview:</strong> As imagens aparecerão como preview (temporárias)</p>
                  <p>3. <strong>Upload Real:</strong> Clique em "Fazer Upload Real" para enviar ao servidor via /api/test-upload</p>
                  <p>4. <strong>Gerenciar:</strong> Você pode reordenar, deletar e adicionar mais imagens</p>
                </div>
              </div>

              {/* API Info */}
              <div className="mt-6 p-4 bg-gray-100 rounded-md">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Informações da API:</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>Endpoint:</strong> POST /api/test-upload</p>
                  <p><strong>Campo:</strong> file</p>
                  <p><strong>Tipos Aceitos:</strong> image/*</p>
                  <p><strong>Tamanho Máximo:</strong> 10MB por arquivo</p>
                  <p><strong>Componente:</strong> ImageUpload (mesmo usado em produtos)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}