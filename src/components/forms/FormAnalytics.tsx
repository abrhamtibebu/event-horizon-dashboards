import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Target,
  Calendar,
  PieChart as PieChartIcon,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

import { formApi, formSubmissionApi } from '@/lib/api/forms';
import { GoogleFormsStyleAnalytics } from './GoogleFormsStyleAnalytics';
import type { SubmissionStatistics, FormStatistics } from '@/types/forms';

interface FormAnalyticsProps {
  eventId: number;
  onExportCSV?: (formId: number) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const FormAnalytics: React.FC<FormAnalyticsProps> = ({
  eventId,
  onExportCSV
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'responses'>('overview');

  // Fetch all forms for the event
  const {
    data: forms,
    isLoading: formsLoading,
    error: formsError
  } = useQuery({
    queryKey: ['event-forms', eventId],
    queryFn: () => formApi.getEventForms(eventId),
  });

  // Fetch statistics for all forms
  const {
    data: allFormStats,
    isLoading: statsLoading,
    error: statsError
  } = useQuery({
    queryKey: ['all-form-statistics', eventId, forms],
    queryFn: async () => {
      if (!forms || forms.length === 0) return null;

      const statsPromises = forms.map(form =>
        formSubmissionApi.getSubmissionStatistics(form.id).catch(() => ({
          total_submissions: 0,
          completed_submissions: 0,
          pending_submissions: 0,
          cancelled_submissions: 0,
          submissions_by_type: {},
          submissions_by_date: {},
          average_completion_time: null,
          submissions_today: 0,
          submissions_this_week: 0,
          submissions_this_month: 0,
          conversion_rate: 0
        }))
      );

      const stats = await Promise.all(statsPromises);

      // Aggregate statistics
      const aggregated = {
        total_forms: forms.length,
        total_submissions: stats.reduce((sum, stat) => sum + (stat.total_submissions || 0), 0),
        completed_submissions: stats.reduce((sum, stat) => sum + (stat.completed_submissions || 0), 0),
        pending_submissions: stats.reduce((sum, stat) => sum + (stat.pending_submissions || 0), 0),
        cancelled_submissions: stats.reduce((sum, stat) => sum + (stat.cancelled_submissions || 0), 0),
        submissions_today: stats.reduce((sum, stat) => sum + (stat.submissions_today || 0), 0),
        submissions_this_week: stats.reduce((sum, stat) => sum + (stat.submissions_this_week || 0), 0),
        submissions_this_month: stats.reduce((sum, stat) => sum + (stat.submissions_this_month || 0), 0),
        forms: forms.map((form, index) => ({
          ...form,
          stats: stats[index]
        }))
      };

      return aggregated;
    },
    enabled: !!forms && forms.length > 0,
  });

  const formatChartData = (data: Record<string, number>) => {
    return Object.entries(data).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      count: value
    }));
  };

  const getCompletionRate = (total: number, completed: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  if (formsLoading || statsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-muted rounded w-1/2"></div>
                  <div className="h-32 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (formsError || statsError || !forms || forms.length === 0) {
    return (
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {formsError || statsError ? 'Failed to load form analytics data.' : 'No forms found for this event.'}
            {forms && forms.length === 0 && ' Create your first form to start collecting responses.'}
          </AlertDescription>
        </Alert>
        {!forms || forms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Forms Yet</h3>
              <p className="text-muted-foreground mb-4">Create forms to start collecting and analyzing responses.</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  }

  const aggregatedStats = allFormStats || {
    total_forms: forms.length,
    total_submissions: 0,
    completed_submissions: 0,
    pending_submissions: 0,
    cancelled_submissions: 0,
    submissions_today: 0,
    submissions_this_week: 0,
    submissions_this_month: 0,
    forms: forms.map(form => ({ ...form, stats: {} }))
  };

  const overallCompletionRate = getCompletionRate(
    aggregatedStats.total_submissions,
    aggregatedStats.completed_submissions
  );

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'overview' | 'responses')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics Overview
          </TabsTrigger>
          <TabsTrigger value="responses" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Form Responses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Overall Analytics Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Live Data
              </Badge>
              <div className="text-sm text-muted-foreground">
                {aggregatedStats.total_forms} form{aggregatedStats.total_forms !== 1 ? 's' : ''} • {aggregatedStats.total_submissions} total submissions
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // Export all form data as CSV
                  forms.forEach(form => {
                    if (onExportCSV) {
                      onExportCSV(form.id);
                    }
                  });
                }}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export All CSV
              </Button>
            </div>
          </div>

      {/* Overall Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedStats.total_submissions}</div>
            <p className="text-xs text-muted-foreground">
              +{aggregatedStats.submissions_today} today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallCompletionRate}%</div>
            <Progress value={overallCompletionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedStats.submissions_this_week}</div>
            <p className="text-xs text-muted-foreground">
              {aggregatedStats.submissions_this_month} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Forms</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aggregatedStats.total_forms}</div>
            <p className="text-xs text-muted-foreground">
              {forms.filter(f => f.status === 'active').length} active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Submission Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Completed</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${aggregatedStats.total_submissions > 0 ? (aggregatedStats.completed_submissions / aggregatedStats.total_submissions) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{aggregatedStats.completed_submissions}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Pending</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{
                        width: `${aggregatedStats.total_submissions > 0 ? (aggregatedStats.pending_submissions / aggregatedStats.total_submissions) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{aggregatedStats.pending_submissions}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Cancelled</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-muted rounded-full h-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{
                        width: `${aggregatedStats.total_submissions > 0 ? (aggregatedStats.cancelled_submissions / aggregatedStats.total_submissions) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium">{aggregatedStats.cancelled_submissions}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Forms Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Forms Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aggregatedStats.forms.slice(0, 5).map((form: any) => (
                <div key={form.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{form.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {form.stats?.total_submissions || 0} submissions
                    </div>
                  </div>
                  <Badge variant={form.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {form.status}
                  </Badge>
                </div>
              ))}
              {aggregatedStats.forms.length > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  +{aggregatedStats.forms.length - 5} more forms
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {aggregatedStats.submissions_today > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Today</span>
                  <Badge variant="secondary">{aggregatedStats.submissions_today}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm">This Week</span>
                <Badge variant="secondary">{aggregatedStats.submissions_this_week}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">This Month</span>
                <Badge variant="secondary">{aggregatedStats.submissions_this_month}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg. per Day</span>
                <Badge variant="outline">{Math.round(aggregatedStats.submissions_this_month / 30) || 0}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Individual Form Analytics */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold">Individual Form Performance</h3>
        <div className="grid gap-6">
          {aggregatedStats.forms.map((form: any) => {
            const formCompletionRate = getCompletionRate(
              form.stats?.total_submissions || 0,
              form.stats?.completed_submissions || 0
            );

            return (
              <Card key={form.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{form.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{form.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={form.status === 'active' ? 'default' : 'secondary'}>
                        {form.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onExportCSV && onExportCSV(form.id)}
                        className="flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        CSV
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{form.stats?.total_submissions || 0}</div>
                      <div className="text-xs text-muted-foreground">Total Submissions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{formCompletionRate}%</div>
                      <div className="text-xs text-muted-foreground">Completion Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{form.stats?.submissions_today || 0}</div>
                      <div className="text-xs text-muted-foreground">Today</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{form.stats?.submissions_this_week || 0}</div>
                      <div className="text-xs text-muted-foreground">This Week</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Export Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Data Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Export all guest responses and form data for analysis. Each form's submissions include all custom fields and guest information.
            </p>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  // Export all forms data
                  aggregatedStats.forms.forEach(form => {
                    if (onExportCSV) {
                      setTimeout(() => onExportCSV(form.id), Math.random() * 1000);
                    }
                  });
                }}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export All Forms (CSV)
              </Button>
              <div className="text-sm text-muted-foreground">
                Downloads {aggregatedStats.forms.length} CSV file{aggregatedStats.forms.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="responses">
          <GoogleFormsStyleAnalytics eventId={eventId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormAnalytics;
