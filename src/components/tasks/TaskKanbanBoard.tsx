import { useState } from 'react'
import { UnifiedTask } from '@/types/tasks'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format, parseISO, isPast, isToday } from 'date-fns'
import { Calendar, Briefcase, Clock, User, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskKanbanBoardProps {
  tasks: UnifiedTask[]
  onTaskClick: (task: UnifiedTask) => void
  onTaskStatusChange?: (taskId: string, newStatus: 'pending' | 'in_progress' | 'waiting' | 'completed' | 'cancelled') => void
  scopeFilter?: 'all' | 'event' | 'general'
}

const columns = [
  { id: 'backlog', title: 'Backlog', statuses: ['pending'] },
  { id: 'todo', title: 'To Do', statuses: ['pending'] },
  { id: 'in_progress', title: 'In Progress', statuses: ['in_progress'] },
  { id: 'waiting', title: 'Waiting', statuses: ['waiting'] },
  { id: 'completed', title: 'Completed', statuses: ['completed'] },
]

export function TaskKanbanBoard({
  tasks,
  onTaskClick,
  onTaskStatusChange,
  scopeFilter = 'all',
}: TaskKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter tasks by scope
  const filteredTasks = tasks.filter((task) => {
    if (scopeFilter === 'all') return true
    const scopeType = task.scope_type || (task.type === 'event_task' || task.type === 'usher_task' ? 'event' : 'general')
    return scopeType === scopeFilter
  })

  // Group tasks by status
  const tasksByStatus = columns.reduce((acc, column) => {
    acc[column.id] = filteredTasks.filter((task) => {
      // Map task status to column
      if (column.id === 'backlog' && task.status === 'pending' && !task.assigned_to) {
        return true
      }
      if (column.id === 'todo' && task.status === 'pending' && task.assigned_to) {
        return true
      }
      return column.statuses.includes(task.status)
    })
    return acc
  }, {} as Record<string, UnifiedTask[]>)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over || !onTaskStatusChange) return

    const taskId = active.id as string
    const newColumnId = over.id as string

    // Find the task
    const task = filteredTasks.find((t) => t.id === taskId)
    if (!task) return

    // Map column to status
    let newStatus: 'pending' | 'in_progress' | 'waiting' | 'completed' | 'cancelled' = task.status
    if (newColumnId === 'backlog' || newColumnId === 'todo') {
      newStatus = 'pending'
    } else if (newColumnId === 'in_progress') {
      newStatus = 'in_progress'
    } else if (newColumnId === 'waiting') {
      newStatus = 'waiting'
    } else if (newColumnId === 'completed') {
      newStatus = 'completed'
    }

    if (newStatus !== task.status) {
      onTaskStatusChange(taskId, newStatus)
    }
  }

  const activeTask = activeId ? filteredTasks.find((t) => t.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-8 snap-x">
        {columns.map((column) => {
          const columnTasks = tasksByStatus[column.id] || []
          return (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={columnTasks}
              onTaskClick={onTaskClick}
            />
          )
        })}
      </div>
      <DragOverlay dropAnimation={{
        duration: 250,
        easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeTask ? <KanbanCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  )
}

interface KanbanColumnProps {
  id: string
  title: string
  tasks: UnifiedTask[]
  onTaskClick: (task: UnifiedTask) => void
}

function KanbanColumn({ id, title, tasks, onTaskClick }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-[340px] snap-center">
      <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-800/30 rounded-[2.5rem] border border-gray-100 dark:border-gray-800/50 p-4">
        <div className="px-4 py-3 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-xs uppercase tracking-[0.2em] text-gray-500">
              {title}
            </h3>
            <span className="bg-white dark:bg-gray-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm text-gray-400">
              {tasks.length}
            </span>
          </div>
          <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto min-h-[500px] max-h-[calc(100vh-250px)] scrollbar-none px-1 py-1">
          <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {tasks.map((task) => (
              <KanbanCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))}
          </SortableContext>
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 opacity-30 select-none">
              <div className="w-12 h-12 border-2 border-dashed border-gray-400 rounded-2xl mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Empty Lane</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface KanbanCardProps {
  task: UnifiedTask
  onClick?: () => void
  isDragging?: boolean
}

function KanbanCard({ task, onClick, isDragging }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
    scale: isSortableDragging ? 0.98 : 1,
  }

  const scopeType = task.scope_type || (task.type === 'event_task' || task.type === 'usher_task' ? 'event' : 'general')
  const isEventTask = scopeType === 'event'
  const isGeneralTask = scopeType === 'general'
  const isOverdue = task.due_date && task.status !== 'completed' && task.status !== 'cancelled' && isPast(parseISO(task.due_date))
  const isDueToday = task.due_date && isToday(parseISO(task.due_date))

  const getPriorityColors = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'critical':
        return 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30'
      case 'high':
        return 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30'
      case 'medium':
        return 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30'
      default:
        return 'bg-gray-50 text-gray-500 border-gray-100 dark:bg-gray-800/50 dark:text-gray-400 dark:border-gray-700/50'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        'group relative p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] cursor-pointer transition-all duration-300',
        'hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 hover:border-orange-200 dark:hover:border-orange-950',
        isDragging && 'shadow-2xl shadow-black/20 ring-2 ring-orange-500/20 border-orange-500 scale-105 z-50 cursor-grabbing',
        isOverdue && 'border-rose-200 dark:border-rose-900/50'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <Badge className={cn(
          'text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 border shadow-none',
          getPriorityColors(task.priority)
        )}>
          {task.priority === 'critical' ? 'Urgent+' : task.priority}
        </Badge>
        {isOverdue && (
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        )}
      </div>

      <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3 line-clamp-2 leading-relaxed tracking-tight group-hover:text-orange-600 transition-colors">
        {task.title}
      </h4>

      {isEventTask && task.event && (
        <div className="flex items-center gap-2 p-2.5 bg-orange-50/50 dark:bg-orange-950/10 rounded-xl mb-4 border border-orange-100/50 dark:border-orange-900/20">
          <div className="w-6 h-6 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center border border-orange-100 dark:border-orange-800 shadow-sm">
            <Calendar className="w-3 h-3 text-orange-600" />
          </div>
          <span className="text-[11px] font-bold text-orange-700 dark:text-orange-400 truncate">
            {task.event.title}
          </span>
        </div>
      )}

      {isGeneralTask && task.department && (
        <div className="flex items-center gap-2 p-2.5 bg-gray-50/50 dark:bg-gray-800/30 rounded-xl mb-4 border border-gray-100/50 dark:border-gray-700/20">
          <div className="w-6 h-6 bg-white dark:bg-gray-900 rounded-lg flex items-center justify-center border border-gray-100 dark:border-gray-800 shadow-sm">
            <Briefcase className="w-3 h-3 text-slate-500" />
          </div>
          <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 truncate">
            {task.department}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-50 dark:border-gray-800/50">
        <div className="flex items-center gap-2">
          {(task.assignedUser || task.usher) ? (
            <Avatar className="h-6 w-6 border border-white dark:border-gray-800 shadow-sm">
              <AvatarFallback className="bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 text-[8px] font-black">
                {((task.assignedUser || task.usher)?.name || '')
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="w-6 h-6 rounded-full border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <User className="w-3 h-3 text-gray-300" />
            </div>
          )}
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate max-w-[80px]">
            {task.assignedUser?.name.split(' ')[0] || task.usher?.name.split(' ')[0] || 'Open'}
          </span>
        </div>

        {task.due_date && (
          <div className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight',
            isOverdue ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30' :
              isDueToday ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/30' :
                'bg-gray-50 text-gray-400 dark:bg-gray-800/50 font-bold'
          )}>
            <Clock className="w-3 h-3" />
            {format(parseISO(task.due_date), 'MMM d')}
          </div>
        )}
      </div>
    </div>
  )
}


