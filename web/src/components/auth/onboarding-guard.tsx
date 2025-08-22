'use client';

import React, { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, onboardingStatus, isLoading, checkOnboardingStatus } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirectingRef = useRef(false);

  useEffect(() => {
    // Se o usuário está logado mas não temos o status do onboarding, verificar
    console.log('OnboardingGuard: Effect 1 - Check status', { 
      user: !!user, 
      userRole: user?.role,
      onboardingStatus: !!onboardingStatus, 
      isLoading 
    });
    
    if (user && !onboardingStatus && !isLoading) {
      console.log('OnboardingGuard: Calling checkOnboardingStatus...');
      checkOnboardingStatus();
    }
  }, [user, onboardingStatus, isLoading, checkOnboardingStatus]);

  useEffect(() => {
    // Se temos status do onboarding e ele requer setup do parceiro
    console.log('OnboardingGuard: Effect 2 - Redirect check', { 
      onboardingStatus,
      requiresPartnerSetup: onboardingStatus?.requiresPartnerSetup,
      currentPath: pathname,
      windowPath: typeof window !== 'undefined' ? window.location.pathname : 'server-side'
    });
    
    if (onboardingStatus?.requiresPartnerSetup) {
      console.log('OnboardingGuard: Requires partner setup detected');
      // Redirecionar para setup da loja apenas se não estiver já na página de setup
      if (!pathname.includes('/setup-loja') && !redirectingRef.current) {
        console.log('OnboardingGuard: Redirecting to /setup-loja', { 
          router: !!router, 
          pathname,
          targetRoute: '/setup-loja',
          alreadyRedirecting: redirectingRef.current
        });
        
        redirectingRef.current = true;
        
        // Try router.push with proper async handling
        console.log('OnboardingGuard: Calling router.push immediately');
        router.push('/setup-loja');
        
      } else {
        console.log('OnboardingGuard: Already on setup page or already redirecting', {
          onSetupPage: pathname.includes('/setup-loja'),
          alreadyRedirecting: redirectingRef.current
        });
      }
    } else if (onboardingStatus?.requiresPromoterSetup) {
      console.log('OnboardingGuard: Requires promoter setup detected');
      // Redirecionar para setup-promoter apenas se não estiver já na página de setup
      if (!pathname.includes('/setup-promoter') && !redirectingRef.current) {
        console.log('OnboardingGuard: Redirecting to /setup-promoter', { 
          router: !!router, 
          pathname,
          targetRoute: '/setup-promoter',
          alreadyRedirecting: redirectingRef.current
        });
        
        redirectingRef.current = true;
        
        // Try router.push with proper async handling
        console.log('OnboardingGuard: Calling router.push immediately');
        router.push('/setup-promoter');
        
      } else {
        console.log('OnboardingGuard: Already on promoter setup page or already redirecting', {
          onSetupPage: pathname.includes('/setup-promoter'),
          alreadyRedirecting: redirectingRef.current
        });
      }
    } else if (onboardingStatus) {
      console.log('OnboardingGuard: Onboarding complete or not required', { 
        isComplete: onboardingStatus.isComplete,
        requiresPartnerSetup: onboardingStatus.requiresPartnerSetup 
      });
    }
  }, [onboardingStatus, router]);

  // Reset redirect flag when conditions change
  useEffect(() => {
    console.log('OnboardingGuard: Pathname changed to:', pathname);
    
    // Reset redirect flag when:
    // 1. We successfully reach setup-loja or setup-promoter
    // 2. Onboarding is no longer required
    // 3. User changes (logout/login)
    if (pathname.includes('/setup-loja') || 
        pathname.includes('/setup-promoter') ||
        (!onboardingStatus?.requiresPartnerSetup && !onboardingStatus?.requiresPromoterSetup) ||
        !user) {
      if (redirectingRef.current) {
        console.log('OnboardingGuard: Resetting redirect flag', { 
          pathname, 
          requiresPartnerSetup: onboardingStatus?.requiresPartnerSetup,
          requiresPromoterSetup: onboardingStatus?.requiresPromoterSetup,
          hasUser: !!user,
          wasRedirecting: redirectingRef.current 
        });
        redirectingRef.current = false;
      }
    }
  }, [pathname, onboardingStatus?.requiresPartnerSetup, onboardingStatus?.requiresPromoterSetup, user]);

  // Se está carregando, mostrar loading
  if (isLoading) {
    console.log('OnboardingGuard: Showing loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  // Se não há usuário, deixar o componente pai lidar (ProtectedRoute)
  if (!user) {
    console.log('OnboardingGuard: No user, passing through to children');
    return <>{children}</>;
  }

  // Se requer setup do parceiro e não está na página de setup, não renderizar conteúdo
  if (onboardingStatus?.requiresPartnerSetup && !pathname.includes('/setup-loja')) {
    console.log('OnboardingGuard: Showing partner redirect message', { pathname });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Redirecionando para configuração da loja...</div>
      </div>
    );
  }

  // Se requer setup do promoter e não está na página de setup, não renderizar conteúdo
  if (onboardingStatus?.requiresPromoterSetup && !pathname.includes('/setup-promoter')) {
    console.log('OnboardingGuard: Showing promoter redirect message', { pathname });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Redirecionando para configuração do promotor...</div>
      </div>
    );
  }

  // Se o onboarding está completo ou não é necessário, renderizar normalmente
  console.log('OnboardingGuard: Rendering children normally');
  return <>{children}</>;
}