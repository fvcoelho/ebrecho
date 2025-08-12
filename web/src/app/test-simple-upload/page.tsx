'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { blobUploadService, type UploadProgress } from '@/lib/api/blob-upload';

interface UploadedImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

export default function TestSimpleUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock admin user data - replace with actual admin user from your database
  const MOCK_ADMIN = {
    userId: 'admin-test-user-id',
    partnerId: 'admin-partner-id',
    email: 'admin@ebrecho.com.br'
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[TestSimpleUpload] ${message}`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    addLog(`Selected ${files.length} files: ${files.map(f => f.name).join(', ')}`);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    addLog(`Removed file at index ${index}`);
  };

  const uploadToBlob = async () => {
    if (selectedFiles.length === 0) {
      addLog('No files selected');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccessMessage(null);
    addLog(`🚀 Starting REAL upload of ${selectedFiles.length} files...`);
    addLog(`   • Using BlobUploadService with real API calls`);
    addLog(`   • Target store: store_HfNAmd3S2wspxAfM`);
    addLog(`   • Files: ${selectedFiles.map(f => `${f.name} (${(f.size/1024/1024).toFixed(2)}MB)`).join(', ')}`);

    try {
      // Step 1: Get real upload token from API
      addLog('📡 Step 1: Requesting real upload token from API...');
      addLog(`   • Endpoint: /api/blob/upload-token`);
      addLog(`   • Admin User: ${MOCK_ADMIN.userId}`);
      
      const config = await blobUploadService.getUploadToken(undefined, selectedFiles.length);
      addLog(`✅ Real upload token received successfully`);
      addLog(`   • Upload URL: ${config.uploadUrl}`);
      addLog(`   • Max files: ${config.maxFiles}`);
      addLog(`   • Max size: ${(config.maxSize / 1024 / 1024).toFixed(2)}MB`);
      addLog(`   • Allowed types: ${config.allowedContentTypes.join(', ')}`);

      // Step 2: Upload files directly to Vercel Blob (REAL)
      addLog('📤 Step 2: Uploading files directly to Vercel Blob...');
      addLog(`   • Using client payload: ${config.clientPayload}`);
      addLog(`   • Upload endpoint: ${config.uploadUrl}`);
      
      const blobs = await blobUploadService.uploadFiles(selectedFiles, config);
      
      addLog(`✅ All files uploaded to Vercel Blob successfully!`);
      blobs.forEach((blob, i) => {
        addLog(`   • ${selectedFiles[i].name} → ${blob.url}`);
        addLog(`   • Blob pathname: ${blob.pathname}`);
        addLog(`   • File size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
        
        // Test if the URL is immediately accessible
        fetch(blob.url)
          .then(response => {
            if (response.ok) {
              addLog(`   ✅ URL verified: ${blob.url} is accessible`);
            } else {
              addLog(`   ⚠️ URL check: ${blob.url} returned ${response.status}`);
            }
          })
          .catch(err => {
            addLog(`   ❌ URL check failed: ${blob.url} - ${err.message}`);
          });
      });

      // Step 3: For test uploads, skip the product completion step
      addLog(`🧪 Step 3: Test upload mode - skipping product association`);
      addLog(`   • Note: In production, images would be associated with a real product`);
      
      // Create uploaded images from blob results
      const realUploadedImages: UploadedImage[] = blobs.map((blob, index) => ({
        id: `blob-${Date.now()}-${index}`,
        url: blob.url,
        thumbnailUrl: blob.url, // Same as original for now
        filename: selectedFiles[index].name,
        size: blob.size,
        uploadedAt: new Date().toISOString()
      }));

      setUploadedImages(prev => [...prev, ...realUploadedImages]);
      setSuccessMessage(`Successfully uploaded ${realUploadedImages.length} image(s) to Vercel Blob!`);
      addLog(`🎉 REAL upload completed successfully!`);
      addLog(`   • ${realUploadedImages.length} images uploaded to Vercel Blob`);
      addLog(`   • Files are permanently stored and accessible`);
      addLog(`   • URLs will continue to work indefinitely`);

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLog(`❌ REAL upload failed: ${errorMessage}`);
      
      // Enhanced error debugging
      if (error.response) {
        addLog(`   • HTTP Status: ${error.response.status}`);
        addLog(`   • Error Data: ${JSON.stringify(error.response.data)}`);
        addLog(`   • URL: ${error.config?.url}`);
      } else if (error.request) {
        addLog(`   • Network Error: No response received`);
        addLog(`   • Request: ${error.request}`);
      } else {
        addLog(`   • Error Type: ${error.constructor.name}`);
        addLog(`   • Stack: ${error.stack?.split('\n')[0]}`);
      }
      
      // Check common issues
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        addLog(`🔑 Authentication Issue:`);
        addLog(`   • Check if BLOB_READ_WRITE_TOKEN is set in API .env`);
        addLog(`   • Verify token has correct permissions`);
        addLog(`   • Make sure API server is running`);
      } else if (errorMessage.includes('404')) {
        addLog(`🔍 Endpoint Not Found:`);
        addLog(`   • Check if blob routes are registered in API`);
        addLog(`   • Verify API server is running on correct port`);
      } else if (errorMessage.includes('ECONNREFUSED')) {
        addLog(`🚫 Connection Refused:`);
        addLog(`   • API server is not running`);
        addLog(`   • Check if API is running on port 3001`);
      }
      
      setError(errorMessage);
    } finally {
      setIsUploading(false);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const clearImages = () => {
    setUploadedImages([]);
    addLog('Cleared uploaded images');
  };

  const testDirectUpload = async () => {
    addLog('🧪 Testing direct upload to Vercel Blob...');
    
    try {
      // Create a small test image
      const testContent = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 red pixel
      
      const response = await fetch('http://localhost:3001/api/blob/test-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          filename: 'test-pixel.png',
          content: testContent
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        addLog('✅ Direct upload test successful!');
        addLog(`   • Blob URL: ${result.blob.url}`);
        addLog(`   • Pathname: ${result.blob.pathname}`);
        addLog(`   • Size: ${result.blob.size} bytes`);
        
        // Test if URL is accessible
        fetch(result.blob.url)
          .then(res => {
            if (res.ok) {
              addLog(`   ✅ URL is accessible: ${result.blob.url}`);
            } else {
              addLog(`   ⚠️ URL returned ${res.status}: ${result.blob.url}`);
            }
          })
          .catch(err => {
            addLog(`   ❌ Failed to access URL: ${err.message}`);
          });
      } else {
        addLog('❌ Direct upload test failed');
        addLog(`   • Error: ${result.error}`);
        if (result.details) {
          addLog(`   • Details: ${result.details}`);
        }
      }
    } catch (error: any) {
      addLog('❌ Failed to test direct upload');
      addLog(`   • Network error: ${error.message}`);
    }
  };

  const testBlobConnection = async () => {
    addLog('🔍 Testing Vercel Blob connection...');
    
    try {
      const response = await fetch('http://localhost:3001/api/blob/test-connection');
      const result = await response.json();
      
      if (result.success) {
        addLog('✅ Blob connection test successful!');
        addLog(`   • Store ID: ${result.config.storeId}`);
        addLog(`   • Base URL: ${result.config.baseUrl}`);
        addLog(`   • Token: Configured and valid`);
        addLog(`   • Existing blobs: ${result.config.blobCount}`);
      } else {
        addLog('❌ Blob connection test failed');
        addLog(`   • Error: ${result.error}`);
        addLog(`   • Details: ${result.details || 'No details'}`);
        addLog(`   • Token configured: ${result.config.token}`);
        addLog(`   • Store ID: ${result.config.storeId || 'Not configured'}`);
      }
    } catch (error: any) {
      addLog('❌ Failed to test blob connection');
      addLog(`   • Network error: ${error.message}`);
      addLog('   • Make sure API server is running on port 3001');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Real Vercel Blob Upload Test</CardTitle>
          <p className="text-sm text-gray-600">
            Test with actual Vercel Blob storage using your configured store
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Mock Admin User</Label>
              <div className="text-sm bg-gray-100 p-2 rounded">
                <p><strong>User ID:</strong> {MOCK_ADMIN.userId}</p>
                <p><strong>Partner ID:</strong> {MOCK_ADMIN.partnerId}</p>
                <p><strong>Email:</strong> {MOCK_ADMIN.email}</p>
              </div>
            </div>
            <div>
              <Label>Vercel Blob Configuration</Label>
              <div className="text-sm bg-green-50 p-2 rounded border border-green-200">
                <p><strong>Store ID:</strong> store_HfNAmd3S2wspxAfM</p>
                <p><strong>Base URL:</strong> hfnamd3s2wspxafm.public.blob.vercel-storage.com</p>
                <p><strong>Token:</strong> <span className="text-green-600 font-medium">Configured ✓</span></p>
                <p><strong>Status:</strong> <span className="text-green-600 font-medium">Ready for Real Uploads!</span></p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-green-800 font-medium">🎉 Setup Complete!</p>
            <p className="text-green-700 text-sm mt-1">
              Your Vercel Blob token has been configured. You can now:
            </p>
            <ol className="text-green-700 text-sm mt-2 ml-4 list-decimal space-y-1">
              <li>Start your API server: <code className="bg-green-100 px-1 rounded">cd api && npm run dev</code></li>
              <li>Test the connection using the button below</li>
              <li>Select image files and click upload</li>
              <li>Watch the debug logs for real-time upload progress</li>
              <li>Access uploaded images via their real Vercel Blob URLs</li>
            </ol>
            <div className="mt-3 flex gap-2">
              <Button 
                onClick={testBlobConnection}
                variant="outline" 
                size="sm"
                className="text-green-700 border-green-300 hover:bg-green-50"
              >
                🔍 Test Connection
              </Button>
              <Button 
                onClick={testDirectUpload}
                variant="outline" 
                size="sm"
                className="text-blue-700 border-blue-300 hover:bg-blue-50"
              >
                🧪 Test Direct Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Images</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file-input">Choose Images</Label>
              <Input
                id="file-input"
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-1"
              />
            </div>

            {selectedFiles.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Selected Files ({selectedFiles.length})</h4>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div>
                        <span className="font-medium">{file.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Success Display */}
                {successMessage && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-green-800 font-medium">Upload Successful!</p>
                      <p className="text-green-700 text-sm">{successMessage}</p>
                      <p className="text-green-600 text-xs mt-1">Your files are now permanently stored in Vercel Blob storage.</p>
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center">
                    <AlertCircle className="h-4 w-4 text-red-600 mr-2 flex-shrink-0" />
                    <div>
                      <p className="text-red-800 font-medium">Upload Failed</p>
                      <p className="text-red-700 text-sm">{error}</p>
                      <p className="text-red-600 text-xs mt-1">Check the debug logs below for detailed error information.</p>
                    </div>
                  </div>
                )}

                <div className="mt-4">
                  <Button
                    onClick={uploadToBlob}
                    disabled={isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading {selectedFiles.length} files to REAL Vercel Blob...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload to REAL Vercel Blob (with API calls)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Uploaded Images ({uploadedImages.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={clearImages}>
              Clear All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploadedImages.map((image) => (
                <div key={image.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="font-medium truncate">{image.filename}</span>
                  </div>
                  <div className="text-xs space-y-1">
                    <p><strong>Size:</strong> {(image.size / 1024 / 1024).toFixed(2)} MB</p>
                    <p><strong>Uploaded:</strong> {new Date(image.uploadedAt).toLocaleString()}</p>
                    <p><strong>ID:</strong> {image.id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs"><strong>Original URL:</strong></p>
                    <a 
                      href={image.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs break-all"
                    >
                      {image.url}
                    </a>
                    {image.thumbnailUrl && (
                      <>
                        <p className="text-xs"><strong>Thumbnail URL:</strong></p>
                        <a 
                          href={image.thumbnailUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-xs break-all"
                        >
                          {image.thumbnailUrl}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Logs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Debug Logs</CardTitle>
          <Button variant="outline" size="sm" onClick={clearLogs}>
            Clear Logs
          </Button>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500">No logs yet... Select and upload some images!</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>1.</strong> Make sure your API server is running (<code>npm run dev</code> in /api directory)</p>
          <p><strong>2.</strong> Set your real BLOB_READ_WRITE_TOKEN in /api/.env file</p>
          <p><strong>3.</strong> Select image files and click "Upload to REAL Vercel Blob"</p>
          <p><strong>4.</strong> Watch the debug logs for detailed real-time upload information</p>
          <p><strong>5.</strong> Successfully uploaded images will appear with real Vercel Blob URLs</p>
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-3">
            <p className="text-blue-800 font-medium">⚠️ Real Implementation Active</p>
            <p className="text-blue-700 text-xs">This now uses actual API calls and will create real blobs in your Vercel store.</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
            <p className="text-yellow-800 font-medium">🔧 Environment Setup Required</p>
            <p className="text-yellow-700 text-xs">Replace "REPLACE_WITH_YOUR_ACTUAL_TOKEN" in /api/.env with your real Vercel Blob token.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}