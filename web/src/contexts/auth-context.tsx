'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService, onboardingService, OnboardingStatus } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  partnerId?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  onboardingStatus: OnboardingStatus | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: 'CUSTOMER' | 'PROMOTER' | 'PARTNER_ADMIN') => Promise<{ user: User; token: string }>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  checkOnboardingStatus: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        
        if (token && savedUser) {
          setUser(JSON.parse(savedUser));
          // Optionally validate token by calling /auth/me
          try {
            const userData = await authService.me();
            setUser(userData);
          } catch {
            // Token might be invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      console.log('AuthContext: Fetching onboarding status...');
      const status = await onboardingService.getStatus();
      console.log('AuthContext: Onboarding status received:', status);
      setOnboardingStatus(status);
    } catch (error) {
      console.error('AuthContext: Error checking onboarding status:', error);
      setOnboardingStatus(null);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Starting login process...');
      const response = await authService.login({ email, password });
      console.log('AuthContext: Login successful, user:', response.user);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      
      // Check onboarding status after login
      console.log('AuthContext: Checking onboarding status after login...');
      await checkOnboardingStatus();
    } catch (error) {
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role?: 'CUSTOMER' | 'PROMOTER' | 'PARTNER_ADMIN') => {
    try {
      console.log('[DEBUG AUTH] Register function called with:', { name, email, role });
      const finalRole = role || 'CUSTOMER';
      console.log('[DEBUG AUTH] Final role being sent to API:', finalRole);
      
      const response = await authService.register({ name, email, password, role: finalRole });
      console.log('[DEBUG AUTH] Registration API response:', response);
      
      // Don't auto-login after registration - user needs to verify email first
      // localStorage.setItem('token', response.token);
      // localStorage.setItem('user', JSON.stringify(response.user));
      // setUser(response.user);
      return response;
    } catch (error) {
      console.error('[DEBUG AUTH] Registration error in auth context:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setUser(null);
      setOnboardingStatus(null);
      // Redirect to home page using window.location
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      console.log('Updating user profile:', userData);
      
      // Call the API to update user data
      const updatedUser = await authService.updateUser(user.id, {
        name: userData.name,
        email: userData.email
      });
      
      // Update local state with new user data
      const newUserData = { ...user, ...updatedUser };
      setUser(newUserData);
      localStorage.setItem('user', JSON.stringify(newUserData));
      
      console.log('User profile updated successfully:', newUserData);
      return;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const refreshUserData = async () => {
    try {
      console.log('AuthContext: Refreshing user data...');
      const userData = await authService.me();
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('AuthContext: User data refreshed:', userData);
    } catch (error) {
      console.error('AuthContext: Error refreshing user data:', error);
      throw error;
    }
  };

  const refreshToken = async () => {
    try {
      console.log('AuthContext: Refreshing token...');
      const response = await authService.refreshToken();
      console.log('AuthContext: Token refresh successful, user:', response.user);
      
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      setUser(response.user);
      
      console.log('AuthContext: Token and user data refreshed');
    } catch (error) {
      console.error('AuthContext: Error refreshing token:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    onboardingStatus,
    login,
    register,
    logout,
    updateProfile,
    checkOnboardingStatus,
    refreshUserData,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}