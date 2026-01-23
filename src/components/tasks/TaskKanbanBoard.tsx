import { useMemo } from 'react';
import { TaskCard } from './TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Task, TaskStatus } from '@/types/tasks';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TaskKanbanBoardProps {
  tasks: Task[];
  onRefresh: () => void;
}

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'pending', label: 'Not Started', color: 'border-slate-200 bg-slate-50' },
  { status: 'in_progress', label: 'In Progress', color: 'border-blue-200 bg-blue-50' },
  { status: 'waiting', label: 'Waiting', color: 'border-orange-200 bg-orange-50' },
  { status: 'blocked', label: 'Blocked', color: 'border-red-200 bg-red-50' },
  { status: 'review_required', label: 'Review', color: 'border-purple-200 bg-purple-50' },
  { status: 'completed', label: 'Completed', color: 'border-green-200 bg-green-50' },
];

export function TaskKanbanBoard({ tasks, onRefresh }: TaskKanbanBoardProps) {
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      pending: [],
      in_progress: [],
      waiting: [],
      blocked: [],
      review_required: [],
      completed: [],
      cancelled: [],
    };

    tasks.forEach((task) => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  }, [tasks]);

  return (
    <div className="flex h-[calc(100vh-280px)] w-full max-w-full overflow-x-auto gap-3 sm:gap-4 pb-4">
      {statusColumns.map((column) => {
        const columnTasks = tasksByStatus[column.status] || [];
        return (
          <div key={column.status} className="flex flex-col min-w-[280px] sm:min-w-[320px] max-w-[280px] sm:max-w-[320px] rounded-xl bg-muted/30 border border-border/50 h-full">
            <div className="p-2 sm:p-3 border-b border-border/50 bg-background/50 backdrop-blur-sm sticky top-0 z-10 rounded-t-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", column.status === 'in_progress' ? 'bg-blue-500' : column.status === 'completed' ? 'bg-green-500' : column.status === 'blocked' ? 'bg-red-500' : 'bg-slate-400')}></span>
                  <h3 className="font-semibold text-xs sm:text-sm truncate">{column.label}</h3>
                </div>
                <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium rounded-full bg-background border text-muted-foreground flex-shrink-0">
                  {columnTasks.length}
                </span>
              </div>
            </div>

            <ScrollArea className="flex-1 p-3">
              <div className="flex flex-col gap-3 pb-4">
                {columnTasks.length === 0 ? (
                  <div className="h-24 flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-muted rounded-lg m-2">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onUpdate={onRefresh}
                      compact
                    />
                  ))
                )}
              </div>
            </ScrollArea>

          </div>
        );
      })}
    </div>
  );
}

