import axios from 'axios';
import { getApiBaseUrl } from '@/lib/api-config';

// Create a separate API client for public endpoints that doesn't add auth headers
const API_BASE = getApiBaseUrl();

export const publicApi = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add debugging interceptors for public API
publicApi.interceptors.request.use(
  (config) => {
    console.log('[DEBUG] Public API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    return config;
  },
  (error) => {
    console.error('[DEBUG] Public API Request Error:', error);
    return Promise.reject(error);
  }
);

publicApi.interceptors.response.use(
  (response) => {
    console.log('[DEBUG] Public API Response Success:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('[DEBUG] Public API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export interface PublicStore {
  id: string
  name: string
  slug: string
  description?: string
  publicEmail?: string
  whatsappNumber?: string
  whatsappName?: string
  publicBanner?: string
  publicLogo?: string
  businessHours?: any
  socialLinks?: any
  pixKey?: string
  isPublicActive: boolean
  createdAt: string
  productCount: number
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
}

export interface PublicProduct {
  id: string
  slug: string
  name: string
  description?: string
  price: number
  category: string
  size?: string
  condition: string
  viewCount: number
  publicTags?: string[]
  isAvailable: boolean
  images: Array<{
    id: string
    thumbnailUrl?: string
    processedUrl?: string
    originalUrl?: string
    order: number
  }>
  createdAt: string
}

export interface ProductsResponse {
  products: PublicProduct[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ProductQuery {
  page?: number
  limit?: number
  sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular'
  category?: string
  search?: string
  min_price?: number
  max_price?: number
}

// Get public store by slug
export async function getPublicStore(slug: string): Promise<PublicStore> {
  console.log('[DEBUG] getPublicStore called with slug:', slug)
  console.log('[DEBUG] Making request to:', `/api/public/store/${slug}`)
  
  try {
    const response = await publicApi.get(`/api/public/store/${slug}`)
    console.log('[DEBUG] getPublicStore response status:', response.status)
    console.log('[DEBUG] getPublicStore response data:', JSON.stringify(response.data, null, 2))
    return response.data.data
  } catch (error: any) {
    console.error('[DEBUG] getPublicStore error:', error)
    console.error('[DEBUG] Error response:', error.response?.data)
    console.error('[DEBUG] Error status:', error.response?.status)
    console.error('[DEBUG] Error config:', error.config)
    throw error
  }
}

// Get store categories
export async function getStoreCategories(slug: string): Promise<Array<{ category: string; count: number }>> {
  const response = await publicApi.get(`/api/public/store/${slug}/categories`)
  return response.data.data
}

// Get public products for a store
export async function getPublicProducts(
  slug: string, 
  query?: ProductQuery
): Promise<ProductsResponse> {
  const params = new URLSearchParams()
  
  if (query?.page) params.append('page', query.page.toString())
  if (query?.limit) params.append('limit', query.limit.toString())
  if (query?.sort) params.append('sort', query.sort)
  if (query?.category) params.append('category', query.category)
  if (query?.search) params.append('search', query.search)
  if (query?.min_price) params.append('min_price', query.min_price.toString())
  if (query?.max_price) params.append('max_price', query.max_price.toString())
  
  const response = await publicApi.get(`/api/public/store/${slug}/products?${params.toString()}`)
  return response.data.data
}

// Get single product by slug
export async function getPublicProduct(storeSlug: string, productSlug: string): Promise<{
  product: PublicProduct & {
    sku?: string
    brand?: string
    color?: string
    updatedAt: string
  }
  relatedProducts: Array<{
    id: string
    slug: string
    name: string
    price: number
    images: Array<{ thumbnailUrl?: string }>
  }>
}> {
  const response = await publicApi.get(`/api/public/store/${storeSlug}/product/${productSlug}`)
  return response.data.data
}

// Register store view (analytics)
export async function registerStoreView(slug: string): Promise<void> {
  await publicApi.post(`/api/public/store/${slug}/view`)
}

// Register product view (analytics)
export async function registerProductView(storeSlug: string, productId: string): Promise<void> {
  await publicApi.post(`/api/public/store/${storeSlug}/product/${productId}/view`)
}