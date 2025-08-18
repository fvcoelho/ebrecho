'use client'

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { initAnalytics, AnalyticsTracker } from '@/lib/analytics'

interface AnalyticsContextType {
  analytics: AnalyticsTracker | null
  trackPageView: (data?: any) => void
  trackClick: (element: HTMLElement) => void
  trackCustomEvent: (eventName: string, data?: Record<string, any>) => void
  setPartnerId: (partnerId: string) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null)

interface AnalyticsProviderProps {
  children: React.ReactNode
  partnerId?: string
  enabled?: boolean
}

export function AnalyticsProvider({ 
  children, 
  partnerId, 
  enabled = true 
}: AnalyticsProviderProps) {
  const analyticsRef = useRef<AnalyticsTracker | null>(null)

  useEffect(() => {
    if (enabled && typeof window !== 'undefined') {
      // Try to detect partner ID from URL if not provided
      let detectedPartnerId = partnerId
      
      if (!detectedPartnerId && typeof window !== 'undefined') {
        const path = window.location.pathname
        // Check if we're on a partner storefront page (/[slug]/...)
        const slugMatch = path.match(/^\/([^\/]+)/)
        if (slugMatch && slugMatch[1] && 
            !['dashboard', 'admin', 'login', 'cadastro', 'produtos', 'vendas', 'api', '_next'].includes(slugMatch[1])) {
          // This looks like a partner slug, we'd need to resolve it to partner ID
          // For now, we'll use the user's partner ID from auth context if available
          const authData = localStorage.getItem('user')
          if (authData) {
            try {
              const user = JSON.parse(authData)
              detectedPartnerId = user.partnerId
            } catch (e) {
              console.warn('Failed to parse user data for partner ID')
            }
          }
        } else {
          // Try to get partner ID from authenticated user
          const authData = localStorage.getItem('user')
          if (authData) {
            try {
              const user = JSON.parse(authData)
              detectedPartnerId = user.partnerId
            } catch (e) {
              console.warn('Failed to parse user data for partner ID')
            }
          }
        }
      }
      
      analyticsRef.current = initAnalytics(detectedPartnerId)
      
      console.log('🔍 Analytics initialized', { 
        providedPartnerId: partnerId, 
        detectedPartnerId, 
        finalPartnerId: detectedPartnerId,
        enabled 
      })
    }

    return () => {
      if (analyticsRef.current) {
        analyticsRef.current.destroy()
      }
    }
  }, [partnerId, enabled])

  const trackPageView = (data?: any) => {
    if (analyticsRef.current && enabled) {
      analyticsRef.current.trackPageView(data)
    }
  }

  const trackClick = (element: HTMLElement) => {
    if (analyticsRef.current && enabled) {
      analyticsRef.current.trackActivity(element, 'click')
    }
  }

  const trackCustomEvent = (eventName: string, data?: Record<string, any>) => {
    if (analyticsRef.current && enabled) {
      analyticsRef.current.trackActivity({
        sessionId: (analyticsRef.current as any).sessionId,
        page: window.location.pathname,
        elementText: eventName,
        elementType: 'custom_event',
        partnerId: (analyticsRef.current as any).partnerId,
        ...data
      })
    }
  }

  const setPartnerId = (newPartnerId: string) => {
    if (analyticsRef.current) {
      analyticsRef.current.setPartnerId(newPartnerId)
    }
  }

  const value: AnalyticsContextType = {
    analytics: analyticsRef.current,
    trackPageView,
    trackClick,
    trackCustomEvent,
    setPartnerId
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext)
  
  if (!context) {
    // Return no-op functions if context is not available
    return {
      analytics: null,
      trackPageView: () => {},
      trackClick: () => {},
      trackCustomEvent: () => {},
      setPartnerId: () => {}
    }
  }
  
  return context
}

// Hook for tracking page views automatically
export function usePageTracking() {
  const { trackPageView } = useAnalytics()
  
  useEffect(() => {
    trackPageView()
  }, [trackPageView])
}

// Hook for tracking element clicks
export function useClickTracking(ref: React.RefObject<HTMLElement>, eventName?: string) {
  const { trackCustomEvent } = useAnalytics()
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const handleClick = () => {
      if (eventName) {
        trackCustomEvent(eventName, {
          elementId: element.id,
          elementText: element.textContent?.trim() || undefined
        })
      }
    }
    
    element.addEventListener('click', handleClick)
    
    return () => {
      element.removeEventListener('click', handleClick)
    }
  }, [ref, eventName, trackCustomEvent])
}