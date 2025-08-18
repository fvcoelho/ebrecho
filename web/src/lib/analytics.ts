// Analytics tracking utilities for eBrecho

interface SessionData {
  sessionId: string
  ipAddress?: string
  userAgent?: string
  referrer?: string
  landingPage?: string
  browser?: string
  city?: string
  country?: string
  device?: string
  headers?: Record<string, string>
  language?: string
  os?: string
  region?: string
  colorDepth?: number
  screenResolution?: string
  timezone?: string
  viewport?: string
  partnerId?: string
}

interface PageViewData {
  sessionId: string
  page: string
  title?: string
  timeSpent?: number
  partnerId?: string
}

interface ActivityData {
  sessionId: string
  page: string
  elementId?: string
  elementText?: string
  elementType?: string
  partnerId?: string
}

class AnalyticsTracker {
  private sessionId: string
  private partnerId?: string
  private isEnabled: boolean = true
  private pageStartTime: number = Date.now()
  private heartbeatInterval?: NodeJS.Timeout
  private isServerSide: boolean = typeof window === 'undefined'

  constructor() {
    this.sessionId = this.generateSessionId()
    
    if (!this.isServerSide) {
      this.initializeSession()
      this.setupEventListeners()
      this.startHeartbeat()
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public setPartnerId(partnerId: string) {
    this.partnerId = partnerId
  }

  public enable() {
    this.isEnabled = true
  }

  public disable() {
    this.isEnabled = false
  }

  private async initializeSession() {
    if (!this.isEnabled || this.isServerSide) return

    try {
      const sessionData: SessionData = {
        sessionId: this.sessionId,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || undefined,
        landingPage: window.location.href,
        browser: this.getBrowserName(),
        language: navigator.language,
        os: this.getOSName(),
        colorDepth: screen.colorDepth,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        partnerId: this.partnerId,
        device: this.getDeviceType()
      }

      // Get geolocation if available
      const location = await this.getLocation()
      if (location.city) sessionData.city = location.city
      if (location.country) sessionData.country = location.country
      if (location.region) sessionData.region = location.region

      await this.sendRequest('/api/analytics/sessions', 'POST', sessionData)
      
      console.log('📊 Analytics session initialized:', this.sessionId)
    } catch (error) {
      console.warn('Failed to initialize analytics session:', error)
    }
  }

  public async trackPageView(customData?: Partial<PageViewData>) {
    if (!this.isEnabled || this.isServerSide) return

    try {
      const pageViewData: PageViewData = {
        sessionId: this.sessionId,
        page: window.location.pathname,
        title: document.title,
        partnerId: this.partnerId,
        ...customData
      }

      await this.sendRequest('/api/analytics/page-views', 'POST', pageViewData)
      
      // Reset page start time for next tracking
      this.pageStartTime = Date.now()
      
      console.log('📄 Page view tracked:', pageViewData.page)
    } catch (error) {
      console.warn('Failed to track page view:', error)
    }
  }

  public async trackActivity(elementOrData: HTMLElement | ActivityData, eventType?: string) {
    if (!this.isEnabled || this.isServerSide) return

    try {
      let activityData: ActivityData

      if (typeof elementOrData === 'object' && 'sessionId' in elementOrData) {
        // Direct data passed
        activityData = elementOrData
      } else {
        // HTML element passed
        const element = elementOrData as HTMLElement
        activityData = {
          sessionId: this.sessionId,
          page: window.location.pathname,
          elementId: element.id || undefined,
          elementText: this.getElementText(element),
          elementType: this.getElementType(element, eventType),
          partnerId: this.partnerId
        }
      }

      await this.sendRequest('/api/analytics/activities', 'POST', activityData)
      
      console.log('🖱️ Activity tracked:', activityData.elementText || activityData.elementId)
    } catch (error) {
      console.warn('Failed to track activity:', error)
    }
  }

  private setupEventListeners() {
    if (this.isServerSide) return

    // Track initial page view immediately if DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      console.log('📄 DOM ready, tracking initial page view')
      this.trackPageView()
    } else {
      // Fallback for pages still loading
      window.addEventListener('load', () => {
        console.log('📄 Window loaded, tracking page view')
        this.trackPageView()
      })
    }

    // Track page views on Next.js client-side navigation
    if (typeof window !== 'undefined' && window.history) {
      const originalPushState = window.history.pushState
      const originalReplaceState = window.history.replaceState
      
      window.history.pushState = function(...args) {
        originalPushState.apply(window.history, args)
        setTimeout(() => {
          console.log('📄 Navigation detected (pushState), tracking page view')
          analytics?.trackPageView()
        }, 100)
      }
      
      window.history.replaceState = function(...args) {
        originalReplaceState.apply(window.history, args)
        setTimeout(() => {
          console.log('📄 Navigation detected (replaceState), tracking page view')
          analytics?.trackPageView()
        }, 100)
      }
    }

    // Track popstate (back/forward navigation)
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        console.log('📄 Popstate detected, tracking page view')
        this.trackPageView()
      }, 100)
    })
    
    // Track time spent on page before leaving
    window.addEventListener('beforeunload', () => {
      const timeSpent = Math.round((Date.now() - this.pageStartTime) / 1000)
      if (timeSpent > 1) { // Only track if spent more than 1 second
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        navigator.sendBeacon(
          `${apiUrl}/api/analytics/page-views`,
          JSON.stringify({
            sessionId: this.sessionId,
            page: window.location.pathname,
            title: document.title,
            timeSpent,
            partnerId: this.partnerId
          })
        )
      }
    })

    // Track clicks on interactive elements
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (this.isTrackableElement(target)) {
        this.trackActivity(target, 'click')
      }
    })

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const target = event.target as HTMLFormElement
      this.trackActivity({
        sessionId: this.sessionId,
        page: window.location.pathname,
        elementId: target.id || undefined,
        elementText: 'Form Submission',
        elementType: 'form_submit',
        partnerId: this.partnerId
      })
    })

    // Track visibility changes (tab focus/blur)
    document.addEventListener('visibilitychange', () => {
      this.trackActivity({
        sessionId: this.sessionId,
        page: window.location.pathname,
        elementText: document.hidden ? 'Tab Hidden' : 'Tab Visible',
        elementType: document.hidden ? 'tab_blur' : 'tab_focus',
        partnerId: this.partnerId
      })
    })
  }

  private startHeartbeat() {
    if (this.isServerSide) return
    
    // Send periodic updates to keep session alive
    this.heartbeatInterval = setInterval(() => {
      if (this.isEnabled && !document.hidden) {
        this.updateSession({
          viewport: `${window.innerWidth}x${window.innerHeight}`
        })
      }
    }, 60000) // Every minute
  }

  private async updateSession(data: Partial<SessionData>) {
    try {
      await this.sendRequest(`/api/analytics/sessions/${this.sessionId}`, 'PUT', data)
    } catch (error) {
      console.warn('Failed to update session:', error)
    }
  }

  private isTrackableElement(element: HTMLElement): boolean {
    const trackableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']
    const trackableRoles = ['button', 'link', 'tab', 'menuitem']
    const trackableClasses = ['btn', 'button', 'link', 'card', 'product']

    // Check tag name
    if (trackableTags.includes(element.tagName)) {
      return true
    }

    // Check role attribute
    const role = element.getAttribute('role')
    if (role && trackableRoles.includes(role)) {
      return true
    }

    // Check for common button/link classes
    const className = element.className.toLowerCase()
    if (trackableClasses.some(cls => className.includes(cls))) {
      return true
    }

    // Check for click handlers
    if (element.onclick || element.getAttribute('onclick')) {
      return true
    }

    return false
  }

  private getElementText(element: HTMLElement): string {
    // Try different methods to get meaningful text
    let text = element.textContent?.trim() || ''
    
    if (!text) {
      // Try alt text for images
      text = element.getAttribute('alt') || ''
    }
    
    if (!text) {
      // Try aria-label
      text = element.getAttribute('aria-label') || ''
    }
    
    if (!text) {
      // Try title attribute
      text = element.getAttribute('title') || ''
    }
    
    if (!text) {
      // Try placeholder for inputs
      text = element.getAttribute('placeholder') || ''
    }
    
    if (!text) {
      // Try value for buttons/inputs
      text = element.getAttribute('value') || ''
    }
    
    // Limit length and clean up
    return text.substring(0, 100).replace(/\s+/g, ' ').trim()
  }

  private getElementType(element: HTMLElement, eventType?: string): string {
    if (eventType) return eventType
    
    const tagName = element.tagName.toLowerCase()
    const type = element.getAttribute('type')
    const role = element.getAttribute('role')
    
    if (role) return role
    if (tagName === 'input' && type) return `input_${type}`
    if (tagName === 'button') return 'button'
    if (tagName === 'a') return 'link'
    
    return tagName
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent
    
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    if (userAgent.includes('Opera')) return 'Opera'
    
    return 'Unknown'
  }

  private getOSName(): string {
    const userAgent = navigator.userAgent
    
    if (userAgent.includes('Windows')) return 'Windows'
    if (userAgent.includes('Mac')) return 'macOS'
    if (userAgent.includes('Linux')) return 'Linux'
    if (userAgent.includes('Android')) return 'Android'
    if (userAgent.includes('iOS')) return 'iOS'
    
    return 'Unknown'
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'Tablet'
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'Mobile'
    
    return 'Desktop'
  }

  private async getClientIP(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip
    } catch {
      return undefined
    }
  }

  private async getLocation(): Promise<{ city?: string; country?: string; region?: string }> {
    try {
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      return {
        city: data.city,
        country: data.country_name,
        region: data.region
      }
    } catch {
      return {}
    }
  }

  private async sendRequest(url: string, method: string, data: any): Promise<any> {
    // Use full API URL for backend requests
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const fullUrl = url.startsWith('http') ? url : `${apiUrl}${url}`
    
    const response = await fetch(fullUrl, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      throw new Error(`Analytics request failed: ${response.statusText}`)
    }

    return response.json()
  }

  public destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
  }
}

// Create global instance
let analytics: AnalyticsTracker | null = null

export const initAnalytics = (partnerId?: string): AnalyticsTracker => {
  if (!analytics) {
    analytics = new AnalyticsTracker()
  }
  
  if (partnerId) {
    analytics.setPartnerId(partnerId)
  }
  
  return analytics
}

export const getAnalytics = (): AnalyticsTracker | null => analytics

// Convenience functions
export const trackPageView = (data?: Partial<PageViewData>) => {
  analytics?.trackPageView(data)
}

export const trackClick = (element: HTMLElement) => {
  analytics?.trackActivity(element, 'click')
}

export const trackCustomEvent = (eventName: string, data?: Record<string, any>) => {
  if (!analytics) return
  
  analytics.trackActivity({
    sessionId: (analytics as any).sessionId,
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    elementText: eventName,
    elementType: 'custom_event',
    partnerId: (analytics as any).partnerId,
    ...data
  })
}

export const setAnalyticsPartnerId = (partnerId: string) => {
  analytics?.setPartnerId(partnerId)
}

export const enableAnalytics = () => {
  analytics?.enable()
}

export const disableAnalytics = () => {
  analytics?.disable()
}

export default {
  initAnalytics,
  getAnalytics,
  trackPageView,
  trackClick,
  trackCustomEvent,
  setAnalyticsPartnerId,
  enableAnalytics,
  disableAnalytics
}