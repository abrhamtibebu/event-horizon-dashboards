import axios from 'axios'
import { getApiBaseURL } from '@/config/env'
import api from '@/lib/api'

const onsiteApi = axios.create({
  baseURL: getApiBaseURL(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface OnsiteGuestType {
  id: number
  name: string
  description?: string | null
}

export interface OnsiteEvent {
  id: number
  uuid: string
  name: string
  title?: string
  location?: string | null
  venue_name?: string | null
  start_date?: string
  end_date?: string
  organizer_name?: string | null
  organizer_logo?: string | null
  image?: string | null
}

export interface OnsiteAccessCode {
  id: number
  event_id: number
  label?: string | null
  enabled: boolean
  can_register: boolean
  can_check_in: boolean
  can_print: boolean
  expires_at?: string | null
  last_used_at?: string | null
  usage_count: number
}

export interface OnsiteStats {
  registered: number
  checked_in: number
  printed: number
}

export interface OnsiteAttendee {
  id: number
  event_id: number
  guest_type_id: number
  checked_in?: boolean
  check_in_time?: string | null
  registration_type?: 'onsite' | 'prereg'
  badge_printed_at?: string | null
  qr_code?: string | null
  guest?: {
    id: number
    uuid?: string
    name?: string
    email?: string
    phone?: string
    company?: string
    jobtitle?: string
    job_title?: string
    country?: string
  }
  guestType?: OnsiteGuestType
  guest_type?: OnsiteGuestType
}

export interface VerifyOnsiteAccessResponse {
  token: string
  expires_at: string
  access_code: OnsiteAccessCode
  event: OnsiteEvent
  guest_types: OnsiteGuestType[]
  stats: OnsiteStats
}

export interface OnsiteConfigResponse {
  access_code: OnsiteAccessCode
  event: OnsiteEvent
  guest_types: OnsiteGuestType[]
  stats: OnsiteStats
  official_badge_template?: unknown
}

export const verifyOnsiteAccess = (accessId: string, printingMode: string) =>
  onsiteApi.post<VerifyOnsiteAccessResponse>('/onsite/access-codes/verify', {
    access_id: accessId,
    printing_mode: printingMode,
  })

export const getOnsiteConfig = (token: string) =>
  onsiteApi.get<OnsiteConfigResponse>('/onsite/kiosk/config', {
    headers: { Authorization: `Bearer ${token}` },
  })

export const searchOnsiteAttendees = (
  token: string,
  search: string,
  options?: {
    guestTypeId?: number
    limit?: number
  },
) =>
  onsiteApi.get<OnsiteAttendee[]>('/onsite/kiosk/attendees', {
    params: {
      search,
      guest_type_id: options?.guestTypeId,
      limit: options?.limit,
    },
    headers: { Authorization: `Bearer ${token}` },
  })

export const createOnsiteAttendee = (
  token: string,
  data: {
    name: string
    email?: string
    phone?: string
    company?: string
    jobtitle?: string
    country?: string
    gender?: string
    guest_type_id: number
    check_in?: boolean
  },
) =>
  onsiteApi.post<{
    message: string
    attendee: OnsiteAttendee
    stats: OnsiteStats
  }>('/onsite/kiosk/attendees', data, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const updateOnsiteAttendee = (
  token: string,
  attendeeId: number,
  data: {
    name: string
    company?: string
    jobtitle?: string
  },
) =>
  onsiteApi.patch<{
    message: string
    attendee: OnsiteAttendee
    stats: OnsiteStats
  }>(`/onsite/kiosk/attendees/${attendeeId}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const checkInOnsiteAttendee = (token: string, attendeeId: number) =>
  onsiteApi.post<{
    message: string
    attendee: OnsiteAttendee
    stats: OnsiteStats
  }>(`/onsite/kiosk/attendees/${attendeeId}/check-in`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const getOnsiteBadgePdf = (token: string, attendeeId: number) =>
  onsiteApi.get<Blob>(`/onsite/kiosk/attendees/${attendeeId}/badge`, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${token}` },
  })

export const markOnsiteBadgePrinted = (token: string, attendeeId: number) =>
  onsiteApi.post<{
    message: string
    attendee: OnsiteAttendee
    stats: OnsiteStats
  }>(`/onsite/kiosk/attendees/${attendeeId}/badge/printed`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  })

export const listEventAccessCodes = (eventId: number) =>
  api.get<OnsiteAccessCode[]>(`/events/${eventId}/access-codes`)

export const createEventAccessCode = (
  eventId: number,
  data: {
    label?: string
    expires_at?: string | null
    can_register?: boolean
    can_check_in?: boolean
    can_print?: boolean
  },
) =>
  api.post<{
    access_code: OnsiteAccessCode
    plain_code: string
    reg_url: string
  }>(`/events/${eventId}/access-codes`, data)

export const updateEventAccessCode = (
  eventId: number,
  accessCodeId: number,
  data: Partial<Pick<OnsiteAccessCode, 'enabled' | 'can_register' | 'can_check_in' | 'can_print' | 'label' | 'expires_at'>>,
) => api.patch<OnsiteAccessCode>(`/events/${eventId}/access-codes/${accessCodeId}`, data)

export const deleteEventAccessCode = (eventId: number, accessCodeId: number) =>
  api.delete(`/events/${eventId}/access-codes/${accessCodeId}`)
