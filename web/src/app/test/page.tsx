'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DatabaseStats {
  totals: {
    users: number;
    partners: number;
    products: number;
  };
  active: {
    users: number;
    availableProducts: number;
  };
  timestamp: string;
}

export default function TestPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDatabaseStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/database/stats', { timeout: 10000 });
      
      if (response.data.success && response.data.data) {
        const stats: DatabaseStats = {
          totals: response.data.data.totals,
          active: response.data.data.active,
          timestamp: response.data.data.timestamp
        };
        setDatabaseStats(stats);
      } else {
        setError('Invalid response format');
      }
    } catch (error: unknown) {
      console.error('Failed to fetch database stats:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { error?: string } } };
        if (axiosError.response?.status === 401) {
          setError('Authentication required. Please log in to view statistics.');
        } else if (axiosError.response?.data?.error) {
          setError(`Error: ${axiosError.response.data.error}`);
        } else {
          setError('Failed to fetch database statistics. Please try again.');
        }
      } else {
        setError('Failed to fetch database statistics. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDatabaseStats();
    } else if (!authLoading && !isAuthenticated) {
      setLoading(false);
      setError('Please log in to view database statistics.');
    }
  }, [authLoading, isAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            📊 Database Statistics
          </h1>
          {isAuthenticated && user && (
            <p className="text-gray-600 mt-2">
              Welcome, {user.name} ({user.role})
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🗄️ eBrecho Database Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(loading || authLoading) && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">
                  {authLoading ? 'Checking authentication...' : 'Loading statistics...'}
                </p>
              </div>
            )}

            {error && (
              <div className="text-center py-8">
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <strong>Error:</strong> {error}
                </div>
                {isAuthenticated ? (
                  <button 
                    onClick={fetchDatabaseStats}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry
                  </button>
                ) : (
                  <a 
                    href="/login"
                    className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Go to Login
                  </a>
                )}
              </div>
            )}

            {databaseStats && !loading && !error && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{databaseStats.totals.users}</div>
                    <div className="text-sm text-gray-600 mt-1">Total Users</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{databaseStats.totals.partners}</div>
                    <div className="text-sm text-gray-600 mt-1">Total Partners</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{databaseStats.totals.products}</div>
                    <div className="text-sm text-gray-600 mt-1">Total Products</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-600">{databaseStats.active.users}</div>
                    <div className="text-sm text-gray-600 mt-1">Active Users</div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <div className="text-3xl font-bold text-indigo-600">{databaseStats.active.availableProducts}</div>
                    <div className="text-sm text-gray-600 mt-1">Available Products</div>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(databaseStats.timestamp).toLocaleString()}
                  </p>
                  <button 
                    onClick={fetchDatabaseStats}
                    className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    disabled={loading}
                  >
                    Refresh Stats
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}