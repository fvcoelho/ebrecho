'use client'

import React, { forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/contexts/analytics-context'

interface TrackedButtonProps extends React.ComponentProps<typeof Button> {
  trackingName?: string
  trackingData?: Record<string, any>
  children: React.ReactNode
}

export const TrackedButton = forwardRef<HTMLButtonElement, TrackedButtonProps>(
  ({ trackingName, trackingData, onClick, children, ...props }, ref) => {
    const { trackCustomEvent } = useAnalytics()
    
    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Track the click
      if (trackingName) {
        trackCustomEvent(trackingName, trackingData)
      } else {
        // Auto-generate tracking name from button content
        const buttonText = typeof children === 'string' 
          ? children 
          : event.currentTarget.textContent?.trim() || 'Button Click'
        
        trackCustomEvent(`Button: ${buttonText}`, trackingData)
      }
      
      // Call original onClick handler
      if (onClick) {
        onClick(event)
      }
    }
    
    return (
      <Button ref={ref} onClick={handleClick} {...props}>
        {children}
      </Button>
    )
  }
)

TrackedButton.displayName = 'TrackedButton'