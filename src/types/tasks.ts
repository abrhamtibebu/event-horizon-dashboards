// Task Status Types
export type TaskStatus = 
  | 'pending' 
  | 'in_progress' 
  | 'waiting' 
  | 'blocked' 
  | 'review_required' 
  | 'completed' 
  | 'cancelled';

// Task Priority Types
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

// Task Type Types
export type TaskType = 'deliverable' | 'milestone' | 'review' | 'payment' | 'other';

// Task Category Types
export type TaskCategory = 
  | 'vendor_recruitment'
  | 'sponsor_followup'
  | 'sponsor_listing'
  | 'event_setup'
  | 'post_event'
  | 'operations'
  | 'logistics'
  | 'staffing'
  | 'marketing'
  | 'sales'
  | 'finance'
  | 'technical'
  | 'client_related'
  | 'other';

// Event Phase Types
export type EventPhase = 'pre_event' | 'event_day' | 'post_event' | null;

// Recurrence Pattern
export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  end_date?: string;
  days_of_week?: number[]; // 0-6, Sunday-Saturday
  day_of_month?: number; // 1-31
}

// Task Interface
export interface Task {
  id: number;
  event_id: number | null;
  organizer_id: number;
  vendor_id: number | null;
  quotation_id: number | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  task_category: TaskCategory | null;
  due_date: string | null;
  start_date: string | null;
  estimated_duration: number | null; // in minutes
  recurrence_pattern: RecurrencePattern | null;
  location: string | null;
  gps_latitude: number | null;
  gps_longitude: number | null;
  event_phase: EventPhase;
  completed_date: string | null;
  notes: string | null;
  completion_notes: string | null;
  attachments: string[] | null;
  proof_media: string[] | null;
  supervisor_approval_required: boolean;
  approved_by: number | null;
  approved_at: string | null;
  assigned_to: number | null;
  created_by: number;
  updated_by: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  
  // Relationships
  event?: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
  } | null;
  organizer?: {
    id: number;
    name: string;
  } | null;
  assignedUser?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  } | null;
  creator?: {
    id: number;
    name: string;
    email: string;
  } | null;
  approver?: {
    id: number;
    name: string;
    email: string;
  } | null;
  watchers?: Array<{
    id: number;
    name: string;
    email: string;
    avatar?: string;
  }>;
  dependencies?: Array<{
    id: number;
    depends_on_task_id: number;
    dependsOnTask?: Task;
  }>;
}

// Task Dependency Interface
export interface TaskDependency {
  id: number;
  task_id: number;
  depends_on_task_id: number;
  created_at: string;
  updated_at: string;
  dependsOnTask?: Task;
}

// Task Watcher Interface
export interface TaskWatcher {
  id: number;
  task_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
}

// Task Activity Log Interface
export interface TaskActivityLog {
  id: number;
  task_id: number;
  user_id: number | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  } | null;
}

// Task Template Interface
export interface TaskTemplate {
  id: number;
  name: string;
  description: string | null;
  organizer_id: number | null;
  event_type: string | null;
  task_data: Partial<Task>;
  created_at: string;
  updated_at: string;
}

// Task Filters Interface
export interface TaskFilters {
  event_id?: number | null;
  vendor_id?: number | null;
  status?: TaskStatus | TaskStatus[] | null;
  priority?: TaskPriority | TaskPriority[] | null;
  type?: TaskType | TaskType[] | null;
  task_category?: TaskCategory | TaskCategory[] | null;
  operational?: boolean | null;
  assigned_to?: number | null;
  overdue?: boolean | null;
  due_soon?: boolean | null;
  due_soon_days?: number;
  event_phase?: EventPhase | EventPhase[] | null;
  location?: string | null;
  watcher_id?: number | null;
  has_dependencies?: boolean | null;
  search?: string | null;
  sort_by?: 'created_at' | 'updated_at' | 'due_date' | 'start_date' | 'priority' | 'title';
  sort_order?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
}

// Task Statistics Interface
export interface TaskStatistics {
  total: number;
  pending: number;
  in_progress: number;
  waiting: number;
  blocked: number;
  review_required: number;
  completed: number;
  cancelled: number;
  overdue: number;
  due_soon: number;
  requiring_approval: number;
  by_priority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
    critical: number;
  };
  by_type: {
    deliverable: number;
    milestone: number;
    review: number;
    payment: number;
    other: number;
  };
  by_category: {
    vendor_recruitment: number;
    sponsor_followup: number;
    sponsor_listing: number;
    event_setup: number;
    post_event: number;
    operations: number;
    logistics: number;
    staffing: number;
    marketing: number;
    sales: number;
    finance: number;
    technical: number;
    client_related: number;
    other: number;
  };
  operational_tasks: number;
  event_tasks: number;
}

// Task Create/Update Payload
export interface TaskPayload {
  event_id?: number | null;
  organizer_id?: number;
  vendor_id?: number | null;
  quotation_id?: number | null;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  task_category?: TaskCategory | null;
  due_date?: string | null;
  start_date?: string | null;
  estimated_duration?: number | null;
  recurrence_pattern?: RecurrencePattern | null;
  location?: string | null;
  gps_latitude?: number | null;
  gps_longitude?: number | null;
  event_phase?: EventPhase;
  notes?: string | null;
  completion_notes?: string | null;
  attachments?: string[] | null;
  proof_media?: string[] | null;
  supervisor_approval_required?: boolean;
  assigned_to?: number | null;
  watcher_ids?: number[];
  dependency_task_ids?: number[];
}

// API Response Types
export interface TasksResponse {
  success: boolean;
  data: {
    data: Task[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  message: string;
}

export interface TaskResponse {
  success: boolean;
  data: Task;
  message: string;
}

export interface TaskStatisticsResponse {
  success: boolean;
  data: TaskStatistics;
  message: string;
}

