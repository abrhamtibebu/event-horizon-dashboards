import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.validity.et/api',
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
    } else {
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

// --- Vendor Mock API ---
let mockVendors = [
  {
    id: 1,
    name: 'Acme Catering',
    company: 'Acme Inc.',
    category: 'Catering',
    status: 'active',
    rating: 4.5,
    assignedEvents: ['Annual Gala', 'Tech Expo'],
    email: 'contact@acme.com',
    phone: '+1234567890',
    services: ['Buffet', 'Cocktail', 'Custom Menus'],
    documents: [],
    contracts: [],
    notes: '',
  },
  {
    id: 2,
    name: 'Bright Lights AV',
    company: 'Bright AV',
    category: 'AV',
    status: 'inactive',
    rating: 3.8,
    assignedEvents: ['Tech Expo'],
    email: 'info@brightav.com',
    phone: '+1987654321',
    services: ['Audio', 'Video', 'Lighting'],
    documents: [],
    contracts: [],
    notes: '',
  },
];
let mockVendorTasks = [
  {
    id: 1,
    vendorId: 1,
    event: 'Annual Gala',
    description: 'Provide catering for 200 guests',
    deadline: '2025-08-01',
    deliverables: 'Menu, Staff, Setup',
    status: 'In Progress',
    files: [],
  },
];
let mockVendorReviews = [
  // { vendorId: 1, event: 'Annual Gala', rating: 5, review: 'Great service!', reviewer: 'Alice', date: '2024-08-02' }
];

export function getVendors() {
  return Promise.resolve([...mockVendors]);
}

export function getVendorById(id) {
  return Promise.resolve(mockVendors.find(v => v.id === Number(id)));
}

export function createVendor(data) {
  const newVendor = { ...data, id: Date.now(), documents: data.documents || [] };
  mockVendors.push(newVendor);
  return Promise.resolve(newVendor);
}

export function updateVendor(id, data) {
  mockVendors = mockVendors.map(v => (v.id === Number(id) ? { ...v, ...data, documents: data.documents || v.documents || [] } : v));
  return Promise.resolve(mockVendors.find(v => v.id === Number(id)));
}

export function deleteVendor(id) {
  mockVendors = mockVendors.filter(v => v.id !== Number(id));
  return Promise.resolve();
}

export function assignVendorsToEvents(vendorIds, eventIds, task) {
  // For mock: just return success
  return Promise.resolve({ vendorIds, eventIds, task });
}

export function uploadVendorFile(vendorId, file) {
  // For mock: add file to vendor's documents array
  const vendor = mockVendors.find(v => v.id === Number(vendorId));
  if (vendor) {
    vendor.documents = vendor.documents || [];
    vendor.documents.push({ name: file.name, url: '#' });
  }
  return Promise.resolve({ vendorId, fileName: file.name });
}

export function getVendorDocuments(vendorId) {
  const vendor = mockVendors.find(v => v.id === Number(vendorId));
  return Promise.resolve(vendor ? vendor.documents || [] : []);
}

export function getVendorTasks() {
  return Promise.resolve([...mockVendorTasks]);
}

export function updateVendorTaskStatus(taskId, status) {
  mockVendorTasks = mockVendorTasks.map(t => (t.id === Number(taskId) ? { ...t, status } : t));
  return Promise.resolve(mockVendorTasks.find(t => t.id === Number(taskId)));
}

export function getVendorReviews(vendorId) {
  return Promise.resolve(mockVendorReviews.filter(r => r.vendorId === Number(vendorId)));
}

export function addVendorReview(vendorId, review) {
  mockVendorReviews.push({ ...review, vendorId: Number(vendorId) });
  return Promise.resolve();
}

export function getVendorAverageRating(vendorId) {
  const reviews = mockVendorReviews.filter(r => r.vendorId === Number(vendorId));
  if (!reviews.length) return Promise.resolve(null);
  const avg = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
  return Promise.resolve(avg);
}
