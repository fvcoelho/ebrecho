'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TestResult {
  endpoint: string;
  method: string;
  status: number | string;
  time: number;
  data?: any;
  error?: string;
  timestamp: string;
}

export default function ApiTestPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('password123');
  const [apiUrl, setApiUrl] = useState('');
  const [mounted, setMounted] = useState(false);
  const [detectedEnvironment, setDetectedEnvironment] = useState('');

  // Function to detect environment and set correct API URL
  const detectEnvironment = () => {
    if (typeof window === 'undefined') return { env: 'server', apiUrl: '' };
    
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Environment detection logic
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return {
        env: 'development',
        apiUrl: 'http://localhost:3001'
      };
    } else if (hostname === 'www.ebrecho.com.br' || hostname === 'ebrecho.com.br') {
      return {
        env: 'production',
        apiUrl: 'https://api.ebrecho.com.br'
      };
    } else if (hostname.includes('vercel.app')) {
      return {
        env: 'preview',
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.ebrecho.com.br'
      };
    } else {
      // Default fallback
      return {
        env: 'unknown',
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.ebrecho.com.br'
      };
    }
  };

  useEffect(() => {
    setMounted(true);
    const { env, apiUrl: detectedApiUrl } = detectEnvironment();
    setDetectedEnvironment(env);
    setApiUrl(detectedApiUrl);
  }, []);

  const addResult = (result: TestResult) => {
    setResults(prev => [result, ...prev]);
  };

  const testEndpoint = async (
    endpoint: string,
    method: string = 'GET',
    body?: any,
    requiresAuth: boolean = false
  ) => {
    const startTime = Date.now();
    const fullUrl = `${apiUrl}${endpoint}`;
    
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Add auth token if available and required
      if (requiresAuth && typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(fullUrl, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const timeElapsed = Date.now() - startTime;
      const data = await response.text();
      
      let jsonData;
      try {
        jsonData = JSON.parse(data);
      } catch {
        jsonData = data;
      }

      // Handle token extraction for login endpoint
      if (endpoint === '/api/auth/login' && response.ok && jsonData?.data?.token && typeof window !== 'undefined') {
        localStorage.setItem('token', jsonData.data.token);
        console.log('Token saved to localStorage');
      }

      addResult({
        endpoint,
        method,
        status: response.status,
        time: timeElapsed,
        data: jsonData,
        timestamp: new Date().toISOString(),
      });

      return response;
    } catch (error) {
      const timeElapsed = Date.now() - startTime;
      addResult({
        endpoint,
        method,
        status: 'ERROR',
        time: timeElapsed,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults([]);

    // Test 1: Health Check
    console.log('Testing health endpoint...');
    await testEndpoint('/health');
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 2: Root endpoint
    console.log('Testing root endpoint...');
    await testEndpoint('/');
    
    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 3: Login (this is the problematic one)
    console.log('Testing login endpoint...');
    try {
      await testEndpoint('/api/auth/login', 'POST', {
        email,
        password,
      });
    } catch (error) {
      console.error('Login test failed:', error);
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 4: Public test endpoint  
    console.log('Testing public API endpoint...');
    await testEndpoint('/api/public/test');

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test 5: Protected endpoint (if logged in)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Testing protected endpoint...');
        await testEndpoint('/api/auth/me', 'GET', undefined, true);
      }
    }

    setLoading(false);
  };

  const testSingleEndpoint = async (endpoint: string, method: string = 'GET', body?: any) => {
    setLoading(true);
    await testEndpoint(endpoint, method, body);
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  const getStatusColor = (status: number | string) => {
    if (status === 'ERROR') return 'text-red-600';
    if (typeof status === 'number') {
      if (status >= 200 && status < 300) return 'text-green-600';
      if (status >= 400 && status < 500) return 'text-yellow-600';
      if (status >= 500) return 'text-red-600';
    }
    return 'text-gray-600';
  };

  const getTimeColor = (time: number) => {
    if (time < 1000) return 'text-green-600';
    if (time < 5000) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">API Connection Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Configuration</CardTitle>
          <CardDescription>
            Configure the API endpoint and test credentials
            {mounted && detectedEnvironment && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                Environment: {detectedEnvironment}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="api-url">API URL</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const { env, apiUrl: detectedApiUrl } = detectEnvironment();
                  setDetectedEnvironment(env);
                  setApiUrl(detectedApiUrl);
                }}
                disabled={!mounted}
              >
                Auto-detect
              </Button>
            </div>
            <Input
              id="api-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://api.ebrecho.com.br"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Test Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <Label htmlFor="password">Test Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={runAllTests} disabled={loading}>
              {loading ? 'Testing...' : 'Run All Tests'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => testSingleEndpoint('/health')}
              disabled={loading}
            >
              Test Health
            </Button>
            <Button 
              variant="outline" 
              onClick={() => testSingleEndpoint('/api/auth/login', 'POST', { email, password })}
              disabled={loading}
            >
              Test Login
            </Button>
            <Button variant="destructive" onClick={clearResults}>
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            {results.length} test{results.length !== 1 ? 's' : ''} executed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {results.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click "Run All Tests" to start.</p>
          ) : (
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-sm font-semibold">
                        {result.method} {result.endpoint}
                      </span>
                      <div className="flex gap-4 mt-1 text-sm">
                        <span className={getStatusColor(result.status)}>
                          Status: {result.status}
                        </span>
                        <span className={getTimeColor(result.time)}>
                          Time: {result.time}ms
                        </span>
                        <span className="text-gray-500">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {result.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                      <p className="text-sm text-red-600">Error: {result.error}</p>
                    </div>
                  )}
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                        Response Data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                        {typeof result.data === 'string' 
                          ? result.data 
                          : JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {mounted && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-sm text-gray-800 mb-2">Environment Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <p><span className="font-medium">Client Origin:</span> {window.location.origin}</p>
              <p><span className="font-medium">Detected Environment:</span> {detectedEnvironment}</p>
              <p><span className="font-medium">API URL:</span> {apiUrl}</p>
            </div>
            <div>
              <p><span className="font-medium">Build Environment:</span> {process.env.NODE_ENV}</p>
              <p><span className="font-medium">NEXT_PUBLIC_API_URL:</span> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
              <p><span className="font-medium">Hostname:</span> {window.location.hostname}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}