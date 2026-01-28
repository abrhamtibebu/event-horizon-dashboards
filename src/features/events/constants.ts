// Constants for event-related functionality

export const PREDEFINED_GUEST_TYPES = [
  'General',
  'VIP',
  'Speaker',
  'Staff',
  'Exhibitor',
  'Media',
  'Regular',
  'Visitor',
  'Sponsor',
  'Organizer',
  'Volunteer',
  'Partner',
  'Vendor',
  'Press',
  'Student',
  'Other'
]

export const DEFAULT_PAGE_SIZE = 15
export const MAX_PAGE_SIZE = 100
export const PRINT_DELAY_MS = 300
export const CSV_UPLOAD_MAX_SIZE = 5 * 1024 * 1024 // 5MB

export const TASK_COLORS = {
  'check-in': 'bg-info/10 dark:bg-info/20 text-info dark:text-info border-info/30',
  'security': 'bg-error/10 dark:bg-error/20 text-error dark:text-error border-error/30',
  'guest-assistance': 'bg-success/10 dark:bg-success/20 text-success dark:text-success border-success/30',
  'crowd-control': 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border-primary/30',
  'communication': 'bg-warning/10 dark:bg-warning/20 text-warning dark:text-warning border-warning/30',
  'technical': 'bg-info/10 dark:bg-info/20 text-info dark:text-info border-info/30',
  'emergency': 'bg-error/10 dark:bg-error/20 text-error dark:text-error border-error/30',
  'default': 'bg-muted text-muted-foreground border-border'
} as const

export const EVENT_STATUS_COLORS = {
  'draft': 'bg-gray-100 text-gray-800',
  'active': 'bg-green-100 text-green-800',
  'completed': 'bg-blue-100 text-blue-800',
  'cancelled': 'bg-red-100 text-red-800',
  'published': 'bg-purple-100 text-purple-800',
  'pending': 'bg-yellow-100 text-yellow-800'
} as const
