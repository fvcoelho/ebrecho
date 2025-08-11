import { getApiBaseUrl, getApiDebugInfo } from '../api-config';

interface EnhancementOptions {
  quality: 'standard' | 'premium';
  backgroundRemoval: boolean;
  autoOptimize: boolean;
  category?: string;
  provider?: 'deep-image' | 'photoroom' | 'claid';
}

interface EnhancementResult {
  originalUrl: string;
  enhancedUrl: string;
  provider: string;
  processingTime: number;
  qualityScore?: number;
  cost: number;
  metadata: {
    originalSize: number;
    enhancedSize: number;
    dimensions: { width: number; height: number };
    enhancementType: string[];
  };
}

interface EnhancementDebugInfo {
  requestId: string;
  timestamp: string;
  originalImage: {
    filename: string;
    size: number;
    dimensions: { width: number; height: number };
    mimeType: string;
  };
  enhancementOptions: EnhancementOptions;
  providerSelection: {
    selectedProvider: string;
    reason: string;
    availableProviders: string[];
  };
  processingSteps: Array<{
    step: string;
    startTime: string;
    endTime: string;
    duration: number;
    status: 'success' | 'error' | 'warning';
    details?: any;
  }>;
  result?: EnhancementResult;
  error?: {
    code: string;
    message: string;
    stack?: string;
    provider?: string;
  };
}

interface EnhancementResponse {
  success: boolean;
  data?: {
    result: EnhancementResult;
    debug: {
      requestId: string;
      processingTime: number;
      steps: EnhancementDebugInfo['processingSteps'];
      provider: EnhancementDebugInfo['providerSelection'];
    };
  };
  error?: string;
  message?: string;
  debug?: any;
}

interface BatchEnhancementResponse {
  success: boolean;
  data?: {
    results: EnhancementResult[];
    summary: {
      totalImages: number;
      successCount: number;
      totalCost: number;
      averageQualityScore: number;
      providers: string[];
      batchId: string;
    };
    debug: {
      batchId: string;
      processingTime: number;
      detailedResults: Array<{
        requestId: string;
        steps: EnhancementDebugInfo['processingSteps'];
        provider: EnhancementDebugInfo['providerSelection'];
      }>;
    };
  };
  error?: string;
  message?: string;
  debug?: any;
}

interface UsageStats {
  summary: {
    totalRequests: number;
    totalImagesProcessed: number;
    totalCost: number;
    averageCostPerImage: number;
  };
  providerBreakdown: Array<{
    provider: string;
    requests: number;
    imagesProcessed: number;
    totalCost: number;
    averageCostPerImage: number;
  }>;
  recentUsage: Array<{
    id: string;
    provider: string;
    enhancementType: string;
    imagesProcessed: number;
    totalCost: number;
    createdAt: string;
    metadata?: any;
  }>;
  debug: {
    partnerId: string;
    queryFilters: any;
    generatedAt: string;
  };
}

const API_BASE = getApiBaseUrl();

console.log('[AI Enhancement API] Initializing with base URL:', API_BASE);

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  console.log('[AI Enhancement API] Auth headers prepared:', { hasToken: !!token });
  return headers;
};

export const aiEnhancementAPI = {
  async enhanceSingleImage(file: File, options: EnhancementOptions): Promise<EnhancementResponse> {
    const startTime = Date.now();
    console.log('[AI Enhancement API] Starting single image enhancement:', {
      filename: file.name,
      size: file.size,
      type: file.type,
      options,
      timestamp: new Date().toISOString()
    });

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('quality', options.quality);
      formData.append('backgroundRemoval', options.backgroundRemoval.toString());
      formData.append('autoOptimize', options.autoOptimize.toString());
      
      if (options.category) {
        formData.append('category', options.category);
      }
      
      if (options.provider) {
        formData.append('provider', options.provider);
      }

      console.log('[AI Enhancement API] Form data prepared, making request to:', `${API_BASE}/api/ai-enhancement/enhance/single`);

      const response = await fetch(`${API_BASE}/api/ai-enhancement/enhance/single`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const responseData = await response.json();
      const processingTime = Date.now() - startTime;

      console.log('[AI Enhancement API] Single image enhancement response:', {
        status: response.status,
        success: responseData.success,
        processingTime,
        hasResult: !!responseData.data?.result,
        provider: responseData.data?.result?.provider,
        cost: responseData.data?.result?.cost,
        qualityScore: responseData.data?.result?.qualityScore
      });

      if (!response.ok) {
        console.error('[AI Enhancement API] Single image enhancement failed:', {
          status: response.status,
          error: responseData.error,
          message: responseData.message,
          debug: responseData.debug
        });
        throw new Error(`Enhancement failed: ${responseData.message || responseData.error || 'Unknown error'}`);
      }

      return responseData;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('[AI Enhancement API] Single image enhancement error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filename: file.name,
        processingTime,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  async enhanceBatchImages(files: File[], options: EnhancementOptions): Promise<BatchEnhancementResponse> {
    const startTime = Date.now();
    console.log('[AI Enhancement API] Starting batch image enhancement:', {
      fileCount: files.length,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      options,
      timestamp: new Date().toISOString()
    });

    try {
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('images', file);
      });
      
      formData.append('quality', options.quality);
      formData.append('backgroundRemoval', options.backgroundRemoval.toString());
      formData.append('autoOptimize', options.autoOptimize.toString());
      
      if (options.category) {
        formData.append('category', options.category);
      }
      
      if (options.provider) {
        formData.append('provider', options.provider);
      }

      console.log('[AI Enhancement API] Batch form data prepared, making request to:', `${API_BASE}/api/ai-enhancement/enhance/batch`);

      const response = await fetch(`${API_BASE}/api/ai-enhancement/enhance/batch`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const responseData = await response.json();
      const processingTime = Date.now() - startTime;

      console.log('[AI Enhancement API] Batch image enhancement response:', {
        status: response.status,
        success: responseData.success,
        processingTime,
        totalImages: responseData.data?.summary?.totalImages,
        totalCost: responseData.data?.summary?.totalCost,
        providers: responseData.data?.summary?.providers,
        batchId: responseData.data?.summary?.batchId
      });

      if (!response.ok) {
        console.error('[AI Enhancement API] Batch image enhancement failed:', {
          status: response.status,
          error: responseData.error,
          message: responseData.message,
          debug: responseData.debug
        });
        throw new Error(`Batch enhancement failed: ${responseData.message || responseData.error || 'Unknown error'}`);
      }

      return responseData;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('[AI Enhancement API] Batch image enhancement error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileCount: files.length,
        processingTime,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  async enhanceProductImages(productId: string, options: EnhancementOptions): Promise<BatchEnhancementResponse> {
    const startTime = Date.now();
    console.log('[AI Enhancement API] Starting product images enhancement:', {
      productId,
      options,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(`${API_BASE}/api/ai-enhancement/products/${productId}/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(options),
      });

      const responseData = await response.json();
      const processingTime = Date.now() - startTime;

      console.log('[AI Enhancement API] Product images enhancement response:', {
        status: response.status,
        success: responseData.success,
        processingTime,
        productId: responseData.data?.productId,
        totalImages: responseData.data?.summary?.totalImages,
        totalCost: responseData.data?.summary?.totalCost,
        providers: responseData.data?.summary?.providers
      });

      if (!response.ok) {
        console.error('[AI Enhancement API] Product images enhancement failed:', {
          status: response.status,
          error: responseData.error,
          message: responseData.message,
          debug: responseData.debug,
          productId
        });
        throw new Error(`Product enhancement failed: ${responseData.message || responseData.error || 'Unknown error'}`);
      }

      return responseData;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('[AI Enhancement API] Product images enhancement error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        productId,
        processingTime,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  async getUsageStats(filters?: { startDate?: string; endDate?: string; provider?: string }): Promise<{ success: boolean; data?: UsageStats; error?: string }> {
    console.log('[AI Enhancement API] Fetching usage stats:', {
      filters,
      timestamp: new Date().toISOString()
    });

    try {
      const params = new URLSearchParams();
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.provider) params.append('provider', filters.provider);

      const url = `${API_BASE}/api/ai-enhancement/usage${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('[AI Enhancement API] Usage stats request URL:', url);

      const response = await fetch(url, {
        headers: getAuthHeaders(),
      });

      const responseData = await response.json();

      console.log('[AI Enhancement API] Usage stats response:', {
        status: response.status,
        success: responseData.success,
        totalRequests: responseData.data?.summary?.totalRequests,
        totalCost: responseData.data?.summary?.totalCost,
        providersCount: responseData.data?.providerBreakdown?.length
      });

      if (!response.ok) {
        console.error('[AI Enhancement API] Usage stats failed:', {
          status: response.status,
          error: responseData.error,
          message: responseData.message
        });
        throw new Error(`Failed to fetch usage stats: ${responseData.message || responseData.error || 'Unknown error'}`);
      }

      return responseData;
    } catch (error) {
      console.error('[AI Enhancement API] Usage stats error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  },

  async getDebugInfo(requestId: string): Promise<{ success: boolean; data?: EnhancementDebugInfo; error?: string }> {
    console.log('[AI Enhancement API] Fetching debug info:', {
      requestId,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(`${API_BASE}/api/ai-enhancement/debug/${requestId}`, {
        headers: getAuthHeaders(),
      });

      const responseData = await response.json();

      console.log('[AI Enhancement API] Debug info response:', {
        status: response.status,
        success: responseData.success,
        hasData: !!responseData.data,
        requestId
      });

      if (!response.ok) {
        console.error('[AI Enhancement API] Debug info failed:', {
          status: response.status,
          error: responseData.error,
          message: responseData.message,
          requestId
        });
        throw new Error(`Failed to fetch debug info: ${responseData.message || responseData.error || 'Unknown error'}`);
      }

      return responseData;
    } catch (error) {
      console.error('[AI Enhancement API] Debug info error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
};

export type {
  EnhancementOptions,
  EnhancementResult,
  EnhancementDebugInfo,
  EnhancementResponse,
  BatchEnhancementResponse,
  UsageStats
};