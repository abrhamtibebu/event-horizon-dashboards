import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks } from '@/hooks/useTasks';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';
import type { TaskPayload, TaskPriority, TaskType } from '@/types/tasks';
import { CalendarIcon, User } from 'lucide-react';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: Partial<TaskPayload>;
}

export function CreateTaskDialog({ open, onOpenChange, onSuccess, initialData }: CreateTaskDialogProps) {
  const { createTask, isCreating } = useTasks();
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<TaskPayload>>({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    type: 'other',
    organizer_id: user?.organizer_id || undefined,
    ...initialData,
  });

  // Fetch team members
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['organizer-contacts', user?.organizer_id, 'task-assignment'],
    queryFn: async () => {
      if (!user?.organizer_id) return { data: [] };
      const response = await api.get(`/organizers/${user.organizer_id}/contacts`);
      return response;
    },
    enabled: open && !!user?.organizer_id,
  });

  const users = Array.isArray(usersResponse?.data)
    ? usersResponse.data
    : Array.isArray(usersResponse)
      ? usersResponse
      : [];

  useEffect(() => {
    if (user?.organizer_id && !formData.organizer_id) {
      setFormData(prev => ({ ...prev, organizer_id: user.organizer_id }));
    }
  }, [user?.organizer_id]);

  const handleSubmit = async () => {
    try {
      const payload: TaskPayload = {
        ...formData,
        organizer_id: user?.organizer_id || formData.organizer_id,
      } as TaskPayload;

      if (!payload.organizer_id) {
        toast({
          title: 'Error',
          description: 'You must be associated with an organizer to create tasks.',
          variant: 'destructive',
        });
        return;
      }

      if (!payload.title) {
        toast({
          title: 'Error',
          description: 'Task title is required.',
          variant: 'destructive',
        });
        return;
      }

      await createTask(payload);
      onSuccess();
      setFormData({
        title: '',
        description: '',
        status: 'pending',
        priority: 'medium',
        type: 'other',
        organizer_id: user?.organizer_id || undefined,
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] overflow-hidden flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new task.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid gap-6 py-4">
            {/* Main Info */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Update Event Graphics"
                  className="text-lg font-medium"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add more details about this task..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as TaskType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deliverable">Deliverable</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 pt-4 grid grid-cols-2 gap-6">
              {/* Assignment */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Assignee
                </Label>
                {isLoadingUsers ? (
                  <div className="flex items-center py-2 text-sm text-muted-foreground">
                    <Spinner size="sm" className="mr-2" /> Loading...
                  </div>
                ) : (
                  <Select
                    value={formData.assigned_to ? formData.assigned_to.toString() : 'unassigned'}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        assigned_to: value === 'unassigned' ? undefined : Number(value)
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Due Date */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  Due Date
                </Label>
                <Input
                  type="date"
                  value={formData.due_date || ''}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value || undefined })}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isCreating || !formData.title}>
            {isCreating ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

