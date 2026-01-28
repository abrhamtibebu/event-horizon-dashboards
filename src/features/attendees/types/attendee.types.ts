// Attendee-related type definitions

export interface Attendee {
  id: number
  guest_id?: number
  event_id: number
  guest_type_id?: number
  ticket_type_id?: number
  checked_in: boolean
  check_in_time?: string | null
  created_at?: string
  updated_at?: string
  guest?: Guest
  guestType?: GuestType
  guest_type?: GuestType | string
  ticketType?: TicketType
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
}

export interface GuestType {
  id: number
  name: string
  description?: string
  price?: number
}

export interface TicketType {
  id: number
  name: string
  price: number
  quantity: number
}

export interface AttendeeFilters {
  search?: string
  guest_type?: string
  checked_in?: 'all' | 'checked-in' | 'not-checked-in'
}

export interface AttendeeFormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  company?: string
  jobtitle?: string
  gender?: string
  country?: string
  guest_type_id?: number | string
  ticket_type_id?: number | string
}

export interface AttendeePagination {
  currentPage: number
  perPage: number
  totalPages: number
  totalRecords: number
}
