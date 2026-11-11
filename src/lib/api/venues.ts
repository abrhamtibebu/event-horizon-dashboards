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
  u_shape?: number | null
  boardroom?: number | null
}

export type VenueSpaceSettings = Record<string, string | number | boolean | null | string[] | undefined>

export interface VenueSpace {
  id: number
  venue_id: number
  space_code?: string
  space_type?: string
  status?: string
  name: string
  description?: string | null
  capacity?: number | null
  recommended_capacity?: number | null
  minimum_capacity?: number | null
  floor_area?: number | null
  floor_level?: string | null
  is_accessible?: boolean
  hourly_rate?: number | null
  featured_image?: string | null
  featured_image_url?: string | null
  pricing_details?: VenueSpaceSettings | null
  availability_settings?: VenueSpaceSettings | null
  layout_config?: VenueSpaceSettings | null
  custom_facilities?: string[] | null
  contact_person?: string | null
  contact_number?: string | null
  internal_notes?: string | null
  terms_conditions?: string | null
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
  event_type?: string | null
  expected_attendance?: number | null
  event_requirements?: string | null
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
  client?: VenueClient | null
  event?: { id: number; name: string }
  organizer?: { id: number; name: string }
}

export interface VenueBookingPayment {
  id: number
  venue_booking_id: number
  amount: number
  type?: 'payment' | 'refund' | string
  status?: 'successful' | 'voided' | string
  original_payment_id?: number | null
  method: 'cash' | 'bank' | 'chapa' | string
  reference?: string | null
  paid_at: string
  notes?: string | null
}

export interface VenueClient {
  id: number
  venue_id: number
  client_type: 'individual' | 'company' | 'organization' | 'government' | 'event_agency' | string
  name: string
  organization_name?: string | null
  contact_person?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  registration_number?: string | null
  notes?: string | null
  bookings_count?: number
  bookings?: VenueBooking[]
}

export interface VenueExpense {
  id: number
  venue_booking_id?: number | null
  description: string
  category: string
  amount: number
  currency: string
  spent_at: string
  vendor?: string | null
  reference?: string | null
  notes?: string | null
  has_receipt?: boolean
  booking?: Pick<VenueBooking, 'id' | 'title' | 'contact_name' | 'starts_at'> | null
}

export interface VenueBookingQuote {
  id: number
  venue_booking_id: number
  version: number
  token: string
  status: 'draft' | 'sent' | 'accepted' | 'changes_requested' | 'declined' | 'expired' | 'superseded'
  items: Array<{ description: string; quantity: number; unit_price: number; amount: number }>
  subtotal: number
  discount_amount: number
  tax_rate: number
  tax_amount: number
  deposit_amount: number
  total: number
  currency: string
  valid_until?: string | null
  terms?: string | null
  sent_at?: string | null
  responded_at?: string | null
  response_note?: string | null
  booking?: VenueBooking
}

export interface VenueCommercialDocument {
  id: number
  venue_id: number
  venue_booking_id: number
  venue_booking_quote_id: number
  type: 'invoice' | 'contract'
  number: string
  token: string
  status: 'issued' | 'paid' | 'awaiting_signature' | 'signed' | string
  amount: number
  currency: string
  snapshot?: {
    items?: Array<{ description: string; quantity: number; unit_price: number; amount: number }>
    subtotal?: number
    discount_amount?: number
    tax_rate?: number
    tax_amount?: number
    deposit_amount?: number
    terms?: string | null
    quote_version?: number
  }
  issued_at: string
  due_at?: string | null
  signed_at?: string | null
}

export interface VenueEventTask {
  id: number
  title: string
  description?: string | null
  phase: 'pre_event' | 'during_event' | 'post_event'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  due_at?: string | null
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked'
  required: boolean
  completion_notes?: string | null
  assigned_user_id?: number | null
  assignee?: { id: number; name: string; email: string }
}

export interface VenueEventResource {
  id: number
  name: string
  code?: string | null
  category: string
  quantity: number
  unavailable_quantity: number
  condition: string
  location?: string | null
  status: string
}

export interface VenueEventWorkspaceSummary {
  booking: VenueBooking
  workspace_id: number
  event_status: string
  readiness: { required_tasks: number; completed_tasks: number; percent: number; ready: boolean }
}

export interface VenueEventWorkspaceDetail {
  booking: VenueBooking
  workspace: {
    id: number
    status: string
    briefing?: string | null
    tasks: VenueEventTask[]
    staff_assignments: Array<{ id: number; user_id: number; assignment_role?: string | null; starts_at: string; ends_at: string; status: string; override_reason?: string | null; user: VenueStaffMember }>
    resource_allocations: Array<{ id: number; resource_id: number; quantity: number; status: string; resource: VenueEventResource }>
    schedule_items: Array<{ id: number; title: string; description?: string | null; starts_at: string; ends_at: string }>
  }
  readiness: { required_tasks: number; completed_tasks: number; percent: number; ready: boolean }
  staff: VenueStaffMember[]
  resources: VenueEventResource[]
  permissions: { manage_resources: boolean; override_staff_conflicts: boolean }
}

export interface VenueFinanceTransaction {
  id: number
  booking_id: number
  booking_title: string
  contact_name?: string | null
  space?: string | null
  amount: number
  type?: 'payment' | 'refund' | string
  status?: 'successful' | 'voided' | string
  original_payment_id?: number | null
  currency: string
  method: string
  reference?: string | null
  paid_at: string
  notes?: string | null
}

export interface VenueOpenBalance {
  booking_id: number
  title: string
  contact_name?: string | null
  space?: string | null
  starts_at: string
  status: string
  quoted_amount: number
  paid_total: number
  balance: number
  currency: string
  balance_status: string
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
  transactions: VenueFinanceTransaction[]
  openBalances: VenueOpenBalance[]
  openBalanceTotal: number
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
  completed: number
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
  referralBreakdown?: { source: string; campaign?: string | null; count: number }[]
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
  clients: (search?: string) => api.get<VenueClient[]>('/venue/clients', { params: search ? { search } : undefined }),
  client: (id: number) => api.get<VenueClient>(`/venue/clients/${id}`),
  createClient: (data: Partial<VenueClient>) => api.post<VenueClient>('/venue/clients', data),
  updateClient: (id: number, data: Partial<VenueClient>) => api.patch<VenueClient>(`/venue/clients/${id}`, data),
  expenses: (params?: { from?: string; to?: string; booking_id?: number }) => api.get<VenueExpense[]>('/venue/expenses', { params }),
  createExpense: (data: FormData) => api.post<VenueExpense>('/venue/expenses', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateExpense: (id: number, data: FormData) => { data.append('_method', 'PATCH'); return api.post<VenueExpense>(`/venue/expenses/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }) },
  expenseReceipt: (id: number) => api.get<Blob>(`/venue/expenses/${id}/receipt`, { responseType: 'blob' }),
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
  checkBookingAvailability: (data: { space_id: number; starts_at: string; ends_at: string }) =>
    api.post<{ available: boolean; error?: string }>('/venue/bookings/check-availability', data),
  booking: (id: number) => api.get<VenueBooking>(`/venue/bookings/${id}`),
  createBooking: (data: Record<string, unknown>) => api.post<VenueBooking>('/venue/bookings', data),
  updateBooking: (id: number, data: Record<string, unknown>) =>
    api.patch<VenueBooking>(`/venue/bookings/${id}`, data),
  manuallyConfirmBooking: (id: number) =>
    api.post<VenueBooking>(`/venue/bookings/${id}/manual-confirm`),
  replyBooking: (id: number, data: { message: string; subject?: string }) =>
    api.post(`/venue/bookings/${id}/reply`, data),
  bookingQuotes: (id: number) => api.get<VenueBookingQuote[]>(`/venue/bookings/${id}/quotes`),
  venueQuotes: () => api.get<VenueBookingQuote[]>('/venue/quotes'),
  acceptVenueQuote: (id: number) => api.post<{ quote: VenueBookingQuote; booking_status: string }>(`/venue/quotes/${id}/accept`),
  sendBookingQuote: (id: number, data: FormData) =>
    api.post<{ quote: VenueBookingQuote; booking: VenueBooking }>(`/venue/bookings/${id}/quotes`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  publicBookingQuote: (token: string) =>
    api.get<{ quote: VenueBookingQuote; booking: VenueBooking; venue: Venue }>(`/public/venue-quotes/${token}`),
  respondToBookingQuote: (token: string, action: 'accepted' | 'changes_requested' | 'declined', note?: string) =>
    api.post<{ quote: VenueBookingQuote; booking_status: string }>(`/public/venue-quotes/${token}/respond`, { action, note }),
  bookingQuoteDocumentUrl: (token: string) => `${api.defaults.baseURL}/public/venue-quotes/${token}/document`,
  commercialDocuments: (bookingId: number) => api.get<VenueCommercialDocument[]>(`/venue/bookings/${bookingId}/commercial-documents`),
  issueCommercialDocument: (bookingId: number, data: { type: 'invoice' | 'contract'; quote_id?: number; due_at?: string }) =>
    api.post<{ document: VenueCommercialDocument; email_sent: boolean; message?: string }>(`/venue/bookings/${bookingId}/commercial-documents`, data),
  publicCommercialDocument: (token: string) =>
    api.get<{ document: VenueCommercialDocument; booking: VenueBooking; venue: Venue }>(`/public/venue-documents/${token}`),
  signCommercialDocument: (token: string, file: File) => {
    const form = new FormData()
    form.append('signed_document', file)
    return api.post(`/public/venue-documents/${token}/sign`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  commercialDocumentUrl: (token: string) => `${api.defaults.baseURL}/public/venue-documents/${token}/document`,
  signedCommercialDocumentUrl: (token: string) => `${api.defaults.baseURL}/public/venue-documents/${token}/signed`,
  recordPayment: (
    bookingId: number,
    data: { amount: number; method: string; reference?: string; paid_at?: string; notes?: string },
  ) => api.post<VenueBooking>(`/venue/bookings/${bookingId}/payments`, data),
  deletePayment: (bookingId: number, paymentId: number) =>
    api.delete<VenueBooking>(`/venue/bookings/${bookingId}/payments/${paymentId}`),
  voidPayment: (bookingId: number, paymentId: number, reason: string) =>
    api.delete<VenueBooking>(`/venue/bookings/${bookingId}/payments/${paymentId}`, { data: { reason } }),
  refundPayment: (bookingId: number, paymentId: number, data: { amount: number; notes: string; reference?: string }) =>
    api.post<VenueBooking>(`/venue/bookings/${bookingId}/payments/${paymentId}/refunds`, data),
  eventWorkspaces: () => api.get<VenueEventWorkspaceSummary[]>('/venue/events'),
  eventWorkspace: (bookingId: number) => api.get<VenueEventWorkspaceDetail>(`/venue/events/${bookingId}/workspace`),
  updateEventWorkspace: (bookingId: number, data: { status?: string; briefing?: string }) =>
    api.patch<VenueEventWorkspaceDetail>(`/venue/events/${bookingId}/workspace`, data),
  createEventTask: (bookingId: number, data: Partial<VenueEventTask>) =>
    api.post<VenueEventTask>(`/venue/events/${bookingId}/workspace/tasks`, data),
  updateEventTask: (bookingId: number, taskId: number, data: Partial<VenueEventTask>) =>
    api.patch<VenueEventTask>(`/venue/events/${bookingId}/workspace/tasks/${taskId}`, data),
  assignEventStaff: (bookingId: number, data: { user_id: number; assignment_role?: string; starts_at?: string; ends_at?: string; override_conflict?: boolean; override_reason?: string }) =>
    api.post(`/venue/events/${bookingId}/workspace/staff`, data),
  removeEventStaff: (bookingId: number, assignmentId: number) => api.delete(`/venue/events/${bookingId}/workspace/staff/${assignmentId}`),
  updateEventStaffAttendance: (bookingId: number, assignmentId: number, status: 'assigned' | 'attended' | 'absent') =>
    api.patch(`/venue/events/${bookingId}/workspace/staff/${assignmentId}`, { status }),
  venueResources: () => api.get<VenueEventResource[]>('/venue/resources'),
  createVenueResource: (data: Partial<VenueEventResource>) => api.post<VenueEventResource>('/venue/resources', data),
  updateVenueResource: (resourceId: number, data: Partial<VenueEventResource>) => api.patch<VenueEventResource>(`/venue/resources/${resourceId}`, data),
  allocateEventResource: (bookingId: number, data: { resource_id: number; quantity: number; notes?: string }) =>
    api.post(`/venue/events/${bookingId}/workspace/resources`, data),
  returnEventResource: (bookingId: number, allocationId: number) => api.patch(`/venue/events/${bookingId}/workspace/resources/${allocationId}/return`),
  createEventScheduleItem: (bookingId: number, data: { title: string; description?: string; starts_at: string; ends_at: string }) =>
    api.post(`/venue/events/${bookingId}/workspace/schedule`, data),
  deleteEventScheduleItem: (bookingId: number, itemId: number) => api.delete(`/venue/events/${bookingId}/workspace/schedule/${itemId}`),
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
