/**
 * Centralized API configuration utility
 * Provides consistent API URL handling across all components
 */

/**
 * Gets the correct API base URL based on environment
 * This function works both on server and client side
 */
export function getApiBaseUrl(): string {
  // Check if we're on client side
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Environment-based URL detection
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    } else if (hostname === 'dev.ebrecho.com.br') {
      return 'http://dev.ebrecho.com.br:3001';
    } else if (hostname === 'www.ebrecho.com.br' || hostname === 'ebrecho.com.br') {
      return 'https://api.ebrecho.com.br';
    } else if (hostname.includes('vercel.app')) {
      return process.env.NEXT_PUBLIC_API_URL || 'https://api.ebrecho.com.br';
    }
  }
  
  // Server-side or fallback
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.ebrecho.com.br';
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