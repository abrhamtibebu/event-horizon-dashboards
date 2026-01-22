import { TaskFilters as TaskFiltersType } from '@/types/tasks'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

interface TaskFiltersProps {
  filters: TaskFiltersType
  onFiltersChange: (filters: TaskFiltersType) => void
  events: Array<{ id: number; title: string }>
  teamMembers: Array<{ id: number; name: string }>
  departments?: string[]
  eventPhases?: string[]
}

export function TaskFilters({ 
  filters, 
  onFiltersChange, 
  events, 
  teamMembers,
  departments = ['HR', 'Marketing', 'Finance', 'Operations', 'IT', 'Sales', 'Procurement', 'Logistics', 'Other'],
  eventPhases = ['Planning', 'Pre-Event', 'Setup', 'Execution', 'Post-Event', 'Wrap-up']
}: TaskFiltersProps) {
  const updateFilter = (key: keyof TaskFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }
  
  const isEventScope = filters.scope_type === 'event'
  const isGeneralScope = filters.scope_type === 'general'

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={filters.search || ''}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Scope Type</Label>
            <Select
              value={filters.scope_type || 'all'}
              onValueChange={(value) => {
                updateFilter('scope_type', value === 'all' ? undefined : value)
                // Reset scope-specific filters when scope changes
                if (value === 'all' || value === 'general') {
                  updateFilter('event_phase', undefined)
                }
                if (value === 'all' || value === 'event') {
                  updateFilter('department', undefined)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="event">Event Tasks</SelectItem>
                <SelectItem value="general">General Tasks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => updateFilter('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) => updateFilter('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Task Type</Label>
            <Select
              value={filters.task_type || 'all'}
              onValueChange={(value) => updateFilter('task_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="event_task">Event Task</SelectItem>
                <SelectItem value="usher_task">Usher Task</SelectItem>
                <SelectItem value="operational_task">Operational Task</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Assigned To</Label>
            <Select
              value={filters.assigned_to || 'all'}
              onValueChange={(value) => updateFilter('assigned_to', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Members</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Event-specific filters */}
          {(isEventScope || !filters.scope_type) && (
            <>
              <div className="space-y-2">
                <Label>Event</Label>
                <Select
                  value={filters.event_id || 'all'}
                  onValueChange={(value) => updateFilter('event_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id.toString()}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Event Phase</Label>
                <Select
                  value={filters.event_phase || 'all'}
                  onValueChange={(value) => updateFilter('event_phase', value === 'all' ? undefined : value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Phases</SelectItem>
                    {eventPhases.map((phase) => (
                      <SelectItem key={phase} value={phase}>
                        {phase}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* General task-specific filters */}
          {(isGeneralScope || !filters.scope_type) && (
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={filters.department || 'all'}
                onValueChange={(value) => updateFilter('department', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label>Task Category</Label>
            <Select
              value={filters.task_category || 'all'}
              onValueChange={(value) => updateFilter('task_category', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="vendor_recruitment">Vendor Recruitment</SelectItem>
                <SelectItem value="sponsor_followup">Sponsor Follow-up</SelectItem>
                <SelectItem value="sponsor_listing">Sponsor Listing</SelectItem>
                <SelectItem value="event_setup">Event Setup</SelectItem>
                <SelectItem value="post_event">Post-Event</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Select
              value={filters.due_date || 'all'}
              onValueChange={(value) => updateFilter('due_date', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due_today">Due Today</SelectItem>
                <SelectItem value="due_this_week">Due This Week</SelectItem>
                <SelectItem value="due_this_month">Due This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="space-y-2">
            <Label>Group By</Label>
            <Select
              value={filters.group_by || 'none'}
              onValueChange={(value) => updateFilter('group_by', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="assigned_user">Assigned User</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="scope_type">Scope Type</SelectItem>
                <SelectItem value="task_category">Task Category</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}



















