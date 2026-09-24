import api from '@/lib/api'

export interface VenueSpacePackage {
  id: number
  space_id: number
  name: string
  unit: 'hourly' | 'daily'
  price: number
  currency?: string | null
  sort_order?: number
}

export interface VenueSpaceLayoutCapacities {
  theater?: number | null
  banquet?: number | null
  classroom?: number | null
  cocktail?: number | null
}

export interface VenueSpace {
  id: number
  venue_id: number
  name: string
  description?: string | null
  capacity?: number | null
  floor_area?: number | null
  hourly_rate?: number | null
  photos?: string[]
  photo_urls?: string[]
  floor_plan?: string | null
  floor_plan_url?: string | null
  amenities?: string[] | null
  layout_capacities?: VenueSpaceLayoutCapacities | null
  length_m?: number | null
  width_m?: number | null
  ceiling_height_m?: number | null
  setup_minutes?: number
  teardown_minutes?: number
  rules?: string | null
  sort_order?: number
  is_default: boolean
  packages?: VenueSpacePackage[]
}

export interface Venue {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  description?: string | null
  website?: string | null
  city?: string | null
  formatted_address?: string | null
  latitude?: number | null
  longitude?: number | null
  logo?: string | null
  banner?: string | null
  logo_url?: string | null
  banner_url?: string | null
  photos?: string[]
  photo_urls?: string[]
  amenities?: string[]
  opening_hours?: Record<string, { open?: string; close?: string; closed?: boolean }> | null
  status: string
  verified: boolean
  is_listed?: boolean
  spaces?: VenueSpace[]
  spaces_count?: number
  bookings_count?: number
  users_count?: number
  users?: VenueStaffMember[]
  created_at?: string
}

export interface VenueBooking {
  id: number
  venue_id: number
  space_id: number
  event_id?: number | null
  organizer_id?: number | null
  starts_at: string
  ends_at: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  source: 'manual' | 'event_request' | 'public_request'
  title?: string | null
  notes?: string | null
  contact_name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  created_at?: string
  package_id?: number | null
  quoted_amount?: number | null
  currency?: string | null
  paid_total?: number
  balance_status?: 'unquoted' | 'unpaid' | 'partial' | 'paid' | string
  space?: VenueSpace
  package?: VenueSpacePackage | null
  payments?: VenueBookingPayment[]
  event?: { id: number; name: string }
  organizer?: { id: number; name: string }
}

export interface VenueBookingPayment {
  id: number
  venue_booking_id: number
  amount: number
  method: 'cash' | 'bank' | 'chapa' | string
  reference?: string | null
  paid_at: string
  notes?: string | null
}

export interface VenueRevenueReport {
  from: string
  to: string
  currency: string
  collected: number
  quoted: number
  outstanding: number
  byMethod: { method: string; amount: number }[]
  bySpace: { id: number; name: string; quoted: number; collected: number; outstanding: number }[]
  daily: { date: string; collected: number }[]
}

export interface VenueBlackout {
  id: number
  venue_id: number
  space_id?: number | null
  starts_at: string
  ends_at: string
  reason?: string | null
  space?: VenueSpace | null
}

export interface VenueStaffMember {
  id: number
  name?: string | null
  first_name?: string | null
  last_name?: string | null
  email: string
  phone?: string | null
  role: 'venue_admin' | 'venue_staff' | string
  is_primary_contact?: boolean
  created_at?: string
}

export interface VenueDashboardVolumePoint {
  date: string
  bookings: number
}

export interface VenueDashboardSourceShare {
  source: 'manual' | 'event_request' | 'public_request' | string
  count: number
  share: number
}

export interface VenueDashboardStatusDay {
  day: string
  pending: number
  confirmed: number
  cancelled: number
}

export interface VenueDashboardSpaceLoad {
  id: number
  name: string
  capacity?: number | null
  is_default: boolean
  open: number
  status: 'Busy' | 'Open' | string
}

export interface VenueDashboardActivity {
  type: 'booking' | 'blackout' | string
  title: string
  time?: string | null
}

export interface VenueDashboardData {
  venue: Venue | null
  needs_setup: boolean
  keyMetrics: {
    upcomingBookings: number
    pendingRequests: number
    confirmedThisWeek: number
    spaces: number
    upcomingDelta?: number
    pendingDelta?: number
    confirmedDelta?: number
    collectedThisMonth?: number
    outstanding?: number
  }
  upcomingBookings: VenueBooking[]
  pendingRequests: VenueBooking[]
  bookingVolume?: VenueDashboardVolumePoint[]
  sourceBreakdown?: VenueDashboardSourceShare[]
  statusTrend?: VenueDashboardStatusDay[]
  spaceLoad?: VenueDashboardSpaceLoad[]
  recentBookings?: VenueBooking[]
  recentActivity?: VenueDashboardActivity[]
}

export const venueApi = {
  setup: (form: FormData) => api.post('/venue/setup', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  profile: () => api.get<Venue>('/venue/profile'),
  updateProfile: (form: FormData) =>
    api.post('/venue/profile', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  dashboard: () => api.get<VenueDashboardData>('/dashboard/venue'),
  catalog: (params?: { search?: string; city?: string }) => api.get('/venues', { params }),
  catalogShow: (id: number) => api.get<Venue>(`/venues/${id}`),
  spaces: () => api.get<VenueSpace[]>('/venue/spaces'),
  createSpace: (data: FormData | Partial<VenueSpace>) =>
    api.post<VenueSpace>('/venue/spaces', data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),
  updateSpace: (id: number, data: FormData | Partial<VenueSpace>) =>
    api.post<VenueSpace>(`/venue/spaces/${id}`, data, {
      headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    }),
  deleteSpace: (id: number) => api.delete(`/venue/spaces/${id}`),
  packages: (spaceId: number) => api.get<VenueSpacePackage[]>(`/venue/spaces/${spaceId}/packages`),
  createPackage: (spaceId: number, data: Partial<VenueSpacePackage>) =>
    api.post<VenueSpacePackage>(`/venue/spaces/${spaceId}/packages`, data),
  updatePackage: (id: number, data: Partial<VenueSpacePackage>) =>
    api.put<VenueSpacePackage>(`/venue/packages/${id}`, data),
  deletePackage: (id: number) => api.delete(`/venue/packages/${id}`),
  bookings: (params?: { status?: string; space_id?: number; from?: string; to?: string }) =>
    api.get<VenueBooking[]>('/venue/bookings', { params }),
  booking: (id: number) => api.get<VenueBooking>(`/venue/bookings/${id}`),
  createBooking: (data: Record<string, unknown>) => api.post<VenueBooking>('/venue/bookings', data),
  updateBooking: (id: number, data: Record<string, unknown>) =>
    api.patch<VenueBooking>(`/venue/bookings/${id}`, data),
  replyBooking: (id: number, data: { message: string; subject?: string }) =>
    api.post(`/venue/bookings/${id}/reply`, data),
  recordPayment: (
    bookingId: number,
    data: { amount: number; method: string; reference?: string; paid_at?: string; notes?: string },
  ) => api.post<VenueBooking>(`/venue/bookings/${bookingId}/payments`, data),
  deletePayment: (bookingId: number, paymentId: number) =>
    api.delete<VenueBooking>(`/venue/bookings/${bookingId}/payments/${paymentId}`),
  revenue: (params?: { from?: string; to?: string }) => api.get<VenueRevenueReport>('/venue/revenue', { params }),
  blackouts: (params?: { space_id?: number; from?: string; to?: string }) =>
    api.get<VenueBlackout[]>('/venue/blackouts', { params }),
  createBlackout: (data: Record<string, unknown>) => api.post<VenueBlackout>('/venue/blackouts', data),
  updateBlackout: (id: number, data: Record<string, unknown>) =>
    api.patch<VenueBlackout>(`/venue/blackouts/${id}`, data),
  deleteBlackout: (id: number) => api.delete(`/venue/blackouts/${id}`),
  staff: () => api.get<VenueStaffMember[]>('/venue/staff'),
  inviteStaff: (data: { name: string; email: string; phone?: string; role?: string }) =>
    api.post('/venue/staff', data),
  updateStaff: (id: number, data: { role: string }) => api.patch(`/venue/staff/${id}`, data),
  removeStaff: (id: number) => api.delete(`/venue/staff/${id}`),
  adminList: (params?: { search?: string; status?: string; page?: number; per_page?: number }) =>
    api.get('/admin/venues', { params }),
  adminShow: (id: number) => api.get<Venue>(`/admin/venues/${id}`),
  adminActivate: (id: number) => api.post(`/admin/venues/${id}/activate`),
  adminSuspend: (id: number, reason?: string) => api.post(`/admin/venues/${id}/suspend`, { reason }),
  adminVerify: (id: number) => api.post(`/admin/venues/${id}/verify`),
}
