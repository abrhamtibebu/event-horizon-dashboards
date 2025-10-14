import axios from 'axios'

  const api = axios.create({
    // baseURL: import.meta.env.VITE_API_URL || 'https://api.validity.et/api',
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',

  headers: {
    'Content-Type': 'application/json',
  },
})

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt')
    const isMockAuth = localStorage.getItem('mock_auth') === 'true'
    
    // Allow public endpoints even in mock mode
    const isPublicEndpoint = config.url?.startsWith('/public/') || 
                            config.url?.startsWith('/events/uuid/') ||
                            config.url?.includes('/register') ||
                            config.url?.includes('/guest-types') ||
                            config.url === '/login' ||
                            config.url === '/register' ||
                            config.url === '/forgot-password' ||
                            config.url === '/reset-password' ||
                            config.url === '/refresh' ||
                            config.url?.startsWith('/analytics/')
    
    if (isMockAuth && !isPublicEndpoint) {
      // In mock mode, reject non-public API calls to prevent 401 errors
      console.log('[API] Mock authentication mode - rejecting API call to prevent 401 errors')
      return Promise.reject(new Error('Mock authentication mode - API calls disabled'))
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else if (!isPublicEndpoint && !isMockAuth) {
      console.warn('[API] No JWT token found in localStorage or sessionStorage. Requests may fail with 401 Unauthorized.')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Do not attempt automatic token refresh; surface 401 to the UI
    if (error.response?.status === 401) {
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api

export const getBadgeTemplates = (eventId: string) =>
  api.get(`/events/${eventId}/badge-templates`)

export const createBadgeTemplate = (
  eventId: string,
  data: { name: string; template_json: any }
) => api.post(`/events/${eventId}/badge-templates`, data)

export const updateBadgeTemplate = (
  eventId: string,
  templateId: string,
  data: { name?: string; template_json?: any }
) => api.put(`/events/${eventId}/badge-templates/${templateId}`, data)

export const deleteBadgeTemplate = (eventId: string, templateId: string) =>
  api.delete(`/events/${eventId}/badge-templates/${templateId}`)

export const getGlobalReport = () => api.get('/reports/summary')

export const getOrganizerReport = () => api.get('/reports/summary')

export const getEventMessages = (eventId: string) =>
  api.get(`/events/${eventId}/messages`)

export const sendEventMessage = (
  eventId: string,
  data: { recipient_id: string; content: string }
) => api.post(`/events/${eventId}/messages`, data)

export const markMessageRead = (messageId: string) =>
  api.post(`/messages/${messageId}/read`)

export const getUnreadMessageCount = () => api.get('/messages/unread/count')

export const getUnreadMessages = () => api.get('/messages/unread')

export const getAllUsers = () => api.get('/users')

export const getEventUshers = (eventId: number) =>
  api.get(`/events/${eventId}/ushers`)

export const assignUshersToEvent = (
  eventId: number,
  ushers: { id: number; tasks: string[] }[]
) => api.post(`/events/${eventId}/ushers`, { ushers });

export const updateUsherTasks = (
  eventId: number,
  usherId: number,
  tasks: string[]
) => api.put(`/events/${eventId}/ushers/${usherId}`, { tasks })

export const removeUsherFromEvent = (eventId: number, usherId: number) =>
  api.delete(`/events/${eventId}/ushers/${usherId}`)

export const getEventById = (eventId: string) => api.get(`/events/${eventId}`)

export const getAllGuests = () => api.get('/guests')

// Fetch all organizers (admin)
export const getAllOrganizers = () => api.get('/organizers')

// Fetch events for the current organizer (organizer)
export const getMyEvents = (status: string = 'draft,active') =>
  api.get('/organizer/events', { params: { status } })

// Fetch events for a specific organizer (admin only)
export const getEventsForOrganizer = (organizerId: number) =>
  api.get(`/admin/organizers/${organizerId}/events`)

export const getAvailableUshers = () => api.get('/ushers/available')

export const getUshers = () => api.get('/ushers')

// Get available ushers for a specific event
export const getAvailableUshersForEvent = (eventId: number) =>
  api.get(`/events/${eventId}/available-ushers`)

// Alternative endpoint for assigning ushers (for backward compatibility)
export const assignUshersToEventAlt = (
  eventId: number,
  ushers: { id: number; tasks: string[] }[]
) => api.post(`/events/${eventId}/assign-ushers`, { ushers })

export const postAttendeesBatch = (eventId: string, attendees: any[]) =>
  api.post(`/events/${eventId}/attendees/batch`, { attendees });

// --- Usher Registration ---
export const createUsherRegistration = (eventId: number, data: any) =>
  api.post(`/events/${eventId}/usher-registrations`, data)
export const getUsherRegistrations = (eventId: number) =>
  api.get(`/events/${eventId}/usher-registrations`)
export const exportUsherRegistrations = (eventId: number) =>
  api.get(`/events/${eventId}/usher-registrations/export`, { responseType: 'blob' })
export const updateUsherRegistrationStatus = (eventId: number, registrationId: number, status: string) =>
  api.patch(`/events/${eventId}/usher-registrations/${registrationId}`, { status })

// --- Short Links ---
export const createShortLink = (eventId: number, registrationData: any, expiresAt?: string) =>
  api.post('/short-links', { event_id: eventId, registration_data: registrationData, expires_at: expiresAt })
export const resolveShortLink = (shortCode: string) =>
  api.get(`/r/${shortCode}`)
export const getShortLinks = (params = {}) =>
  api.get('/short-links', { params })
export const getShortLink = (id: number) =>
  api.get(`/short-links/${id}`)
export const updateShortLink = (id: number, data: any) =>
  api.put(`/short-links/${id}`, data)
export const deleteShortLink = (id: number) =>
  api.delete(`/short-links/${id}`)
export const getShortLinkStats = (id: number) =>
  api.get(`/short-links/${id}/stats`)

// --- Vendor Management API Functions ---

// Vendor CRUD operations
export const getVendors = (params = {}) => api.get('/vendors', { params })
export const getVendorById = (id: number) => api.get(`/vendors/${id}`)
export const createVendor = (data: any) => {
  // Check if data is FormData (for file uploads)
  if (data instanceof FormData) {
    return api.post('/vendors', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }
  return api.post('/vendors', data);
}
export const updateVendor = (id: number, data: any) => api.put(`/vendors/${id}`, data)
export const deleteVendor = (id: number) => api.delete(`/vendors/${id}`)
export const deactivateVendor = (id: number) => api.patch(`/vendors/${id}/deactivate`)
export const activateVendor = (id: number) => api.patch(`/vendors/${id}/activate`)

// Vendor Quotations
export const getVendorQuotations = (params = {}) => api.get('/vendors/quotations', { params })
export const getVendorQuotationById = (id: number) => api.get(`/vendors/quotations/${id}`)
export const createVendorQuotation = (data: any) => api.post('/vendors/quotations', data)
export const updateVendorQuotation = (id: number, data: any) => api.put(`/vendors/quotations/${id}`, data)
export const deleteVendorQuotation = (id: number) => api.delete(`/vendors/quotations/${id}`)
export const approveVendorQuotation = (id: number) => api.post(`/vendors/quotations/${id}/approve`)
export const rejectVendorQuotation = (id: number, reason: string) => api.post(`/vendors/quotations/${id}/reject`, { rejection_reason: reason })

// Vendor Payments
export const getVendorPayments = (params = {}) => api.get('/vendors/payments', { params })
export const getVendorPaymentById = (id: number) => api.get(`/vendors/payments/${id}`)
export const createVendorPayment = (data: any) => api.post('/vendors/payments', data)
export const updateVendorPayment = (id: number, data: any) => api.put(`/vendors/payments/${id}`, data)
export const deleteVendorPayment = (id: number) => api.delete(`/vendors/payments/${id}`)
export const markPaymentAsPaid = (id: number, data: any) => api.post(`/vendors/payments/${id}/mark-paid`, data)
export const markPaymentAsFailed = (id: number, data: any) => api.post(`/vendors/payments/${id}/mark-failed`, data)

// Vendor Deliveries
export const getVendorDeliveries = (params = {}) => api.get('/vendors/deliveries', { params })
export const getVendorDeliveryById = (id: number) => api.get(`/vendors/deliveries/${id}`)
export const createVendorDelivery = (data: any) => api.post('/vendors/deliveries', data)
export const updateVendorDelivery = (id: number, data: any) => api.put(`/vendors/deliveries/${id}`, data)
export const deleteVendorDelivery = (id: number) => api.delete(`/vendors/deliveries/${id}`)
export const markDeliveryAsDelivered = (id: number, data: any) => api.post(`/vendors/deliveries/${id}/mark-delivered`, data)
export const markDeliveryAsFailed = (id: number, data: any) => api.post(`/vendors/deliveries/${id}/mark-failed`, data)

// Vendor Ratings
export const getVendorRatings = (params = {}) => api.get('/vendors/ratings', { params })
export const getVendorRatingById = (id: number) => api.get(`/vendors/ratings/${id}`)
export const createVendorRating = (data: any) => api.post('/vendors/ratings', data)
export const updateVendorRating = (id: number, data: any) => api.put(`/vendors/ratings/${id}`, data)
export const deleteVendorRating = (id: number) => api.delete(`/vendors/ratings/${id}`)
export const getVendorRatingSummary = (vendorId: number) => api.get(`/vendors/ratings/vendor/${vendorId}/summary`)

// Vendor Statistics and Reports
export const getVendorStatistics = () => api.get('/vendors/statistics')
export const getVendorQuotationStatistics = () => api.get('/vendors/quotations/statistics')
export const getVendorPaymentStatistics = () => api.get('/vendors/payments/statistics')
export const getVendorDeliveryStatistics = () => api.get('/vendors/deliveries/statistics')
export const getVendorRatingStatistics = () => api.get('/vendors/ratings/statistics')

// Vendor Event Assignment
export const assignVendorToEvent = (eventId: number, vendorId: number, data: any) =>
  api.post(`/events/${eventId}/vendors`, { vendor_id: vendorId, ...data })
export const removeVendorFromEvent = (eventId: number, vendorId: number) =>
  api.delete(`/events/${eventId}/vendors/${vendorId}`)
export const getEventVendors = (eventId: number) => api.get(`/events/${eventId}/vendors`)

// File Upload for Vendor Documents
export const uploadVendorDocument = (vendorId: number, file: File, type: string) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  return api.post(`/vendors/${vendorId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const uploadQuotationAttachment = (quotationId: number, file: File) => {
  const formData = new FormData()
  formData.append('attachment', file)
  return api.post(`/vendors/quotations/${quotationId}/attachment`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const uploadPaymentReceipt = (paymentId: number, file: File) => {
  const formData = new FormData()
  formData.append('receipt', file)
  return api.post(`/vendors/payments/${paymentId}/receipt`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// Export Reports
export const exportVendorReport = (params = {}) => api.get('/vendors/export', { params, responseType: 'blob' })
export const exportQuotationReport = (params = {}) => api.get('/vendors/quotations/export', { params, responseType: 'blob' })
export const exportPaymentReport = (params = {}) => api.get('/vendors/payments/export', { params, responseType: 'blob' })
export const exportDeliveryReport = (params = {}) => api.get('/vendors/deliveries/export', { params, responseType: 'blob' })

// Bulk Operations
export const bulkVendorOperations = (data: { action: string; vendor_ids: number[]; data?: any }) => 
  api.post('/vendors/bulk-operations', data)
export const bulkActivateVendors = (vendorIds: number[]) => 
  bulkVendorOperations({ action: 'activate', vendor_ids: vendorIds })
export const bulkDeactivateVendors = (vendorIds: number[]) => 
  bulkVendorOperations({ action: 'deactivate', vendor_ids: vendorIds })
export const bulkDeleteVendors = (vendorIds: number[]) => 
  bulkVendorOperations({ action: 'delete', vendor_ids: vendorIds })



// Share Analytics API functions
export const getShareAnalytics = (eventId: string, params?: { start_date?: string; end_date?: string }) =>
  api.get(`/events/${eventId}/share-analytics`, { params })

export const getRealTimeShareAnalytics = (eventId: string) =>
  api.get(`/events/${eventId}/share-analytics/realtime`)

export const trackShare = (eventId: string, data: {
  platform: string;
  source?: string;
  user_agent?: string;
  ip_address?: string;
}) => api.post(`/events/${eventId}/share-analytics/track`, data)

export const trackRegistration = (eventId: string, data: {
  source?: string;
  platform?: string;
  user_agent?: string;
  ip_address?: string;
}) => api.post(`/events/${eventId}/share-analytics/registration`, data)

// --- Sessions API ---
export const getEventSessions = (eventId: number) => api.get(`/events/${eventId}/sessions`)
export const createEventSession = (eventId: number, data: any) => api.post(`/events/${eventId}/sessions`, data)
export const getSessionById = (sessionId: number) => api.get(`/sessions/${sessionId}`)
export const updateSession = (sessionId: number, data: any) => api.put(`/sessions/${sessionId}`, data)
export const deleteSession = (sessionId: number) => api.delete(`/sessions/${sessionId}`)
export const cancelSession = (sessionId: number) => api.post(`/sessions/${sessionId}/cancel`)

// Session Attendance
export const createSessionAttendance = (sessionId: number, data: any) => api.post(`/sessions/${sessionId}/attendances`, data)
export const updateSessionAttendance = (sessionId: number, attendanceId: number, data: any) => api.put(`/sessions/${sessionId}/attendances/${attendanceId}`, data)

// Session Usher assignment
export const getSessionUshers = (sessionId: number) => api.get(`/sessions/${sessionId}/ushers`)
export const assignSessionUshers = (sessionId: number, ushers: { id: number; tasks?: string[] }[]) => api.post(`/sessions/${sessionId}/ushers`, { ushers })
export const updateSessionUsher = (sessionId: number, usherId: number, tasks: string[]) => api.put(`/sessions/${sessionId}/ushers/${usherId}`, { tasks })
export const removeSessionUsher = (sessionId: number, usherId: number) => api.delete(`/sessions/${sessionId}/ushers/${usherId}`)

// Deliverables
export const getDeliverables = (params?: any) => api.get('/deliverables', { params })
export const getDeliverable = (id: number) => api.get(`/deliverables/${id}`)
export const createDeliverable = (data: any) => api.post('/deliverables', data)
export const updateDeliverable = (id: number, data: any) => api.put(`/deliverables/${id}`, data)
export const deleteDeliverable = (id: number) => api.delete(`/deliverables/${id}`)
export const bulkUpdateDeliverableStatus = (ids: number[], status: string) => api.post('/deliverables/bulk-update-status', { deliverable_ids: ids, status })
export const getVendorEventDeliverables = (vendorId: number, eventId: number) => api.get(`/vendors/${vendorId}/events/${eventId}/deliverables`)

export { api }
