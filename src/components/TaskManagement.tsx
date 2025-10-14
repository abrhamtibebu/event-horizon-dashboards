import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  MoreHorizontal,
  Plus,
  Calendar,
  User,
  Building,
  FileText,
  Play,
  Pause,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';
import { taskApi, Task, TaskFilters } from '@/lib/taskApi';

interface TaskManagementProps {
  eventId?: number;
  vendorId?: number;
}

export function TaskManagement({ eventId, vendorId }: TaskManagementProps) {
  const [filters, setFilters] = useState<TaskFilters>({
    event_id: eventId,
    vendor_id: vendorId,
    sort_by: 'created_at',
    sort_order: 'desc',
    per_page: 15,
  });
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  const queryClient = useQueryClient();

  // Fetch tasks
  const { data: tasksData, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskApi.getTasks(filters),
    retry: 1,
  });

  // Fetch task statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['task-statistics', { event_id: eventId }],
    queryFn: () => taskApi.getTaskStatistics({ event_id: eventId }),
    retry: 1,
  });

  // Mutations
  const completeTaskMutation = useMutation({
    mutationFn: (taskId: number) => taskApi.completeTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-statistics'] });
      toast.success('Task completed successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to complete task: ${error.message}`);
    },
  });

  const startTaskMutation = useMutation({
    mutationFn: (taskId: number) => taskApi.startTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-statistics'] });
      toast.success('Task started successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to start task: ${error.message}`);
    },
  });

  const cancelTaskMutation = useMutation({
    mutationFn: (taskId: number) => taskApi.cancelTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-statistics'] });
      toast.success('Task cancelled successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel task: ${error.message}`);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => taskApi.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-statistics'] });
      toast.success('Task deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete task: ${error.message}`);
    },
  });

  const handleFilterChange = (key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Play className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    return (
      <Badge className={variants[priority as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {priority}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      deliverable: 'bg-blue-100 text-blue-800',
      milestone: 'bg-purple-100 text-purple-800',
      review: 'bg-green-100 text-green-800',
      payment: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={variants[type as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  if (tasksLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  if (tasksError) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Tasks</h3>
        <p className="text-gray-600 mb-4">There was an error loading the tasks. Please try again.</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  const tasks = tasksData?.data || [];
  const stats = statsData || {
    total: 0,
    pending: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0,
    due_soon: 0,
    by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
    by_type: { deliverable: 0, milestone: 0, review: 0, payment: 0, other: 0 }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Play className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Event Tasks</CardTitle>
              <CardDescription>Manage and track event deliverables and milestones</CardDescription>
            </div>
            <Button onClick={() => setShowCreateTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priority || 'all'} onValueChange={(value) => handleFilterChange('priority', value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.type || 'all'} onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="deliverable">Deliverable</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tasks Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Task</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No tasks found</p>
                        <p className="text-sm">Create your first task to get started</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          {getStatusBadge(task.status)}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                      <TableCell>{getTypeBadge(task.type)}</TableCell>
                      <TableCell>
                        {task.due_date ? (
                          <div className={`flex items-center gap-1 ${isOverdue(task.due_date) ? 'text-red-600' : ''}`}>
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(task.due_date).toLocaleDateString()}</span>
                            {isOverdue(task.due_date) && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">No due date</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {task.vendor ? (
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{task.vendor.name}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No vendor</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedTask(task);
                              setShowTaskDetails(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {task.status === 'pending' && (
                              <DropdownMenuItem onClick={() => startTaskMutation.mutate(task.id)}>
                                <Play className="h-4 w-4 mr-2" />
                                Start Task
                              </DropdownMenuItem>
                            )}
                            {(task.status === 'pending' || task.status === 'in_progress') && (
                              <DropdownMenuItem onClick={() => completeTaskMutation.mutate(task.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Complete Task
                              </DropdownMenuItem>
                            )}
                            {(task.status === 'pending' || task.status === 'in_progress') && (
                              <DropdownMenuItem onClick={() => cancelTaskMutation.mutate(task.id)}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancel Task
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => deleteTaskMutation.mutate(task.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Task
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>
              View detailed information about this task
            </DialogDescription>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedTask.title}</h3>
                {selectedTask.description && (
                  <p className="text-gray-600 mt-2">{selectedTask.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedTask.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <div className="mt-1">{getPriorityBadge(selectedTask.priority)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <div className="mt-1">{getTypeBadge(selectedTask.type)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Due Date</label>
                  <div className="mt-1">
                    {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'No due date'}
                  </div>
                </div>
              </div>

              {selectedTask.vendor && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Vendor</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span>{selectedTask.vendor.name}</span>
                    <span className="text-gray-400">({selectedTask.vendor.contact_email})</span>
                  </div>
                </div>
              )}

              {selectedTask.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    {selectedTask.notes}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <label className="font-medium">Created</label>
                  <div>{new Date(selectedTask.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <label className="font-medium">Last Updated</label>
                  <div>{new Date(selectedTask.updated_at).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}














