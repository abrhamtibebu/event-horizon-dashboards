export interface TaskComment {
  id: number
  task_id: number
  user_id: number
  comment: string
  created_at: string
  updated_at: string
  user?: {
    id: number
    name: string
    email: string
  }
}

export interface UnifiedTask {
  id: string // Unique identifier (can be prefixed with type)
  type: 'event_task' | 'usher_task' | 'operational_task'
  source: 'api' | 'event_usher' | 'session_usher' | 'manual'
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: number // User ID
  assignedUser?: { id: number; name: string; email: string }
  event_id?: number
  event?: { id: number; title: string; start_date: string }
  session_id?: number
  session?: { id: number; name: string }
  due_date?: string
  completed_date?: string
  created_at: string
  updated_at: string
  notes?: string
  comments?: TaskComment[]
  attachments?: string[]
  // Operational task specific
  task_category?: 'vendor_recruitment' | 'sponsor_followup' | 'sponsor_listing' | 'event_setup' | 'post_event' | 'other'
  vendor_id?: number
  vendor?: { id: number; name: string }
  sponsor_id?: number
  sponsor?: { id: number; name: string }
  // Original task ID from source (for updates)
  original_id?: number
  // Usher task specific
  usher_id?: number
  usher?: { id: number; name: string; email: string }
}

export interface TaskFormData {
  title: string
  description?: string
  task_type: 'event_task' | 'usher_task' | 'operational_task'
  task_category?: 'vendor_recruitment' | 'sponsor_followup' | 'sponsor_listing' | 'event_setup' | 'post_event' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: number
  event_id?: number
  session_id?: number
  due_date?: string
  notes?: string
  vendor_id?: number
  sponsor_id?: number
  usher_id?: number
}

export interface TaskFilters {
  status?: 'all' | 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority?: 'all' | 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: 'all' | 'unassigned' | string // User ID as string
  event_id?: 'all' | string // Event ID as string
  task_type?: 'all' | 'event_task' | 'usher_task' | 'operational_task'
  task_category?: 'all' | 'vendor_recruitment' | 'sponsor_followup' | 'sponsor_listing' | 'event_setup' | 'post_event' | 'other'
  due_date?: 'all' | 'overdue' | 'due_today' | 'due_this_week' | 'due_this_month'
  search?: string
  group_by?: 'none' | 'assigned_user' | 'event' | 'task_category' | 'priority'
}

export interface TaskStatistics {
  total: number
  pending: number
  in_progress: number
  completed: number
  cancelled: number
  overdue: number
  due_soon: number
  by_priority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  by_type: {
    event_task: number
    usher_task: number
    operational_task: number
  }
  by_category: {
    vendor_recruitment: number
    sponsor_followup: number
    sponsor_listing: number
    event_setup: number
    post_event: number
    other: number
  }
  team_workload: Array<{
    user_id: number
    user_name: string
    task_count: number
  }>
}

export type ViewMode = 'list' | 'team'


