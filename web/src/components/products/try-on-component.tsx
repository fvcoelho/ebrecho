'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle, AlertCircle, X, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { type Product } from '@/lib/api';
import { imageApi } from '@/lib/api/images';
import { getApiBaseUrl } from '@/lib/api-config';

interface Model {
  id: string;
  name: string;
  imageUrl: string;
}

interface TryOnComponentProps {
  product: Product;
  model: Model;
  onClose: () => void;
}

interface TryOnState {
  isProcessing: boolean;
  eventId: string | null;
  resultImage: string | null;
  error: string | null;
}

export function TryOnComponent({ product, model, onClose }: TryOnComponentProps) {
  const [tryOnState, setTryOnState] = useState<TryOnState>({
    isProcessing: false,
    eventId: null,
    resultImage: null,
    error: null
  });

  const processTryOn = async () => {
    setTryOnState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null,
      resultImage: null,
      eventId: null
    }));

    try {
      const API_BASE = getApiBaseUrl();
      
      // Get the product image URL - use the first image
      const productImageUrl = product.images[0]?.processedUrl || product.images[0]?.originalUrl;
      if (!productImageUrl) {
        throw new Error('Produto não possui imagens');
      }

      // Convert relative URLs to absolute URLs
      const garmentUrl = productImageUrl.startsWith('http') || productImageUrl.startsWith('blob:')
        ? productImageUrl
        : imageApi.getImageUrl(productImageUrl);

      console.log('🎨 Initiating try-on with URLs:', {
        personUrl: model.imageUrl,
        garmentUrl,
        productName: product.name,
        modelName: model.name
      });

      // Use URL mode for try-on
      const response = await fetch(`${API_BASE}/tryon/url`, {
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

      if (!response.ok) {
        throw new Error(`Try-on request failed: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('🎨 Try-on response received:', responseData);
      
      const event_id = responseData.data?.event_id;
      
      if (!event_id) {
        throw new Error('No event_id received from API response');
      }
      
      setTryOnState(prev => ({ ...prev, eventId: event_id }));
      console.log('🎨 Try-on initiated with event_id:', event_id);

      // Poll for result
      await pollForResult(event_id);

    } catch (error) {
      console.error('🎨 Try-on processing error:', error);
      setTryOnState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  };

  const pollForResult = async (eventId: string) => {
    const maxAttempts = 30; // 5 minutes max (10s intervals)
    let attempts = 0;

    const poll = async (): Promise<void> => {
      try {
        attempts++;
        console.log(`🎨 Polling attempt ${attempts}/${maxAttempts} for event_id: ${eventId}`);

        const API_BASE = getApiBaseUrl();
        const response = await fetch(`${API_BASE}/tryon/${eventId}`);
        
        if (!response.ok) {
          throw new Error(`Polling failed: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('🎨 Poll response:', responseData);
        
        const result = responseData.data || responseData;
        
        if ((result.status === 'completed' || result.status === 'READY') && result.result_url) {
          console.log('🎨 Try-on completed successfully');
          
          const resultImageUrl = result.media_urls?.[0] || result.result_url;
          
          setTryOnState(prev => ({
            ...prev,
            isProcessing: false,
            resultImage: resultImageUrl
          }));
          
          console.log('🎨 Final result:', {
            status: result.status,
            result_url: result.result_url,
            media_urls: result.media_urls,
            selectedUrl: resultImageUrl
          });
          
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
        setTryOnState(prev => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : 'Polling failed'
        }));
      }
    };

    setTimeout(poll, 5000);
  };

  const reset = () => {
    setTryOnState({
      isProcessing: false,
      eventId: null,
      resultImage: null,
      error: null
    });
  };

  const downloadResult = () => {
    if (!tryOnState.resultImage) return;
    
    const link = document.createElement('a');
    const imageUrl = tryOnState.resultImage.startsWith('http') 
      ? tryOnState.resultImage
      : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '')}${tryOnState.resultImage}`;
    link.href = imageUrl;
    link.download = `tryon-${product.name}-${model.name}.jpg`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Preview Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Model */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Modelo: {model.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={model.imageUrl}
                alt={model.name}
                className="w-full h-full object-cover"
              />
            </div>
          </CardContent>
        </Card>

        {/* Product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Produto: {product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
              {product.images[0] && (
                <img
                  src={(() => {
                    const imageUrl = product.images[0].processedUrl || product.images[0].originalUrl;
                    return imageUrl.startsWith('http') || imageUrl.startsWith('blob:')
                      ? imageUrl 
                      : imageApi.getImageUrl(imageUrl);
                  })()}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      {!tryOnState.resultImage && !tryOnState.isProcessing && !tryOnState.error && (
        <div className="text-center">
          <Button
            onClick={processTryOn}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-3 text-lg"
          >
            Gerar Try-On Virtual
          </Button>
        </div>
      )}

      {/* Processing Status */}
      {tryOnState.isProcessing && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processando Try-On Virtual</h3>
            <p className="text-gray-600 mb-2">
              {tryOnState.eventId ? 
                `Event ID: ${tryOnState.eventId}` : 
                'Iniciando processamento...'
              }
            </p>
            <p className="text-sm text-gray-500">Isso pode levar 2-5 minutos</p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {tryOnState.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Erro</h3>
            <p className="text-red-600 mb-4">{tryOnState.error}</p>
            <div className="flex justify-center gap-4">
              <Button onClick={reset} variant="outline">
                Tentar Novamente
              </Button>
              <Button onClick={onClose} variant="outline">
                Fechar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result Display */}
      {tryOnState.resultImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Resultado do Try-On Virtual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <img
                  src={tryOnState.resultImage.startsWith('http') 
                    ? tryOnState.resultImage 
                    : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '')}${tryOnState.resultImage}`
                  }
                  alt="Try-on result"
                  className="max-w-md rounded-lg shadow-lg"
                />
              </div>
              <div className="flex justify-center gap-4">
                <Button onClick={downloadResult}>
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Resultado
                </Button>
                <Button onClick={reset} variant="outline">
                  Tentar Outro
                </Button>
                <Button onClick={onClose} variant="outline">
                  Fechar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}