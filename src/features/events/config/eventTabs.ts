export interface EventTabConfig {
  label: string
  value: string
  requiresManage?: boolean
}

const FREE_EVENT_TABS: EventTabConfig[] = [
  { label: 'Details', value: 'details' },
  { label: 'Attendees', value: 'attendees' },
  { label: 'Ushers', value: 'ushers', requiresManage: true },
  { label: 'Bulk Badges', value: 'bulk-badges', requiresManage: true },
  { label: 'Team', value: 'team', requiresManage: true },
  { label: 'Forms', value: 'forms', requiresManage: true },
  { label: 'Survey', value: 'survey', requiresManage: true },
  { label: 'Sessions', value: 'sessions' },
  { label: 'Invitations', value: 'invitations', requiresManage: true },
  { label: 'Analytics', value: 'analytics', requiresManage: true },
]

const TICKETED_EVENT_TABS: EventTabConfig[] = [
  { label: 'Overview', value: 'overview' },
  { label: 'Tickets', value: 'tickets', requiresManage: true },
  { label: 'Seating', value: 'seating', requiresManage: true },
  { label: 'Ticket Holders', value: 'ticket-holders' },
  { label: 'Check-in', value: 'check-in' },
  { label: 'Ushers', value: 'ushers', requiresManage: true },
  { label: 'Sales', value: 'sales', requiresManage: true },
  { label: 'Referrals', value: 'referrals', requiresManage: true },
]

const FREE_USHER_TABS: EventTabConfig[] = [
  { label: 'Attendees', value: 'attendees' },
]

const TICKETED_USHER_TABS: EventTabConfig[] = [
  { label: 'Ticket Holders', value: 'ticket-holders' },
  { label: 'Check-in', value: 'check-in' },
]

export function getEventTabs(params: {
  eventType?: string | null
  role?: string | null
  canManageEvent?: boolean
}): EventTabConfig[] {
  const { eventType, role, canManageEvent = false } = params
  const isTicketed = eventType === 'ticketed'
  const isUsher = role === 'usher'

  const tabs = isUsher
    ? isTicketed
      ? TICKETED_USHER_TABS
      : FREE_USHER_TABS
    : isTicketed
      ? TICKETED_EVENT_TABS
      : FREE_EVENT_TABS

  return tabs.filter((tab) => !tab.requiresManage || canManageEvent)
}

export function getDefaultEventTab(params: {
  eventType?: string | null
  role?: string | null
  canManageEvent?: boolean
}): string {
  const [firstTab] = getEventTabs(params)
  return firstTab?.value ?? 'details'
}
