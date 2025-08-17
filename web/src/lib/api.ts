import axios from 'axios';
import { getApiBaseUrl } from './api-config';

// Use centralized API configuration
const API_BASE = getApiBaseUrl();

// Log the API URL in development
if (process.env.NODE_ENV !== 'production') {
  console.log('API URL configured as:', API_BASE, typeof window === 'undefined' ? '(server-side)' : '(client-side)');
}

// Create axios instance with dynamic base URL
export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add debugging interceptors
api.interceptors.request.use(
  (config) => {
    console.log('[DEBUG] API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    return config;
  },
  (error) => {
    console.error('[DEBUG] API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('[DEBUG] API Response Success:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('[DEBUG] API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

// Add auth token to requests (only on client-side)
if (typeof window !== 'undefined') {
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('[AUTH DEBUG] Request interceptor:', {
        url: config.url,
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        user: user ? JSON.parse(user) : null
      });
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Handle auth errors (only on client-side)
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      // Only redirect to login on 401 if not already on login/register pages
      if (error.response?.status === 401 && 
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/cadastro')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface OnboardingStatus {
  isComplete: boolean;
  requiresPartnerSetup: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    partnerId: string | null;
  };
  partner: Record<string, unknown> | null;
}

export interface PartnerSetupData {
  name: string;
  email: string;
  phone: string;
  document: string;
  documentType: 'CPF' | 'CNPJ';
  description?: string;
  hasPhysicalStore: boolean;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/auth/login', credentials);
      
      // Handle both response structures for compatibility
      const authData = response.data.data || response.data;
      
      if (!authData.token || !authData.user) {
        throw new Error('Invalid response structure from server');
      }
      
      return authData;
    } catch (error: unknown) {
      // Re-throw with cleaner error structure
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      if (axiosError.response?.data?.error) {
        throw new Error(axiosError.response.data.error);
      }
      if (axiosError.response?.status === 401) {
        throw new Error('Email ou senha inválidos');
      }
      throw new Error('Erro ao fazer login. Tente novamente.');
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post('/api/auth/register', data);
    return response.data.data; // API returns {success: true, data: {user, token}}
  },

  async me(): Promise<AuthResponse['user']> {
    const response = await api.get('/api/auth/me');
    return response.data.data; // API returns {success: true, data: user}
  },

  async logout(): Promise<void> {
    await api.post('/api/auth/logout');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async verifyEmail(token: string): Promise<void> {
    const response = await api.post('/api/auth/verify-email', { token });
    return response.data;
  },

  async resendVerification(email: string): Promise<void> {
    const response = await api.post('/api/auth/resend-verification', { email });
    return response.data;
  },

  async forgotPassword(email: string): Promise<void> {
    const response = await api.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await api.post('/api/auth/refresh');
      const authData = response.data.data || response.data;
      
      if (!authData.token || !authData.user) {
        throw new Error('Invalid response structure from server');
      }
      
      return authData;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { error?: string }; status?: number } };
      if (axiosError.response?.data?.error) {
        throw new Error(axiosError.response.data.error);
      }
      if (axiosError.response?.status === 401) {
        throw new Error('Invalid or expired refresh token');
      }
      throw new Error('Error refreshing token. Please login again.');
    }
  },
};

export const onboardingService = {
  async getStatus(): Promise<OnboardingStatus> {
    const response = await api.get('/api/onboarding/status');
    return response.data.data;
  },

  async completePartnerSetup(data: PartnerSetupData): Promise<{ token?: string }> {
    const response = await api.post('/api/onboarding/complete-partner', data);
    return response.data;
  }
};

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  category: string;
  brand?: string;
  size?: string;
  color?: string;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR';
  status: 'AVAILABLE' | 'SOLD' | 'RESERVED' | 'INACTIVE';
  images: ProductImage[];
  partnerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  originalUrl: string;
  processedUrl: string;
  thumbnailUrl: string;
  order: number;
  metadata?: Record<string, unknown>;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  status?: Product['status'];
  category?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: string;
  sku?: string;
  category: string;
  brand?: string;
  size?: string;
  color?: string;
  condition: Product['condition'];
  status?: Product['status'];
}

export interface Category {
  name: string;
  count: number;
}

export const productService = {
  async getProducts(filters: ProductFilters = {}): Promise<ProductsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    const response = await api.get(`/api/products?${params.toString()}`);
    const data = response.data.data;
    
    // Ensure price is a number for all products
    if (data.products) {
      data.products = data.products.map((product: any) => ({
        ...product,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price
      }));
    }
    
    return data;
  },

  async getProductById(id: string): Promise<Product> {
    const response = await api.get(`/api/products/${id}`);
    const product = response.data.data;
    
    // Ensure price is a number
    if (product && typeof product.price === 'string') {
      product.price = parseFloat(product.price);
    }
    
    return product;
  },

  async createProduct(data: CreateProductData): Promise<Product> {
    console.log('📤 productService.createProduct called with data:', {
      name: data.name,
      price: data.price,
      category: data.category,
      condition: data.condition,
      status: data.status,
      hasSku: !!data.sku,
      hasBrand: !!data.brand,
      hasDescription: !!data.description
    });

    const response = await api.post('/api/products', data);
    console.log('✅ productService.createProduct API response:', {
      success: response.data.success,
      productId: response.data.data?.id,
      productName: response.data.data?.name,
      imagesCount: response.data.data?.images?.length || 0,
      status: response.status
    });

    const product = response.data.data;
    
    // Ensure price is a number
    if (product && typeof product.price === 'string') {
      product.price = parseFloat(product.price);
    }
    
    return product;
  },

  async updateProduct(id: string, data: Partial<CreateProductData>): Promise<Product> {
    const response = await api.put(`/api/products/${id}`, data);
    const product = response.data.data;
    
    // Ensure price is a number
    if (product && typeof product.price === 'string') {
      product.price = parseFloat(product.price);
    }
    
    return product;
  },

  async updateProductStatus(id: string, status: Product['status']): Promise<Product> {
    const response = await api.patch(`/api/products/${id}/status`, { status });
    const product = response.data.data;
    
    // Ensure price is a number
    if (product && typeof product.price === 'string') {
      product.price = parseFloat(product.price);
    }
    
    return product;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/api/products/${id}`);
  },

  async getCategories(): Promise<Category[]> {
    const response = await api.get('/api/products/categories');
    return response.data.data;
  }
};

export interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  document: string;
  documentType: 'CPF' | 'CNPJ';
  description?: string;
  logo?: string;
  hasPhysicalStore: boolean;
  // Fields for public storefront (will be added via migration)
  slug?: string;
  publicDescription?: string;
  isPublicActive?: boolean;
  publicBanner?: string;
  publicLogo?: string;
  whatsappNumber?: string;
  publicEmail?: string;
  businessHours?: Record<string, unknown>;
  socialLinks?: Record<string, unknown>;
  pixKey?: string;
  isActive: boolean;
  address?: {
    id: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UpdatePartnerData {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  documentType?: 'CPF' | 'CNPJ';
  description?: string;
  slug?: string;
  publicDescription?: string;
  isPublicActive?: boolean;
  hasPhysicalStore?: boolean;
  whatsappNumber?: string;
  publicEmail?: string;
  businessHours?: Record<string, unknown>;
  socialLinks?: Record<string, unknown>;
  pixKey?: string;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
}

export const partnerService = {
  async getCurrentPartner(): Promise<Partner> {
    const response = await api.get('/api/dashboard/partner');
    return response.data.data;
  },

  async updateCurrentPartner(data: UpdatePartnerData): Promise<Partner> {
    const response = await api.put('/api/dashboard/partner', data);
    return response.data.data;
  },

  async getPartnerById(id: string): Promise<Partner> {
    const response = await api.get(`/api/partners/${id}`);
    return response.data.data;
  },

  async updatePartner(id: string, data: UpdatePartnerData): Promise<Partner> {
    const response = await api.put(`/api/partners/${id}`, data);
    return response.data.data;
  }
};