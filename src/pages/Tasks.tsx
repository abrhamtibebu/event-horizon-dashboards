import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  RefreshCw,
  List,
  Users,
  BarChart3,
  Filter,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import { ProtectedButton } from '@/components/ProtectedButton'
import { PermissionGuard } from '@/components/PermissionGuard'
import api from '@/lib/api'
import { taskApi, Task as EventTask } from '@/lib/taskApi'
import { getEventUshers, getEventSessions, getSessionUshers } from '@/lib/api'
import {
  UnifiedTask,
  TaskFormData,
  TaskFilters as TaskFiltersType,
  TaskStatistics,
  ViewMode,
} from '@/types/tasks'
import { TaskList } from '@/components/tasks/TaskList'
import { TaskFilters } from '@/components/tasks/TaskFilters'
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog'
import { TaskDetailsModal } from '@/components/tasks/TaskDetailsModal'
import { TaskStatistics as TaskStatisticsComponent } from '@/components/tasks/TaskStatistics'
import { TeamWorkloadView } from '@/components/tasks/TeamWorkloadView'
import { BulkActionsBar } from '@/components/tasks/BulkActionsBar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Breadcrumbs from '@/components/Breadcrumbs'
import { SpinnerInline } from '@/components/ui/spinner'
import { isPast, isToday, addDays, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

export default function Tasks() {
  const { user } = useAuth()
  const { hasPermission, checkPermission } = usePermissionCheck()
  const queryClient = useQueryClient()

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [showStatistics, setShowStatistics] = useState(false)
  const [showFilters, setShowFilters] = useState(true)

  // Task management state
  const [tasks, setTasks] = useState<UnifiedTask[]>([])
  const [selectedTask, setSelectedTask] = useState<UnifiedTask | null>(null)
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [showCheckboxes, setShowCheckboxes] = useState(false)

  // Filters
  const [filters, setFilters] = useState<TaskFiltersType>({
    status: 'all',
    priority: 'all',
    assigned_to: 'all',
    event_id: 'all',
    task_type: 'all',
    task_category: 'all',
    due_date: 'all',
    search: '',
    group_by: 'none',
  })

  // Loading states
  const [loading, setLoading] = useState(true)

  // Fetch events
  const { data: eventsData = [] } = useQuery({
    queryKey: ['events-for-tasks', user?.organizer_id],
    queryFn: async () => {
      try {
        // Fetch events with pagination - get all events for the organizer
        const response = await api.get('/events', {
          params: {
            per_page: 100, // Get up to 100 events
          }
        })
        
        // Handle different response structures
        // For organizers: response.data is a direct array
        // For admins: response.data might be paginated with response.data.data
        let events = []
        
        // Check if response.data is an array (direct response for organizers)
        if (Array.isArray(response.data)) {
          events = response.data
        } 
        // Check if response.data.data exists (paginated response for admins)
        else if (response.data?.data) {
          if (Array.isArray(response.data.data)) {
            events = response.data.data
          } else if (response.data.data?.data) {
            // Nested data structure
            events = Array.isArray(response.data.data.data) ? response.data.data.data : []
          }
        }
        // Check if response.data is an object with events array
        else if (response.data && typeof response.data === 'object') {
          // Try to find an array in the response
          if (Array.isArray(response.data.events)) {
            events = response.data.events
          } else if (response.data.id) {
            // Single event object
            events = [response.data]
          }
        }
        
        // Transform events to have consistent structure with id and title
        // Events API returns 'name' field, but we need 'title' for the dropdown
        const transformedEvents = events
          .filter((event: any) => event && event.id) // Filter out invalid events
          .map((event: any) => ({
            id: event.id,
            title: event.name || event.title || `Event ${event.id}`, // Use 'name' field as 'title'
            name: event.name || event.title,
            organizer_id: event.organizer_id,
            start_date: event.start_date || event.event_date,
            status: event.status,
          }))
        
        console.log('Fetched events for task dropdown:', {
          count: transformedEvents.length,
          events: transformedEvents.map((e: any) => ({ id: e.id, title: e.title })),
          rawResponse: response.data
        })
        
        return transformedEvents
      } catch (error) {
        console.error('Error fetching events for task creation:', error)
        return []
      }
    },
    enabled: !!user, // Only fetch if user is logged in
  })

  // Fetch team members
  const { data: teamMembersData = [] } = useQuery({
    queryKey: ['team-members-for-tasks', user?.organizer_id],
    queryFn: async () => {
      if (!user?.organizer_id) return []
      const response = await api.get(`/organizers/${user.organizer_id}/contacts`)
      return response.data || []
    },
    enabled: !!user?.organizer_id,
  })

  // Fetch vendors
  const { data: vendorsData = [] } = useQuery({
    queryKey: ['vendors-for-tasks'],
    queryFn: async () => {
      try {
      const response = await api.get('/vendors')
        return response.data.data || response.data || []
      } catch {
        return []
      }
    },
  })

  // Fetch sponsors (if endpoint exists)
  const { data: sponsorsData = [] } = useQuery({
    queryKey: ['sponsors-for-tasks'],
    queryFn: async () => {
      try {
        const response = await api.get('/sponsors')
        return response.data.data || response.data || []
      } catch {
        return []
      }
    },
  })

  // Normalize EventTask to UnifiedTask
  const normalizeEventTask = (task: EventTask): UnifiedTask => {
    // Determine if this is an operational task (no event_id) or event task
    const isOperational = !task.event_id;
    
    // Handle assignedUser - check multiple possible field names (camelCase and snake_case)
    // Laravel may serialize relationships differently depending on configuration
    // Check both camelCase (assignedUser) and snake_case (assigned_user)
    const taskAny = task as any;
    let assignedUser = task.assignedUser || taskAny.assigned_user || taskAny.assignedUser;
    
    // Debug: Log the task structure to see what we're getting
    if (task.assigned_to) {
      console.log(`Task ${task.id} - assigned_to: ${task.assigned_to}`, {
        hasAssignedUser: !!task.assignedUser,
        hasAssigned_user: !!taskAny.assigned_user,
        taskKeys: Object.keys(task),
        assignedUser: task.assignedUser,
        assigned_user: taskAny.assigned_user
      });
    }
    
    // If we have assigned_to but no assignedUser, log a warning
    if (task.assigned_to && !assignedUser) {
      console.warn(`Task ${task.id} has assigned_to (${task.assigned_to}) but no assignedUser object.`, {
        taskId: task.id,
        assigned_to: task.assigned_to,
        availableKeys: Object.keys(task),
        fullTask: task
      });
    }
    
    // Ensure assignedUser has required fields if it exists
    const normalizedAssignedUser = assignedUser ? {
      id: assignedUser.id || task.assigned_to,
      name: assignedUser.name || assignedUser.full_name || 'Unknown User',
      email: assignedUser.email || assignedUser.email_address || '',
    } : undefined;
    
    return {
      id: `event_task_${task.id}`,
      type: isOperational ? 'operational_task' : 'event_task',
      source: 'api',
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to,
      assignedUser: normalizedAssignedUser,
      event_id: task.event_id || undefined,
      event: task.event ? {
        id: task.event.id,
        title: task.event.name || task.event.title || `Event ${task.event.id}`, // Event model uses 'name' field
        start_date: task.event.event_date || task.event.start_date,
      } : undefined,
      due_date: task.due_date,
      completed_date: task.completed_date,
      created_at: task.created_at,
      updated_at: task.updated_at,
      notes: task.notes,
      task_category: task.task_category,
      vendor_id: task.vendor_id,
      vendor: task.vendor,
      original_id: task.id,
    }
  }

  // Normalize usher task from event_usher pivot
  const normalizeEventUsherTask = (
    task: string,
    usherId: number,
    usherName: string,
    usherEmail: string,
    eventId: number,
    eventTitle: string,
    eventStartDate: string,
    index: number
  ): UnifiedTask => {
    return {
      id: `event_usher_${eventId}_${usherId}_${index}`,
      type: 'usher_task',
      source: 'event_usher',
      title: task,
      status: 'pending',
      priority: 'medium',
      assigned_to: usherId,
      assignedUser: { id: usherId, name: usherName, email: usherEmail },
      event_id: eventId,
      event: { id: eventId, title: eventTitle, start_date: eventStartDate },
      usher_id: usherId,
      usher: { id: usherId, name: usherName, email: usherEmail },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  // Normalize usher task from session_usher pivot
  const normalizeSessionUsherTask = (
    task: string,
    usherId: number,
    usherName: string,
    usherEmail: string,
    sessionId: number,
    sessionName: string,
    eventId: number,
    eventTitle: string,
    eventStartDate: string,
    index: number
  ): UnifiedTask => {
    return {
      id: `session_usher_${sessionId}_${usherId}_${index}`,
      type: 'usher_task',
      source: 'session_usher',
      title: task,
      status: 'pending',
      priority: 'medium',
      assigned_to: usherId,
      assignedUser: { id: usherId, name: usherName, email: usherEmail },
      event_id: eventId,
      event: { id: eventId, title: eventTitle, start_date: eventStartDate },
      session_id: sessionId,
      session: { id: sessionId, name: sessionName },
      usher_id: usherId,
      usher: { id: usherId, name: usherName, email: usherEmail },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  // Fetch all tasks
  const fetchAllTasks = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true)
    }
    try {
      const allTasks: UnifiedTask[] = []

      // Fetch EventTask tasks - fetch all statuses including cancelled
      try {
        const [pendingResponse, inProgressResponse, completedResponse, cancelledResponse] = await Promise.all([
          taskApi.getTasks({ status: 'pending', per_page: 100 }).catch(() => ({ data: [] })),
          taskApi.getTasks({ status: 'in_progress', per_page: 100 }).catch(() => ({ data: [] })),
          taskApi.getTasks({ status: 'completed', per_page: 100 }).catch(() => ({ data: [] })),
          taskApi.getTasks({ status: 'cancelled', per_page: 100 }).catch(() => ({ data: [] })),
        ])

        const eventTasks = [
          ...(pendingResponse.data?.data || pendingResponse.data || []),
          ...(inProgressResponse.data?.data || inProgressResponse.data || []),
          ...(completedResponse.data?.data || completedResponse.data || []),
          ...(cancelledResponse.data?.data || cancelledResponse.data || []),
        ]

        eventTasks.forEach((task: EventTask) => {
          // Debug logging to check assignedUser data
          if (task.assigned_to && !task.assignedUser) {
            console.warn('Task has assigned_to but no assignedUser:', {
              taskId: task.id,
              assigned_to: task.assigned_to,
              task: task
            })
          }
          if (task.assignedUser) {
            console.log('Task assignedUser found:', {
              taskId: task.id,
              assignedUser: task.assignedUser,
              name: task.assignedUser?.name
            })
          }
          allTasks.push(normalizeEventTask(task))
        })
      } catch (error) {
        console.error('Error fetching event tasks:', error)
      }

      // Fetch event usher tasks
      if (eventsData && Array.isArray(eventsData)) {
        for (const event of eventsData) {
          try {
            const ushersResponse = await getEventUshers(event.id)
            const ushers = ushersResponse.data || []

            ushers.forEach((usher: any) => {
              if (usher.pivot?.tasks && Array.isArray(usher.pivot.tasks)) {
                usher.pivot.tasks.forEach((task: string, index: number) => {
                  allTasks.push(normalizeEventUsherTask(
                    task,
                    usher.id,
                    usher.name,
                    usher.email,
                    event.id,
                    event.title || event.name,
                    event.start_date || event.event_date,
                    index
                  ))
                })
              }
            })
          } catch (error) {
            console.error(`Error fetching ushers for event ${event.id}:`, error)
          }
        }
      }

      // Fetch session usher tasks
      if (eventsData && Array.isArray(eventsData)) {
        for (const event of eventsData) {
          try {
            const sessionsResponse = await getEventSessions(event.id)
            const sessions = sessionsResponse.data?.data || sessionsResponse.data || []

            for (const session of sessions) {
              try {
                const sessionUshersResponse = await getSessionUshers(session.id)
                const sessionUshers = sessionUshersResponse.data?.data || sessionUshersResponse.data || []

                sessionUshers.forEach((usher: any) => {
                  if (usher.pivot?.tasks && Array.isArray(usher.pivot.tasks)) {
                    usher.pivot.tasks.forEach((task: string, index: number) => {
                      allTasks.push(normalizeSessionUsherTask(
                        task,
                        usher.id,
                        usher.name,
                        usher.email,
                        session.id,
                        session.name,
                        event.id,
                        event.title || event.name,
                        event.start_date || event.event_date,
                        index
                      ))
                    })
                  }
                })
              } catch (error) {
                console.error(`Error fetching ushers for session ${session.id}:`, error)
              }
            }
          } catch (error) {
            console.error(`Error fetching sessions for event ${event.id}:`, error)
          }
        }
      }

      setTasks(allTasks)
    } catch (error) {
      console.error('Error fetching tasks:', error)
      if (showLoading) {
        toast.error('Failed to fetch tasks')
      }
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    if (user) {
      fetchAllTasks()
    }
  }, [user, eventsData])

  // Filter tasks
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(task => task.status === filters.status)
    }

    // Priority filter
    if (filters.priority && filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority)
    }

    // Assigned to filter
    if (filters.assigned_to && filters.assigned_to !== 'all') {
      if (filters.assigned_to === 'unassigned') {
        filtered = filtered.filter(task => !task.assigned_to)
      } else {
        filtered = filtered.filter(task => task.assigned_to === Number(filters.assigned_to))
      }
    }

    // Event filter
    if (filters.event_id && filters.event_id !== 'all') {
      filtered = filtered.filter(task => task.event_id === Number(filters.event_id))
    }

    // Task type filter
    if (filters.task_type && filters.task_type !== 'all') {
      filtered = filtered.filter(task => task.type === filters.task_type)
    }

    // Task category filter
    if (filters.task_category && filters.task_category !== 'all') {
      filtered = filtered.filter(task => task.task_category === filters.task_category)
    }

    // Due date filter
    if (filters.due_date && filters.due_date !== 'all') {
      const now = new Date()
      filtered = filtered.filter(task => {
        if (!task.due_date) return false
        const dueDate = parseISO(task.due_date)

        switch (filters.due_date) {
          case 'overdue':
            return isPast(dueDate) && task.status !== 'completed' && task.status !== 'cancelled'
          case 'due_today':
            return isToday(dueDate)
          case 'due_this_week':
            const weekStart = startOfWeek(now)
            const weekEnd = endOfWeek(now)
            return dueDate >= weekStart && dueDate <= weekEnd
          case 'due_this_month':
            const monthStart = startOfMonth(now)
            const monthEnd = endOfMonth(now)
            return dueDate >= monthStart && dueDate <= monthEnd
          default:
            return true
        }
      })
    }

    return filtered
  }, [tasks, filters])

  // Calculate statistics
  const statistics = useMemo((): TaskStatistics => {
    const stats: TaskStatistics = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      cancelled: tasks.filter(t => t.status === 'cancelled').length,
      overdue: tasks.filter(t => {
        if (!t.due_date || t.status === 'completed' || t.status === 'cancelled') return false
        return isPast(parseISO(t.due_date))
      }).length,
      due_soon: tasks.filter(t => {
        if (!t.due_date || t.status === 'completed' || t.status === 'cancelled') return false
        const dueDate = parseISO(t.due_date)
        const threeDaysFromNow = addDays(new Date(), 3)
        return dueDate > new Date() && dueDate <= threeDaysFromNow
      }).length,
      by_priority: {
        low: tasks.filter(t => t.priority === 'low').length,
        medium: tasks.filter(t => t.priority === 'medium').length,
        high: tasks.filter(t => t.priority === 'high').length,
        urgent: tasks.filter(t => t.priority === 'urgent').length,
      },
      by_type: {
        event_task: tasks.filter(t => t.type === 'event_task').length,
        usher_task: tasks.filter(t => t.type === 'usher_task').length,
        operational_task: tasks.filter(t => t.type === 'operational_task').length,
      },
      by_category: {
        vendor_recruitment: tasks.filter(t => t.task_category === 'vendor_recruitment').length,
        sponsor_followup: tasks.filter(t => t.task_category === 'sponsor_followup').length,
        sponsor_listing: tasks.filter(t => t.task_category === 'sponsor_listing').length,
        event_setup: tasks.filter(t => t.task_category === 'event_setup').length,
        post_event: tasks.filter(t => t.task_category === 'post_event').length,
        other: tasks.filter(t => !t.task_category || t.task_category === 'other').length,
      },
      team_workload: teamMembersData.map((member: any) => ({
        user_id: member.id,
        user_name: member.name,
        task_count: tasks.filter(t => t.assigned_to === member.id).length,
      })),
    }
    return stats
  }, [tasks, teamMembersData])

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (data.task_type === 'event_task') {
        // Validate event_id is provided for event tasks
        if (!data.event_id) {
          throw new Error('Event is required for event tasks')
        }
        
        // Create EventTask via API - status is always 'pending' for new tasks
        const taskData = {
          event_id: data.event_id,
          organizer_id: user?.organizer_id,
          title: data.title,
          description: data.description,
          status: 'pending', // Always pending for new tasks
          priority: data.priority || 'medium',
          type: 'other', // Default type
          task_category: data.task_category,
          due_date: data.due_date,
          notes: data.notes,
          assigned_to: data.assigned_to,
        }
        await taskApi.createTask(taskData)
      } else if (data.task_type === 'operational_task') {
        // Create operational task as EventTask with special handling (no event_id)
        // Status is always 'pending' for new tasks
        const taskData = {
          event_id: null, // Operational tasks don't have event_id
          organizer_id: user?.organizer_id,
          title: data.title,
          description: data.description,
          status: 'pending', // Always pending for new tasks
          priority: data.priority || 'medium',
          type: 'other', // Default type
          task_category: data.task_category,
          due_date: data.due_date,
          notes: data.notes,
          assigned_to: data.assigned_to,
        }
        await taskApi.createTask(taskData)
      } else if (data.task_type === 'usher_task') {
        // Create usher task by updating event_usher or session_usher pivot
        if (data.event_id && data.usher_id) {
          if (data.session_id) {
            // Session usher task
            const sessionUshersResponse = await getSessionUshers(data.session_id)
            const sessionUshers = sessionUshersResponse.data?.data || sessionUshersResponse.data || []
            const existingUsher = sessionUshers.find((u: any) => u.id === data.usher_id)
            const existingTasks = existingUsher?.pivot?.tasks || []
            const newTasks = [...existingTasks, data.title]
            await api.put(`/sessions/${data.session_id}/ushers/${data.usher_id}`, { tasks: newTasks })
          } else {
            // Event usher task
            const eventUshersResponse = await getEventUshers(data.event_id)
            const eventUshers = eventUshersResponse.data || []
            const existingUsher = eventUshers.find((u: any) => u.id === data.usher_id)
            const existingTasks = existingUsher?.pivot?.tasks || []
            const newTasks = [...existingTasks, data.title]
            await api.put(`/events/${data.event_id}/ushers/${data.usher_id}`, { tasks: newTasks })
          }
        }
      }
    },
    onSuccess: () => {
      toast.success('Task created successfully')
      setTaskDialogOpen(false)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      fetchAllTasks()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create task')
    },
  })

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<UnifiedTask> }) => {
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')

      if (task.source === 'api' && task.original_id) {
        // Update EventTask via API
        // Build update payload - only include defined values
        const updatePayload: any = {}
        
        // Always include status if it's being updated
        if (updates.status !== undefined) {
          updatePayload.status = updates.status
        }
        
        // Include other fields if they're defined
        if (updates.title !== undefined) updatePayload.title = updates.title
        if (updates.description !== undefined) updatePayload.description = updates.description
        if (updates.priority !== undefined) updatePayload.priority = updates.priority
        if (updates.type !== undefined) updatePayload.type = updates.type
        if (updates.task_category !== undefined) updatePayload.task_category = updates.task_category
        if (updates.assigned_to !== undefined) updatePayload.assigned_to = updates.assigned_to
        if (updates.due_date !== undefined) updatePayload.due_date = updates.due_date
        if (updates.notes !== undefined) updatePayload.notes = updates.notes
        if (updates.event_id !== undefined) updatePayload.event_id = updates.event_id
        if (updates.completed_date !== undefined) updatePayload.completed_date = updates.completed_date
        
        console.log('Updating task:', {
          taskId: task.original_id,
          updates: updatePayload,
          status: updatePayload.status
        })
        
        const response = await taskApi.updateTask(task.original_id, updatePayload)
        return { taskId, updatedTask: response, originalTask: task }
      } else if (task.source === 'event_usher' || task.source === 'session_usher') {
        // Update usher task by updating pivot table
        // For now, we'll just refetch since updating individual tasks in pivot is complex
        // In a real implementation, you'd need backend support for updating individual usher tasks
        toast.info('Usher task updates require backend support')
        return { taskId, updatedTask: null, originalTask: task }
      }
      return { taskId, updatedTask: null, originalTask: task }
    },
    onMutate: async ({ taskId, updates }) => {
      // Cancel any outgoing refetches to avoid overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      
      // Snapshot the previous value for rollback
      const previousTasks = [...tasks]
      
      // Optimistic update - immediately update the UI so task moves to correct column
      setTasks(prevTasks => 
        prevTasks.map(task => {
          if (task.id === taskId) {
            const updatedTask = {
              ...task,
              ...updates,
              updated_at: new Date().toISOString(),
            }
            // Ensure completed_date is set/cleared correctly
            if (updates.status === 'completed' && !updates.completed_date) {
              updatedTask.completed_date = new Date().toISOString()
            } else if (updates.status !== 'completed' && task.status === 'completed') {
              updatedTask.completed_date = undefined
            }
            return updatedTask
          }
          return task
        })
      )
      
      return { previousTasks }
    },
    onSuccess: (data, variables, context) => {
      // If we got updated task from backend, normalize and update with server data
      // This ensures we have the latest data from the server
      if (data?.updatedTask) {
        const normalizedTask = normalizeEventTask(data.updatedTask)
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === variables.taskId ? normalizedTask : task
          )
        )
        
        // Update selected task if modal is open for this task
        setSelectedTask(prevTask => {
          if (prevTask && prevTask.id === variables.taskId) {
            return normalizedTask
          }
          return prevTask
        })
      }
      
      // Refetch to ensure consistency with backend (silent background refresh)
      // This catches any changes that might have happened on the server
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      // Refetch in background without showing loading state
      setTimeout(() => {
        fetchAllTasks(false).catch(() => {
          // Silently handle refetch errors - optimistic update is already applied
        })
      }, 500)
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousTasks) {
        setTasks(context.previousTasks)
        // Also update selected task if modal is open
        if (selectedTask && selectedTask.id === variables.taskId) {
          const previousTask = context.previousTasks.find(t => t.id === variables.taskId)
          if (previousTask) {
            setSelectedTask(previousTask)
          }
        }
      }
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to update task'
      toast.error(errorMessage)
    },
  })

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = tasks.find(t => t.id === taskId)
      if (!task) throw new Error('Task not found')

      if (task.source === 'api' && task.original_id) {
        await taskApi.deleteTask(task.original_id)
      } else {
        // For usher tasks, we'd need to remove from pivot table
        toast.info('Usher task deletion requires backend support')
      }
    },
    onSuccess: () => {
      toast.success('Task deleted successfully')
      setTaskDetailsOpen(false)
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      fetchAllTasks()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete task')
    },
  })

  // Handle task move (status change)
  const handleTaskMove = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      const updates: Partial<UnifiedTask> = { status: newStatus }
      
      // Set completed_date when status is completed
      if (newStatus === 'completed') {
        updates.completed_date = new Date().toISOString()
      } else {
        // Clear completed_date when status changes from completed
        const currentTask = tasks.find(t => t.id === taskId)
        if (currentTask?.status === 'completed') {
          updates.completed_date = undefined
        }
      }
      
      await updateTaskMutation.mutateAsync({
        taskId,
        updates,
      })
    } catch (error) {
      console.error('Error updating task status:', error)
      // Error is already handled in mutation onError
    }
  }

  // Handle task click
  const handleTaskClick = (task: UnifiedTask) => {
    setSelectedTask(task)
    setTaskDetailsOpen(true)
  }

  // Handle bulk operations
  const handleBulkAssign = async (userId: number) => {
    for (const taskId of selectedTasks) {
      await updateTaskMutation.mutateAsync({
        taskId,
        updates: { assigned_to: userId },
      })
    }
    setSelectedTasks(new Set())
    setShowCheckboxes(false)
  }

  const handleBulkStatusChange = async (status: string) => {
    for (const taskId of selectedTasks) {
      await updateTaskMutation.mutateAsync({
        taskId,
        updates: { status: status as any },
      })
    }
    setSelectedTasks(new Set())
    setShowCheckboxes(false)
  }

  const handleBulkPriorityChange = async (priority: string) => {
    for (const taskId of selectedTasks) {
      await updateTaskMutation.mutateAsync({
        taskId,
        updates: { priority: priority as any },
      })
    }
    setSelectedTasks(new Set())
    setShowCheckboxes(false)
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedTasks.size} tasks?`)) return
    for (const taskId of selectedTasks) {
      await deleteTaskMutation.mutateAsync(taskId)
    }
    setSelectedTasks(new Set())
    setShowCheckboxes(false)
  }

  // Handle task select
  const handleTaskSelect = (taskId: string, selected: boolean) => {
    const newSelected = new Set(selectedTasks)
    if (selected) {
      newSelected.add(taskId)
    } else {
      newSelected.delete(taskId)
    }
    setSelectedTasks(newSelected)
  }

  // Get sessions for selected event
  const getSessionsForEvent = async (eventId: number) => {
    try {
      const response = await getEventSessions(eventId)
      const sessions = response.data?.data || response.data || []
      return sessions.map((s: any) => ({ id: s.id, name: s.name }))
    } catch {
      return []
    }
  }

  // Format events for dropdown - eventsData is already transformed to have id and title
  // But we need to ensure they're properly formatted and filtered
  const events = Array.isArray(eventsData) 
    ? eventsData
        .filter((event: any) => {
          // Filter events by organizer_id if user is an organizer
          // The backend already filters, but we ensure here too
          if ((user?.role === 'organizer' || user?.role === 'organizer_admin') && user?.organizer_id) {
            return event.organizer_id === user.organizer_id
          }
          return true // Show all events for admins
        })
        .map((event: any) => ({
          id: event.id,
          title: event.title || event.name || `Event ${event.id}`,
        }))
        .filter((event: any) => event.id && event.title) // Ensure we have valid events
    : []
  const teamMembers = Array.isArray(teamMembersData) ? teamMembersData : []
  const vendors = Array.isArray(vendorsData) ? vendorsData : []
  const sponsors = Array.isArray(sponsorsData) ? sponsorsData : []

  return (
    <div className="space-y-6">
      <Breadcrumbs 
        items={[
          { label: 'Tasks & Team Management', href: '/dashboard/tasks' }
        ]}
        className="mb-4"
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tasks & Team Management</h1>
          <p className="text-muted-foreground">Manage tasks between teams and ushers</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowStatistics(!showStatistics)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {showStatistics ? 'Hide' : 'Show'} Statistics
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAllTasks}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
          <ProtectedButton
            permission="tasks.create"
            onClick={() => setTaskDialogOpen(true)}
            actionName="create tasks"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </ProtectedButton>
        </div>
      </div>

      {/* Statistics */}
      {showStatistics && (
        <Card className="p-4">
          <TaskStatisticsComponent statistics={statistics} />
        </Card>
      )}

      {/* Filters */}
      {showFilters && (
        <TaskFilters
          filters={filters}
          onFiltersChange={setFilters}
          events={events}
          teamMembers={teamMembers}
        />
      )}

      {/* Bulk Actions */}
      {selectedTasks.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedTasks.size}
          onBulkAssign={handleBulkAssign}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkPriorityChange={handleBulkPriorityChange}
          onBulkDelete={handleBulkDelete}
          teamMembers={teamMembers}
        />
      )}

      {/* View Mode Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
          <TabsList>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users className="h-4 w-4 mr-2" />
              Team
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {viewMode !== 'team' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowCheckboxes(!showCheckboxes)
              if (!showCheckboxes) {
                setSelectedTasks(new Set())
              }
            }}
          >
            {showCheckboxes ? 'Cancel Selection' : 'Select Tasks'}
          </Button>
        )}
            </div>

      {/* Task Views */}
      {loading ? (
            <div className="flex items-center justify-center p-8">
              <SpinnerInline />
            </div>
          ) : (
        <>
          {viewMode === 'list' && (
            <TaskList
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onTaskStatusChange={handleTaskMove}
              selectedTasks={selectedTasks}
              onTaskSelect={handleTaskSelect}
              showCheckboxes={showCheckboxes}
            />
          )}

          {viewMode === 'team' && (
            <TeamWorkloadView
              tasks={filteredTasks}
              teamMembers={teamMembers.map((m: any) => ({
                id: m.id,
                name: m.name,
                email: m.email || '',
              }))}
              onTaskClick={handleTaskClick}
            />
          )}
        </>
      )}

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onSubmit={createTaskMutation.mutateAsync}
        events={events}
        teamMembers={teamMembers}
        vendors={vendors}
        sponsors={sponsors}
        sessions={[]}
        onEventChange={getSessionsForEvent}
        isLoading={createTaskMutation.isPending}
      />

      {/* Task Details Modal */}
      <TaskDetailsModal
        open={taskDetailsOpen}
        onOpenChange={setTaskDetailsOpen}
        task={selectedTask}
        onUpdate={updateTaskMutation.mutateAsync}
        onDelete={deleteTaskMutation.mutateAsync}
        onDuplicate={async (task) => {
          // Duplicate task logic
          const duplicateData: TaskFormData = {
            title: `${task.title} (Copy)`,
            description: task.description,
            task_type: task.type,
            task_category: task.task_category,
            status: 'pending',
            priority: task.priority,
            assigned_to: task.assigned_to,
            event_id: task.event_id,
            session_id: task.session_id,
            due_date: task.due_date,
            notes: task.notes,
            vendor_id: task.vendor_id,
            sponsor_id: task.sponsor_id,
            usher_id: task.usher_id,
          }
          await createTaskMutation.mutateAsync(duplicateData)
        }}
        teamMembers={teamMembers}
        events={events}
        isLoading={updateTaskMutation.isPending || deleteTaskMutation.isPending}
      />
    </div>
  )
}
