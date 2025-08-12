export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
  from: number
  to: number
}

export interface User {
  id: number
  name: string
  email: string
  phone?: string
  bio?: string
  avatar?: string
  created_at: string
  updated_at: string
  role?: string
}

export interface Event {
  id: number
  uuid: string
  title: string
  description: string
  image: string | boolean | null
  date: string
  time: string
  location: string
  organizer: string
  price: string
  category: string
  attendees: number
  max_guests?: number
  event_type: 'free' | 'ticketed'
  status: string
  start_date: string
  end_date: string
  registration_start_date: string
  registration_end_date: string
  requirements?: string
  agenda?: string
  latitude?: number
  longitude?: number
  venue_details?: string
  contact_email?: string
  contact_phone?: string
  social_links?: {
    facebook?: string
    twitter?: string
    instagram?: string
    linkedin?: string
  }
}

export interface EventCategory {
  id: number
  name: string
  description?: string
  event_count?: number
  icon?: string
  color?: string
}

export interface EventType {
  id: number
  name: string
  description?: string
  event_count?: number
}

export interface TicketType {
  id: number
  name: string
  description: string
  price: number
  quantity: number
  sold_count: number
  sales_end_date: string
  is_active: boolean
  benefits?: string[]
  min_group_size?: number
  max_group_size?: number
}

export interface GuestType {
  id: number
  name: string
  description: string
  requirements?: string
  max_count?: number
}

export interface Registration {
  id: number
  event: Event
  registration_date: string
  status: string
  guest_type?: GuestType
  ticket_type?: TicketType
  quantity?: number
  total_amount?: number
  qr_code?: string
}

export interface SearchFilters {
  search?: string
  category?: string
  event_type?: string
  date_from?: string
  date_to?: string
  location?: string
  price_min?: number
  price_max?: number
  page?: number
  limit?: number
  sort_by?: 'date' | 'price' | 'popularity' | 'title'
  sort_order?: 'asc' | 'desc'
}

