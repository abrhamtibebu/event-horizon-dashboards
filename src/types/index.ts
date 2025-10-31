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

export interface Ticket {
  id: number
  event_id: number
  ticket_type_id: number
  attendee_id: number
  ticket_number: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'used'
  price_paid: number
  purchased_at: string
  expires_at?: string
  attendee_info?: {
    name: string
    email: string
    phone?: string
  }
  notes?: string
  event?: Event
  ticket_type?: TicketType
  is_expired?: boolean
  is_valid?: boolean
}

export interface TicketPurchase {
  id: number
  event_id: number
  ticket_type_id: number
  guest_id: number
  quantity: number
  unit_price: number
  total_amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  payment_method?: string
  payment_reference?: string
  purchased_at: string
  notes?: string
  event?: Event
  ticket_type?: TicketType
  tickets?: Ticket[]
}

export interface TicketSalesStats {
  total_tickets_sold: number
  total_revenue: number
  tickets_by_type: {
    ticket_type_id: number
    ticket_type_name: string
    tickets_sold: number
    revenue: number
  }[]
  sales_by_date: {
    date: string
    tickets_sold: number
    revenue: number
  }[]
  pending_tickets: number
  confirmed_tickets: number
  used_tickets: number
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

export interface PreGeneratedBadge {
  id: number
  event_id: number
  guest_type_id: number
  badge_code: string
  qr_code: string
  status: 'available' | 'assigned' | 'void'
  assigned_to_guest_id?: number
  assigned_to_attendee_id?: number
  assigned_at?: string
  assigned_by?: number
  guest_type?: GuestType
  assigned_to_guest?: Guest
  assigned_to_attendee?: Attendee
  assigned_by_user?: User
  created_by: number
  created_at: string
  updated_at: string
}

export interface BadgeStatistics {
  total: number
  available: number
  assigned: number
  void: number
  by_guest_type: Array<{
    guest_type_id: number
    guest_type_name: string
    total: number
    available: number
    assigned: number
  }>
}

export interface Guest {
  id: number
  name: string
  email: string
  phone?: string
  company?: string
  jobtitle?: string
  gender?: string
  country?: string
  uuid?: string
  profile_picture?: string
}

export interface Attendee {
  id: number
  event_id: number
  guest_id: number
  guest_type_id: number
  ticket_purchase_id?: number
  check_in_time?: string
  checked_in: boolean
  checked_in_by?: number
  check_in_location?: string
  guest?: Guest
  guestType?: GuestType
  qr_code?: string
}

