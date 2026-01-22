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
  type: 'event_task' | 'usher_task' | 'operational_task' | 'general_task' // Keep operational_task for backward compatibility
  scope_type?: 'event' | 'general' // Clear distinction between event and general tasks
  source: 'api' | 'event_usher' | 'session_usher' | 'manual'
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'waiting' | 'completed' | 'cancelled' // Added 'waiting' status
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical' // Added 'critical' priority
  assigned_to?: number // User ID
  assignedUser?: { id: number; name: string; email: string }
  event_id?: number
  event?: { id: number; title: string; start_date: string }
  session_id?: number
  session?: { id: number; name: string }
  start_date?: string // Separate from due_date
  due_date?: string
  completed_date?: string
  created_at: string
  updated_at: string
  notes?: string
  comments?: TaskComment[]
  attachments?: string[]
  // Operational/General task specific
  task_category?: 'vendor_recruitment' | 'sponsor_followup' | 'sponsor_listing' | 'event_setup' | 'post_event' | 'other'
  department?: string // For general tasks
  vendor_id?: number
  vendor?: { id: number; name: string }
  sponsor_id?: number
  sponsor?: { id: number; name: string }
  // Event task specific
  event_phase?: string // For event tasks
  // Multi-event linking
  linked_events?: number[] // For tasks linked to multiple events
  // Template and conversion tracking
  template_id?: number // For template-based tasks
  converted_from?: string // Track conversions (task ID)
  // Original task ID from source (for updates)
  original_id?: number
  // Usher task specific
  usher_id?: number
  usher?: { id: number; name: string; email: string }
}

export interface TaskFormData {
  title: string
  description?: string
  task_type: 'event_task' | 'usher_task' | 'operational_task' | 'general_task'
  scope_type?: 'event' | 'general' // Scope selection for unified flow
  task_category?: 'vendor_recruitment' | 'sponsor_followup' | 'sponsor_listing' | 'event_setup' | 'post_event' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical'
  assigned_to?: number
  event_id?: number
  session_id?: number
  start_date?: string // Start date separate from due date
  due_date?: string
  notes?: string
  vendor_id?: number
  sponsor_id?: number
  usher_id?: number
  department?: string // For general tasks
  event_phase?: string // For event tasks
  status?: 'pending' | 'in_progress' | 'waiting' | 'completed' | 'cancelled'
  template_id?: number // Optional template to apply
}

export interface TaskFilters {
  status?: 'all' | 'pending' | 'in_progress' | 'waiting' | 'completed' | 'cancelled'
  priority?: 'all' | 'low' | 'medium' | 'high' | 'urgent' | 'critical'
  assigned_to?: 'all' | 'unassigned' | string // User ID as string
  event_id?: 'all' | string // Event ID as string
  task_type?: 'all' | 'event_task' | 'usher_task' | 'operational_task' | 'general_task'
  scope_type?: 'all' | 'event' | 'general' // Filter by scope type
  task_category?: 'all' | 'vendor_recruitment' | 'sponsor_followup' | 'sponsor_listing' | 'event_setup' | 'post_event' | 'other'
  department?: 'all' | string // For general tasks
  event_phase?: 'all' | string // For event tasks
  due_date?: 'all' | 'overdue' | 'due_today' | 'due_this_week' | 'due_this_month'
  search?: string
  group_by?: 'none' | 'assigned_user' | 'event' | 'department' | 'task_category' | 'priority' | 'scope_type' | 'status'
}

export interface TaskStatistics {
  total: number
  pending: number
  in_progress: number
  waiting: number
  completed: number
  cancelled: number
  overdue: number
  due_soon: number
  by_priority: {
    low: number
    medium: number
    high: number
    urgent: number
    critical: number
  }
  by_type: {
    event_task: number
    usher_task: number
    operational_task: number
    general_task: number
  }
  by_scope: {
    event: number
    general: number
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
  // Enhanced metrics
  completion_rate?: {
    event: number
    general: number
    overall: number
  }
  on_time_delivery?: {
    event: number
    general: number
    overall: number
  }
  department_productivity?: Array<{
    department: string
    completed: number
    total: number
    completion_rate: number
  }>
  vendor_performance?: Array<{
    vendor_id: number
    vendor_name: string
    completed: number
    total: number
    on_time: number
  }>
}

export type ViewMode = 'list' | 'kanban' | 'timeline' | 'team'

// Task Template interfaces
export interface TaskTemplate {
  id: number
  name: string
  description?: string
  category: 'event' | 'general' | 'department'
  scope_type: 'event' | 'general'
  department?: string
  event_type?: string
  tasks: Array<{
    title: string
    description?: string
    priority: 'low' | 'medium' | 'high' | 'urgent' | 'critical'
    task_category?: string
    department?: string
    estimated_duration_days?: number
    dependencies?: number[] // Task indices within template
  }>
  created_at: string
  updated_at: string
  created_by: number
}

// Task Automation Rule interfaces
export interface TaskAutomationRule {
  id: number
  name: string
  description?: string
  scope_type?: 'event' | 'general' | 'all'
  trigger_type: 'status_change' | 'due_date' | 'assignment' | 'event_phase' | 'completion'
  trigger_conditions: Record<string, any>
  actions: Array<{
    type: 'notify' | 'assign' | 'change_status' | 'change_priority' | 'create_task' | 'update_field'
    params: Record<string, any>
  }>
  enabled: boolean
  created_at: string
  updated_at: string
  created_by: number
}


