import { TaskCard } from './TaskCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '@/types/tasks';

interface TaskListViewProps {
  tasks: Task[];
  pagination?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null;
  onRefresh: () => void;
}

export function TaskListView({ tasks, pagination, onRefresh }: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground">No tasks found</p>
        <p className="text-sm text-muted-foreground mt-2">Create a new task to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onUpdate={onRefresh} />
        ))}
      </div>

      {pagination && pagination.last_page > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t w-full">
          <div className="text-sm text-muted-foreground text-center sm:text-left">
            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
            {pagination.total} tasks
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current_page === 1}
              onClick={() => {
                onRefresh();
              }}
              className="flex-1 sm:flex-initial"
            >
              <ChevronLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.current_page === pagination.last_page}
              onClick={() => {
                onRefresh();
              }}
              className="flex-1 sm:flex-initial"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 sm:ml-2" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

