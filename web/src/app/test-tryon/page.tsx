'use client';

import React, { useState } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, User, Shirt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl } from '@/lib/api-config';

interface TryOnState {
  personImage: File | null;
  garmentImage: File | null;
  personImageUrl: string;
  garmentImageUrl: string;
  useUrlMode: boolean;
  isProcessing: boolean;
  eventId: string | null;
  resultImage: string | null;
  mediaUrls: string[] | null;
  error: string | null;
}

export default function TestTryOnPage() {
  const [tryOnState, setTryOnState] = useState<TryOnState>({
    personImage: null,
    garmentImage: null,
    personImageUrl: 'https://static.getglam.app/api_service/target.jpg',
    garmentImageUrl: 'https://static.getglam.app/api_service/garment.jpg',
    useUrlMode: false,
    isProcessing: false,
    eventId: null,
    resultImage: null,
    mediaUrls: null,
    error: null
  });

  const handleImageUpload = (type: 'person' | 'garment') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTryOnState(prev => ({
        ...prev,
        [type === 'person' ? 'personImage' : 'garmentImage']: file,
        error: null
      }));
    }
  };

  const processTryOn = async () => {
    // Validate inputs based on mode
    if (tryOnState.useUrlMode) {
      if (!tryOnState.personImageUrl.trim() || !tryOnState.garmentImageUrl.trim()) {
        setTryOnState(prev => ({ ...prev, error: 'Please provide both person and garment image URLs' }));
        return;
      }
    } else {
      if (!tryOnState.personImage || !tryOnState.garmentImage) {
        setTryOnState(prev => ({ ...prev, error: 'Please upload both person and garment images' }));
        return;
      }
    }

    setTryOnState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      error: null,
      resultImage: null,
      mediaUrls: null,
      eventId: null
    }));

    try {
      // Step 1: Generate try-on request
      const API_BASE = getApiBaseUrl();
      let response: Response;

      if (tryOnState.useUrlMode) {
        // URL mode - send JSON with URLs
        console.log('Initiating try-on request with URLs...');
        response = await fetch(`${API_BASE}/tryon/url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            mask_type: 'overall',
            media_url: tryOnState.personImageUrl,
            garment_url: tryOnState.garmentImageUrl
          })
        });
      } else {
        // File upload mode
        console.log('Initiating try-on request with file uploads...');
        const formData = new FormData();
        formData.append('person', tryOnState.personImage!);
        formData.append('garment', tryOnState.garmentImage!);
        formData.append('mask_type', 'overall');

        response = await fetch(`${API_BASE}/tryon`, {
          method: 'POST',
          body: formData
        });
      }

      if (!response.ok) {
        throw new Error(`Try-on request failed: ${response.statusText}`);
      }

      const responseData = await response.json();
      console.log('Try-on response received:', responseData);
      
      const event_id = responseData.data?.event_id;
      
      if (!event_id) {
        throw new Error('No event_id received from API response');
      }
      
      setTryOnState(prev => ({ ...prev, eventId: event_id }));
      console.log('Try-on initiated with event_id:', event_id);

      // Step 2: Poll for result
      await pollForResult(event_id);

    } catch (error) {
      console.error('Try-on processing error:', error);
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
        console.log(`Polling attempt ${attempts}/${maxAttempts} for event_id: ${eventId}`);

        const API_BASE = getApiBaseUrl();
        const response = await fetch(`${API_BASE}/tryon/${eventId}`);
        
        if (!response.ok) {
          throw new Error(`Polling failed: ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('Poll response:', responseData);
        
        // Access the actual data from the wrapped response
        const result = responseData.data || responseData;
        
        // Handle both 'completed' and 'READY' status
        if ((result.status === 'completed' || result.status === 'READY') && result.result_url) {
          console.log('Try-on completed successfully');
          
          // If there's a media_urls array, use the first URL, otherwise use result_url
          const resultImageUrl = result.media_urls?.[0] || result.result_url;
          
          setTryOnState(prev => ({
            ...prev,
            isProcessing: false,
            resultImage: resultImageUrl,
            mediaUrls: result.media_urls || [result.result_url]
          }));
          
          // Log the final result for debugging
          console.log('Final result:', {
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

        // Still processing, continue polling
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else {
          throw new Error('Try-on processing timed out');
        }

      } catch (error) {
        console.error('Polling error:', error);
        setTryOnState(prev => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : 'Polling failed'
        }));
      }
    };

    // Start polling after initial delay
    setTimeout(poll, 5000);
  };

  const reset = () => {
    setTryOnState({
      personImage: null,
      garmentImage: null,
      personImageUrl: 'https://static.getglam.app/api_service/target.jpg',
      garmentImageUrl: 'https://static.getglam.app/api_service/garment.jpg',
      useUrlMode: false,
      isProcessing: false,
      eventId: null,
      resultImage: null,
      mediaUrls: null,
      error: null
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Virtual Try-On</h1>
        <p className="text-gray-600">Upload images or use URLs to test virtual try-on functionality</p>
      </div>

      {/* Mode Toggle */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={!tryOnState.useUrlMode}
                onChange={() => setTryOnState(prev => ({ ...prev, useUrlMode: false, error: null }))}
                className="text-blue-600"
              />
              <span>Upload Files</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                checked={tryOnState.useUrlMode}
                onChange={() => setTryOnState(prev => ({ ...prev, useUrlMode: true, error: null }))}
                className="text-blue-600"
              />
              <span>Use URLs (for testing)</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* URL Input Section */}
      {tryOnState.useUrlMode && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Person Image URL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Person Image URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="url"
                  placeholder="https://example.com/person-image.jpg"
                  value={tryOnState.personImageUrl}
                  onChange={(e) => setTryOnState(prev => ({ ...prev, personImageUrl: e.target.value, error: null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={tryOnState.isProcessing}
                />
                
                {tryOnState.personImageUrl && (
                  <div className="relative">
                    <img
                      src={tryOnState.personImageUrl}
                      alt="Person"
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = 'block';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="hidden border-2 border-dashed border-red-300 rounded-lg p-8 text-center">
                      <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                      <p className="text-red-500">Failed to load image</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Garment Image URL */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shirt className="h-5 w-5" />
                Garment Image URL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="url"
                  placeholder="https://example.com/garment-image.jpg"
                  value={tryOnState.garmentImageUrl}
                  onChange={(e) => setTryOnState(prev => ({ ...prev, garmentImageUrl: e.target.value, error: null }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={tryOnState.isProcessing}
                />
                
                {tryOnState.garmentImageUrl && (
                  <div className="relative">
                    <img
                      src={tryOnState.garmentImageUrl}
                      alt="Garment"
                      className="w-full h-64 object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = 'block';
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <div className="hidden border-2 border-dashed border-red-300 rounded-lg p-8 text-center">
                      <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
                      <p className="text-red-500">Failed to load image</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Section */}
      {!tryOnState.useUrlMode && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Person Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Person Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload('person')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={tryOnState.isProcessing}
                />
                
                {tryOnState.personImage && (
                  <div className="relative">
                    <img
                      src={URL.createObjectURL(tryOnState.personImage)}
                      alt="Person"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  </div>
                )}
                
                {!tryOnState.personImage && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Upload person image</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        {/* Garment Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shirt className="h-5 w-5" />
              Garment Image
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload('garment')}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                disabled={tryOnState.isProcessing}
              />
              
              {tryOnState.garmentImage && (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(tryOnState.garmentImage)}
                    alt="Garment"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                </div>
              )}
              
              {!tryOnState.garmentImage && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Upload garment image</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </div>
      )}

      {/* Process Button */}
      <div className="text-center">
        <Button
          onClick={processTryOn}
          disabled={
            tryOnState.isProcessing || 
            (tryOnState.useUrlMode 
              ? !tryOnState.personImageUrl.trim() || !tryOnState.garmentImageUrl.trim()
              : !tryOnState.personImage || !tryOnState.garmentImage
            )
          }
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-3 text-lg"
        >
          {tryOnState.isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {tryOnState.eventId ? 'Processing...' : 'Uploading...'}
            </>
          ) : (
            'Generate Try-On'
          )}
        </Button>
      </div>

      {/* Status */}
      {tryOnState.isProcessing && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Processing Your Try-On</h3>
            <p className="text-gray-600 mb-2">
              {tryOnState.eventId ? 
                `Event ID: ${tryOnState.eventId}` : 
                'Uploading images and initiating processing...'
              }
            </p>
            <p className="text-sm text-gray-500">This may take 2-5 minutes</p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {tryOnState.error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-red-700 mb-2">Error</h3>
            <p className="text-red-600 mb-4">{tryOnState.error}</p>
            <Button onClick={reset} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Result Display */}
      {tryOnState.resultImage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Try-On Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <img
                src={tryOnState.resultImage.startsWith('http') 
                  ? tryOnState.resultImage 
                  : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '')}${tryOnState.resultImage}`
                }
                alt="Try-on result"
                className="mx-auto max-w-md rounded-lg shadow-lg"
              />
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    const imageUrl = tryOnState.resultImage!.startsWith('http') 
                      ? tryOnState.resultImage!
                      : `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api').replace('/api', '')}${tryOnState.resultImage!}`;
                    link.href = imageUrl;
                    link.download = 'tryon-result.jpg';
                    link.click();
                  }}
                >
                  Download Result
                </Button>
                <Button onClick={reset} variant="outline">
                  Try Another
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-sm">Debug Info</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(tryOnState, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}