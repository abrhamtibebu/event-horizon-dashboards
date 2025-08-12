import { useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import evellaAnalytics from '@/lib/evellaAnalytics'

export const useEvellaTracking = () => {
  const location = useLocation()
  const pageLoadTime = useRef<number>(0)
  const startTime = useRef<number>(0)

  // Track page view when location changes
  useEffect(() => {
    const endTime = performance.now()
    const loadTime = endTime - startTime.current
    
    evellaAnalytics.trackPageView(location.pathname, loadTime)
    
    // Reset for next page
    startTime.current = performance.now()
  }, [location.pathname])

  // Initialize page load timing
  useEffect(() => {
    startTime.current = performance.now()
  }, [])

  // Track user clicks
  const trackClick = useCallback((target: string, details?: Record<string, any>) => {
    evellaAnalytics.trackInteraction('click', target, details)
  }, [])

  // Track form submissions
  const trackFormSubmit = useCallback((formName: string, success: boolean, details?: Record<string, any>) => {
    evellaAnalytics.trackInteraction('form_submit', formName, {
      success,
      ...details
    }, undefined, success)
  }, [])

  // Track API calls
  const trackApiCall = useCallback((endpoint: string, duration: number, success: boolean, error?: string) => {
    evellaAnalytics.trackInteraction('api_call', endpoint, {
      duration,
      success,
      error
    }, duration, success)
  }, [])

  // Track navigation
  const trackNavigation = useCallback((from: string, to: string, duration: number) => {
    evellaAnalytics.trackInteraction('navigation', `${from} -> ${to}`, {
      from,
      to,
      duration
    }, duration)
  }, [])

  // Track event-specific actions
  const trackEventAction = useCallback((
    eventId: string,
    eventTitle: string,
    action: 'view' | 'edit' | 'delete' | 'publish' | 'unpublish' | 'duplicate',
    details?: Record<string, any>
  ) => {
    evellaAnalytics.trackEventEngagement(eventId, eventTitle, action as any, details)
  }, [])

  // Track user management actions
  const trackUserAction = useCallback((
    action: 'view' | 'create' | 'edit' | 'delete' | 'suspend' | 'activate',
    targetUserId?: string,
    details?: Record<string, any>
  ) => {
    evellaAnalytics.trackInteraction('click', `user_${action}`, {
      action,
      targetUserId,
      ...details
    })
  }, [])

  // Track organizer actions
  const trackOrganizerAction = useCallback((
    action: 'view' | 'create' | 'edit' | 'delete' | 'suspend' | 'activate',
    organizerId?: string,
    details?: Record<string, any>
  ) => {
    evellaAnalytics.trackInteraction('click', `organizer_${action}`, {
      action,
      organizerId,
      ...details
    })
  }, [])

  // Track report generation
  const trackReportGeneration = useCallback((
    reportType: string,
    format: 'pdf' | 'csv' | 'excel',
    duration: number,
    success: boolean
  ) => {
    evellaAnalytics.trackInteraction('form_submit', `report_${reportType}`, {
      reportType,
      format,
      duration,
      success
    }, duration, success)
  }, [])

  // Track badge operations
  const trackBadgeOperation = useCallback((
    operation: 'design' | 'print' | 'locate' | 'assign',
    eventId?: string,
    details?: Record<string, any>
  ) => {
    evellaAnalytics.trackInteraction('click', `badge_${operation}`, {
      operation,
      eventId,
      ...details
    })
  }, [])

  // Track vendor operations
  const trackVendorOperation = useCallback((
    operation: 'assign' | 'view' | 'edit' | 'track',
    vendorId?: string,
    details?: Record<string, any>
  ) => {
    evellaAnalytics.trackInteraction('click', `vendor_${operation}`, {
      operation,
      vendorId,
      ...details
    })
  }, [])

  // Track usher operations
  const trackUsherOperation = useCallback((
    operation: 'assign' | 'view' | 'checkin' | 'manage',
    eventId?: string,
    details?: Record<string, any>
  ) => {
    evellaAnalytics.trackInteraction('click', `usher_${operation}`, {
      operation,
      eventId,
      ...details
    })
  }, [])

  // Track settings changes
  const trackSettingsChange = useCallback((
    setting: string,
    oldValue: any,
    newValue: any,
    success: boolean
  ) => {
    evellaAnalytics.trackInteraction('form_submit', `settings_${setting}`, {
      setting,
      oldValue,
      newValue,
      success
    }, undefined, success)
  }, [])

  // Track search within dashboard
  const trackDashboardSearch = useCallback((
    query: string,
    results: number,
    duration: number,
    filters?: Record<string, any>
  ) => {
    evellaAnalytics.trackSearch(query, results, duration, filters)
  }, [])

  // Track error occurrences
  const trackError = useCallback((
    error: Error,
    componentStack?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    evellaAnalytics.trackError(error, componentStack, severity)
  }, [])

  // Track performance metrics
  const trackPerformance = useCallback((metrics: {
    pageLoadTime: number
    firstContentfulPaint: number
    largestContentfulPaint: number
    cumulativeLayoutShift: number
    firstInputDelay: number
    timeToInteractive: number
  }) => {
    evellaAnalytics.trackPerformance(metrics)
  }, [])

  // Track user preferences
  const trackUserPreference = useCallback((
    category: string,
    value: any,
    source: 'explicit' | 'inferred' = 'explicit'
  ) => {
    evellaAnalytics.trackUserPreference(category, value, source)
  }, [])

  // Track bulk operations
  const trackBulkOperation = useCallback((
    operation: 'delete' | 'export' | 'update' | 'assign',
    itemType: string,
    count: number,
    success: boolean
  ) => {
    evellaAnalytics.trackInteraction('form_submit', `bulk_${operation}`, {
      operation,
      itemType,
      count,
      success
    }, undefined, success)
  }, [])

  // Track file operations
  const trackFileOperation = useCallback((
    operation: 'upload' | 'download' | 'delete',
    fileType: string,
    fileSize?: number,
    success: boolean
  ) => {
    evellaAnalytics.trackInteraction('form_submit', `file_${operation}`, {
      operation,
      fileType,
      fileSize,
      success
    }, undefined, success)
  }, [])

  // Track authentication events
  const trackAuthEvent = useCallback((
    event: 'login' | 'logout' | 'password_reset' | 'profile_update',
    success: boolean,
    details?: Record<string, any>
  ) => {
    evellaAnalytics.trackInteraction('form_submit', `auth_${event}`, {
      event,
      success,
      ...details
    }, undefined, success)
  }, [])

  // Track notification interactions
  const trackNotificationInteraction = useCallback((
    action: 'view' | 'dismiss' | 'click',
    notificationType: string,
    notificationId?: string
  ) => {
    evellaAnalytics.trackInteraction('click', `notification_${action}`, {
      action,
      notificationType,
      notificationId
    })
  }, [])

  // Track sidebar navigation
  const trackSidebarNavigation = useCallback((menuItem: string) => {
    evellaAnalytics.trackNavigation(location.pathname, `/dashboard/${menuItem}`, 0)
  }, [location.pathname])

  // Track data export
  const trackDataExport = useCallback((
    dataType: string,
    format: 'csv' | 'json' | 'excel' | 'pdf',
    recordCount: number,
    success: boolean
  ) => {
    evellaAnalytics.trackInteraction('form_submit', `export_${dataType}`, {
      dataType,
      format,
      recordCount,
      success
    }, undefined, success)
  }, [])

  // Track data import
  const trackDataImport = useCallback((
    dataType: string,
    format: 'csv' | 'json' | 'excel',
    recordCount: number,
    success: boolean
  ) => {
    evellaAnalytics.trackInteraction('form_submit', `import_${dataType}`, {
      dataType,
      format,
      recordCount,
      success
    }, undefined, success)
  }, [])

  return {
    // Basic tracking
    trackClick,
    trackFormSubmit,
    trackApiCall,
    trackNavigation,
    trackError,
    trackPerformance,
    trackUserPreference,
    
    // Domain-specific tracking
    trackEventAction,
    trackUserAction,
    trackOrganizerAction,
    trackReportGeneration,
    trackBadgeOperation,
    trackVendorOperation,
    trackUsherOperation,
    trackSettingsChange,
    trackDashboardSearch,
    
    // Advanced tracking
    trackBulkOperation,
    trackFileOperation,
    trackAuthEvent,
    trackNotificationInteraction,
    trackSidebarNavigation,
    trackDataExport,
    trackDataImport,
  }
}

export default useEvellaTracking
