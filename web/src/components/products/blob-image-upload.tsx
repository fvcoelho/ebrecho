'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, X, Loader2, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { blobUploadService, type UploadProgress } from '@/lib/api/blob-upload';
// import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface BlobImageUploadProps {
  productId?: string;
  onImagesChange?: (images: any[]) => void;
  onUploadComplete?: (images: any[]) => void;
  onReorganizationComplete?: () => void;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
  existingImages?: any[];
}

interface LocalImage {
  id: string;
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  progress: number;
  error?: string;
  blobUrl?: string;
}

export const BlobImageUpload: React.FC<BlobImageUploadProps> = ({
  productId,
  onImagesChange,
  onUploadComplete,
  onReorganizationComplete,
  maxImages = 10,
  disabled = false,
  className = '',
  existingImages = []
}) => {
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  const [uploadedImages, setUploadedImages] = useState<any[]>(existingImages);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processedProductIds = useRef<Set<string>>(new Set()); // Track processed productIds

  console.log('[BlobImageUpload] Component initialized', {
    productId,
    maxImages,
    existingImagesCount: existingImages.length
  });

  const generateImageId = () => `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Auto-trigger upload completion when productId becomes available
  useEffect(() => {
    if (productId && uploadedImages.length > 0 && !processedProductIds.current.has(productId)) {
      const tempImages = uploadedImages.filter(img => 
        img.metadata?.pathname && img.metadata.pathname.includes('/temp-')
      );
      
      if (tempImages.length > 0) {
        // Mark this productId as being processed
        processedProductIds.current.add(productId);
        console.log('[BlobImageUpload] ProductId now available, triggering upload completion for temp images', {
          productId,
          tempImagesCount: tempImages.length,
          tempPaths: tempImages.map(img => img.metadata?.pathname)
        });
        
        // Convert to the format expected by the API
        const blobsToComplete = tempImages.map(img => ({
          url: img.originalUrl,
          pathname: img.metadata?.pathname || '',
          size: img.metadata?.size || 0
        }));
        
        // Trigger upload completion in the background with retry logic
        const completeReorganization = async (retryCount = 0) => {
          try {
            console.log(`[BlobImageUpload] 🔄 Attempting reorganization (attempt ${retryCount + 1})`, {
              productId,
              tempImagesCount: blobsToComplete.length,
              blobsToComplete
            });

            const result = await blobUploadService.notifyUploadComplete(productId, blobsToComplete);
            console.log('[BlobImageUpload] ✅ Auto upload completion successful', result);
            
            // Update uploaded images with the final URLs from the API response
            if (result && result.images) {
              console.log('[BlobImageUpload] 🔄 Updating state with final image URLs', {
                newImages: result.images.length,
                sampleFinalUrl: result.images[0]?.originalUrl
              });
              
              // Replace temp images with the final processed images from API
              setUploadedImages(prev => {
                // Keep non-temp images and add the new final images
                const nonTempImages = prev.filter(img => 
                  !img.metadata?.pathname || !img.metadata.pathname.includes('/temp-')
                );
                const finalImages = [...nonTempImages, ...result.images];
                console.log('[BlobImageUpload] 📊 Final images state after reorganization:', {
                  totalImages: finalImages.length,
                  newImages: result.images.length,
                  keptImages: nonTempImages.length
                });
                return finalImages;
              });
              
              // Notify parent component of the update
              if (onImagesChange) {
                const nonTempLocal = localImages.filter(img => !img.uploaded);
                onImagesChange([...result.images, ...nonTempLocal]);
              }

              // Notify completion
              if (onReorganizationComplete) {
                console.log('[BlobImageUpload] 🎉 Calling onReorganizationComplete callback');
                onReorganizationComplete();
              }
            }
          } catch (error) {
            console.error(`[BlobImageUpload] ⚠️ Auto upload completion failed (attempt ${retryCount + 1}):`, error);
            
            // Retry up to 3 times with exponential backoff
            if (retryCount < 2) {
              const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
              console.log(`[BlobImageUpload] 🔄 Retrying in ${delay}ms...`);
              setTimeout(() => completeReorganization(retryCount + 1), delay);
            } else {
              console.error('[BlobImageUpload] ❌ Max retries exceeded for reorganization');
              // Still call completion callback even on failure
              if (onReorganizationComplete) {
                onReorganizationComplete();
              }
            }
          }
        };

        completeReorganization();
      }
    }
  }, [productId, uploadedImages.length]); // Safe dependency - only triggers when length changes, not content

  const handleFileSelection = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setError(null);
    const fileArray = Array.from(files);
    
    console.log('[BlobImageUpload] Files selected', {
      count: fileArray.length,
      currentCount: localImages.length + uploadedImages.length
    });

    const totalImages = localImages.length + uploadedImages.length;
    const availableSlots = maxImages - totalImages;
    
    if (availableSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`);
      return;
    }

    const filesToProcess = fileArray.slice(0, availableSlots);
    
    // Create local preview images
    const newImages: LocalImage[] = await Promise.all(
      filesToProcess.map(async (file) => ({
        id: generateImageId(),
        file,
        preview: blobUploadService.generatePreviewUrl(file),
        uploading: false,
        uploaded: false,
        progress: 0
      }))
    );

    setLocalImages(prev => [...prev, ...newImages]);
    
    if (onImagesChange) {
      onImagesChange([...uploadedImages, ...localImages, ...newImages]);
    }

    console.log('[BlobImageUpload] Local previews created', {
      newCount: newImages.length,
      totalCount: localImages.length + newImages.length + uploadedImages.length
    });
  }, [localImages, uploadedImages, maxImages, onImagesChange]);

  const uploadImages = useCallback(async () => {
    // Use a temporary ID if no productId exists yet
    const uploadId = productId || `temp-${Date.now()}`;
    
    const imagesToUpload = localImages.filter(img => !img.uploaded && !img.uploading);
    if (imagesToUpload.length === 0) return;

    console.log('[BlobImageUpload] Starting upload', {
      productId: uploadId,
      isTemporary: !productId,
      imageCount: imagesToUpload.length,
      usingDirectMethod: true
    });

    setIsUploading(true);
    setError(null);

    try {
      // Mark images as uploading
      setLocalImages(prev => prev.map(img => 
        imagesToUpload.find(i => i.id === img.id) 
          ? { ...img, uploading: true, error: undefined }
          : img
      ));

      // Upload images using blob service with uploadId (may be temporary)
      const files = imagesToUpload.map(img => img.file);
      const result = await blobUploadService.uploadProductImages(
        uploadId,
        files,
        (fileIndex, progress) => {
          // Update progress for each file
          setLocalImages(prev => prev.map((img, idx) => {
            const uploadIdx = imagesToUpload.findIndex(i => i.id === img.id);
            if (uploadIdx === fileIndex) {
              return { ...img, progress: progress.percentage };
            }
            return img;
          }));
        }
      );

      console.log('[BlobImageUpload] Upload complete', {
        uploadedCount: result.images.length
      });

      // Mark images as uploaded and update with blob URLs
      setLocalImages(prev => prev.map(img => {
        const uploadedIdx = imagesToUpload.findIndex(i => i.id === img.id);
        if (uploadedIdx !== -1 && result.images[uploadedIdx]) {
          return {
            ...img,
            uploading: false,
            uploaded: true,
            progress: 100,
            blobUrl: result.images[uploadedIdx].originalUrl
          };
        }
        return img;
      }));

      // Add to uploaded images
      setUploadedImages(prev => [...prev, ...result.images]);

      if (onUploadComplete) {
        onUploadComplete(result.images);
      }

    } catch (error) {
      console.error('[BlobImageUpload] Upload error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setError(errorMessage);
      
      // Mark images as failed
      setLocalImages(prev => prev.map(img => 
        imagesToUpload.find(i => i.id === img.id)
          ? { ...img, uploading: false, error: errorMessage }
          : img
      ));
    } finally {
      setIsUploading(false);
    }
  }, [productId, localImages, onUploadComplete]);

  const removeLocalImage = useCallback((id: string) => {
    console.log('[BlobImageUpload] Removing local image', { id });
    
    const image = localImages.find(img => img.id === id);
    if (image) {
      blobUploadService.revokePreviewUrl(image.preview);
    }
    
    setLocalImages(prev => prev.filter(img => img.id !== id));
    
    if (onImagesChange) {
      const remainingLocal = localImages.filter(img => img.id !== id);
      onImagesChange([...uploadedImages, ...remainingLocal]);
    }
  }, [localImages, uploadedImages, onImagesChange]);

  const removeUploadedImage = useCallback(async (imageId: string) => {
    console.log('[BlobImageUpload] Removing uploaded image', { imageId });
    
    try {
      await blobUploadService.deleteImage(imageId);
      setUploadedImages(prev => prev.filter(img => img.id !== imageId));
      
      if (onImagesChange) {
        const remaining = uploadedImages.filter(img => img.id !== imageId);
        onImagesChange([...remaining, ...localImages]);
      }
    } catch (error) {
      console.error('[BlobImageUpload] Error deleting image:', error);
      setError('Failed to delete image');
    }
  }, [uploadedImages, localImages, onImagesChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelection(e.dataTransfer.files);
  }, [handleFileSelection]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelection(e.target.files);
  }, [handleFileSelection]);

  const handleDragEnd = (result: any) => {
    // Disabled drag and drop for now
    // if (!result.destination) return;

    // const items = Array.from(uploadedImages);
    // const [reorderedItem] = items.splice(result.source.index, 1);
    // items.splice(result.destination.index, 0, reorderedItem);

    // // Update order property
    // const reorderedItems = items.map((item, index) => ({
    //   ...item,
    //   order: index
    // }));

    // setUploadedImages(reorderedItems);
    // if (onImagesChange) {
    //   onImagesChange([...reorderedItems, ...localImages]);
    // }
  };

  const hasImages = localImages.length > 0 || uploadedImages.length > 0;
  const canUpload = localImages.some(img => !img.uploaded) && productId;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Product Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drop images here or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports JPEG, PNG, WebP • Max {maxImages} images • 5MB per file
            </p>
            {!productId && (
              <p className="text-sm text-green-600 mt-2">
                💡 You can now upload images even before saving the product!
              </p>
            )}
            {(localImages.length + uploadedImages.length) > 0 && (
              <p className="text-sm text-blue-600 mt-2">
                {localImages.length + uploadedImages.length} / {maxImages} images
              </p>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />

          {/* Upload Button */}
          {localImages.length > 0 && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={uploadImages}
                disabled={isUploading || disabled}
                className="w-full sm:w-auto"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading to Vercel Blob...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload {localImages.filter(img => !img.uploaded).length} Images to Blob
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Local Images (not uploaded yet) */}
      {localImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ready to Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {localImages.map((image) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={image.preview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Upload Progress */}
                    {image.uploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white mb-2" />
                        <div className="w-3/4 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${image.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-white text-xs mt-1">{image.progress}%</p>
                      </div>
                    )}

                    {/* Upload Success */}
                    {image.uploaded && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                      </div>
                    )}

                    {/* Error State */}
                    {image.error && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                    )}

                    {/* Remove Button */}
                    {!image.uploading && (
                      <button
                        onClick={() => removeLocalImage(image.id)}
                        className="absolute top-2 left-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {image.file.name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Images (with drag to reorder) */}
      {uploadedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Uploaded Images ({uploadedImages.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedImages.map((image, index) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={image.thumbnailUrl || image.originalUrl}
                      alt={`Product ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Order Badge */}
                    <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      #{index + 1}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => removeUploadedImage(image.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};