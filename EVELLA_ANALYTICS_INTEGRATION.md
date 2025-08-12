# Evella Analytics Integration

This document outlines the comprehensive integration of Evella user tracking and monitoring into the Event Horizon dashboards.

## Overview

The Evella Analytics integration provides real-time user behavior tracking, performance monitoring, and comprehensive analytics for the Event Horizon dashboard platform. This integration allows administrators to gain insights into user interactions, system performance, and business metrics.

## Features

### 📊 Analytics Dashboard
- **Real-time Metrics**: Active users, page views, interactions, and errors
- **Comprehensive Charts**: Line charts, bar charts, pie charts, area charts, radar charts
- **Multiple Tabs**: Overview, Users, Events, Performance, Search, Errors
- **Date Range Filtering**: Customizable time periods for data analysis
- **Export Functionality**: Download analytics data in CSV, JSON, and Excel formats

### 🎯 User Tracking
- **Page Views**: Track which pages users visit and how long they stay
- **User Interactions**: Monitor clicks, form submissions, and navigation patterns
- **Session Analytics**: Analyze user session duration and behavior
- **Device Analytics**: Track desktop, mobile, and tablet usage
- **User Journeys**: Map complete user paths through the application

### 📈 Performance Monitoring
- **Core Web Vitals**: First Contentful Paint, Largest Contentful Paint, Cumulative Layout Shift
- **Load Times**: Page load time tracking and trends
- **API Performance**: Monitor API call durations and success rates
- **Error Tracking**: Comprehensive error logging with severity levels

### 🔍 Search Analytics
- **Search Trends**: Track search volume over time
- **Popular Queries**: Identify most searched terms
- **Search Performance**: Monitor search result quality and user satisfaction
- **Filter Usage**: Track which search filters are most popular

### 📋 Event-Specific Analytics
- **Event Views**: Track which events are most popular
- **Event Registrations**: Monitor registration trends and conversion rates
- **Event Engagement**: Track user actions on event pages
- **Source Attribution**: Identify how users discover events

## Installation & Setup

### 1. Dependencies

The integration requires the following dependencies (already included in package.json):

```json
{
  "recharts": "^2.8.0",
  "date-fns": "^2.30.0",
  "lucide-react": "^0.292.0"
}
```

### 2. File Structure

```
src/
├── lib/
│   └── evellaAnalytics.ts          # Analytics service
├── hooks/
│   └── useEvellaTracking.ts        # React hook for tracking
├── pages/
│   └── EvellaAnalytics.tsx         # Analytics dashboard page
└── components/
    └── AppSidebar.tsx              # Updated with analytics link
```

### 3. API Endpoints

The analytics service expects the following backend endpoints:

```
POST /api/analytics/page-view
POST /api/analytics/interaction
POST /api/analytics/search
POST /api/analytics/performance
POST /api/analytics/error
POST /api/analytics/event-view
POST /api/analytics/event-registration
POST /api/analytics/event-engagement
POST /api/analytics/user-preference
POST /api/analytics/session-start
POST /api/analytics/session-end

GET /api/analytics/dashboard
GET /api/analytics/realtime
GET /api/analytics/user-journey/:userId
GET /api/analytics/search-analytics
GET /api/analytics/performance-analytics
GET /api/analytics/error-analytics
GET /api/analytics/export
```

## Usage

### 1. Basic Tracking

```typescript
import useEvellaTracking from '@/hooks/useEvellaTracking'

function MyComponent() {
  const { trackClick, trackFormSubmit, trackError } = useEvellaTracking()

  const handleButtonClick = () => {
    trackClick('save_button', { component: 'MyComponent' })
    // Your logic here
  }

  const handleFormSubmit = async (data: any) => {
    try {
      await submitForm(data)
      trackFormSubmit('user_registration', true, { userId: data.id })
    } catch (error) {
      trackFormSubmit('user_registration', false, { error: error.message })
      trackError(error, 'MyComponent', 'medium')
    }
  }

  return (
    <button onClick={handleButtonClick}>
      Save
    </button>
  )
}
```

### 2. Event-Specific Tracking

```typescript
const { trackEventAction, trackUserAction, trackOrganizerAction } = useEvellaTracking()

// Track event actions
trackEventAction('event-123', 'Tech Conference 2024', 'edit', {
  field: 'title',
  oldValue: 'Old Title',
  newValue: 'New Title'
})

// Track user management
trackUserAction('create', undefined, {
  role: 'organizer',
  email: 'user@example.com'
})

// Track organizer actions
trackOrganizerAction('suspend', 'org-456', {
  reason: 'policy_violation',
  duration: '30_days'
})
```

### 3. Performance Tracking

```typescript
const { trackPerformance, trackApiCall } = useEvellaTracking()

// Track API calls
const fetchData = async () => {
  const startTime = performance.now()
  try {
    const response = await api.get('/events')
    const duration = performance.now() - startTime
    trackApiCall('/events', duration, true)
    return response.data
  } catch (error) {
    const duration = performance.now() - startTime
    trackApiCall('/events', duration, false, error.message)
    throw error
  }
}

// Track performance metrics
useEffect(() => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          trackPerformance({
            pageLoadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
            firstContentfulPaint: 0, // Will be set by observer
            largestContentfulPaint: 0,
            cumulativeLayoutShift: 0,
            firstInputDelay: 0,
            timeToInteractive: navEntry.domInteractive - navEntry.fetchStart
          })
        }
      })
    })
    observer.observe({ entryTypes: ['navigation'] })
  }
}, [])
```

### 4. Search Tracking

```typescript
const { trackDashboardSearch } = useEvellaTracking()

const handleSearch = async (query: string) => {
  const startTime = performance.now()
  try {
    const results = await searchEvents(query)
    const duration = performance.now() - startTime
    trackDashboardSearch(query, results.length, duration, {
      filters: { status: 'active' }
    })
  } catch (error) {
    trackDashboardSearch(query, 0, 0, { error: error.message })
  }
}
```

### 5. Error Tracking

```typescript
const { trackError } = useEvellaTracking()

// In error boundaries or try-catch blocks
try {
  // Risky operation
} catch (error) {
  trackError(error, 'Component stack trace', 'high')
}

// In React Error Boundary
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  trackError(error, errorInfo.componentStack, 'critical')
}
```

## Analytics Dashboard

### Accessing the Dashboard

1. Navigate to the Event Horizon dashboard
2. Look for "Evella Analytics" in the sidebar (superadmin and admin roles only)
3. Click to access the analytics dashboard

### Dashboard Features

#### Real-time Metrics
- **Active Users**: Number of users currently online
- **Page Views**: Page views in the last 5 minutes
- **Interactions**: User interactions in the last 5 minutes
- **Errors**: Error occurrences in the last 5 minutes

#### Overview Tab
- Page views over time chart
- Device distribution pie chart
- Top pages list

#### Users Tab
- User session duration distribution
- User interaction types breakdown

#### Events Tab
- Most viewed events
- Event registration trends

#### Performance Tab
- Core Web Vitals radar chart
- Load time trends

#### Search Tab
- Search volume trends
- Popular search terms

#### Errors Tab
- Error frequency trends
- Error severity distribution
- Recent errors list

### Exporting Data

1. Navigate to the Export section at the bottom of the dashboard
2. Select the data type (pageviews, interactions, searches, etc.)
3. Choose the format (CSV, JSON, Excel)
4. Click "Export Data" to download

## Configuration

### Environment Variables

```env
VITE_API_URL=http://localhost:8000/api
VITE_ANALYTICS_ENABLED=true
VITE_ANALYTICS_SAMPLE_RATE=1.0
```

### Analytics Service Configuration

```typescript
// In evellaAnalytics.ts
class EvellaAnalyticsService {
  private baseURL: string
  private sampleRate: number

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
    this.sampleRate = parseFloat(import.meta.env.VITE_ANALYTICS_SAMPLE_RATE || '1.0')
  }

  // Only send analytics if sample rate allows
  private shouldTrack(): boolean {
    return Math.random() < this.sampleRate
  }
}
```

## Data Privacy & Security

### Data Collection

The analytics system collects:
- Page view data (URL, timestamp, device type)
- User interactions (clicks, form submissions)
- Performance metrics (load times, Core Web Vitals)
- Error logs (error messages, stack traces)
- Search queries and results
- Event engagement data

### Privacy Considerations

- **User Consent**: Ensure users have consented to analytics tracking
- **Data Anonymization**: Consider anonymizing sensitive user data
- **Data Retention**: Implement data retention policies
- **GDPR Compliance**: Ensure compliance with data protection regulations

### Security Measures

- **HTTPS Only**: All analytics data is transmitted over HTTPS
- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: API endpoints implement rate limiting
- **Access Control**: Analytics dashboard restricted to admin roles

## Troubleshooting

### Common Issues

1. **Analytics not loading**
   - Check API endpoint availability
   - Verify authentication tokens
   - Check browser console for errors

2. **No data appearing**
   - Ensure analytics tracking is enabled
   - Check sample rate configuration
   - Verify date range selection

3. **Performance impact**
   - Reduce tracking frequency
   - Implement sampling
   - Use web workers for heavy processing

### Debug Mode

Enable debug mode to see detailed logging:

```typescript
// In evellaAnalytics.ts
private debug = import.meta.env.DEV || import.meta.env.VITE_ANALYTICS_DEBUG === 'true'

private log(message: string, data?: any) {
  if (this.debug) {
    console.log(`[Evella Analytics] ${message}`, data)
  }
}
```

## Best Practices

### 1. Performance Optimization
- Use sampling for high-traffic applications
- Batch analytics requests when possible
- Implement lazy loading for analytics dashboard

### 2. Data Quality
- Validate all tracking data before sending
- Implement retry logic for failed requests
- Use consistent naming conventions

### 3. User Experience
- Don't block UI for analytics requests
- Provide opt-out mechanisms
- Show loading states for analytics dashboard

### 4. Maintenance
- Regularly review and clean old data
- Monitor analytics system performance
- Update tracking implementation as needed

## API Reference

### Analytics Service Methods

```typescript
// Page tracking
trackPageView(page: string, loadTime: number): Promise<void>

// Interaction tracking
trackInteraction(type: string, target: string, details?: object): Promise<void>

// Search tracking
trackSearch(query: string, results: number, duration: number): Promise<void>

// Performance tracking
trackPerformance(metrics: PerformanceMetrics): Promise<void>

// Error tracking
trackError(error: Error, componentStack?: string, severity?: string): Promise<void>

// Event tracking
trackEventView(eventId: string, eventTitle: string, source: string): Promise<void>
trackEventRegistration(eventId: string, eventTitle: string, type: string): Promise<void>
trackEventEngagement(eventId: string, eventTitle: string, action: string): Promise<void>

// Data retrieval
getAnalyticsData(params: object): Promise<EvellaAnalyticsData>
getRealTimeAnalytics(): Promise<RealTimeData>
exportAnalyticsData(params: object): Promise<Blob>
```

### Hook Methods

```typescript
// Basic tracking
trackClick(target: string, details?: object)
trackFormSubmit(formName: string, success: boolean, details?: object)
trackApiCall(endpoint: string, duration: number, success: boolean, error?: string)
trackNavigation(from: string, to: string, duration: number)

// Domain-specific tracking
trackEventAction(eventId: string, eventTitle: string, action: string, details?: object)
trackUserAction(action: string, targetUserId?: string, details?: object)
trackOrganizerAction(action: string, organizerId?: string, details?: object)
trackReportGeneration(reportType: string, format: string, duration: number, success: boolean)

// Advanced tracking
trackBulkOperation(operation: string, itemType: string, count: number, success: boolean)
trackFileOperation(operation: string, fileType: string, fileSize?: number, success: boolean)
trackAuthEvent(event: string, success: boolean, details?: object)
```

## Support

For technical support or questions about the Evella Analytics integration:

1. Check the troubleshooting section above
2. Review the API documentation
3. Contact the development team
4. Check the project repository for updates

## Changelog

### v1.0.0 (Current)
- Initial implementation of Evella Analytics integration
- Comprehensive dashboard with real-time metrics
- User interaction tracking
- Performance monitoring
- Error tracking and reporting
- Export functionality
- React hooks for easy integration

---

This integration provides a powerful foundation for understanding user behavior and system performance in the Event Horizon dashboard platform.
