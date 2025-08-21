'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { OnboardingGuard } from './onboarding-guard';

type UserRole = 'ADMIN' | 'PARTNER_ADMIN' | 'PARTNER_USER' | 'CUSTOMER' | 'PROMOTER' | 'PARTNER_PROMOTER';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<UserRole>;
  fallbackPath?: string;
  bypassOnboarding?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  fallbackPath = '/login',
  bypassOnboarding = false
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, onboardingStatus } = useAuth();
  const router = useRouter();
  
  console.log('ProtectedRoute: Rendering', { 
    isLoading, 
    isAuthenticated, 
    userRole: user?.role, 
    allowedRoles, 
    bypassOnboarding 
  });

  useEffect(() => {
    console.log('ProtectedRoute: useEffect triggered', { isLoading, isAuthenticated, user: !!user });
    
    if (isLoading) {
      console.log('ProtectedRoute: Still loading, returning early');
      return;
    }

    if (!isAuthenticated) {
      console.log('ProtectedRoute: Not authenticated, redirecting to', fallbackPath);
      router.push(fallbackPath);
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
      console.log('ProtectedRoute: User role not allowed', { userRole: user.role, allowedRoles });
      
      // IMPORTANT: Don't redirect PARTNER_ADMIN if they need onboarding setup
      // Let OnboardingGuard handle the redirect to /setup-loja instead
      if (user.role === 'PARTNER_ADMIN' && onboardingStatus?.requiresPartnerSetup) {
        console.log('ProtectedRoute: PARTNER_ADMIN needs setup, letting OnboardingGuard handle redirect');
        return; // Don't redirect, let OnboardingGuard do it
      }
      
      // Redirect based on user role to prevent loops
      if (user.role === 'CUSTOMER') {
        console.log('ProtectedRoute: Redirecting CUSTOMER to /');
        router.push('/');
      } else if (user.role === 'PARTNER_ADMIN' || user.role === 'PARTNER_USER') {
        console.log('ProtectedRoute: Redirecting PARTNER to /dashboard');
        router.push('/dashboard');
      } else if (user.role === 'PROMOTER' || user.role === 'PARTNER_PROMOTER') {
        console.log('ProtectedRoute: Redirecting PROMOTER to /promoter');
        router.push('/promoter');
      } else if (user.role === 'ADMIN') {
        console.log('ProtectedRoute: Redirecting ADMIN to /admin');
        router.push('/admin');
      }
      return;
    }
    
    console.log('ProtectedRoute: Access granted, proceeding to render');
  }, [isLoading, isAuthenticated, user, allowedRoles, router, fallbackPath, onboardingStatus]);

  if (isLoading) {
    console.log('ProtectedRoute: Rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, rendering null');
    return null;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role as UserRole)) {
    console.log('ProtectedRoute: Role not allowed, rendering null');
    return null;
  }

  // Se bypassOnboarding for true, não aplicar OnboardingGuard
  if (bypassOnboarding) {
    console.log('ProtectedRoute: Bypassing OnboardingGuard, rendering children directly');
    return <>{children}</>;
  }

  console.log('ProtectedRoute: Rendering with OnboardingGuard');
  return (
    <OnboardingGuard>
      {children}
    </OnboardingGuard>
  );
}