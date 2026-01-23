import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Filter, List as ListIcon, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasks, useMyTasks, useTaskStatistics } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import type { TaskFilters, TaskStatus } from '@/types/tasks';
import { TaskListView } from '@/components/tasks/TaskListView';
import { TaskCalendarView } from '@/components/tasks/TaskCalendarView';
import { TaskTimelineView } from '@/components/tasks/TaskTimelineView';
import { TaskFilters as TaskFiltersComponent } from '@/components/tasks/TaskFilters';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { TaskStatistics } from '@/components/tasks/TaskStatistics';

type ViewType = 'list' | 'calendar' | 'timeline';
type FilterType = 'all' | 'my-tasks' | 'event-tasks' | 'general-tasks' | 'overdue';

export default function Tasks() {
  const [view, setView] = useState<ViewType>('list');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState<TaskFilters>({
    sort_by: 'due_date',
    sort_order: 'asc',
    per_page: 20,
  });

  // Build filters based on filter type
  const activeFilters = useMemo<TaskFilters>(() => {
    const baseFilters: TaskFilters = {
      ...filters,
      search: searchQuery || undefined,
    };

    switch (filterType) {
      case 'my-tasks':
        return baseFilters;
      case 'event-tasks':
        return { ...baseFilters, operational: false };
      case 'general-tasks':
        return { ...baseFilters, operational: true };
      case 'overdue':
        return { ...baseFilters, overdue: true };
      default:
        return baseFilters;
    }
  }, [filterType, filters, searchQuery]);

  // Always call both hooks to avoid conditional hook calls
  const allTasksResult = useTasks(activeFilters);
  const myTasksResult = useMyTasks(activeFilters);

  // Use appropriate result based on filter type
  const { tasks, pagination, isLoading, refetch } = filterType === 'my-tasks'
    ? myTasksResult
    : allTasksResult;

  const { statistics } = useTaskStatistics(undefined);

  const handleFilterChange = (newFilters: Partial<TaskFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleViewChange = (newView: ViewType) => {
    setView(newView);
    // Save to localStorage
    localStorage.setItem('tasks-view', newView);
  };

  // Load saved view preference
  useEffect(() => {
    const savedView = localStorage.getItem('tasks-view') as ViewType;
    if (savedView && ['list', 'calendar', 'timeline'].includes(savedView)) {
      setView(savedView);
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-x-hidden">
      {/* Top Header */}
      <div className="bg-background border-b px-4 sm:px-6 py-4 flex flex-col gap-4 sticky top-0 z-20 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your team's tasks and deliverables.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/40 border-border w-full"
              />
            </div>

            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 flex-shrink-0"
            >
              <Filter className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filters</span>
            </Button>

            <Button onClick={() => setShowCreateDialog(true)} className="gap-2 shadow-sm flex-shrink-0">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Create Task</span>
            </Button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="pb-2 animate-in fade-in slide-in-from-top-2">
            <TaskFiltersComponent
              filters={filters}
              onChange={handleFilterChange}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Navigation Tabs and View Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)} className="w-full sm:w-auto min-w-0">
            <TabsList className="bg-muted/50 p-1 w-full sm:w-auto overflow-x-auto">
              <TabsTrigger value="all" className="px-3 sm:px-4 flex-shrink-0">All</TabsTrigger>
              <TabsTrigger value="my-tasks" className="px-3 sm:px-4 flex-shrink-0">My Tasks</TabsTrigger>
              <TabsTrigger value="event-tasks" className="px-3 sm:px-4 flex-shrink-0">Events</TabsTrigger>
              <TabsTrigger value="general-tasks" className="px-3 sm:px-4 flex-shrink-0">General</TabsTrigger>
              <TabsTrigger value="overdue" className="px-3 sm:px-4 flex-shrink-0 data-[state=active]:text-destructive data-[state=active]:bg-destructive/10 dark:data-[state=active]:bg-destructive/20">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center bg-muted/50 rounded-lg p-1 overflow-x-auto">
            <Button
              variant={view === 'list' ? 'background' : 'ghost'}
              size="sm"
              className={cn("h-8 px-2 sm:px-3 rounded-md transition-all flex-shrink-0", view === 'list' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              onClick={() => handleViewChange('list')}
            >
              <ListIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">List</span>
            </Button>
            <Button
              variant={view === 'calendar' ? 'background' : 'ghost'}
              size="sm"
              className={cn("h-8 px-2 sm:px-3 rounded-md transition-all flex-shrink-0", view === 'calendar' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              onClick={() => handleViewChange('calendar')}
            >
              <Calendar className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Calendar</span>
            </Button>
            <Button
              variant={view === 'timeline' ? 'background' : 'ghost'}
              size="sm"
              className={cn("h-8 px-2 sm:px-3 rounded-md transition-all flex-shrink-0", view === 'timeline' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              onClick={() => handleViewChange('timeline')}
            >
              <Clock className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Timeline</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden min-w-0">
        <div className="h-full overflow-y-auto overflow-x-hidden p-4 sm:p-6 scroll-smooth">
          {/* Statistics Section - Only show on 'all' tab or make it collapsible? Let's show it always but compact */}
          {statistics && (
            <div className="mb-6">
              <TaskStatistics statistics={statistics} compact={false} />
            </div>
          )}

          <div className="mt-6">
            {/* Since we handle filterType in state, we don't need TabsContent for each type unless they render differently. 
                     We can just render the active view. */}
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground text-sm">Loading tasks...</p>
                </div>
              </div>
            ) : (
              <ViewContent view={view} tasks={tasks} pagination={pagination} isLoading={isLoading} refetch={refetch} />
            )}
          </div>
        </div>
      </div>

      {/* Create Task Dialog */}
      {showCreateDialog && (
        <CreateTaskDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            setShowCreateDialog(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

// Separate component for view content to avoid duplication
function ViewContent({
  view,
  tasks,
  pagination,
  isLoading,
  refetch
}: {
  view: ViewType;
  tasks: any[];
  pagination: any;
  isLoading: boolean;
  refetch: () => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  switch (view) {
    case 'list':
      return <TaskListView tasks={tasks} pagination={pagination} onRefresh={refetch} />;
    case 'calendar':
      return <TaskCalendarView tasks={tasks} onRefresh={refetch} />;
    case 'timeline':
      return <TaskTimelineView tasks={tasks} onRefresh={refetch} />;
    default:
      return <TaskListView tasks={tasks} pagination={pagination} onRefresh={refetch} />;
  }
}
