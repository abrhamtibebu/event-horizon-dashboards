import { TaskStatistics as TaskStatisticsType } from '@/types/tasks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Flag, Calendar, Briefcase, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Badge } from '@/components/ui/badge'

interface TaskStatisticsProps {
  statistics: TaskStatisticsType
}

const COLORS = {
  pending: '#94a3b8',
  in_progress: '#f97316',
  waiting: '#fdba74',
  completed: '#22c55e',
  cancelled: '#ef4444',
  low: '#cbd5e1',
  medium: '#94a3b8',
  high: '#f97316',
  urgent: '#ea580c',
  critical: '#dc2626',
  event: '#f97316',
  general: '#64748b',
}

export function TaskStatistics({ statistics }: TaskStatisticsProps) {
  const statusData = [
    { name: 'Pending', value: statistics.pending, color: COLORS.pending },
    { name: 'In Progress', value: statistics.in_progress, color: COLORS.in_progress },
    { name: 'Waiting', value: statistics.waiting || 0, color: COLORS.waiting },
    { name: 'Completed', value: statistics.completed, color: COLORS.completed },
    { name: 'Cancelled', value: statistics.cancelled, color: COLORS.cancelled },
  ].filter(item => item.value > 0)

  const priorityData = [
    { name: 'Low', value: statistics.by_priority.low, color: COLORS.low },
    { name: 'Medium', value: statistics.by_priority.medium, color: COLORS.medium },
    { name: 'High', value: statistics.by_priority.high, color: COLORS.high },
    { name: 'Urgent', value: statistics.by_priority.urgent, color: COLORS.urgent },
    { name: 'Critical', value: statistics.by_priority.critical || 0, color: COLORS.critical },
  ].filter(item => item.value > 0)

  const typeData = [
    { name: 'Event Task', value: statistics.by_type.event_task },
    { name: 'Usher Task', value: statistics.by_type.usher_task },
    { name: 'Operational Task', value: statistics.by_type.operational_task },
    { name: 'General Task', value: statistics.by_type.general_task || 0 },
  ].filter(item => item.value > 0)

  const scopeData = statistics.by_scope ? [
    { name: 'Event Tasks', value: statistics.by_scope.event, color: COLORS.event },
    { name: 'General Tasks', value: statistics.by_scope.general, color: COLORS.general },
  ].filter(item => item.value > 0) : []

  const workloadData = statistics.team_workload.map(w => ({
    name: w.user_name.split(' ')[0], // First name only for display
    tasks: w.task_count,
  }))

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-foreground">{statistics.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{statistics.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {statistics.waiting !== undefined && statistics.waiting > 0 && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Waiting</p>
                  <p className="text-2xl font-bold text-warning">{statistics.waiting}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-info">{statistics.in_progress}</p>
              </div>
              <Clock className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{statistics.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-error">{statistics.overdue}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-error" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due Soon</p>
                <p className="text-2xl font-bold text-warning">{statistics.due_soon}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scope Breakdown */}
      {scopeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Tasks by Scope
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  <span className="font-semibold text-orange-700 dark:text-orange-300">Event Tasks</span>
                </div>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {statistics.by_scope.event}
                </p>
                {statistics.completion_rate?.event !== undefined && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {statistics.completion_rate.event.toFixed(1)}% completion rate
                  </p>
                )}
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">General Tasks</span>
                </div>
                <p className="text-3xl font-bold text-slate-600 dark:text-slate-400">
                  {statistics.by_scope.general}
                </p>
                {statistics.completion_rate?.general !== undefined && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {statistics.completion_rate.general.toFixed(1)}% completion rate
                  </p>
                )}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={scopeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scopeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Completion & On-Time Delivery Metrics */}
      {(statistics.completion_rate || statistics.on_time_delivery) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {statistics.completion_rate && (
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.completion_rate.overall !== undefined && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Overall</span>
                        <span className="text-sm font-bold">{statistics.completion_rate.overall.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-success h-2 rounded-full"
                          style={{ width: `${statistics.completion_rate.overall}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {statistics.completion_rate.event !== undefined && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          Event Tasks
                        </span>
                        <span className="text-sm font-bold">{statistics.completion_rate.event.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${statistics.completion_rate.event}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {statistics.completion_rate.general !== undefined && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Briefcase className="w-4 h-4 text-slate-600" />
                          General Tasks
                        </span>
                        <span className="text-sm font-bold">{statistics.completion_rate.general.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-slate-600 h-2 rounded-full"
                          style={{ width: `${statistics.completion_rate.general}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {statistics.on_time_delivery && (
            <Card>
              <CardHeader>
                <CardTitle>On-Time Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.on_time_delivery.overall !== undefined && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Overall</span>
                        <span className="text-sm font-bold">{statistics.on_time_delivery.overall.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-success h-2 rounded-full"
                          style={{ width: `${statistics.on_time_delivery.overall}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {statistics.on_time_delivery.event !== undefined && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-orange-600" />
                          Event Tasks
                        </span>
                        <span className="text-sm font-bold">{statistics.on_time_delivery.event.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-orange-600 h-2 rounded-full"
                          style={{ width: `${statistics.on_time_delivery.event}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {statistics.on_time_delivery.general !== undefined && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium flex items-center gap-1">
                          <Briefcase className="w-4 h-4 text-slate-600" />
                          General Tasks
                        </span>
                        <span className="text-sm font-bold">{statistics.on_time_delivery.general.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-slate-600 h-2 rounded-full"
                          style={{ width: `${statistics.on_time_delivery.general}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Department Productivity */}
      {statistics.department_productivity && statistics.department_productivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Department Productivity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.department_productivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#22c55e" name="Completed" />
                <Bar dataKey="total" fill="#94a3b8" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Vendor Performance */}
      {statistics.vendor_performance && statistics.vendor_performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statistics.vendor_performance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendor_name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" fill="#22c55e" name="Completed" />
                <Bar dataKey="on_time" fill="#3b82f6" name="On Time" />
                <Bar dataKey="total" fill="#94a3b8" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8">
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tasks by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={typeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>


        {workloadData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Team Workload</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workloadData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tasks" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

