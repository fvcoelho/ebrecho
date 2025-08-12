'use client';

import React, { useState } from 'react';
import { BlobImageUpload } from '@/components/products/blob-image-upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestBlobUploadPage() {
  const [productId, setProductId] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleImagesChange = (images: any[]) => {
    addLog(`Images changed: ${images.length} total images`);
    console.log('Images changed:', images);
  };

  const handleUploadComplete = (images: any[]) => {
    addLog(`Upload completed: ${images.length} images uploaded successfully`);
    setUploadedImages(prev => [...prev, ...images]);
    console.log('Upload completed:', images);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  React.useEffect(() => {
    addLog('Test page initialized');
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vercel Blob Upload Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="productId">Product ID (optional for testing)</Label>
            <Input
              id="productId"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              placeholder="Enter product ID or leave empty"
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave empty to test file selection and preview only. Enter a valid product ID to test full upload.
            </p>
          </div>
        </CardContent>
      </Card>

      <BlobImageUpload
        productId={productId || undefined}
        onImagesChange={handleImagesChange}
        onUploadComplete={handleUploadComplete}
        maxImages={5}
        className="max-w-4xl mx-auto"
      />

      {uploadedImages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upload Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {uploadedImages.map((image, index) => (
                <div key={image.id || index} className="p-2 border rounded">
                  <p><strong>ID:</strong> {image.id}</p>
                  <p><strong>Original URL:</strong> <a href={image.originalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Image</a></p>
                  {image.thumbnailUrl && (
                    <p><strong>Thumbnail URL:</strong> <a href={image.thumbnailUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">View Thumbnail</a></p>
                  )}
                  <p><strong>Order:</strong> {image.order}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Debug Logs</CardTitle>
          <Button variant="outline" size="sm" onClick={clearLogs}>
            Clear Logs
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-60 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500">No logs yet...</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1. File Selection:</strong> Try uploading some images to test the preview functionality.</p>
          <p><strong>2. Without Product ID:</strong> Images will show preview but won't upload to server.</p>
          <p><strong>3. With Product ID:</strong> Enter a valid product ID to test full upload flow.</p>
          <p><strong>4. Console Logs:</strong> Open browser console to see detailed logging from the upload service.</p>
          <p><strong>5. Network Tab:</strong> Check browser network tab to see API requests.</p>
        </CardContent>
      </Card>
    </div>
  );
}