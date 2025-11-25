import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import { UnifiedTask } from '@/types/tasks'
import { KanbanColumn } from './KanbanColumn'
import { TaskCard } from './TaskCard'
import { ScrollArea } from '@/components/ui/scroll-area'

interface KanbanBoardProps {
  tasks: UnifiedTask[]
  onTaskClick: (task: UnifiedTask) => void
  onTaskMove?: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => void
  onTaskStatusChange?: (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => void
  selectedTasks?: Set<string>
  onTaskSelect?: (taskId: string, selected: boolean) => void
  showCheckboxes?: boolean
}

const columns = [
  { id: 'pending', title: 'Pending' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'completed', title: 'Completed' },
  { id: 'cancelled', title: 'Cancelled' },
] as const

export function KanbanBoard({
  tasks,
  onTaskClick,
  onTaskMove,
  onTaskStatusChange,
  selectedTasks,
  onTaskSelect,
  showCheckboxes = false,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<UnifiedTask | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const tasksByStatus = {
    pending: tasks.filter(t => t.status === 'pending'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
    cancelled: tasks.filter(t => t.status === 'cancelled'),
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = tasks.find(t => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)

    if (!over) return

    const task = tasks.find(t => t.id === active.id)
    if (!task) return

    const newStatus = over.id as 'pending' | 'in_progress' | 'completed' | 'cancelled'
    
    if (task.status !== newStatus && columns.some(col => col.id === newStatus)) {
      onTaskMove?.(task.id, newStatus)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <ScrollArea className="w-full h-full">
        <div className="flex gap-4 p-4 min-w-max">
          <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => (
              <div key={column.id} className="w-80 flex-shrink-0">
                <KanbanColumn
                  id={column.id}
                  title={column.title}
                  tasks={tasksByStatus[column.id]}
                  onTaskClick={onTaskClick}
                  onTaskStatusChange={onTaskStatusChange}
                  selectedTasks={selectedTasks}
                  onTaskSelect={onTaskSelect}
                  showCheckboxes={showCheckboxes}
                />
              </div>
            ))}
          </SortableContext>
        </div>
      </ScrollArea>
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-90">
            <TaskCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}


