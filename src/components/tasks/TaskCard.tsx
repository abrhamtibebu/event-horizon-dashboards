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
import { Calendar, User, Flag, AlertCircle, Clock } from 'lucide-react'
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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'event_task':
        return { label: 'Event', color: 'bg-info/10 text-info' }
      case 'usher_task':
        return { label: 'Usher', color: 'bg-primary/10 text-primary' }
      case 'operational_task':
        return { label: 'Operational', color: 'bg-warning/10 text-warning' }
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

  return (
    <div
      className={cn(
        'group relative bg-card border border-border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isOverdue && 'border-error/50 bg-error/5'
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

      {/* Task Type - Prominently displayed at top */}
      <div className="mb-2">
        <Badge variant="outline" className={cn('text-xs font-medium', typeBadge.color)}>
          {typeBadge.label} Task
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

      {/* Event Information - Always displayed */}
      <div className="mb-2">
        {task.event ? (
          <div className="flex items-center gap-1.5 text-xs text-foreground bg-muted/30 rounded px-2 py-1">
            <Calendar className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="truncate font-medium">{task.event.title}</span>
          </div>
        ) : task.type === 'operational_task' ? (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Operational Task (No Event)</span>
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
          {task.priority}
        </Badge>
        {task.task_category && (
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

