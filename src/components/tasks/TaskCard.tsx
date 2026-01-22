import { UnifiedTask } from '@/types/tasks'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { format, parseISO, isPast, isToday, addDays } from 'date-fns'
import { Calendar, User, Flag, AlertCircle, Clock, Briefcase, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: UnifiedTask
  onClick?: () => void
  onStatusChange?: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => void
  isSelected?: boolean
  onSelect?: (taskId: string, selected: boolean) => void
  showCheckbox?: boolean
}

export function TaskCard({ task, onClick, onStatusChange, isSelected, onSelect, showCheckbox = false }: TaskCardProps) {
  const isOverdue = task.due_date && task.status !== 'completed' && task.status !== 'cancelled' && isPast(parseISO(task.due_date))
  const isDueToday = task.due_date && isToday(parseISO(task.due_date))
  const isDueSoon = task.due_date && !isOverdue && !isDueToday && !isPast(parseISO(task.due_date)) && parseISO(task.due_date) <= addDays(new Date(), 3)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-error/10 text-error border-error/30'
      case 'high':
        return 'bg-warning/10 text-warning border-warning/30'
      case 'medium':
        return 'bg-info/10 text-info border-info/30'
      case 'low':
        return 'bg-muted text-muted-foreground border-border'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/30'
      case 'in_progress':
        return 'bg-info/10 text-info border-info/30'
      case 'cancelled':
        return 'bg-error/10 text-error border-error/30'
      case 'pending':
        return 'bg-muted text-muted-foreground border-border'
      default:
        return 'bg-muted text-muted-foreground border-border'
    }
  }

  // Determine scope type
  const scopeType = task.scope_type || (task.type === 'event_task' || task.type === 'usher_task' ? 'event' : 'general')
  const isEventTask = scopeType === 'event'
  const isGeneralTask = scopeType === 'general'

  const getScopeBadge = () => {
    if (isEventTask) {
      return {
        label: 'Event Task',
        color: 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
        icon: Calendar
      }
    } else {
      return {
        label: 'General Task',
        color: 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        icon: Briefcase
      }
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'event_task':
        return { label: 'Event', color: 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300' }
      case 'usher_task':
        return { label: 'Usher', color: 'bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300' }
      case 'operational_task':
      case 'general_task':
        return { label: 'General', color: 'bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300' }
      default:
        return { label: 'Task', color: 'bg-muted text-muted-foreground' }
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const typeBadge = getTypeBadge(task.type)
  const scopeBadge = getScopeBadge()
  const ScopeIcon = scopeBadge.icon

  return (
    <div
      className={cn(
        'group relative bg-card border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isOverdue && 'border-error/50 bg-error/5',
        isEventTask && 'border-l-4 border-l-orange-500 hover:border-orange-600',
        isGeneralTask && 'border-l-4 border-l-slate-400 hover:border-slate-500'
      )}
      onClick={onClick}
    >
      {showCheckbox && (
        <div
          className="absolute top-2 right-2 z-10"
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.(task.id, !isSelected)
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onSelect?.(task.id, e.target.checked)
            }}
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
          />
        </div>
      )}

      {/* Scope Type Badge - Prominently displayed at top */}
      <div className="mb-2 flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={cn(
            'text-xs font-semibold px-2.5 py-0.5 flex items-center gap-1.5 border-2',
            scopeBadge.color
          )}
        >
          <ScopeIcon className="w-3 h-3" />
          {scopeBadge.label}
        </Badge>
      </div>

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Event/Department Information - Always displayed */}
      <div className="mb-2">
        {isEventTask && task.event ? (
          <div className="flex items-center gap-1.5 text-xs text-foreground bg-orange-50 dark:bg-orange-950/20 rounded px-2 py-1 border border-orange-200 dark:border-orange-800">
            <Calendar className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
            <span className="truncate font-medium">{task.event.title}</span>
            {task.event_phase && (
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 border-orange-300 dark:border-orange-700 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                {task.event_phase}
              </Badge>
            )}
          </div>
        ) : isGeneralTask && task.department ? (
          <div className="flex items-center gap-1.5 text-xs text-foreground bg-slate-50 dark:bg-slate-900/50 rounded px-2 py-1 border border-slate-200 dark:border-slate-700">
            <Building2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 flex-shrink-0" />
            <span className="truncate font-medium">{task.department}</span>
            {task.task_category && (
              <Badge variant="outline" className="ml-auto text-[10px] px-1.5 py-0 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {task.task_category.replace(/_/g, ' ')}
              </Badge>
            )}
          </div>
        ) : null}
      </div>

      {/* Assigned Staff - Prominently displayed */}
      {(task.assignedUser || task.usher) && (
        <div className="mb-2 flex items-center gap-2 text-xs bg-primary/5 rounded px-2 py-1.5">
          <User className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="font-medium text-foreground">Assigned to:</span>
          <span className="text-foreground truncate font-medium">
            {task.assignedUser?.name || task.usher?.name || 'Unassigned'}
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap mb-2">
        {onStatusChange ? (
          <div 
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onMouseDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              e.preventDefault()
            }}
            className="relative z-10"
          >
            <Select
              value={task.status}
              onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
                onStatusChange(task.id, value)
              }}
            >
              <SelectTrigger 
                className={cn(
                  'h-6 text-xs px-2 border shadow-sm hover:bg-accent',
                  getStatusColor(task.status),
                  'cursor-pointer'
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <Badge className={cn('text-xs', getStatusColor(task.status))}>
            {task.status.replace(/_/g, ' ')}
          </Badge>
        )}
        <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
          <Flag className="w-3 h-3 mr-1" />
          {task.priority === 'critical' ? 'Critical' : task.priority}
        </Badge>
        {task.task_category && !isGeneralTask && (
          <Badge variant="outline" className="text-xs bg-muted/50 text-muted-foreground">
            {task.task_category.replace(/_/g, ' ')}
          </Badge>
        )}
      </div>

      {task.due_date && (
        <div
          className={cn(
            'flex items-center gap-1 text-xs mb-2',
            isOverdue && 'text-error font-medium',
            isDueToday && 'text-warning font-medium',
            isDueSoon && 'text-info font-medium',
            !isOverdue && !isDueToday && !isDueSoon && 'text-muted-foreground'
          )}
        >
          <Clock className="w-3 h-3" />
          <span>
            {format(parseISO(task.due_date), 'MMM d, yyyy')}
            {isOverdue && ' (Overdue)'}
            {isDueToday && ' (Today)'}
            {isDueSoon && ' (Soon)'}
          </span>
        </div>
      )}

      {/* Footer with due date and overdue indicator */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
        {/* Only show unassigned in footer if not already shown in assigned section above */}
        {!(task.assignedUser || task.usher) && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>Unassigned</span>
          </div>
        )}

        {isOverdue && (
          <div className="flex items-center gap-1 text-xs text-error">
            <AlertCircle className="w-4 h-4" />
            <span>Overdue</span>
          </div>
        )}
      </div>
    </div>
  )
}

