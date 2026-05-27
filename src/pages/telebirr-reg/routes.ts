import { DEFAULT_TELEBIRR_EVENT_ID } from './constants'

export function telebirrRegisterPath(eventId: string = DEFAULT_TELEBIRR_EVENT_ID): string {
  return `/event/telebirr-register/${eventId}`
}

export function telebirrSuccessPath(eventId: string = DEFAULT_TELEBIRR_EVENT_ID): string {
  return `/event/telebirr-register/${eventId}/success`
}

export function telebirrRegisterPathWithSearch(
  eventId: string = DEFAULT_TELEBIRR_EVENT_ID,
  search: string = '',
): string {
  return `${telebirrRegisterPath(eventId)}${search}`
}
