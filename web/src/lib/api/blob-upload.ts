import { upload } from '@vercel/blob/client';
import { api } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/api-config';

export interface BlobUploadConfig {
  uploadUrl: string;
  maxFiles: number;
  maxSize: number;
  allowedContentTypes: string[];
  clientPayload: string;
}

export interface BlobInfo {
  url: string;
  pathname: string;
  size: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class BlobUploadService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = getApiBaseUrl();
  }

  /**
   * Request upload token from API
   */
  async getUploadToken(productId?: string, fileCount?: number): Promise<BlobUploadConfig> {
    console.log('🔑 Requesting upload token', { productId, fileCount });

    try {
      // If productId starts with "temp-", don't send it to the API
      const actualProductId = productId && !productId.startsWith('temp-') ? productId : undefined;
      
      const response = await api.post('/api/blob/upload-token', {
        productId: actualProductId,
        fileCount
      });

      console.log('✅ Upload token received', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error getting upload token:', error);
      throw error;
    }
  }

  /**
   * Upload a single file directly to Vercel Blob
   */
  async uploadFile(
    file: File,
    config: BlobUploadConfig,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<BlobInfo> {
    console.log('📤 Uploading file to Blob using direct method', {
      filename: file.name,
      size: file.size,
      type: file.type
    });

    try {
      // Validate file type
      if (config.allowedContentTypes && !config.allowedContentTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} not allowed`);
      }

      // Validate file size
      if (config.maxSize && file.size > config.maxSize) {
        throw new Error(`File size exceeds maximum of ${config.maxSize} bytes`);
      }

      // Convert file to FormData and upload directly via our API
      const formData = new FormData();
      formData.append('file', file);
      formData.append('filename', file.name);
      
      // Parse client payload to get user info
      const payload = JSON.parse(config.clientPayload);
      formData.append('userId', payload.userId);
      formData.append('partnerId', payload.partnerId);

      // Upload directly through our API endpoint
      const response = await api.post('/api/blob/direct-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.loaded && progressEvent.total) {
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100)
            });
          }
        }
      });

      console.log('✅ File uploaded successfully', {
        url: response.data.blob.url,
        pathname: response.data.blob.pathname
      });

      return {
        url: response.data.blob.url,
        pathname: response.data.blob.pathname,
        size: file.size
      };
    } catch (error) {
      console.error('❌ Error uploading file:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files to Vercel Blob
   */
  async uploadFiles(
    files: File[],
    config: BlobUploadConfig,
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<BlobInfo[]> {
    console.log('📤 Uploading multiple files', {
      count: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });

    // Validate file count
    if (config.maxFiles && files.length > config.maxFiles) {
      throw new Error(`Cannot upload more than ${config.maxFiles} files`);
    }

    const uploadPromises = files.map((file, index) =>
      this.uploadFile(
        file,
        config,
        onProgress ? (progress) => onProgress(index, progress) : undefined
      )
    );

    try {
      const results = await Promise.all(uploadPromises);
      console.log('✅ All files uploaded successfully', {
        count: results.length
      });
      return results;
    } catch (error) {
      console.error('❌ Error uploading files:', error);
      throw error;
    }
  }

  /**
   * Upload product images
   */
  async uploadProductImages(
    productId: string,
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<any> {
    console.log('🖼️ Uploading product images', {
      productId,
      fileCount: files.length
    });

    try {
      // Step 1: Get upload token
      const config = await this.getUploadToken(productId, files.length);

      // Step 2: Upload files directly to Blob
      const blobs = await this.uploadFiles(files, config, onProgress);

      // Step 3: Try to notify API of upload completion
      // Skip if using temporary ID or if this fails
      if (productId && !productId.startsWith('temp-')) {
        try {
          const response = await this.notifyUploadComplete(productId, blobs);
          console.log('✅ Product images uploaded and processed', {
            productId,
            imagesCount: response.images.length
          });
          return response;
        } catch (completionError) {
          console.warn('⚠️ Could not complete product association, but files were uploaded successfully', completionError);
        }
      } else {
        console.log('📋 Skipping product association for temporary ID:', productId);
      }
      
      // Return a simplified response with just the uploaded blob info
      return {
        images: blobs.map((blob, index) => ({
          id: `blob-${Date.now()}-${index}`,
          originalUrl: blob.url,
          thumbnailUrl: blob.url,
          processedUrl: blob.url,
          order: index,
          metadata: {
            pathname: blob.pathname,
            size: blob.size
          }
        })),
        processed: blobs.length,
        total: blobs.length
      };
    } catch (error) {
      console.error('❌ Error uploading product images:', error);
      throw error;
    }
  }

  /**
   * Notify API that upload is complete
   */
  async notifyUploadComplete(productId: string, blobs: BlobInfo[]): Promise<any> {
    console.log('📮 Notifying API of upload completion', {
      productId,
      blobCount: blobs.length
    });

    try {
      const response = await api.post('/api/blob/upload-complete', {
        productId,
        blobs
      });

      console.log('✅ Upload completion processed', response.data.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ Error notifying upload completion:', error);
      throw error;
    }
  }

  /**
   * Delete an image
   */
  async deleteImage(imageId: string): Promise<void> {
    console.log('🗑️ Deleting image', { imageId });

    try {
      await api.delete(`/api/blob/images/${imageId}`);
      console.log('✅ Image deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      throw error;
    }
  }

  /**
   * Generate a preview URL for a file
   */
  generatePreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Clean up preview URLs
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const blobUploadService = new BlobUploadService();