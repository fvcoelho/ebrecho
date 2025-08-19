'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { authService } from '@/lib/api';

interface JWTPayload {
  id?: string;
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  partnerId?: string;
  iat?: number;
  exp?: number;
  [key: string]: any;
}

function parseJWT(token: string): JWTPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
}

export default function TestDashboard() {
  const { user, onboardingStatus, isLoading } = useAuth();
  const [jwtPayload, setJwtPayload] = useState<JWTPayload | null>(null);
  const [rawToken, setRawToken] = useState<string>('');
  const [apiUserData, setApiUserData] = useState<any>(null);
  const [apiError, setApiError] = useState<string>('');

  useEffect(() => {
    // Get token from localStorage and parse it
    const token = localStorage.getItem('token');
    if (token) {
      setRawToken(token);
      const payload = parseJWT(token);
      setJwtPayload(payload);
    }

    // Fetch fresh user data from API
    const fetchApiUser = async () => {
      try {
        const userData = await authService.me();
        setApiUserData(userData);
        setApiError('');
      } catch (error: any) {
        setApiError(error?.response?.data?.error || error?.message || 'Unknown error');
        setApiUserData(null);
      }
    };

    if (token) {
      fetchApiUser();
    }
  }, []);

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">JWT Token Debug Dashboard</h1>
        
        {/* Auth Context User */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-blue-600">Auth Context User</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>ID:</strong> {user?.id || 'NOT SET'}</div>
            <div><strong>Email:</strong> {user?.email || 'NOT SET'}</div>
            <div><strong>Name:</strong> {user?.name || 'NOT SET'}</div>
            <div><strong>Role:</strong> {user?.role || 'NOT SET'}</div>
            <div><strong>Partner ID:</strong> {user?.partnerId || 'NOT SET'}</div>
            <div><strong>Has Partner:</strong> {user?.partnerId ? 'YES' : 'NO'}</div>
          </div>
          <div className="mt-4">
            <strong>Full User Object:</strong>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        </div>

        {/* JWT Token Payload */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-green-600">JWT Token Payload</h2>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><strong>ID:</strong> {jwtPayload?.id || 'NOT SET'}</div>
            <div><strong>User ID:</strong> {jwtPayload?.userId || 'NOT SET'}</div>
            <div><strong>Email:</strong> {jwtPayload?.email || 'NOT SET'}</div>
            <div><strong>Name:</strong> {jwtPayload?.name || 'NOT SET'}</div>
            <div><strong>Role:</strong> {jwtPayload?.role || 'NOT SET'}</div>
            <div><strong>Partner ID:</strong> {jwtPayload?.partnerId || 'NOT SET'}</div>
            <div><strong>Issued At:</strong> {jwtPayload?.iat ? new Date(jwtPayload.iat * 1000).toLocaleString() : 'NOT SET'}</div>
            <div><strong>Expires:</strong> {jwtPayload?.exp ? new Date(jwtPayload.exp * 1000).toLocaleString() : 'NOT SET'}</div>
          </div>
          <div>
            <strong>Full JWT Payload:</strong>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(jwtPayload, null, 2)}
            </pre>
          </div>
        </div>

        {/* Raw Token */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">Raw JWT Token</h2>
          <div className="text-sm">
            <strong>Token Length:</strong> {rawToken.length} characters
          </div>
          <div className="mt-2">
            <strong>Raw Token:</strong>
            <textarea 
              readOnly 
              value={rawToken}
              className="mt-2 w-full h-32 p-3 bg-gray-100 rounded text-xs font-mono"
            />
          </div>
        </div>

        {/* API User Data */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-orange-600">Fresh API User Data (/auth/me)</h2>
          {apiError ? (
            <div className="text-red-500">
              <strong>API Error:</strong> {apiError}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><strong>ID:</strong> {apiUserData?.id || 'NOT SET'}</div>
                <div><strong>Email:</strong> {apiUserData?.email || 'NOT SET'}</div>
                <div><strong>Name:</strong> {apiUserData?.name || 'NOT SET'}</div>
                <div><strong>Role:</strong> {apiUserData?.role || 'NOT SET'}</div>
                <div><strong>Partner ID:</strong> {apiUserData?.partnerId || 'NOT SET'}</div>
                <div><strong>Has Partner:</strong> {apiUserData?.partnerId ? 'YES' : 'NO'}</div>
              </div>
              <div>
                <strong>Full API Response:</strong>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(apiUserData, null, 2)}
                </pre>
              </div>
            </>
          )}
        </div>

        {/* Onboarding Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Onboarding Status</h2>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><strong>Is Complete:</strong> {onboardingStatus?.isComplete ? 'YES' : 'NO'}</div>
            <div><strong>Requires Partner Setup:</strong> {onboardingStatus?.requiresPartnerSetup ? 'YES' : 'NO'}</div>
            <div><strong>User ID:</strong> {onboardingStatus?.user?.id || 'NOT SET'}</div>
            <div><strong>User Partner ID:</strong> {onboardingStatus?.user?.partnerId || 'NOT SET'}</div>
          </div>
          <div>
            <strong>Full Onboarding Status:</strong>
            <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
              {JSON.stringify(onboardingStatus, null, 2)}
            </pre>
          </div>
        </div>

        {/* Token Comparison */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-indigo-600">Token vs API Comparison</h2>
          <div className="space-y-2 text-sm">
            <div className={`p-2 rounded ${
              jwtPayload?.partnerId === apiUserData?.partnerId ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <strong>Partner ID Match:</strong> {
                jwtPayload?.partnerId === apiUserData?.partnerId ? 'YES ✅' : 'NO ❌'
              }
            </div>
            <div className={`p-2 rounded ${
              jwtPayload?.id === apiUserData?.id || jwtPayload?.userId === apiUserData?.id ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <strong>User ID Match:</strong> {
                jwtPayload?.id === apiUserData?.id || jwtPayload?.userId === apiUserData?.id ? 'YES ✅' : 'NO ❌'
              }
            </div>
            <div className={`p-2 rounded ${
              jwtPayload?.role === apiUserData?.role ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <strong>Role Match:</strong> {
                jwtPayload?.role === apiUserData?.role ? 'YES ✅' : 'NO ❌'
              }
            </div>
          </div>
        </div>

        {/* LocalStorage Debug */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-teal-600">LocalStorage Contents</h2>
          <div className="space-y-4 text-sm">
            <div>
              <strong>Has Token:</strong> {localStorage.getItem('token') ? 'YES' : 'NO'}
            </div>
            <div>
              <strong>Has User:</strong> {localStorage.getItem('user') ? 'YES' : 'NO'}
            </div>
            {localStorage.getItem('user') && (
              <div>
                <strong>Stored User:</strong>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {localStorage.getItem('user')}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}