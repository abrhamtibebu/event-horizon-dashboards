import axios from 'axios'

const api = axios.create({
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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch((err) => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt')
      
      if (!token) {
        // No token to refresh, redirect to login
        localStorage.removeItem('jwt')
        sessionStorage.removeItem('jwt')
        window.location.href = '/'
        return Promise.reject(error)
      }

      try {
        // Try to refresh the token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://api.validity.et//api'}/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        const newToken = response.data.token
        localStorage.setItem('jwt', newToken)
        sessionStorage.setItem('jwt', newToken)
        
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        
        processQueue(null, newToken)
        
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('jwt')
        sessionStorage.removeItem('jwt')
        window.location.href = '/'
        
        return Promise.reject(refreshError)
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
) => api.post(`/events/${eventId}/ushers`, { ushers })

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
