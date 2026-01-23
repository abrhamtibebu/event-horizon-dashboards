import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { TaskFilters, TaskStatus, TaskPriority, TaskCategory } from '@/types/tasks';

interface TaskFiltersProps {
  filters: TaskFilters;
  onChange: (filters: Partial<TaskFilters>) => void;
  onClose?: () => void;
}

const statusOptions: TaskStatus[] = ['pending', 'in_progress', 'waiting', 'blocked', 'review_required', 'completed', 'cancelled'];
const priorityOptions: TaskPriority[] = ['low', 'medium', 'high', 'urgent', 'critical'];
const categoryOptions: TaskCategory[] = [
  'vendor_recruitment', 'sponsor_followup', 'sponsor_listing', 'event_setup', 'post_event',
  'operations', 'logistics', 'staffing', 'marketing', 'sales', 'finance', 'technical', 'client_related', 'other'
];

export function TaskFilters({ filters, onChange, onClose }: TaskFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (key: keyof TaskFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onChange(newFilters);
  };

  const clearFilters = () => {
    const cleared: Partial<TaskFilters> = {
      status: undefined,
      priority: undefined,
      task_category: undefined,
      sort_by: 'due_date',
      sort_order: 'asc',
    };
    setLocalFilters(cleared as TaskFilters);
    onChange(cleared);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            value={Array.isArray(localFilters.status) ? undefined : (localFilters.status || 'all')}
            onValueChange={(value) => handleChange('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={Array.isArray(localFilters.priority) ? undefined : (localFilters.priority || 'all')}
            onValueChange={(value) => handleChange('priority', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {priorityOptions.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={Array.isArray(localFilters.task_category) ? undefined : (localFilters.task_category || 'all')}
            onValueChange={(value) => handleChange('task_category', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Sort By</Label>
          <Select
            value={localFilters.sort_by || 'due_date'}
            onValueChange={(value) => handleChange('sort_by', value as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="due_date">Due Date</SelectItem>
              <SelectItem value="start_date">Start Date</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="created_at">Created</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Order</Label>
          <Select
            value={localFilters.sort_order || 'asc'}
            onValueChange={(value) => handleChange('sort_order', value as 'asc' | 'desc')}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex items-end">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="overdue"
              checked={localFilters.overdue || false}
              onCheckedChange={(checked) => handleChange('overdue', checked || undefined)}
            />
            <Label htmlFor="overdue" className="cursor-pointer">Overdue only</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>
    </div>
  );
}

