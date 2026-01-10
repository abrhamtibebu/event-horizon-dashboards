import axios from 'axios'

  // Ensure baseURL always includes /api suffix
  const getBaseURL = () => {
    const envURL = import.meta.env.VITE_API_URL;
    if (envURL) {
      // If VITE_API_URL is provided, ensure it ends with /api
      return envURL.endsWith('/api') ? envURL : `${envURL.replace(/\/$/, '')}/api`;
    }
    // Default to localhost for development
    return 'http://localhost:8000/api';
  };

  const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 60000, // 60 seconds timeout for long-running operations like campaign sending
    headers: {
      'Content-Type': 'application/json',
    },
})

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: any) => void
  reject: (error?: any) => void
  config: any
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error)
    } else {
      if (token && config) {
        config.headers.Authorization = `Bearer ${token}`
      }
      resolve()
    }
  })
  
  failedQueue = []
}

/**
 * Refresh token function
 */
const refreshToken = async (): Promise<string | null> => {
  const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt')
  if (!token) {
    throw new Error('No token available')
  }

  try {
    const response = await axios.post(
      '/refresh',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const { token: newToken, user, expires_in } = response.data

    // Store new token
    if (localStorage.getItem('jwt')) {
      localStorage.setItem('jwt', newToken)
    } else {
      sessionStorage.setItem('jwt', newToken)
    }

    // Store token expiration timestamp
    if (expires_in) {
      const expiresAt = Date.now() + expires_in * 1000
      const storage = localStorage.getItem('jwt') ? localStorage : sessionStorage
      storage.setItem('token_expires_at', expiresAt.toString())
    }

    // Store token creation time for refresh period check
    const storage = localStorage.getItem('jwt') ? localStorage : sessionStorage
    if (!storage.getItem('token_created_at')) {
      storage.setItem('token_created_at', Date.now().toString())
    }

    return newToken
  } catch (error: any) {
    // If refresh fails, clear all tokens and logout
    localStorage.removeItem('jwt')
    sessionStorage.removeItem('jwt')
    localStorage.removeItem('token_expires_at')
    sessionStorage.removeItem('token_expires_at')
    localStorage.removeItem('token_created_at')
    sessionStorage.removeItem('token_created_at')
    localStorage.removeItem('user_role')
    localStorage.removeItem('user_id')
    localStorage.removeItem('organizer_id')
    
    throw error
  }
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt')
    
    // Check if URL matches public event patterns: /events/{id} or /events/{id}/ticket-types/available
    const isPublicEventEndpoint = config.url?.match(/^\/events\/\d+$/) || 
                                   config.url?.includes('/ticket-types/available') ||
                                   config.url?.includes('/share-analytics')
    
    const isPublicEndpoint = config.url?.startsWith('/public/') ||
                            config.url?.startsWith('/guest/') ||
                            config.url?.startsWith('/events/uuid/') ||
                            config.url?.startsWith('/invitations/track') ||
                            config.url?.startsWith('/invitation/track') ||
                            config.url?.includes('/register') ||
                            config.url?.includes('/guest-types') ||
                            config.url?.startsWith('/forms/') || // Public form access
                            config.url === '/login' ||
                            config.url === '/register' ||
                            config.url === '/forgot-password' ||
                            config.url === '/reset-password' ||
                            config.url === '/refresh' ||
                            config.url?.startsWith('/analytics/') ||
                            isPublicEventEndpoint
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else if (!isPublicEndpoint) {
      // Only warn for non-public endpoints
      console.warn('[API] No JWT token found in localStorage or sessionStorage. Requests may fail with 401 Unauthorized.')
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Add response interceptor to handle token expiration and auto-refresh
api.interceptors.response.use(
  (response) => {
    // Store token expiration if provided in response (e.g., from login)
    if (response.data?.expires_in) {
      const expiresAt = Date.now() + response.data.expires_in * 1000
      const storage = localStorage.getItem('jwt') ? localStorage : sessionStorage
      storage.setItem('token_expires_at', expiresAt.toString())
      
      // Store token creation time if this is a new token
      if (!storage.getItem('token_created_at')) {
        storage.setItem('token_created_at', Date.now().toString())
      }
    }
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Skip refresh for refresh endpoint itself to avoid infinite loops
    if (originalRequest?.url === '/refresh') {
      // Clear tokens and logout on refresh failure
      localStorage.removeItem('jwt')
      sessionStorage.removeItem('jwt')
      localStorage.removeItem('token_expires_at')
      sessionStorage.removeItem('token_expires_at')
      localStorage.removeItem('token_created_at')
      sessionStorage.removeItem('token_created_at')
      localStorage.removeItem('user_role')
      localStorage.removeItem('user_id')
      localStorage.removeItem('organizer_id')
      localStorage.removeItem('mock_auth')
      
      if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
        window.location.href = '/'
      }
      
      return Promise.reject(error)
    }

    // Handle 401 unauthorized - attempt token refresh
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Check if we're already refreshing
      if (isRefreshing) {
        // Queue this request to retry after refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest })
        })
          .then(() => {
            const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt')
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const newToken = await refreshToken()
        
        if (newToken) {
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          
          // Process queued requests
          processQueue(null, newToken)
          
          // Retry the original request
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed - clear tokens and logout
        processQueue(refreshError, null)
        
        localStorage.removeItem('jwt')
        sessionStorage.removeItem('jwt')
        localStorage.removeItem('token_expires_at')
        sessionStorage.removeItem('token_expires_at')
        localStorage.removeItem('token_created_at')
        sessionStorage.removeItem('token_created_at')
        localStorage.removeItem('user_role')
        localStorage.removeItem('user_id')
        localStorage.removeItem('organizer_id')
        localStorage.removeItem('mock_auth')
        
        // Redirect to login if not already there
        if (window.location.pathname !== '/' && window.location.pathname !== '/login') {
          window.location.href = '/'
        }
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api

export const getBadgeTemplates = (eventId: string) =>
  api.get(`/events/${eventId}/badge-templates`)

export const getBadgeTemplate = (eventId: string, templateId: string) =>
  api.get(`/events/${eventId}/badge-templates/${templateId}`)

export const createBadgeTemplate = (
  eventId: string,
  data: { name: string; template_json: any; is_default?: boolean }
) => api.post(`/events/${eventId}/badge-templates`, data)

export const updateBadgeTemplate = (
  eventId: string,
  templateId: string,
  data: { name?: string; template_json?: any; is_default?: boolean }
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

// Enhanced messaging API functions
export const getConversations = () => api.get('/messages/conversations')

export const getDirectMessages = (userId: string, page = 1, perPage = 50) =>
  api.get(`/messages/direct/${userId}?page=${page}&per_page=${perPage}`)

export const sendDirectMessage = (data: {
  recipient_id: number
  content: string
  parent_message_id?: number
  file?: File
}) => {
  const formData = new FormData()
  formData.append('recipient_id', data.recipient_id.toString())
  formData.append('content', data.content)
  if (data.parent_message_id) {
    formData.append('parent_message_id', data.parent_message_id.toString())
  }
  if (data.file) {
    formData.append('file', data.file)
  }
  return api.post('/messages/direct', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const sendEventMessageWithAttachment = (
  eventId: string,
  data: {
    recipient_id: number
    content: string
    parent_message_id?: number
    file?: File
  }
) => {
  const formData = new FormData()
  formData.append('recipient_id', data.recipient_id.toString())
  formData.append('content', data.content)
  if (data.parent_message_id) {
    formData.append('parent_message_id', data.parent_message_id.toString())
  }
  if (data.file) {
    formData.append('file', data.file)
  }
  return api.post(`/events/${eventId}/messages`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const uploadMessageAttachment = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/messages/attachment', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

export const searchMessages = (query: string, filters: {
  type?: 'all' | 'event' | 'direct'
  per_page?: number
  page?: number
} = {}) => {
  const params = new URLSearchParams({ q: query })
  if (filters.type && filters.type !== 'all') {
    params.append('type', filters.type)
  }
  if (filters.per_page) {
    params.append('per_page', filters.per_page.toString())
  }
  if (filters.page) {
    params.append('page', filters.page.toString())
  }
  return api.get(`/messages/search?${params.toString()}`)
}

export const getConversationPartners = () => api.get('/messages/partners')

export const markConversationRead = (data: {
  other_user_id?: number
  event_id?: number
}) => api.post('/messages/conversation/read', data)

export const deleteMessage = (messageId: string) =>
  api.delete(`/messages/${messageId}`)

// Message pinning
export const pinMessage = (messageId: number) =>
  api.post(`/messages/${messageId}/pin`)

export const unpinMessage = (messageId: number) =>
  api.delete(`/messages/${messageId}/pin`)

export const getPinnedMessages = (conversationId: string) => {
  // Extract conversation type and ID
  if (conversationId.startsWith('event_')) {
    const eventId = conversationId.replace('event_', '')
    return api.get(`/events/${eventId}/messages/pinned`)
  } else if (conversationId.startsWith('direct_')) {
    const userId = conversationId.replace('direct_', '')
    return api.get(`/messages/direct/${userId}/pinned`)
  }
  return Promise.reject(new Error('Invalid conversation ID'))
}

export const getAllUsers = () => api.get('/users')

export const getMessagingContacts = () => api.get('/users/messaging-contacts')

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
// Alias for getEventById for backward compatibility
export const getEvent = (eventId: string) => getEventById(eventId)

export const getAllGuests = () => api.get('/guests')

// Get attendees for an event
export const getAttendees = (eventId: string) => api.get(`/events/${eventId}/attendees`)

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
export const deleteUsherRegistration = (eventId: number, registrationId: number) =>
  api.delete(`/events/${eventId}/usher-registrations/${registrationId}`)

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
export const bulkApproveVendorQuotations = (quotationIds: number[]) => api.post('/vendors/quotations/bulk-approve', { quotation_ids: quotationIds })
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

// Upload proforma invoice
export const uploadProforma = (quotationId: number, file: File) => {
  const formData = new FormData()
  formData.append('proforma', file)
  return api.post(`/vendors/quotations/${quotationId}/upload-proforma`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
}

// Line Items
export const getQuotationLineItems = (quotationId: number) => api.get(`/vendors/quotations/${quotationId}/line-items`)
export const createQuotationLineItem = (quotationId: number, data: {
  item_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
}) => api.post(`/vendors/quotations/${quotationId}/line-items`, data)
export const updateQuotationLineItem = (quotationId: number, itemId: number, data: {
  item_name?: string;
  description?: string;
  quantity?: number;
  unit_price?: number;
}) => api.put(`/vendors/quotations/${quotationId}/line-items/${itemId}`, data)
export const deleteQuotationLineItem = (quotationId: number, itemId: number) => api.delete(`/vendors/quotations/${quotationId}/line-items/${itemId}`)

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

// Pre-generated Badges API
export const bulkGenerateBadges = (eventId: number, data: { guest_type_id: number; quantity: number }) =>
  api.post(`/events/${eventId}/pre-generated-badges/bulk-generate`, data)

export const getPreGeneratedBadges = (eventId: number, filters?: { 
  guest_type_id?: number; 
  status?: string; 
  search?: string; 
  per_page?: number 
}) =>
  api.get(`/events/${eventId}/pre-generated-badges`, { params: filters })

export const assignPreGeneratedBadge = (eventId: number, data: {
  badge_code: string
  guest_id?: number
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company?: string
  job_title?: string
}) =>
  api.post(`/events/${eventId}/pre-generated-badges/assign`, data)

export const unassignPreGeneratedBadge = (eventId: number, badgeId: number) =>
  api.delete(`/events/${eventId}/pre-generated-badges/${badgeId}/unassign`)

export const getPreGeneratedBadgeStats = (eventId: number) =>
  api.get(`/events/${eventId}/pre-generated-badges/statistics`)

export const exportPreGeneratedBadges = (eventId: number, format: 'csv' | 'pdf', guestTypeId?: number) =>
  api.get(`/events/${eventId}/pre-generated-badges/export`, { 
    params: { format, guest_type_id: guestTypeId }, 
    responseType: 'blob' 
  })

export const generatePrintableBadges = (eventId: number, badgeIds: number[]) =>
  api.post(`/events/${eventId}/pre-generated-badges/generate-printables`, 
    { badge_ids: badgeIds },
    { responseType: 'blob' }
  )

// QR Code Check-in
export const checkInByQR = (eventId: number, uuid: string) =>
  api.post(`/events/${eventId}/check-in/qr`, { uuid })

// Auto-detect event check-in by QR (for ushers)
export const checkInByQRAuto = (uuid: string) =>
  api.post('/check-in/qr', { uuid })

export { api }
