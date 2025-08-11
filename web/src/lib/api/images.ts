import { api } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/api-config';

export interface ProductImage {
  id: string
  productId: string
  originalUrl: string
  processedUrl: string
  thumbnailUrl: string
  order: number
  metadata?: any
  createdAt: string
}

export interface ImageUploadResponse {
  success: boolean
  data: {
    images: ProductImage[]
    uploaded: number
    total: number
  }
}

export const imageApi = {
  // Upload multiple images to a product
  async uploadImages(productId: string, files: File[]): Promise<ProductImage[]> {
    console.log('📤 imageApi.uploadImages called:', {
      productId,
      filesCount: files.length,
      fileNames: files.map(f => f.name),
      fileSizes: files.map(f => f.size)
    });

    const formData = new FormData()
    files.forEach((file, index) => {
      console.log(`📎 Adding file ${index + 1} to FormData:`, {
        name: file.name,
        size: file.size,
        type: file.type
      });
      formData.append('images', file)
    })

    console.log('📡 Sending upload request to:', `/images/products/${productId}/images`);

    const response = await api.post<ImageUploadResponse>(
      `/images/products/${productId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )

    console.log('✅ Upload response received:', {
      success: response.data.success,
      uploadedCount: response.data.data.uploaded,
      totalCount: response.data.data.total,
      imagesCount: response.data.data.images.length,
      sampleImage: response.data.data.images[0] ? {
        id: response.data.data.images[0].id,
        thumbnailUrl: response.data.data.images[0].thumbnailUrl,
        originalUrl: response.data.data.images[0].originalUrl
      } : null
    });

    return response.data.data.images
  },

  // Delete a specific image
  async deleteImage(productId: string, imageId: string): Promise<void> {
    await api.delete(`/images/products/${productId}/images/${imageId}`)
  },

  // Reorder images for a product
  async reorderImages(productId: string, images: ProductImage[]): Promise<ProductImage[]> {
    const imageOrders = images.map(img => ({
      imageId: img.id,
      order: img.order
    }))

    const response = await api.put<{ success: boolean; data: ProductImage[] }>(
      `/images/products/${productId}/images/reorder`,
      { imageOrders }
    )

    return response.data.data
  },

  // Crop/edit an existing image
  async cropImage(
    productId: string, 
    imageId: string, 
    cropData: { x: number; y: number; width: number; height: number }
  ): Promise<ProductImage> {
    const response = await api.put<{ success: boolean; data: ProductImage }>(
      `/images/products/${productId}/images/${imageId}/crop`,
      { cropData }
    )

    return response.data.data
  },

  // Get full image URL (with API base URL)
  getImageUrl(relativeUrl: string): string {
    console.log('🔗 imageApi.getImageUrl called:', { relativeUrl });
    
    if (relativeUrl.startsWith('http')) {
      console.log('✅ URL is already absolute:', relativeUrl);
      return relativeUrl
    }
    
    // Get the API base URL - no need to remove /api suffix as getApiBaseUrl returns clean base URL
    const API_BASE = getApiBaseUrl();
    const fullUrl = `${API_BASE}${relativeUrl}`;
    
    console.log('🔗 Constructed image URL:', {
      relativeUrl,
      API_BASE,
      fullUrl
    });
    
    return fullUrl;
  }
}