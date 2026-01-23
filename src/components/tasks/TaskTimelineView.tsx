import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TaskCard } from './TaskCard';
import type { Task } from '@/types/tasks';

interface TaskTimelineViewProps {
  tasks: Task[];
  onRefresh: () => void;
}

export function TaskTimelineView({ tasks, onRefresh }: TaskTimelineViewProps) {
  const groupedTasks = useMemo(() => {
    const grouped: Record<string, Task[]> = {};

    tasks.forEach((task) => {
      let groupKey = 'No Date';
      if (task.due_date) {
        const date = new Date(task.due_date);
        groupKey = date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric',
        });
      } else if (task.event_id && task.event) {
        groupKey = `Event: ${task.event.name}`;
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(task);
    });

    return grouped;
  }, [tasks]);

  return (
    <div className="space-y-6 w-full">
      {Object.entries(groupedTasks).map(([group, groupTasks]) => (
        <div key={group} className="w-full">
          <h3 className="text-base sm:text-lg font-semibold mb-3 sticky top-0 bg-background py-2 z-10 truncate">
            {group}
          </h3>
          <div className="space-y-2 w-full">
            {groupTasks.map((task) => (
              <TaskCard key={task.id} task={task} onUpdate={onRefresh} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

