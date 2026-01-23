import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TaskStatistics as TaskStatisticsType } from '@/types/tasks';
import { CheckCircle2, Clock, AlertCircle, LayoutList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskStatisticsProps {
  statistics: TaskStatisticsType;
  compact?: boolean;
}

export function TaskStatistics({ statistics, compact = false }: TaskStatisticsProps) {
  if (compact) {
  return (
      <div className="space-y-3">
        <div className="text-sm font-semibold tracking-tight">Quick Stats</div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-muted border border-border">
            <div className="text-muted-foreground mb-1">Total</div>
            <div className="font-bold text-lg text-foreground">{statistics.total}</div>
              </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <div className="text-green-600 dark:text-green-400 mb-1">Completed</div>
            <div className="font-bold text-lg text-green-700 dark:text-green-300">{statistics.completed}</div>
            </div>
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="text-blue-600 dark:text-blue-400 mb-1">In Progress</div>
            <div className="font-bold text-lg text-blue-700 dark:text-blue-300">{statistics.in_progress}</div>
              </div>
          <div className="p-3 rounded-lg bg-destructive/10 dark:bg-destructive/20 border border-destructive/30 dark:border-destructive/50">
            <div className="text-destructive mb-1">Overdue</div>
            <div className="font-bold text-lg text-destructive">{statistics.overdue}</div>
            </div>
                </div>
              </div>
    );
  }

  const statCards = [
    { label: 'Total Tasks', value: statistics.total, icon: LayoutList, color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' },
    { label: 'Completed', value: statistics.completed, icon: CheckCircle2, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800' },
    { label: 'In Progress', value: statistics.in_progress, icon: Clock, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
    { label: 'Overdue', value: statistics.overdue, icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10 dark:bg-destructive/20', border: 'border-destructive/30 dark:border-destructive/50' },
  ];

  return (
    <div className="space-y-6 w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full">
        {statCards.map((stat) => (
          <Card key={stat.label} className={cn("border shadow-sm min-w-0", stat.border)}>
            <CardContent className="p-4 sm:p-6 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{stat.label}</p>
                <div className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2">{stat.value}</div>
              </div>
              <div className={cn("p-2 sm:p-3 rounded-full flex-shrink-0", stat.bg)}>
                <stat.icon className={cn("w-4 h-4 sm:w-5 sm:h-5", stat.color)} />
            </div>
          </CardContent>
        </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">By Status</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge label="Pending" count={statistics.pending} />
              <StatusBadge label="Waiting" count={statistics.waiting} />
              <StatusBadge label="Blocked" count={statistics.blocked} variant="destructive" />
              <StatusBadge label="Review" count={statistics.review_required} />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">By Priority</h3>
            <div className="flex flex-wrap gap-2">
              <PriorityBadge label="Low" count={statistics.by_priority.low} color="bg-muted text-muted-foreground" />
              <PriorityBadge label="Medium" count={statistics.by_priority.medium} color="bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300" />
              <PriorityBadge label="High" count={statistics.by_priority.high} color="bg-orange-100 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300" />
              <PriorityBadge label="Urgent" count={statistics.by_priority.urgent} color="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300" />
              <PriorityBadge label="Critical" count={statistics.by_priority.critical} color="bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300" />
            </div>
          </CardContent>
        </Card>
      </div>
                </div>
  );
}

function StatusBadge({ label, count, variant = "outline" }: { label: string, count: number, variant?: "outline" | "destructive" }) {
  if (count === 0) return null;
  return (
    <Badge variant={variant as any} className="px-3 py-1 text-sm font-normal gap-2">
      {label}
      <span className="font-bold opacity-70 border-l pl-2 ml-1 border-current">{count}</span>
    </Badge>
  );
}

function PriorityBadge({ label, count, color }: { label: string, count: number, color: string }) {
  if (count === 0) return null;
  return (
    <div className={cn("flex items-center px-3 py-1 rounded-full text-xs font-medium gap-2", color)}>
      {label}
      <span className="font-bold opacity-70 border-l pl-2 ml-1 border-current">{count}</span>
      </div>
  );
}

