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
import { Calendar, User, Flag, AlertCircle, Clock, Briefcase, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TaskFilters } from '@/types/tasks'

interface TaskListProps {
  tasks: UnifiedTask[]
  onTaskClick: (task: UnifiedTask) => void
  onTaskStatusChange?: (taskId: string, newStatus: 'pending' | 'in_progress' | 'waiting' | 'completed' | 'cancelled') => void
  selectedTasks?: Set<string>
  onTaskSelect?: (taskId: string, selected: boolean) => void
  showCheckboxes?: boolean
  groupBy?: TaskFilters['group_by']
}

export function TaskList({
  tasks,
  onTaskClick,
  onTaskStatusChange,
  selectedTasks,
  onTaskSelect,
  showCheckboxes = false,
  groupBy = 'none',
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

  // Group tasks based on groupBy option
  const groupTasks = (tasks: UnifiedTask[]) => {
    if (groupBy === 'none') {
      return { 'All Tasks': tasks }
    }

    const grouped: Record<string, UnifiedTask[]> = {}

    tasks.forEach(task => {
      let key = 'Uncategorized'

      switch (groupBy) {
        case 'event':
          key = task.event?.title || 'No Event'
          break
        case 'department':
          key = task.department || 'No Department'
          break
        case 'status':
          key = task.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          break
        case 'priority':
          key = task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
          break
        case 'scope_type':
          const scopeType = task.scope_type || (task.type === 'event_task' || task.type === 'usher_task' ? 'event' : 'general')
          key = scopeType === 'event' ? 'Event Tasks' : 'General Tasks'
          break
        case 'assigned_user':
          key = task.assignedUser?.name || task.usher?.name || 'Unassigned'
          break
        case 'task_category':
          key = task.task_category ? task.task_category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'No Category'
          break
      }

      if (!grouped[key]) {
        grouped[key] = []
      }
      grouped[key].push(task)
    })

    return grouped
  }

  const groupedTasks = groupTasks(tasks)
  const groupKeys = Object.keys(groupedTasks).sort()

  const getScopeType = (task: UnifiedTask) => {
    return task.scope_type || (task.type === 'event_task' || task.type === 'usher_task' ? 'event' : 'general')
  }

  return (
    <div className="overflow-x-auto">
      {groupBy !== 'none' ? (
        // Grouped view
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {groupKeys.map((groupKey) => {
            const groupTasks = groupedTasks[groupKey]
            const isEventGroup = groupKey === 'Event Tasks'
            const isGeneralGroup = groupKey === 'General Tasks'

            return (
              <div key={groupKey} className="group">
                <div className={cn(
                  "px-8 py-4 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-between",
                  isEventGroup && "bg-orange-50/50 dark:bg-orange-900/10 text-orange-600",
                  isGeneralGroup && "bg-slate-50/50 dark:bg-slate-800/20 text-slate-500",
                  !isEventGroup && !isGeneralGroup && "bg-gray-50/50 dark:bg-gray-800/10 text-gray-400"
                )}>
                  <div className="flex items-center gap-2">
                    {groupKey}
                    <span className="bg-white dark:bg-gray-900 px-2 py-0.5 rounded-full text-[10px] border border-gray-100 dark:border-gray-800 shadow-sm">
                      {groupTasks.length}
                    </span>
                  </div>
                </div>
                <Table>
                  <TableHeader className="bg-transparent">
                    <TableRow className="hover:bg-transparent border-0">
                      {showCheckboxes && <TableHead className="w-12 pl-8"></TableHead>}
                      <TableHead className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[10px] h-12 pl-8">Objective</TableHead>
                      <TableHead className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[10px] h-12">Context</TableHead>
                      <TableHead className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[10px] h-12">Status</TableHead>
                      <TableHead className="font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-[10px] h-12 text-right pr-8">Deadline</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupTasks.map((task) => {
                      return renderTaskRow(task)
                    })}
                  </TableBody>
                </Table>
              </div>
            )
          })}
        </div>
      ) : (
        // Ungrouped view
        <Table>
          <TableHeader className="bg-gray-50/50 dark:bg-gray-800/30">
            <TableRow className="hover:bg-transparent border-gray-100 dark:border-gray-800">
              {showCheckboxes && <TableHead className="w-12 pl-8"></TableHead>}
              <TableHead className="font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] text-[10px] h-14 pl-8">Task Objective</TableHead>
              <TableHead className="font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] text-[10px] h-14">Work Stream</TableHead>
              <TableHead className="font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] text-[10px] h-14">Status Phase</TableHead>
              <TableHead className="font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em] text-[10px] h-14 text-right pr-8">Timeline</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              return renderTaskRow(task)
            })}
            {tasks.length === 0 && (
              <TableRow>
                <TableCell colSpan={showCheckboxes ? 8 : 7} className="text-center py-20 bg-gray-50/30 dark:bg-gray-900/30">
                  <div className="flex flex-col items-center max-w-xs mx-auto">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
                      <Calendar className="h-8 w-8 text-gray-300 dark:text-gray-600" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Workspace Empty</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                      Your current filters don't match any tasks. Try adjusting them or create a new objective.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  )

  function renderTaskRow(task: UnifiedTask) {
    const overdue = isOverdue(task)
    const dueToday = isDueToday(task)
    const scopeType = getScopeType(task)
    const isEventTask = scopeType === 'event'
    const isGeneralTask = scopeType === 'general'

    return (
      <TableRow
        key={task.id}
        className={cn(
          "group cursor-pointer transition-all duration-300 border-gray-50 dark:border-gray-800/50",
          "hover:bg-orange-50/30 dark:hover:bg-orange-950/10",
          selectedTasks?.has(task.id) && "bg-orange-50/50 dark:bg-orange-950/20"
        )}
        onClick={() => onTaskClick(task)}
      >
        {showCheckboxes && (
          <TableCell className="pl-8" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selectedTasks?.has(task.id)}
              onChange={(e) => {
                e.stopPropagation()
                onTaskSelect?.(task.id, e.target.checked)
              }}
              className="h-5 w-5 rounded-lg border-gray-200 dark:border-gray-700 text-orange-600 focus:ring-orange-600 transition-all cursor-pointer"
            />
          </TableCell>
        )}
        <TableCell className="py-5 pl-8">
          <div className="flex flex-col gap-1.5 min-w-[300px]">
            <div className="flex items-center gap-2">
              <Badge className={cn(
                'text-[10px] font-black uppercase tracking-wider px-2 py-0 border-0 shadow-none',
                getPriorityColor(task.priority)
              )}>
                {task.priority === 'critical' ? 'CRITICAL' : task.priority.toUpperCase()}
              </Badge>
              <div className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                {task.title}
              </div>
            </div>
            {task.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md font-medium">
                {task.description}
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              {(task.assignedUser || task.usher) ? (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5 border border-white dark:border-gray-800 shadow-sm">
                    <AvatarFallback className="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 text-[8px] font-black">
                      {getInitials((task.assignedUser || task.usher)?.name || '')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                    {task.assignedUser?.name || task.usher?.name}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-gray-400">
                  <User className="w-3 h-3" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Unassigned</span>
                </div>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="space-y-1.5">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border shadow-none",
                isEventTask && "bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 border-orange-200/50 dark:border-orange-800/50",
                isGeneralTask && "bg-slate-50/50 dark:bg-slate-800/20 text-slate-500 border-slate-200/50 dark:border-slate-700/50"
              )}
            >
              {isEventTask ? 'Operational' : 'Corporate'}
            </Badge>
            {isEventTask && task.event ? (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                <Calendar className="w-3 h-3 text-orange-500" />
                {task.event.title}
              </div>
            ) : isGeneralTask && task.department ? (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                <Building2 className="w-3 h-3 text-slate-400" />
                {task.department}
              </div>
            ) : null}
          </div>
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          {onTaskStatusChange ? (
            <Select
              value={task.status}
              onValueChange={(value: 'pending' | 'in_progress' | 'waiting' | 'completed' | 'cancelled') => {
                onTaskStatusChange(task.id, value)
              }}
            >
              <SelectTrigger className="w-32 h-9 text-[11px] font-bold uppercase tracking-widest bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 focus:ring-orange-600 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 dark:border-gray-800">
                <SelectItem value="pending" className="text-[11px] font-bold uppercase tracking-wider">Pending</SelectItem>
                <SelectItem value="in_progress" className="text-[11px] font-bold uppercase tracking-wider">In Progress</SelectItem>
                <SelectItem value="waiting" className="text-[11px] font-bold uppercase tracking-wider">Waiting</SelectItem>
                <SelectItem value="completed" className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Completed</SelectItem>
                <SelectItem value="cancelled" className="text-[11px] font-bold uppercase tracking-wider text-rose-600">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge className={cn('text-[10px] font-black uppercase tracking-wider', getStatusColor(task.status))}>
              {task.status.replace(/_/g, ' ')}
            </Badge>
          )}
        </TableCell>
        <TableCell className="text-right pr-8">
          {task.due_date ? (
            <div
              className={cn(
                'inline-flex flex-col items-end gap-0.5',
                overdue && 'text-rose-600',
                dueToday && 'text-orange-500',
                !overdue && !dueToday && 'text-gray-900 dark:text-white'
              )}
            >
              <div className="text-[11px] font-black tracking-tight flex items-center gap-1.5">
                <Clock className="w-3 h-3 opacity-50" />
                {format(parseISO(task.due_date), 'MMM d, yyyy')}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                {overdue ? 'EXPIRED' : dueToday ? 'DUE TODAY' : 'ON TRACK'}
              </div>
            </div>
          ) : (
            <span className="text-[10px] font-black text-gray-300 dark:text-gray-700 tracking-widest uppercase">No Deadline</span>
          )}
        </TableCell>
      </TableRow>
    )
  }

}


