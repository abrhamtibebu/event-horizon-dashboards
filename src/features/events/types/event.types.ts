// Event-related type definitions

export interface Event {
  id: number
  uuid: string
  name: string
  description: string
  start_date: string
  end_date: string
  location: string
  event_type: 'free' | 'ticketed'
  status: string
  event_image?: string | null
  organizer_id?: number
  organizer?: {
    id: number
    name: string
    email: string
  }
  guestTypes?: GuestType[]
  ticketTypes?: TicketType[]
  attendee_count?: number
  max_guests?: number
  registration_start_date?: string
  registration_end_date?: string
  advertisement_status?: string
  [key: string]: any
}

export interface GuestType {
  id: number
  name: string
  description?: string
  price?: number
  max_guests?: number
  current_count?: number
}

export interface TicketType {
  id: number
  name: string
  description?: string
  price: number
  quantity: number
  sold_count?: number
  available_quantity?: number
  sales_end_date?: string
  is_active?: boolean
}

export interface EventFilters {
  search?: string
  category?: string
  status?: string
  event_type?: 'free' | 'ticketed' | 'all'
}

export interface EventEditForm {
  name?: string
  description?: string
  start_date?: string
  end_date?: string
  location?: string
  event_type_id?: number
  event_category_id?: number
  max_guests?: number
  registration_start_date?: string
  registration_end_date?: string
  [key: string]: any
}
