import { useMemo } from 'react'
import { UnifiedTask } from '@/types/tasks'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format, parseISO, startOfWeek, endOfWeek, eachDayOfInterval, differenceInDays, addDays, isWithinInterval } from 'date-fns'
import { Calendar, Clock, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskTimelineViewProps {
  tasks: UnifiedTask[]
  onTaskClick: (task: UnifiedTask) => void
}

export function TaskTimelineView({ tasks, onTaskClick }: TaskTimelineViewProps) {
  // Filter to only event tasks
  const eventTasks = tasks.filter((task) => {
    const scopeType = task.scope_type || (task.type === 'event_task' || task.type === 'usher_task' ? 'event' : 'general')
    return scopeType === 'event'
  })

  // Group tasks by event
  const tasksByEvent = useMemo(() => {
    const grouped: Record<number, UnifiedTask[]> = {}
    eventTasks.forEach((task) => {
      if (task.event_id) {
        if (!grouped[task.event_id]) {
          grouped[task.event_id] = []
        }
        grouped[task.event_id].push(task)
      }
    })
    return grouped
  }, [eventTasks])

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    if (eventTasks.length === 0) {
      const today = new Date()
      return {
        start: startOfWeek(today),
        end: endOfWeek(addDays(today, 14)),
      }
    }

    const dates = eventTasks
      .map((task) => {
        const dates: Date[] = []
        if (task.start_date) dates.push(parseISO(task.start_date))
        if (task.due_date) dates.push(parseISO(task.due_date))
        if (task.event?.start_date) dates.push(parseISO(task.event.start_date))
        return dates
      })
      .flat()
      .filter(Boolean) as Date[]

    if (dates.length === 0) {
      const today = new Date()
      return {
        start: startOfWeek(today),
        end: endOfWeek(addDays(today, 14)),
      }
    }

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())))

    return {
      start: startOfWeek(minDate),
      end: endOfWeek(addDays(maxDate, 7)),
    }
  }, [eventTasks])

  const days = eachDayOfInterval({ start: timelineRange.start, end: timelineRange.end })
  const totalDays = differenceInDays(timelineRange.end, timelineRange.start) + 1

  const getTaskPosition = (task: UnifiedTask) => {
    const startDate = task.start_date ? parseISO(task.start_date) : (task.due_date ? parseISO(task.due_date) : timelineRange.start)
    const endDate = task.due_date ? parseISO(task.due_date) : addDays(startDate, 1)
    
    const startOffset = differenceInDays(startDate, timelineRange.start)
    const duration = differenceInDays(endDate, startDate) || 1
    
    return {
      left: (startOffset / totalDays) * 100,
      width: (duration / totalDays) * 100,
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'critical':
        return 'bg-error/20 border-error/50 text-error'
      case 'high':
        return 'bg-warning/20 border-warning/50 text-warning'
      case 'medium':
        return 'bg-info/20 border-info/50 text-info'
      case 'low':
        return 'bg-muted border-border text-muted-foreground'
      default:
        return 'bg-muted border-border text-muted-foreground'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/20 border-success/50'
      case 'in_progress':
        return 'bg-info/20 border-info/50'
      case 'waiting':
        return 'bg-warning/20 border-warning/50'
      case 'cancelled':
        return 'bg-error/20 border-error/50 opacity-50'
      default:
        return 'bg-muted border-border'
    }
  }

  if (eventTasks.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Event Tasks</h3>
          <p className="text-muted-foreground">Timeline view is only available for event tasks.</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Timeline View</h3>
          <div className="text-sm text-muted-foreground">
            {format(timelineRange.start, 'MMM d')} - {format(timelineRange.end, 'MMM d, yyyy')}
          </div>
        </div>
        
        {/* Date Headers */}
        <div className="overflow-x-auto">
          <div className="flex min-w-full" style={{ minWidth: `${totalDays * 40}px` }}>
            {days.map((day, index) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              
              return (
                <div
                  key={index}
                  className={cn(
                    'flex-shrink-0 border-r border-border text-xs p-1 text-center',
                    isWeekend && 'bg-muted/30',
                    isToday && 'bg-orange-100 dark:bg-orange-950/20 font-semibold'
                  )}
                  style={{ width: `${100 / totalDays}%` }}
                >
                  <div>{format(day, 'd')}</div>
                  <div className="text-[10px] text-muted-foreground">{format(day, 'EEE')}</div>
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* Tasks by Event */}
      {Object.entries(tasksByEvent).map(([eventId, eventTasks]) => {
        const event = eventTasks[0]?.event
        if (!event) return null

        return (
          <Card key={eventId} className="p-4">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <h4 className="font-semibold">{event.title}</h4>
              <Badge variant="outline" className="ml-auto">
                {eventTasks.length} tasks
              </Badge>
            </div>

            <div className="relative" style={{ minHeight: `${eventTasks.length * 60 + 20}px` }}>
              {/* Timeline Grid */}
              <div className="absolute inset-0 flex">
                {days.map((_, index) => {
                  const isWeekend = days[index].getDay() === 0 || days[index].getDay() === 6
                  return (
                    <div
                      key={index}
                      className={cn(
                        'flex-shrink-0 border-r border-border',
                        isWeekend && 'bg-muted/10'
                      )}
                      style={{ width: `${100 / totalDays}%` }}
                    />
                  )
                })}
              </div>

              {/* Task Bars */}
              <div className="relative">
                {eventTasks.map((task, taskIndex) => {
                  const position = getTaskPosition(task)
                  const isOverdue = task.due_date && task.status !== 'completed' && task.status !== 'cancelled' && parseISO(task.due_date) < new Date()

                  return (
                    <div
                      key={task.id}
                      className="absolute cursor-pointer group"
                      style={{
                        left: `${position.left}%`,
                        width: `${Math.max(position.width, 2)}%`,
                        top: `${taskIndex * 60}px`,
                      }}
                      onClick={() => onTaskClick(task)}
                    >
                      <div
                        className={cn(
                          'p-2 rounded border-2 transition-all hover:shadow-md',
                          getStatusColor(task.status),
                          getPriorityColor(task.priority),
                          isOverdue && 'ring-2 ring-error'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-xs truncate">{task.title}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] px-1.5 py-0',
                                  getPriorityColor(task.priority)
                                )}
                              >
                                <Flag className="w-2.5 h-2.5 mr-1" />
                                {task.priority === 'critical' ? 'Critical' : task.priority}
                              </Badge>
                              {task.due_date && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Clock className="w-2.5 h-2.5" />
                                  {format(parseISO(task.due_date), 'MMM d')}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        )
      })}

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center gap-4 text-xs">
          <div className="font-semibold">Legend:</div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-success/20 border-2 border-success/50 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-info/20 border-2 border-info/50 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-warning/20 border-2 border-warning/50 rounded"></div>
            <span>Waiting</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-muted border-2 border-border rounded"></div>
            <span>Pending</span>
          </div>
        </div>
      </Card>
    </div>
  )
}

