import { UnifiedTask } from '@/types/tasks'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

interface TaskListProps {
  tasks: UnifiedTask[]
  onTaskClick: (task: UnifiedTask) => void
  onTaskStatusChange?: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => void
  selectedTasks?: Set<string>
  onTaskSelect?: (taskId: string, selected: boolean) => void
  showCheckboxes?: boolean
}

export function TaskList({
  tasks,
  onTaskClick,
  onTaskStatusChange,
  selectedTasks,
  onTaskSelect,
  showCheckboxes = false,
}: TaskListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-error/10 text-error'
      case 'high':
        return 'bg-warning/10 text-warning'
      case 'medium':
        return 'bg-info/10 text-info'
      case 'low':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success'
      case 'in_progress':
        return 'bg-info/10 text-info'
      case 'cancelled':
        return 'bg-error/10 text-error'
      case 'pending':
        return 'bg-muted text-muted-foreground'
      default:
        return 'bg-muted text-muted-foreground'
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

  const isOverdue = (task: UnifiedTask) => {
    return task.due_date && task.status !== 'completed' && task.status !== 'cancelled' && isPast(parseISO(task.due_date))
  }

  const isDueToday = (task: UnifiedTask) => {
    return task.due_date && isToday(parseISO(task.due_date))
  }

  return (
    <div className="border border-border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            {showCheckboxes && <TableHead className="w-12"></TableHead>}
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Due Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const overdue = isOverdue(task)
            const dueToday = isDueToday(task)

            return (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onTaskClick(task)}
              >
                {showCheckboxes && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedTasks?.has(task.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        onTaskSelect?.(task.id, e.target.checked)
                      }}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div>
                    <div className="font-medium">{task.title}</div>
                    {task.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-md">
                        {task.description}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs font-medium">
                    {task.type === 'event_task' ? 'Event Task' : 
                     task.type === 'usher_task' ? 'Usher Task' : 
                     task.type === 'operational_task' ? 'Operational Task' : 
                     task.type.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {onTaskStatusChange ? (
                    <Select
                      value={task.status}
                      onValueChange={(value: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
                        onTaskStatusChange(task.id, value)
                      }}
                    >
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={cn('text-xs', getStatusColor(task.status))}>
                      {task.status.replace(/_/g, ' ')}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={cn('text-xs', getPriorityColor(task.priority))}>
                    <Flag className="w-3 h-3 mr-1" />
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {(task.assignedUser || task.usher) ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials((task.assignedUser || task.usher)?.name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {task.assignedUser?.name || task.usher?.name || 'Unassigned'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Unassigned</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.event ? (
                    <div className="flex items-center gap-1.5 text-sm">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium">{task.event.title}</span>
                    </div>
                  ) : task.type === 'operational_task' ? (
                    <span className="text-sm text-muted-foreground italic">Operational Task</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {task.due_date ? (
                    <div
                      className={cn(
                        'flex items-center gap-1 text-sm',
                        overdue && 'text-error font-medium',
                        dueToday && 'text-warning font-medium',
                        !overdue && !dueToday && 'text-foreground'
                      )}
                    >
                      <Clock className="w-3 h-3" />
                      <span>
                        {format(parseISO(task.due_date), 'MMM d, yyyy')}
                        {overdue && ' (Overdue)'}
                        {dueToday && ' (Today)'}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={showCheckboxes ? 8 : 7} className="text-center py-8">
                <div className="flex flex-col items-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Tasks Found</h3>
                  <p className="text-muted-foreground">No tasks match your current filters.</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}


