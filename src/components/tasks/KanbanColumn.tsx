import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { UnifiedTask } from '@/types/tasks'
import { TaskCard } from './TaskCard'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface KanbanColumnProps {
  id: string
  title: string
  tasks: UnifiedTask[]
  onTaskClick: (task: UnifiedTask) => void
  onTaskStatusChange?: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => void
  selectedTasks?: Set<string>
  onTaskSelect?: (taskId: string, selected: boolean) => void
  showCheckboxes?: boolean
}

interface SortableTaskCardProps {
  task: UnifiedTask
  onClick?: () => void
  onStatusChange?: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => void
  isSelected?: boolean
  onSelect?: (taskId: string, selected: boolean) => void
  showCheckbox?: boolean
}

function SortableTaskCard({ task, onClick, onStatusChange, isSelected, onSelect, showCheckbox }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onClick={onClick}
        onStatusChange={onStatusChange}
        isSelected={isSelected}
        onSelect={onSelect}
        showCheckbox={showCheckbox}
      />
    </div>
  )
}

export function KanbanColumn({
  id,
  title,
  tasks,
  onTaskClick,
  onTaskStatusChange,
  selectedTasks,
  onTaskSelect,
  showCheckboxes = false,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  })

  const taskIds = tasks.map(task => task.id)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <Badge variant="secondary" className="bg-muted text-muted-foreground">
          {tasks.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-lg border-2 border-dashed transition-colors p-2 min-h-[400px]',
          isOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'
        )}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                onStatusChange={onTaskStatusChange}
                isSelected={selectedTasks?.has(task.id)}
                onSelect={onTaskSelect}
                showCheckbox={showCheckboxes}
              />
            ))}
            {tasks.length === 0 && (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No tasks
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

