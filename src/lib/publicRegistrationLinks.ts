/**
 * Public registration URLs for attendee sharing — matches organizer tooling
 * (EventDetails / EventDetailsTabs): ticketed vs free events.
 */

import type { SurveyTriggerType } from '@/types/survey'

export type PublicEventRegistrationType = string | undefined

function normalizeShareBase(raw: string | null | undefined): string {
  return typeof raw === 'string' ? raw.trim().replace(/\/$/, '') : ''
}

/**
 * Social share URL: Laravel Open Graph pages when `sharePreviewBase` is non-empty;
 * otherwise direct SPA registration / ticket purchase URLs on `origin`.
 */
export function buildSocialShareRegistrationLink(params: {
  sharePreviewBase: string | null
  origin: string
  eventId: number
  eventUuid: string | undefined | null
  eventType: PublicEventRegistrationType
}): string | null {
  const ogBase = normalizeShareBase(params.sharePreviewBase)
  const spaBase = normalizeShareBase(params.origin)
  const useOg = !!ogBase
  const base = useOg ? ogBase : spaBase
  if (!base || !params.eventId) return null

  const q = 'type=prereg'

  if (params.eventType === 'ticketed') {
    if (useOg) {
      return `${base}/share/tickets/${params.eventId}?${q}`
    }
    return `${base}/tickets/purchase/${params.eventId}?${q}`
  }

  const uuid = typeof params.eventUuid === 'string' ? params.eventUuid.trim() : ''
  if (!uuid) return null
  if (useOg) {
    return `${base}/share/register/${encodeURIComponent(uuid)}?${q}`
  }
  return `${base}/event/register/${encodeURIComponent(uuid)}?${q}`
}

/**
 * Public survey URL on the SPA — same `origin` handling as direct registration links
 * (`normalizeShareBase(getPublicSiteURL())`).
 */
export function buildPublicSurveyFrontendLink(params: {
  origin: string
  eventId: number
  triggerType: SurveyTriggerType
}): string | null {
  const spaBase = normalizeShareBase(params.origin)
  if (!spaBase || !params.eventId) return null
  const q = new URLSearchParams()
  if (params.triggerType === 'manual') {
    q.set('eligible', '1')
  }
  const qs = q.toString()
  return `${spaBase}/events/${params.eventId}/survey${qs ? `?${qs}` : ''}`
}
