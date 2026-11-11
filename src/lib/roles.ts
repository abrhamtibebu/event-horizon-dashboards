/** Roles that manage events for their organization (same access as organizer for event features). */
export const ORGANIZER_EVENT_ROLES = ['organizer', 'organizer_admin', 'event_manager'] as const

export const VENUE_ROLES = ['venue_admin', 'venue_manager', 'booking_officer', 'venue_event_manager', 'finance_officer', 'operations_staff', 'security', 'venue_staff'] as const
export const VENUE_BOOKING_ROLES = ['venue_admin', 'venue_manager', 'booking_officer', 'venue_staff'] as const
export const VENUE_EVENT_ROLES = ['venue_admin', 'venue_manager', 'venue_event_manager', 'operations_staff', 'security', 'venue_staff'] as const
export const VENUE_FINANCE_ROLES = ['venue_admin', 'venue_manager', 'finance_officer', 'venue_staff'] as const

export function isVenueRole(role?: string | null): boolean {
  return !!role && (VENUE_ROLES as readonly string[]).includes(role)
}

export type OrganizerEventRole = (typeof ORGANIZER_EVENT_ROLES)[number]

export function isOrganizerEventRole(role?: string | null): boolean {
  if (!role) return false
  return (ORGANIZER_EVENT_ROLES as readonly string[]).includes(role)
}

export function canManageOrganizerEvents(role?: string | null): boolean {
  return (
    role === 'superadmin' ||
    role === 'admin' ||
    isOrganizerEventRole(role)
  )
}
