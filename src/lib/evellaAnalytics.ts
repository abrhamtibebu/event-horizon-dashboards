import api from './api'

export interface EvellaAnalyticsData {
  // User Interaction Data
  pageViews: PageViewData[]
  userInteractions: UserInteractionData[]
  searchAnalytics: SearchAnalyticsData[]
  performanceMetrics: PerformanceMetricsData[]
  errorLogs: ErrorLogData[]
  
  // Event-specific Analytics
  eventViews: EventViewData[]
  eventRegistrations: EventRegistrationData[]
  eventEngagement: EventEngagementData[]
  
  // User Behavior Data
  userSessions: UserSessionData[]
  userJourneys: UserJourneyData[]
  userPreferences: UserPreferenceData[]
}

export interface PageViewData {
  id: string
  userId?: string
  sessionId: string
  page: string
  url: string
  referrer?: string
  timestamp: string
  userAgent: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  loadTime: number
  timeOnPage: number
}

export interface UserInteractionData {
  id: string
  userId?: string
  sessionId: string
  type: 'click' | 'scroll' | 'search' | 'navigation' | 'form_submit' | 'api_call'
  target: string
  details: Record<string, any>
  timestamp: string
  duration?: number
  success?: boolean
}

export interface SearchAnalyticsData {
  id: string
  userId?: string
  sessionId: string
  query: string
  results: number
  duration: number
  filters: Record<string, any>
  timestamp: string
  clickedResult?: string
  savedSearch?: boolean
}

export interface PerformanceMetricsData {
  id: string
  sessionId: string
  pageLoadTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  timeToInteractive: number
  timestamp: string
  url: string
}

export interface ErrorLogData {
  id: string
  userId?: string
  sessionId: string
  errorId: string
  message: string
  stack?: string
  componentStack?: string
  url: string
  timestamp: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  resolved: boolean
}

export interface EventViewData {
  id: string
  userId?: string
  sessionId: string
  eventId: string
  eventTitle: string
  timestamp: string
  source: 'search' | 'category' | 'featured' | 'direct' | 'social'
  timeSpent: number
  actions: string[]
}

export interface EventRegistrationData {
  id: string
  userId: string
  eventId: string
  eventTitle: string
  registrationType: 'free' | 'ticketed'
  timestamp: string
  guestType?: string
  ticketType?: string
  amount?: number
  source: 'evella' | 'direct' | 'social'
}

export interface EventEngagementData {
  id: string
  userId?: string
  sessionId: string
  eventId: string
  eventTitle: string
  action: 'view' | 'save' | 'share' | 'bookmark' | 'register' | 'cancel'
  timestamp: string
  metadata?: Record<string, any>
}

export interface UserSessionData {
  id: string
  userId?: string
  sessionId: string
  startTime: string
  endTime?: string
  duration: number
  pages: string[]
  interactions: number
  deviceType: 'desktop' | 'mobile' | 'tablet'
  userAgent: string
  ipAddress?: string
  location?: string
}

export interface UserJourneyData {
  id: string
  userId: string
  sessionId: string
  steps: JourneyStep[]
  startTime: string
  endTime?: string
  completed: boolean
  conversion?: string
}

export interface JourneyStep {
  page: string
  action?: string
  timestamp: string
  duration: number
  metadata?: Record<string, any>
}

export interface UserPreferenceData {
  id: string
  userId: string
  category: string
  value: any
  timestamp: string
  source: 'explicit' | 'inferred'
}

// Analytics Service Class
class EvellaAnalyticsService {
  private baseURL: string
  private sessionId: string
  private userId?: string
  private isInitialized: boolean = false

  constructor() {
    // Set the base URL for the analytics API. It first tries to use the environment variable VITE_API_URL.
    // If that is not defined, it falls back to the local development server URL.
    this.baseURL = import.meta.env.VITE_API_URL || 'https://api.validity.et/api'
    this.sessionId = this.generateSessionId()
    this.userId = this.getUserId()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getUserId(): string | undefined {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (user) {
      try {
        const userData = JSON.parse(user)
        return userData.id
      } catch {
        return undefined
      }
    }
    return undefined
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase()
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet'
    }
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(userAgent)) {
      return 'mobile'
    }
    return 'desktop'
  }

  // Initialize analytics
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Send session start event
      await this.trackSessionStart()
      this.isInitialized = true
    } catch (error) {
      console.error('Failed to initialize Evella analytics:', error)
    }
  }

  // Track page view
  async trackPageView(page: string, loadTime: number): Promise<void> {
    const pageViewData: PageViewData = {
      id: `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      sessionId: this.sessionId,
      page,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      deviceType: this.getDeviceType(),
      loadTime,
      timeOnPage: 0
    }

    try {
      await api.post('/analytics/page-view', pageViewData)
    } catch (error) {
      console.error('Failed to track page view:', error)
    }
  }

  // Track user interaction
  async trackInteraction(
    type: UserInteractionData['type'],
    target: string,
    details: Record<string, any> = {},
    duration?: number,
    success?: boolean
  ): Promise<void> {
    const interactionData: UserInteractionData = {
      id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      sessionId: this.sessionId,
      type,
      target,
      details,
      timestamp: new Date().toISOString(),
      duration,
      success
    }

    try {
      await api.post('/analytics/interaction', interactionData)
    } catch (error) {
      console.error('Failed to track interaction:', error)
    }
  }

  // Track search analytics
  async trackSearch(
    query: string,
    results: number,
    duration: number,
    filters: Record<string, any> = {},
    clickedResult?: string,
    savedSearch?: boolean
  ): Promise<void> {
    const searchData: SearchAnalyticsData = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      sessionId: this.sessionId,
      query,
      results,
      duration,
      filters,
      timestamp: new Date().toISOString(),
      clickedResult,
      savedSearch
    }

    try {
      await api.post('/analytics/search', searchData)
    } catch (error) {
      console.error('Failed to track search:', error)
    }
  }

  // Track performance metrics
  async trackPerformance(metrics: Omit<PerformanceMetricsData, 'id' | 'sessionId' | 'timestamp' | 'url'>): Promise<void> {
    const performanceData: PerformanceMetricsData = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...metrics
    }

    try {
      await api.post('/analytics/performance', performanceData)
    } catch (error) {
      console.error('Failed to track performance:', error)
    }
  }

  // Track error
  async trackError(
    error: Error,
    componentStack?: string,
    severity: ErrorLogData['severity'] = 'medium'
  ): Promise<void> {
    const errorData: ErrorLogData = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      sessionId: this.sessionId,
      errorId: `error_${Date.now()}`,
      message: error.message,
      stack: error.stack,
      componentStack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      severity,
      resolved: false
    }

    try {
      await api.post('/analytics/error', errorData)
    } catch (apiError) {
      console.error('Failed to track error:', apiError)
    }
  }

  // Track event view
  async trackEventView(
    eventId: string,
    eventTitle: string,
    source: EventViewData['source'],
    timeSpent: number,
    actions: string[] = []
  ): Promise<void> {
    const eventViewData: EventViewData = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      sessionId: this.sessionId,
      eventId,
      eventTitle,
      timestamp: new Date().toISOString(),
      source,
      timeSpent,
      actions
    }

    try {
      await api.post('/analytics/event-view', eventViewData)
    } catch (error) {
      console.error('Failed to track event view:', error)
    }
  }

  // Track event registration
  async trackEventRegistration(
    eventId: string,
    eventTitle: string,
    registrationType: 'free' | 'ticketed',
    guestType?: string,
    ticketType?: string,
    amount?: number,
    source: EventRegistrationData['source'] = 'evella'
  ): Promise<void> {
    const registrationData: EventRegistrationData = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId!,
      eventId,
      eventTitle,
      registrationType,
      timestamp: new Date().toISOString(),
      guestType,
      ticketType,
      amount,
      source
    }

    try {
      await api.post('/analytics/event-registration', registrationData)
    } catch (error) {
      console.error('Failed to track event registration:', error)
    }
  }

  // Track event engagement
  async trackEventEngagement(
    eventId: string,
    eventTitle: string,
    action: EventEngagementData['action'],
    metadata?: Record<string, any>
  ): Promise<void> {
    const engagementData: EventEngagementData = {
      id: `eng_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      sessionId: this.sessionId,
      eventId,
      eventTitle,
      action,
      timestamp: new Date().toISOString(),
      metadata
    }

    try {
      await api.post('/analytics/event-engagement', engagementData)
    } catch (error) {
      console.error('Failed to track event engagement:', error)
    }
  }

  // Track user preference
  async trackUserPreference(
    category: string,
    value: any,
    source: 'explicit' | 'inferred' = 'explicit'
  ): Promise<void> {
    if (!this.userId) return

    const preferenceData: UserPreferenceData = {
      id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      category,
      value,
      timestamp: new Date().toISOString(),
      source
    }

    try {
      await api.post('/analytics/user-preference', preferenceData)
    } catch (error) {
      console.error('Failed to track user preference:', error)
    }
  }

  // Track session start
  private async trackSessionStart(): Promise<void> {
    const sessionData: UserSessionData = {
      id: this.sessionId,
      userId: this.userId,
      sessionId: this.sessionId,
      startTime: new Date().toISOString(),
      duration: 0,
      pages: [window.location.pathname],
      interactions: 0,
      deviceType: this.getDeviceType(),
      userAgent: navigator.userAgent
    }

    try {
      await api.post('/analytics/session-start', sessionData)
    } catch (error) {
      // Analytics failures should not break the app
      console.warn('Analytics session tracking failed (this is normal if not authenticated):', error.message)
    }
  }

  // Track session end
  async trackSessionEnd(): Promise<void> {
    try {
      await api.post('/analytics/session-end', {
        sessionId: this.sessionId,
        endTime: new Date().toISOString()
      })
    } catch (error) {
      // Analytics failures should not break the app
      console.warn('Analytics session end tracking failed (this is normal if not authenticated):', error.message)
    }
  }

  // Get analytics data for dashboard
  async getAnalyticsData(params: {
    startDate?: string
    endDate?: string
    eventId?: string
    userId?: string
    type?: 'pageviews' | 'interactions' | 'searches' | 'performance' | 'errors' | 'events'
  }): Promise<EvellaAnalyticsData> {
    try {
      const response = await api.get('/analytics/dashboard', { params })
      return response.data
    } catch (error) {
      console.warn('Failed to fetch analytics data (this is normal if not authenticated):', error.message)
      // Return mock data instead of throwing
      return this.getMockAnalyticsData()
    }
  }

  // Get real-time analytics
  async getRealTimeAnalytics(): Promise<{
    activeUsers: number
    currentPageViews: number
    recentInteractions: UserInteractionData[]
    recentErrors: ErrorLogData[]
  }> {
    try {
      const response = await api.get('/analytics/realtime')
      return response.data
    } catch (error) {
      console.warn('Failed to fetch real-time analytics (this is normal if not authenticated):', error.message)
      // Return mock data instead of throwing
      return {
        activeUsers: 0,
        currentPageViews: 0,
        recentInteractions: [],
        recentErrors: []
      }
    }
  }



  // Get mock analytics data for when API is not available
  private getMockAnalyticsData(): EvellaAnalyticsData {
    return {
      summary: {
        totalPageViews: 0,
        totalInteractions: 0,
        totalSearches: 0,
        totalErrors: 0,
        averageLoadTime: 0
      },
      pageViews: [],
      interactions: [],
      searches: [],
      performance: [],
      errors: [],
      events: []
    }
  }

  // Get user journey data
  async getUserJourney(userId: string, startDate?: string, endDate?: string): Promise<UserJourneyData[]> {
    try {
      const response = await api.get(`/analytics/user-journey/${userId}`, {
        params: { startDate, endDate }
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch user journey:', error)
      throw error
    }
  }

  // Get search analytics
  async getSearchAnalytics(params: {
    startDate?: string
    endDate?: string
    query?: string
    limit?: number
  }): Promise<{
    searches: SearchAnalyticsData[]
    popularQueries: Array<{ query: string; count: number }>
    searchTrends: Array<{ date: string; count: number }>
  }> {
    try {
      const response = await api.get('/analytics/search-analytics', { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch search analytics:', error)
      throw error
    }
  }

  // Get performance analytics
  async getPerformanceAnalytics(params: {
    startDate?: string
    endDate?: string
    url?: string
  }): Promise<{
    metrics: PerformanceMetricsData[]
    averages: {
      pageLoadTime: number
      firstContentfulPaint: number
      largestContentfulPaint: number
      cumulativeLayoutShift: number
      firstInputDelay: number
      timeToInteractive: number
    }
    trends: Array<{ date: string; metric: string; value: number }>
  }> {
    try {
      const response = await api.get('/analytics/performance-analytics', { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch performance analytics:', error)
      throw error
    }
  }

  // Get error analytics
  async getErrorAnalytics(params: {
    startDate?: string
    endDate?: string
    severity?: ErrorLogData['severity']
    resolved?: boolean
  }): Promise<{
    errors: ErrorLogData[]
    errorCounts: Array<{ error: string; count: number }>
    errorTrends: Array<{ date: string; count: number }>
  }> {
    try {
      const response = await api.get('/analytics/error-analytics', { params })
      return response.data
    } catch (error) {
      console.error('Failed to fetch error analytics:', error)
      throw error
    }
  }

  // Export analytics data
  async exportAnalyticsData(params: {
    startDate?: string
    endDate?: string
    type: 'pageviews' | 'interactions' | 'searches' | 'performance' | 'errors' | 'events'
    format: 'csv' | 'json' | 'excel'
  }): Promise<Blob> {
    try {
      const response = await api.get('/analytics/export', {
        params,
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Failed to export analytics data:', error)
      throw error
    }
  }
}

// Create singleton instance
export const evellaAnalytics = new EvellaAnalyticsService()

// Initialize analytics when the module is loaded
if (typeof window !== 'undefined') {
  evellaAnalytics.initialize()

  // Track session end when page is unloaded
  window.addEventListener('beforeunload', () => {
    evellaAnalytics.trackSessionEnd()
  })
}

export default evellaAnalytics
