import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTask, useTaskActivity } from '@/hooks/useTasks';
import { Spinner } from '@/components/ui/spinner';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';
import {
  Calendar, 
  User, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  Users,
  Link2,
  Building2,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskDetailsModalProps {
  taskId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function TaskDetailsModal({ taskId, open, onOpenChange, onUpdate }: TaskDetailsModalProps) {
  const { task, isLoading, updateTask, completeTask, startTask, approveTask, rejectTask } = useTask(taskId);
  const { activityLog } = useTaskActivity(taskId);

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Spinner />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!task) {
    return null;
  }

  // Calculate progress
  const getProgress = () => {
    if (task.status === 'completed') return 100;
    if (task.status === 'in_progress') return 50;
    if (task.status === 'review_required') return 90;
    if (task.status === 'waiting' || task.status === 'blocked') return 30;
    return 10;
  };

  // Check if overdue
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== 'completed';

  // Get status color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      review_required: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };
    return colors[status] || colors.pending;
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      critical: 'bg-red-200 text-red-900 dark:bg-red-950 dark:text-red-100',
    };
    return colors[priority] || colors.medium;
  };

  // Format duration
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'Not set';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Format date with relative time
  const formatDateWithRelative = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    const formatted = format(date, 'PPP');
    const relative = formatDistanceToNow(date, { addSuffix: true });
    return `${formatted} (${relative})`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold mb-3">{task.title}</DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={cn('font-semibold', getStatusColor(task.status))}>
                  {task.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge className={cn('font-semibold', getPriorityColor(task.priority))}>
                  {task.priority.toUpperCase()}
                </Badge>
                {task.type && (
                  <Badge variant="outline" className="font-semibold">
                    <Tag className="w-3 h-3 mr-1" />
                    {task.type}
                  </Badge>
                )}
                {task.task_category && (
                  <Badge variant="outline" className="font-semibold">
                    {task.task_category.replace('_', ' ')}
                  </Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive" className="font-semibold">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    OVERDUE
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-muted-foreground">{getProgress()}%</span>
            </div>
            <Progress value={getProgress()} className="h-2" />
              </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="proof">Proof & Approval</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-6">
            {/* Description */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </h3>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                {task.description || 'No description provided'}
              </p>
              </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Date
                </h3>
                <p className="text-sm">
                  {task.due_date ? (
                    <span className={cn(
                      isOverdue && 'text-destructive font-semibold',
                      isToday(new Date(task.due_date)) && 'text-orange-600 dark:text-orange-400 font-semibold'
                    )}>
                      {formatDateWithRelative(task.due_date)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Not set</span>
                  )}
                </p>
              </div>

              {/* Start Date */}
              {task.start_date && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Start Date
                  </h3>
                  <p className="text-sm">{formatDateWithRelative(task.start_date)}</p>
                </div>
              )}

              {/* Assigned To */}
                <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Assigned To
                </h3>
                {task.assignedUser ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={task.assignedUser.avatar} />
                      <AvatarFallback>
                        {task.assignedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{task.assignedUser.name}</p>
                      <p className="text-xs text-muted-foreground">{task.assignedUser.email}</p>
                </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
              </div>

              {/* Estimated Duration */}
              {task.estimated_duration && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Estimated Duration
                  </h3>
                  <p className="text-sm">{formatDuration(task.estimated_duration)}</p>
                </div>
              )}

              {/* Event */}
              {task.event && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Event
                  </h3>
                  <div>
                    <p className="text-sm font-medium">{task.event.name}</p>
                    {task.event_phase && (
                      <Badge variant="outline" className="text-xs mt-1">
                        {task.event_phase.replace('_', ' ')}
                      </Badge>
                    )}
                </div>
              </div>
              )}

              {/* Location */}
              {task.location && (
              <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Location
                  </h3>
                  <p className="text-sm">{task.location}</p>
              </div>
              )}

              {/* Created By */}
              {task.creator && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Created By</h3>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback>
                        {task.creator.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
              <div>
                      <p className="text-sm font-medium">{task.creator.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.created_at), 'PPP')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Completed Date */}
              {task.completed_date && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    Completed Date
                  </h3>
                  <p className="text-sm">{formatDateWithRelative(task.completed_date)}</p>
              </div>
                )}
              </div>

            {/* Watchers */}
            {task.watchers && task.watchers.length > 0 && (
                <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Watchers ({task.watchers.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {task.watchers.map((watcher) => (
                    <div key={watcher.id} className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-md">
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={watcher.avatar} />
                        <AvatarFallback>
                          {watcher.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{watcher.name}</span>
                </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dependencies */}
            {task.dependencies && task.dependencies.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Dependencies ({task.dependencies.length})
                </h3>
                <div className="space-y-2">
                  {task.dependencies.map((dep) => (
                    <div key={dep.id} className="bg-muted/50 p-2 rounded-md">
                      <p className="text-sm font-medium">
                        {dep.dependsOnTask?.title || `Task #${dep.depends_on_task_id}`}
                      </p>
                    </div>
                  ))}
                </div>
                </div>
              )}

            {/* Notes */}
            {task.notes && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Notes</h3>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {task.notes}
                </p>
                </div>
              )}

            {/* Completion Notes */}
            {task.completion_notes && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">Completion Notes</h3>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
                  {task.completion_notes}
                </p>
                </div>
              )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              {task.status === 'pending' && (
                <Button onClick={() => startTask().then(onUpdate)}>
                  Start Task
                </Button>
              )}
              {['pending', 'in_progress'].includes(task.status) && (
                <Button onClick={() => completeTask().then(onUpdate)}>
                  Complete Task
                </Button>
              )}
              {task.status === 'waiting' && (
                <Button variant="outline" onClick={() => updateTask({ status: 'in_progress' }).then(onUpdate)}>
                  Resume Task
                </Button>
              )}
              {task.status === 'blocked' && (
                <Button variant="outline" onClick={() => updateTask({ status: 'in_progress' }).then(onUpdate)}>
                  Unblock Task
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4 mt-6">
            {activityLog && Array.isArray(activityLog) && activityLog.length > 0 ? (
              <div className="space-y-3">
                {activityLog.map((activity) => (
                  <div key={activity.id} className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm capitalize">
                          {activity.action.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.user?.name || 'System'} • {format(new Date(activity.created_at), 'PPP p')}
                        </p>
                        {activity.new_value && (
                          <p className="text-xs text-muted-foreground mt-2 bg-background p-2 rounded">
                            {typeof activity.new_value === 'string' 
                              ? activity.new_value 
                              : JSON.stringify(activity.new_value, null, 2)}
                        </p>
                      )}
                    </div>
                    </div>
                  </div>
                ))}
                  </div>
                ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No activity recorded yet</p>
                </div>
              )}
          </TabsContent>

          <TabsContent value="proof" className="space-y-4 mt-6">
            {/* Proof Media */}
            {task.proof_media && task.proof_media.length > 0 ? (
                <div>
                <h3 className="font-semibold text-sm mb-3">Proof Media</h3>
                <div className="grid grid-cols-2 gap-4">
                  {task.proof_media.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Proof ${index + 1}`} 
                        className="rounded-lg w-full h-48 object-cover border"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No proof media uploaded</p>
                </div>
              )}

            {/* Approval Section */}
            {task.supervisor_approval_required && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold text-sm">Approval Status</h3>
                {task.approved_by ? (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                        <p className="font-medium text-sm">Approved</p>
                        <p className="text-xs text-muted-foreground">
                          by {task.approver?.name || 'Unknown'} 
                          {task.approved_at && ` on ${format(new Date(task.approved_at), 'PPP')}`}
                        </p>
                      </div>
                </div>
                </div>
                ) : task.status === 'completed' ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      This task requires supervisor approval before it can be marked as complete.
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={() => approveTask().then(onUpdate)}>
                        Approve
                      </Button>
                      <Button variant="outline" onClick={() => rejectTask().then(onUpdate)}>
                        Reject
                      </Button>
                </div>
              </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Approval will be required when this task is completed.
                  </p>
          )}
        </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
