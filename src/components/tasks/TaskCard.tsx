import { useState } from 'react';
import { Calendar, User, Eye, CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { TaskDetailsModal } from './TaskDetailsModal';
import type { Task, TaskPriority } from '@/types/tasks'; // Added TaskPriority for type safety
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onUpdate: () => void;
  compact?: boolean;
}

const statusConfig: Record<string, { label: string; text: string; icon: any; bg: string }> = {
  pending: { label: 'To Do', text: 'text-muted-foreground', icon: Clock, bg: 'bg-muted' },
  in_progress: { label: 'In Progress', text: 'text-blue-600 dark:text-blue-400', icon: Clock, bg: 'bg-blue-50 dark:bg-blue-950/30' },
  waiting: { label: 'Waiting', text: 'text-orange-600 dark:text-orange-400', icon: Clock, bg: 'bg-orange-50 dark:bg-orange-950/30' },
  blocked: { label: 'Blocked', text: 'text-destructive', icon: XCircle, bg: 'bg-destructive/10 dark:bg-destructive/20' },
  review_required: { label: 'Review', text: 'text-purple-600 dark:text-purple-400', icon: Eye, bg: 'bg-purple-50 dark:bg-purple-950/30' },
  completed: { label: 'Done', text: 'text-green-600 dark:text-green-400', icon: CheckCircle2, bg: 'bg-green-50 dark:bg-green-950/30' },
  cancelled: { label: 'Cancelled', text: 'text-muted-foreground', icon: XCircle, bg: 'bg-muted' },
};

const priorityConfig: Record<string, { color: string; bg: string }> = {
  low: { color: 'bg-muted-foreground', bg: 'bg-muted' },
  medium: { color: 'bg-blue-500 dark:bg-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30' },
  high: { color: 'bg-orange-500 dark:bg-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30' },
  urgent: { color: 'bg-red-500 dark:bg-red-400', bg: 'bg-red-50 dark:bg-red-950/30' },
  critical: { color: 'bg-rose-700 dark:bg-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30' },
};

export function TaskCard({ task, onUpdate, compact = false }: TaskCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const statusInfo = statusConfig[task.status] || statusConfig.pending;
  const priorityInfo = priorityConfig[task.priority] || priorityConfig.medium;
  const StatusIcon = statusInfo.icon;

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';

  return (
    <>
    <div
      className={cn(
          "group relative flex flex-col gap-3 rounded-xl border bg-card p-3 sm:p-4 text-card-foreground shadow-sm transition-all hover:shadow-md cursor-pointer w-full min-w-0",
          compact ? "p-3 gap-2" : "",
          isOverdue ? "border-destructive/50 bg-destructive/5 dark:bg-destructive/10" : "border-border/50"
        )}
        onClick={() => setShowDetails(true)}
      >
        {/* Priority Indicator Strip */}
        <div
          className={cn(
            "absolute left-0 top-3 bottom-3 w-1 rounded-r-full",
            priorityInfo.color
          )}
        />

        <div className="pl-2.5 flex flex-col gap-2 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 min-w-0">
            <h4 className={cn(
              "font-semibold leading-tight text-foreground/90 group-hover:text-primary transition-colors truncate flex-1 min-w-0",
              compact ? "text-sm" : "text-sm sm:text-base"
            )}>
            {task.title}
          </h4>
          </div>

          {/* Description */}
          {!compact && task.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Tags / Metadata */}
          <div className="flex items-center flex-wrap gap-2 mt-1">
            <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", statusInfo.bg, statusInfo.text)}>
              <StatusIcon className="w-3 h-3" />
              {statusInfo.label}
      </div>

            {task.due_date && (
              <div className={cn(
                "flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border bg-background/50",
                isOverdue ? "text-destructive border-destructive/30 bg-destructive/10 dark:bg-destructive/20" : "text-muted-foreground border-transparent"
              )}>
                <Calendar className="w-3 h-3" />
                <span>
                  {isOverdue
                    ? 'Overdue ' + formatDistanceToNow(new Date(task.due_date))
                    : format(new Date(task.due_date), 'MMM d')}
          </span>
        </div>
      )}

            {task.priority === 'urgent' || task.priority === 'critical' ? (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase tracking-wider font-bold">
                {task.priority}
          </Badge>
            ) : null}
      </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/40 gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {task.event && (
                <div className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md max-w-full sm:max-w-[120px] truncate">
                  {task.event.name}
        </div>
      )}
          </div>

            {task.assignedUser ? (
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0" title={task.assignedUser.name}>
                <span className="text-xs text-muted-foreground hidden sm:inline-block truncate">{task.assignedUser.name.split(' ')[0]}</span>
                <Avatar className="h-5 w-5 sm:h-6 sm:w-6 border border-background flex-shrink-0">
                  <AvatarImage src={task.assignedUser.avatar} />
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {task.assignedUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
          </div>
            ) : (
              <div className="text-xs text-muted-foreground italic flex-shrink-0">Unassigned</div>
        )}
      </div>
    </div>
      </div>

      {showDetails && (
        <TaskDetailsModal
          taskId={task.id}
          open={showDetails}
          onOpenChange={setShowDetails}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}

