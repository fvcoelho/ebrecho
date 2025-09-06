/**
 * Centralized API configuration utility
 * Provides consistent API URL handling across all components
 */

/**
 * Gets the correct API base URL based on environment
 * This function works both on server and client side
 * Returns the base URL without /api path to avoid double /api/ issues
 */
export function getApiBaseUrl(): string {
  let baseUrl: string;
  
  // Check if we're on client side
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Environment-based URL detection
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      baseUrl = 'http://localhost:3001';
    } else if (hostname === 'dev.ebrecho.com.br') {
      baseUrl = 'http://dev.ebrecho.com.br:3001';
    } else if (hostname === 'www.ebrecho.com.br' || hostname === 'ebrecho.com.br') {
      baseUrl = 'https://api.ebrecho.com.br';
    } else if (hostname.includes('vercel.app')) {
      baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.ebrecho.com.br';
    } else {
      baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.ebrecho.com.br';
    }
  } else {
    // Server-side or fallback
    baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.ebrecho.com.br';
  }
  
  // Remove trailing /api if present to avoid double /api/ in URLs
  if (baseUrl.endsWith('/api')) {
    baseUrl = baseUrl.slice(0, -4);
  }
  
  return baseUrl;
}

/**
 * Gets the API base URL with /api path for endpoints that expect it
 * @deprecated Use getApiBaseUrl() directly as most endpoints don't need /api suffix
 */
export function getApiBaseUrlWithPath(): string {
  const API_BASE = getApiBaseUrl();
  // Most of our API endpoints don't use /api prefix, so return base URL
  return API_BASE;
}

/**
 * Environment detection utility
 */
export function detectEnvironment(): 'development' | 'production' | 'preview' | 'server' {
  if (typeof window === 'undefined') return 'server';
  
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === 'dev.ebrecho.com.br') {
    return 'development';
  } else if (hostname === 'www.ebrecho.com.br' || hostname === 'ebrecho.com.br') {
    return 'production';
  } else if (hostname.includes('vercel.app')) {
    return 'preview';
  }
  
  return 'production'; // Default fallback
}

/**
 * Debug information for API configuration
 */
export function getApiDebugInfo() {
  return {
    API_BASE: getApiBaseUrl(),
    environment: detectEnvironment(),
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
    envVar: process.env.NEXT_PUBLIC_API_URL,
  };
}