'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Sparkles, Settings, Info, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { SpinningLogo } from '@/components/ui/spinning-logo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { aiEnhancementAPI, EnhancementOptions, EnhancementResult, EnhancementDebugInfo } from '@/lib/api/ai-enhancement';

interface AIImageUploadProps {
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  category?: string;
  disabled?: boolean;
  className?: string;
}

interface ImageWithEnhancement {
  file: File;
  preview: string;
  id: string;
  isEnhancing?: boolean;
  enhancementResult?: EnhancementResult;
  enhancementError?: string;
  debugInfo?: EnhancementDebugInfo;
}

export const AIImageUpload: React.FC<AIImageUploadProps> = ({
  onImagesChange,
  maxImages = 10,
  category,
  disabled = false,
  className = ''
}) => {
  const [images, setImages] = useState<ImageWithEnhancement[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhancement options
  const [enhancementOptions, setEnhancementOptions] = useState<EnhancementOptions>({
    quality: 'standard',
    backgroundRemoval: false,
    autoOptimize: true,
    category: category,
  });

  console.log('[AI Image Upload] Component initialized with options:', {
    maxImages,
    category,
    disabled,
    enhancementOptions,
    debugMode
  });

  const generateImageId = () => `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const createImagePreview = useCallback((file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFileSelection = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    console.log('[AI Image Upload] Files selected:', {
      count: fileArray.length,
      files: fileArray.map(f => ({ name: f.name, size: f.size, type: f.type })),
      maxImages,
      currentCount: images.length
    });

    const availableSlots = maxImages - images.length;
    const filesToProcess = fileArray.slice(0, availableSlots);

    if (filesToProcess.length < fileArray.length) {
      console.warn('[AI Image Upload] Some files were not processed due to max limit:', {
        requested: fileArray.length,
        processed: filesToProcess.length,
        maxImages,
        currentCount: images.length
      });
    }

    const newImages: ImageWithEnhancement[] = [];

    for (const file of filesToProcess) {
      const preview = await createImagePreview(file);
      const imageWithEnhancement: ImageWithEnhancement = {
        file,
        preview,
        id: generateImageId()
      };
      newImages.push(imageWithEnhancement);
    }

    const updatedImages = [...images, ...newImages];
    setImages(updatedImages);
    onImagesChange(updatedImages.map(img => img.file));

    console.log('[AI Image Upload] Images added:', {
      newCount: newImages.length,
      totalCount: updatedImages.length,
      imageIds: newImages.map(img => img.id)
    });
  }, [images, maxImages, onImagesChange, createImagePreview]);

  const enhanceSingleImage = async (imageData: ImageWithEnhancement) => {
    console.log('[AI Image Upload] Starting single image enhancement:', {
      imageId: imageData.id,
      filename: imageData.file.name,
      options: enhancementOptions
    });

    setImages(prev => prev.map(img => 
      img.id === imageData.id 
        ? { ...img, isEnhancing: true, enhancementError: undefined }
        : img
    ));

    try {
      const response = await aiEnhancementAPI.enhanceSingleImage(imageData.file, enhancementOptions);
      
      if (response.success && response.data) {
        console.log('[AI Image Upload] Enhancement successful:', {
          imageId: imageData.id,
          provider: response.data.result.provider,
          cost: response.data.result.cost,
          qualityScore: response.data.result.qualityScore,
          requestId: response.data.debug.requestId
        });

        setImages(prev => prev.map(img => 
          img.id === imageData.id 
            ? { 
                ...img, 
                isEnhancing: false, 
                enhancementResult: response.data!.result,
                debugInfo: debugMode ? {
                  requestId: response.data!.debug.requestId,
                  timestamp: new Date().toISOString(),
                  originalImage: {
                    filename: imageData.file.name,
                    size: imageData.file.size,
                    dimensions: { width: 0, height: 0 },
                    mimeType: imageData.file.type
                  },
                  enhancementOptions,
                  providerSelection: response.data!.debug.provider,
                  processingSteps: response.data!.debug.steps
                } : undefined
              }
            : img
        ));
      } else {
        throw new Error(response.error || 'Enhancement failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AI Image Upload] Enhancement failed:', {
        imageId: imageData.id,
        error: errorMessage,
        filename: imageData.file.name
      });

      setImages(prev => prev.map(img => 
        img.id === imageData.id 
          ? { ...img, isEnhancing: false, enhancementError: errorMessage }
          : img
      ));
    }
  };

  const enhanceAllImages = async () => {
    console.log('[AI Image Upload] Starting batch enhancement:', {
      imageCount: images.length,
      options: enhancementOptions
    });

    setIsProcessing(true);
    
    try {
      // Mark all images as enhancing
      setImages(prev => prev.map(img => ({ 
        ...img, 
        isEnhancing: true, 
        enhancementError: undefined 
      })));

      const files = images.map(img => img.file);
      const response = await aiEnhancementAPI.enhanceBatchImages(files, enhancementOptions);
      
      if (response.success && response.data) {
        console.log('[AI Image Upload] Batch enhancement successful:', {
          totalImages: response.data.summary.totalImages,
          totalCost: response.data.summary.totalCost,
          providers: response.data.summary.providers,
          batchId: response.data.summary.batchId
        });

        // Update all images with results
        setImages(prev => prev.map((img, index) => {
          const result = response.data!.results[index];
          const debugResult = response.data!.debug.detailedResults[index];
          
          return {
            ...img,
            isEnhancing: false,
            enhancementResult: result,
            debugInfo: debugMode && debugResult ? {
              requestId: debugResult.requestId,
              timestamp: new Date().toISOString(),
              originalImage: {
                filename: img.file.name,
                size: img.file.size,
                dimensions: { width: 0, height: 0 },
                mimeType: img.file.type
              },
              enhancementOptions,
              providerSelection: debugResult.provider,
              processingSteps: debugResult.steps
            } : undefined
          };
        }));
      } else {
        throw new Error(response.error || 'Batch enhancement failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AI Image Upload] Batch enhancement failed:', {
        error: errorMessage,
        imageCount: images.length
      });

      // Mark all images as failed
      setImages(prev => prev.map(img => ({ 
        ...img, 
        isEnhancing: false, 
        enhancementError: errorMessage 
      })));
    } finally {
      setIsProcessing(false);
    }
  };

  const removeImage = (id: string) => {
    console.log('[AI Image Upload] Removing image:', { imageId: id });
    
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onImagesChange(updatedImages.map(img => img.file));

    console.log('[AI Image Upload] Image removed, new count:', updatedImages.length);
  };

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

  const hasEnhancedImages = images.some(img => img.enhancementResult);
  const hasEnhancingImages = images.some(img => img.isEnhancing);
  const hasErrors = images.some(img => img.enhancementError);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Enhancement Settings */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI Image Enhancement
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDebugMode(!debugMode)}
                className={debugMode ? 'bg-blue-50 text-blue-600' : ''}
              >
                <Info className="h-4 w-4" />
                Debug
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>

        {showSettings && (
          <CardContent className="pt-0 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Quality Level</label>
                <Select
                  value={enhancementOptions.quality}
                  onValueChange={(value: 'standard' | 'premium') => 
                    setEnhancementOptions(prev => ({ ...prev, quality: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard ($0.03/image)</SelectItem>
                    <SelectItem value="premium">Premium ($0.08/image)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Provider</label>
                <Select
                  value={enhancementOptions.provider || 'auto'}
                  onValueChange={(value) => 
                    setEnhancementOptions(prev => ({ 
                      ...prev, 
                      provider: value === 'auto' ? undefined : value as any
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto Select</SelectItem>
                    <SelectItem value="deep-image">Deep Image (Fast)</SelectItem>
                    <SelectItem value="photoroom">Photoroom (Background)</SelectItem>
                    <SelectItem value="claid">Claid (Premium)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="backgroundRemoval"
                    checked={enhancementOptions.backgroundRemoval}
                    onCheckedChange={(checked) =>
                      setEnhancementOptions(prev => ({ 
                        ...prev, 
                        backgroundRemoval: checked as boolean 
                      }))
                    }
                  />
                  <label htmlFor="backgroundRemoval" className="text-sm">
                    Remove Background
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoOptimize"
                    checked={enhancementOptions.autoOptimize}
                    onCheckedChange={(checked) =>
                      setEnhancementOptions(prev => ({ 
                        ...prev, 
                        autoOptimize: checked as boolean 
                      }))
                    }
                  />
                  <label htmlFor="autoOptimize" className="text-sm">
                    Auto Optimize
                  </label>
                </div>
              </div>
            </div>

            {debugMode && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Debug Mode Enabled</h4>
                <p className="text-xs text-blue-600">
                  Detailed processing information will be logged to console and stored with each image.
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* File Upload Area */}
      <Card>
        <CardContent className="p-6">
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
            <p className="text-sm text-gray-500 mb-4">
              Supports JPEG, PNG, WebP • Max {maxImages} images • 5MB per file
            </p>
            
            {images.length > 0 && (
              <div className="flex justify-center gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    enhanceAllImages();
                  }}
                  disabled={isProcessing || hasEnhancingImages || disabled}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  {isProcessing ? (
                    <>
                      <SpinningLogo size="sm" speed="fast" className="mr-2" />
                      Enhancing All...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Enhance All Images
                    </>
                  )}
                </Button>
              </div>
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
        </CardContent>
      </Card>

      {/* Image Grid */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Uploaded Images ({images.length}/{maxImages})</span>
              <div className="flex items-center gap-2 text-sm">
                {hasEnhancedImages && (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Enhanced
                  </span>
                )}
                {hasEnhancingImages && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <SpinningLogo size="sm" speed="fast" />
                    Processing
                  </span>
                )}
                {hasErrors && (
                  <span className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    Errors
                  </span>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((imageData) => (
                <div key={imageData.id} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative">
                    <img
                      src={imageData.preview}
                      alt={`Upload ${imageData.id}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Enhancement Status Overlay */}
                    {imageData.isEnhancing && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-center text-white">
                          <SpinningLogo size="md" speed="fast" className="mx-auto mb-2" />
                          <p className="text-xs">Enhancing...</p>
                        </div>
                      </div>
                    )}

                    {imageData.enhancementResult && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-green-500 text-white p-1 rounded-full">
                          <CheckCircle className="h-4 w-4" />
                        </div>
                      </div>
                    )}

                    {imageData.enhancementError && (
                      <div className="absolute top-2 right-2">
                        <div className="bg-red-500 text-white p-1 rounded-full">
                          <AlertCircle className="h-4 w-4" />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex gap-1">
                        {!imageData.enhancementResult && !imageData.isEnhancing && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => enhanceSingleImage(imageData)}
                            className="h-8 w-8 p-0"
                          >
                            <Sparkles className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {debugMode && imageData.debugInfo && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              console.log('[AI Image Upload] Debug info for image:', imageData.debugInfo);
                              alert(`Debug info logged to console for request: ${imageData.debugInfo?.requestId}`);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeImage(imageData.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="mt-2 text-xs space-y-1">
                    <p className="font-medium truncate">{imageData.file.name}</p>
                    <p className="text-gray-500">
                      {(imageData.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {imageData.enhancementResult && (
                      <div className="space-y-1">
                        <p className="text-green-600">
                          ✓ Enhanced ({imageData.enhancementResult.provider})
                        </p>
                        <p className="text-gray-500">
                          Quality: {((imageData.enhancementResult.qualityScore || 0) * 100).toFixed(0)}%
                        </p>
                        <p className="text-gray-500">
                          Cost: ${imageData.enhancementResult.cost.toFixed(3)}
                        </p>
                      </div>
                    )}
                    
                    {imageData.enhancementError && (
                      <p className="text-red-600 text-xs">
                        ✗ {imageData.enhancementError}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhancement Summary */}
      {hasEnhancedImages && (
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {images.filter(img => img.enhancementResult).length}
                </p>
                <p className="text-sm text-gray-600">Enhanced</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {(images
                    .filter(img => img.enhancementResult)
                    .reduce((avg, img) => avg + (img.enhancementResult?.qualityScore || 0), 0) * 100 / 
                    images.filter(img => img.enhancementResult).length || 0
                  ).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-600">Avg Quality</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  ${images
                    .filter(img => img.enhancementResult)
                    .reduce((sum, img) => sum + (img.enhancementResult?.cost || 0), 0)
                    .toFixed(3)}
                </p>
                <p className="text-sm text-gray-600">Total Cost</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600">
                  {[...new Set(images
                    .filter(img => img.enhancementResult)
                    .map(img => img.enhancementResult?.provider)
                  )].length}
                </p>
                <p className="text-sm text-gray-600">Providers Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};