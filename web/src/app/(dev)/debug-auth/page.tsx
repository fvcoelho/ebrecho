'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { authService } from '@/lib/api';

export default function DebugAuthPage() {
  const { user } = useAuth();
  const [authData, setAuthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAuthData = async () => {
      try {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        console.log('=== DEBUG AUTH PAGE ===');
        console.log('Token exists:', !!token);
        console.log('Token preview:', token ? token.substring(0, 50) + '...' : 'none');
        console.log('Stored user:', storedUser);

        // Try to get user data from API
        const meData = await authService.me();
        
        setAuthData({
          contextUser: user,
          storedUser: storedUser ? JSON.parse(storedUser) : null,
          apiUser: meData,
          token: !!token,
          tokenPreview: token ? token.substring(0, 50) + '...' : null
        });
      } catch (err: any) {
        console.error('Error fetching auth data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAuthData();
  }, [user]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Authentication</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Auth Context User:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(authData?.contextUser, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">LocalStorage User:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(authData?.storedUser, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">API /me Response:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(authData?.apiUser, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Token Info:</h2>
          <p>Token exists: {authData?.token ? 'Yes' : 'No'}</p>
          <p>Token preview: {authData?.tokenPreview || 'N/A'}</p>
        </div>

        <div className="bg-yellow-100 p-4 rounded mt-6">
          <h2 className="font-bold mb-2">Key Observations:</h2>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>User Role: <strong>{authData?.contextUser?.role || 'Not set'}</strong></li>
            <li>Partner ID: <strong>{authData?.contextUser?.partnerId || 'Not set'}</strong></li>
            <li>Can access dashboard: <strong>{['PARTNER_ADMIN', 'PARTNER_USER'].includes(authData?.contextUser?.role) ? 'Yes' : 'No'}</strong></li>
            <li>Dashboard endpoint requires: PARTNER_ADMIN or PARTNER_USER role + partnerId</li>
          </ul>
        </div>
      </div>
    </div>
  );
}