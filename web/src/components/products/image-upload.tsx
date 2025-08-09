'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, X, Eye, Move } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { imageApi, type ProductImage } from '@/lib/api/images'

interface ImageUploadProps {
  productId?: string
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
  maxImages?: number
  onUpload?: (files: File[]) => Promise<ProductImage[]>
  onDelete?: (imageId: string) => Promise<void>
  onReorder?: (images: ProductImage[]) => Promise<void>
}

export function ImageUpload({
  productId,
  images,
  onImagesChange,
  maxImages = 10,
  onUpload,
  onDelete,
  onReorder
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length > 0) {
      await handleFileUpload(files)
    }
  }, [])

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      await handleFileUpload(files)
    }
  }, [])

  const handleFileUpload = async (files: File[]) => {
    console.log('🔍 ImageUpload.handleFileUpload called:', {
      filesCount: files.length,
      currentImagesCount: images.length,
      maxImages,
      productId,
      hasOnUpload: !!onUpload,
      fileNames: files.map(f => f.name),
      fileSizes: files.map(f => f.size)
    });

    if (images.length + files.length > maxImages) {
      console.warn('⚠️ Too many images:', {
        current: images.length,
        trying: files.length,
        max: maxImages
      });
      alert(`Máximo de ${maxImages} imagens permitidas`)
      return
    }

    setIsUploading(true)
    
    try {
      // Create preview images for immediate visual feedback
      const previews = files.map(file => {
        const url = URL.createObjectURL(file);
        console.log('📷 Created preview URL:', { fileName: file.name, url });
        return url;
      });
      setPreviewImages(prev => {
        const newPreviews = [...prev, ...previews];
        console.log('🖼️ Updated preview images:', { count: newPreviews.length });
        return newPreviews;
      });

      if (onUpload) {
        console.log('📤 Uploading to server (productId:', productId, ')');
        // Upload to server
        const uploadedImages = await onUpload(files)
        console.log('✅ Upload completed:', {
          uploadedCount: uploadedImages.length,
          uploadedImages: uploadedImages.map(img => ({ id: img.id, order: img.order }))
        });
        
        const newImagesList = [...images, ...uploadedImages];
        console.log('🔄 Updating images state:', {
          previousCount: images.length,
          newCount: newImagesList.length,
          totalImages: newImagesList.map(img => ({ id: img.id, order: img.order }))
        });
        onImagesChange(newImagesList)
      } else {
        console.log('💾 Creating local preview (no productId or onUpload)');
        // Local preview only (for new products)
        const localImages: ProductImage[] = files.map((file, index) => {
          const objectUrl = URL.createObjectURL(file);
          const tempImage = {
            id: `temp-${Date.now()}-${index}`,
            productId: productId || '',
            originalUrl: objectUrl,
            processedUrl: objectUrl,
            thumbnailUrl: objectUrl,
            order: images.length + index,
            createdAt: new Date().toISOString()
          };
          console.log('🆕 Created local image:', { id: tempImage.id, order: tempImage.order, url: objectUrl });
          return tempImage;
        });
        
        const newImagesList = [...images, ...localImages];
        console.log('🔄 Updating local images state:', {
          previousCount: images.length,
          newCount: newImagesList.length,
          localImages: localImages.map(img => ({ id: img.id, order: img.order }))
        });
        onImagesChange(newImagesList)
      }
    } catch (error) {
      console.error('❌ Error uploading images:', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        filesCount: files.length,
        productId
      })
      alert('Erro ao fazer upload das imagens')
    } finally {
      console.log('🏁 Upload process finished, cleaning up previews');
      setIsUploading(false)
      setPreviewImages([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    console.log('🗑️ Deleting image:', { imageId, isTemp: imageId.startsWith('temp-'), hasOnDelete: !!onDelete });
    
    if (onDelete && !imageId.startsWith('temp-')) {
      try {
        console.log('📤 Calling server delete for image:', imageId);
        await onDelete(imageId)
        console.log('✅ Server delete completed for image:', imageId);
      } catch (error) {
        console.error('❌ Error deleting image from server:', { imageId, error })
        alert('Erro ao deletar imagem')
        return
      }
    }
    
    const updatedImages = images.filter(img => img.id !== imageId)
    console.log('🔄 Updated images after delete:', {
      deletedImageId: imageId,
      previousCount: images.length,
      newCount: updatedImages.length,
      remainingImages: updatedImages.map(img => ({ id: img.id, order: img.order }))
    });
    onImagesChange(updatedImages)
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOverImage = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDropImage = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      return
    }

    const reorderedImages = [...images]
    const draggedImage = reorderedImages[draggedIndex]
    
    // Remove dragged item
    reorderedImages.splice(draggedIndex, 1)
    
    // Insert at new position
    reorderedImages.splice(dropIndex, 0, draggedImage)
    
    // Update order property
    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      order: index
    }))

    onImagesChange(updatedImages)
    setDraggedIndex(null)

    // Save to server if available
    if (onReorder && !updatedImages.some(img => img.id.startsWith('temp-'))) {
      onReorder(updatedImages).catch(error => {
        console.error('Error reordering images:', error)
      })
    }
  }

  const canAddMore = images.length < maxImages

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {canAddMore && (
        <Card>
          <CardContent className="p-6">
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                isDragOver ? "border-primary bg-primary/5" : "border-gray-300",
                isUploading && "opacity-50 pointer-events-none"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isUploading ? 'Fazendo upload...' : 'Arraste imagens aqui'}
                </p>
                <p className="text-sm text-gray-500">
                  ou{' '}
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto font-medium"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    clique para selecionar
                  </Button>
                </p>
                <p className="text-xs text-gray-400">
                  PNG, JPG, WebP até 5MB • Máximo {maxImages} imagens
                </p>
                <p className="text-xs text-gray-400">
                  {images.length}/{maxImages} imagens adicionadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Images Grid */}
      {(images.length > 0 || previewImages.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {/* Uploaded Images */}
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOverImage(e, index)}
              onDrop={(e) => handleDropImage(e, index)}
            >
              <Card className="overflow-hidden">
                <div className="relative aspect-square">
                  <img
                    src={image.thumbnailUrl.startsWith('http') || image.thumbnailUrl.startsWith('blob:') ? image.thumbnailUrl : imageApi.getImageUrl(image.thumbnailUrl)}
                    alt={`Produto ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {/* Primary badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                      Principal
                    </div>
                  )}
                  
                  {/* Drag handle */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 rounded p-1 cursor-move">
                      <Move className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 w-8 p-0"
                      onClick={() => window.open(image.processedUrl.startsWith('http') || image.processedUrl.startsWith('blob:') ? image.processedUrl : imageApi.getImageUrl(image.processedUrl), '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDeleteImage(image.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          ))}

          {/* Preview Images (during upload) */}
          {previewImages.map((previewUrl, index) => (
            <div key={`preview-${index}`} className="relative">
              <Card className="overflow-hidden opacity-50">
                <div className="relative aspect-square">
                  <img
                    src={previewUrl}
                    alt={`Upload ${index + 1}`}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      {images.length > 0 && (
        <p className="text-sm text-gray-500">
          💡 Arraste as imagens para reordenar. A primeira imagem será a principal.
        </p>
      )}
    </div>
  )
}