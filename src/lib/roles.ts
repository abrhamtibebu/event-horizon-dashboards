/** Roles that manage events for their organization (same access as organizer for event features). */
export const ORGANIZER_EVENT_ROLES = ['organizer', 'organizer_admin', 'event_manager'] as const

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
