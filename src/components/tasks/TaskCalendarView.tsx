import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TaskDetailsModal } from './TaskDetailsModal';
import type { Task } from '@/types/tasks';

interface TaskCalendarViewProps {
  tasks: Task[];
  onRefresh: () => void;
}

export function TaskCalendarView({ tasks, onRefresh }: TaskCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const tasksByDate = tasks.reduce((acc, task) => {
    if (task.due_date) {
      const dateKey = new Date(task.due_date).toDateString();
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
    }
    return acc;
  }, {} as Record<string, Task[]>);

  const selectedDateTasks = selectedDate
    ? tasksByDate[selectedDate.toDateString()] || []
    : [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'urgent':
        return 'bg-destructive';
      case 'high':
        return 'bg-orange-500 dark:bg-orange-400';
      case 'medium':
        return 'bg-blue-500 dark:bg-blue-400';
      case 'low':
        return 'bg-muted-foreground';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
      <div className="lg:col-span-2 w-full min-w-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border"
          modifiers={{
            hasTasks: Object.keys(tasksByDate).map((date) => new Date(date)),
          }}
          modifiersClassNames={{
            hasTasks: 'bg-primary/10',
          }}
        />
      </div>
      <div className="w-full min-w-0">
        <Card className="w-full">
          <CardContent className="pt-4">
            <h3 className="font-semibold mb-4 text-sm sm:text-base">
              {selectedDate
                ? `Tasks for ${selectedDate.toLocaleDateString()}`
                : 'Select a date'}
            </h3>
            {selectedDateTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks for this date</p>
            ) : (
              <div className="space-y-2 w-full">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-2 border rounded cursor-pointer hover:bg-accent"
                    onClick={() => setSelectedTask(task)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {task.assignedUser && (
                          <p className="text-xs text-muted-foreground">
                            {task.assignedUser.name}
                          </p>
                        )}
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${getPriorityColor(
                          task.priority
                        )}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedTask && (
        <TaskDetailsModal
          taskId={selectedTask.id}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          onUpdate={onRefresh}
        />
      )}
    </div>
  );
}

