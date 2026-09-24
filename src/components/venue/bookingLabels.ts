import { differenceInCalendarDays } from 'date-fns'
import type { VenueBooking } from '@/lib/api/venues'

export const PENDING_HOLD_DAYS = 7

export function bookingSourceLabel(source?: string | null) {
  if (source === 'event_request') return 'Event request'
  if (source === 'public_request') return 'Public request'
  return 'Manual'
}

export function bookingTitle(booking: Pick<VenueBooking, 'title' | 'event'>) {
  return booking.title || booking.event?.name || 'Booking'
}

export function pendingExpiresSoon(createdAt?: string | null) {
  if (!createdAt) return false
  const age = differenceInCalendarDays(new Date(), new Date(createdAt))
  return age >= PENDING_HOLD_DAYS - 2
}

export function overlapsRange(startsAt: string, endsAt: string, rangeStart: Date, rangeEnd: Date) {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  return start <= rangeEnd && end >= rangeStart
}
