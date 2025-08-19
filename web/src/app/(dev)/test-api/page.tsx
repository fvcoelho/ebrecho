'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { getApiBaseUrl, getApiDebugInfo } from '@/lib/api-config';

interface ErrorInfo {
  message?: string;
  status?: number;
  data?: unknown;
  config?: {
    url?: string;
    baseURL?: string;
    method?: string;
  };
  stack?: string;
}

export default function TestApiPage() {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<ErrorInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const testRegister = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await api.post('/auth/register', {
        email: `test${Date.now()}@example.com`,
        password: 'Test123',
        name: 'Test User',
        role: 'CUSTOMER'
      });
      setResult(response.data as Record<string, unknown>);
    } catch (err) {
      const errorObj = err as { message?: string; response?: { status?: number; data?: unknown }; config?: { url?: string; baseURL?: string; method?: string } };
      setError({
        message: errorObj.message,
        status: errorObj.response?.status,
        data: errorObj.response?.data,
        config: {
          url: errorObj.config?.url,
          baseURL: errorObj.config?.baseURL,
          method: errorObj.config?.method
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const API_BASE = getApiBaseUrl();
      console.log('Testing health endpoint:', `${API_BASE}/health`);
      
      const response = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json() as Record<string, unknown>;
      setResult({
        ...data,
        _debug: getApiDebugInfo()
      });
    } catch (err) {
      const errorObj = err as { message?: string; stack?: string };
      setError({
        message: errorObj.message,
        stack: errorObj.stack,
        _debug: getApiDebugInfo()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">API URL: {getApiBaseUrl()}</h2>
          <p className="text-sm text-gray-600">Environment: {typeof window !== 'undefined' ? getApiDebugInfo().environment : 'server'}</p>
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={testHealth}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Test Health Endpoint
          </button>
          
          <button
            onClick={testRegister}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Test Register Endpoint
          </button>
        </div>
        
        {loading && <p>Loading...</p>}
        
        {result && (
          <div className="mt-4 p-4 bg-green-100 rounded">
            <h3 className="font-semibold">Success:</h3>
            <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-100 rounded">
            <h3 className="font-semibold">Error:</h3>
            <pre className="text-sm overflow-auto">{JSON.stringify(error, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}