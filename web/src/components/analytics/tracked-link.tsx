'use client'

import React, { forwardRef } from 'react'
import Link from 'next/link'
import { useAnalytics } from '@/contexts/analytics-context'

interface TrackedLinkProps extends React.ComponentProps<typeof Link> {
  trackingName?: string
  trackingData?: Record<string, any>
  children: React.ReactNode
}

export const TrackedLink = forwardRef<HTMLAnchorElement, TrackedLinkProps>(
  ({ trackingName, trackingData, onClick, href, children, ...props }, ref) => {
    const { trackCustomEvent } = useAnalytics()
    
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      // Track the click
      if (trackingName) {
        trackCustomEvent(trackingName, { href, ...trackingData })
      } else {
        // Auto-generate tracking name from link content
        const linkText = typeof children === 'string' 
          ? children 
          : event.currentTarget.textContent?.trim() || 'Link Click'
        
        trackCustomEvent(`Link: ${linkText}`, { href, ...trackingData })
      }
      
      // Call original onClick handler
      if (onClick) {
        onClick(event)
      }
    }
    
    return (
      <Link ref={ref} href={href} onClick={handleClick} {...props}>
        {children}
      </Link>
    )
  }
)

TrackedLink.displayName = 'TrackedLink'