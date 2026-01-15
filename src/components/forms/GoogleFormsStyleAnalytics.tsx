import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  User,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  X,
  Download,
  Search,
  Filter,
  PieChart,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts';

import { formSubmissionApi, formApi } from '@/lib/api/forms';
import type { FormSubmission, Form, FormField } from '@/types/forms';
import { toast } from 'sonner';

interface GoogleFormsStyleAnalyticsProps {
  eventId: number;
  formId?: number; // Optional - if provided, show submissions for specific form only
}

export const GoogleFormsStyleAnalytics: React.FC<GoogleFormsStyleAnalyticsProps> = ({
  eventId,
  formId
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'charts'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Fetch forms for the event
  const {
    data: forms,
    isLoading: formsLoading,
    error: formsError
  } = useQuery({
    queryKey: ['event-forms-analytics', eventId],
    queryFn: () => formApi.getEventForms(eventId),
  });

  // Also fetch individual form details if formId is provided
  const {
    data: specificForm,
    isLoading: specificFormLoading
  } = useQuery({
    queryKey: ['form-details-analytics', formId],
    queryFn: () => formId ? formApi.getForm(formId) : null,
    enabled: !!formId,
  });

  // Fetch submissions - either for all forms or specific form
  const {
    data: submissionsData,
    isLoading: submissionsLoading,
    error: submissionsError
  } = useQuery({
    queryKey: ['form-submissions-analytics', eventId, formId, searchTerm, statusFilter],
    queryFn: async () => {
      if (!forms || forms.length === 0) return null;

      const targetForms = formId ? forms.filter(f => f.id === formId) : forms;
      const allSubmissions: FormSubmission[] = [];

      // Fetch submissions for each form
      for (const form of targetForms) {
        try {
          const response = await formSubmissionApi.getSubmissions(form.id, {
            page: 1,
            per_page: 1000, // Get more submissions for analytics
            status: statusFilter === 'all' ? undefined : statusFilter,
            search: searchTerm || undefined
          });
          // response.data contains the paginated response, response.data.data contains the submissions array
          allSubmissions.push(...response.data.data);
        } catch (error) {
          console.error(`Failed to fetch submissions for form ${form.id}:`, error);
        }
      }

      // Sort by submission date (newest first)
      allSubmissions.sort((a, b) =>
        new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );

      return allSubmissions;
    },
    enabled: !!forms && forms.length > 0,
  });

  const submissions = submissionsData || [];
  const targetForms = formId
    ? (specificForm ? [specificForm] : (forms?.filter(f => f.id === formId) || []))
    : forms;

  // Get all unique form fields across all forms for the table headers
  const getAllFormFields = () => {
    if (!targetForms) return [];
    const allFields: Array<{ formId: number; field: FormField }> = [];

    targetForms.forEach(form => {
      if (form.formFields) {
        form.formFields.forEach(field => {
          allFields.push({ formId: form.id, field });
        });
      }
    });

    return allFields.sort((a, b) => a.field.order - b.field.order);
  };

  // Generate chart data for a specific field
  const generateFieldChartData = (fieldKey: string, field: FormField) => {
    const fieldResponses = submissions.map(sub => sub.submission_data?.[fieldKey]).filter(val => val != null);
    const responseCounts: Record<string, number> = {};

    fieldResponses.forEach(response => {
      const key = Array.isArray(response) ? response.join(', ') : String(response || 'No response');
      responseCounts[key] = (responseCounts[key] || 0) + 1;
    });

    return Object.entries(responseCounts).map(([name, value]) => ({
      name: name.length > 30 ? name.substring(0, 30) + '...' : name,
      value,
      percentage: Math.round((value / fieldResponses.length) * 100)
    }));
  };

  const COLORS = ['hsl(var(--color-primary))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  const handleViewSubmission = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setIsDetailModalOpen(true);
  };

  // Generate timeline data for charts
  const generateTimelineData = (formSubmissions: FormSubmission[]) => {
    const dateMap: Record<string, number> = {};

    formSubmissions.forEach(submission => {
      const date = new Date(submission.submitted_at).toLocaleDateString();
      dateMap[date] = (dateMap[date] || 0) + 1;
    });

    return Object.entries(dateMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, count]) => ({ date, count }));
  };

  const getFieldValue = (fieldKey: string, submissionData: Record<string, any>) => {
    return submissionData[fieldKey] || 'Not answered';
  };

  const formatFieldValue = (value: any, field?: FormField) => {
    if (!value || value === 'Not answered') return value;

    // Handle different field types
    switch (field?.field_type) {
      case 'checkbox':
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return value;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'datetime':
        return new Date(value).toLocaleString();
      default:
        return value;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <X className="w-3 h-3 mr-1" />
          Cancelled
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (formsLoading || submissionsLoading || (formId && specificFormLoading)) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (formsError || submissionsError || !forms || forms.length === 0) {
    // Error logged for debugging
    return (
      <Alert>
        <AlertDescription>
          {formsError || submissionsError ? 'Failed to load form data.' : 'No forms found for this event.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No completed submissions yet</h3>
        <p className="text-muted-foreground">
          Form submissions will appear here once guests start filling out and completing forms.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Form Responses</h2>
            <p className="text-muted-foreground">
              {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
              {!formId && forms && forms.length > 0 && ` across ${forms.length} form${forms.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const csvContent = generateCSVExport(submissions);
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `form_responses_${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              toast.success('CSV export completed successfully!');
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export All CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search responses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'list' | 'charts')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Responses List
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            Charts & Analytics
          </TabsTrigger>
        </TabsList>

        {/* List View Tab */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {submissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Respondent</TableHead>
                        {getAllFormFields().map(({ field, formId }) => (
                          <TableHead key={`${formId}-${field.id}`} className="min-w-32">
                            {field.label}
                            {field.is_required && <span className="text-red-500 ml-1">*</span>}
                          </TableHead>
                        ))}
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission, index) => {
                        const form = targetForms?.find(f => f.id === submission.form_id);
                        return (
                          <TableRow key={submission.id}>
                            <TableCell className="font-mono text-sm">
                              {submission.id}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(submission.submitted_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(submission.submitted_at).toLocaleTimeString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(submission.status)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {submission.guest?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {submission.guest?.email || ''}
                              </div>
                            </TableCell>
                            {getAllFormFields().map(({ field, formId }) => {
                              const value = submission.submission_data?.[field.field_key];
                              const displayValue = formatFieldValue(value, field);
                              return (
                                <TableCell key={`${formId}-${field.id}`} className="max-w-32">
                                  <div className="text-sm truncate" title={displayValue}>
                                    {displayValue}
                                  </div>
                                </TableCell>
                              );
                            })}
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewSubmission(submission)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No responses found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Form responses will appear here once guests start submitting forms.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Charts View Tab */}
        <TabsContent value="charts" className="space-y-6">
          {targetForms && targetForms.length > 0 && (
            <div className="grid gap-6">
              {targetForms.map(form => {
                if (!form.formFields || form.formFields.length === 0) return null;

                return (
                  <Card key={form.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="w-5 h-5" />
                        {form.name} - Response Analytics
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">{form.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {form.formFields
                          .filter(field => ['radio', 'select', 'checkbox'].includes(field.field_type))
                          .slice(0, 4) // Show top 4 fields with charts
                          .map(field => {
                            const chartData = generateFieldChartData(field.field_key, field);
                            if (chartData.length === 0) return null;

                            return (
                              <div key={field.id} className="space-y-2">
                                <h4 className="font-medium text-sm">{field.label}</h4>
                                <div className="h-64">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                      <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percentage }) => `${percentage}%`}
                                        outerRadius={60}
                                        fill="#8884d8"
                                        dataKey="value"
                                      >
                                        {chartData.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                      </Pie>
                                      <Tooltip formatter={(value, name) => [`${value} responses`, name]} />
                                    </RechartsPieChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="flex flex-wrap gap-1 text-xs">
                                  {chartData.slice(0, 3).map((item, index) => (
                                    <div key={index} className="flex items-center gap-1">
                                      <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                      />
                                      <span className="truncate max-w-20" title={item.name}>
                                        {item.name}
                                      </span>
                                    </div>
                                  ))}
                                  {chartData.length > 3 && (
                                    <span className="text-muted-foreground">+{chartData.length - 3} more</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>

                      {/* Response Timeline */}
                      <div className="mt-6">
                        <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Response Timeline
                        </h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={generateTimelineData(submissions.filter(s => s.form_id === form.id))}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="date" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="count" stroke="hsl(var(--color-primary))" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

        {/* List View Tab */}
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              {submissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">#</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Respondent</TableHead>
                        {getAllFormFields().map(({ field, formId }) => (
                          <TableHead key={`${formId}-${field.id}`} className="min-w-32">
                            {field.label}
                            {field.is_required && <span className="text-red-500 ml-1">*</span>}
                          </TableHead>
                        ))}
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((submission, index) => {
                        const form = targetForms?.find(f => f.id === submission.form_id);
                        return (
                          <TableRow key={submission.id}>
                            <TableCell className="font-mono text-sm">
                              {submission.id}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(submission.submitted_at).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(submission.submitted_at).toLocaleTimeString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(submission.status)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">
                                {submission.guest?.name || 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {submission.guest?.email || ''}
                              </div>
                            </TableCell>
                            {getAllFormFields().map(({ field, formId }) => {
                              const value = submission.submission_data?.[field.field_key];
                              const displayValue = formatFieldValue(value, field);
                              return (
                                <TableCell key={`${formId}-${field.id}`} className="max-w-32">
                                  <div className="text-sm truncate" title={displayValue}>
                                    {displayValue}
                                  </div>
                                </TableCell>
                              );
                            })}
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewSubmission(submission)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No responses found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all'
                      ? 'Try adjusting your search or filter criteria.'
                      : 'Form responses will appear here once guests start submitting forms.'
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      {/* Individual Response Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Response Details
            </DialogTitle>
            <DialogDescription>
              Individual form submission with all responses
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-6">
              {/* Response Header */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{selectedSubmission.id}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(selectedSubmission.submitted_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedSubmission.status)}
                  <Badge variant="outline">{selectedSubmission.participant_type}</Badge>
                </div>
              </div>

              {/* Respondent Information */}
              {selectedSubmission.guest && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Respondent Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Name</Label>
                        <p className="font-medium">{selectedSubmission.guest.name || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Email</Label>
                        <p className="font-medium">{selectedSubmission.guest.email || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Phone</Label>
                        <p className="font-medium">{selectedSubmission.guest.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Company</Label>
                        <p className="font-medium">{selectedSubmission.guest.company || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Form Responses */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Form Responses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      // First try to find the form in targetForms (which includes specificForm when formId is provided)
                      let form = targetForms?.find(f => f.id === selectedSubmission.form_id);

                      // If not found, try to get it from the original forms array
                      if (!form && forms) {
                        form = forms.find(f => f.id === selectedSubmission.form_id);
                      }

                      // Debug logging removed for production

                      if (!form) {
                        return <p className="text-muted-foreground">Form not found for this submission.</p>;
                      }
                      if (!form.formFields || form.formFields.length === 0) {
                        console.log('No form fields found for form:', form.id);
                        return <p className="text-muted-foreground">No form fields found for this form. Form ID: {form.id}</p>;
                      }

                      return form.formFields
                        .sort((a, b) => a.order - b.order)
                        .map((field) => {
                          const fieldValue = getFieldValue(field.field_key, selectedSubmission.submission_data);
                          const formattedValue = formatFieldValue(fieldValue, field);

                          return (
                            <div key={field.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-foreground">
                                  {field.label}
                                  {field.is_required && <span className="text-red-500 ml-1">*</span>}
                                </Label>

                                <div className="bg-muted/50 rounded-md p-3 min-h-[2.5rem] flex items-center">
                                  <div className="text-sm break-words">
                                    {formattedValue === 'Not answered' ? (
                                      <span className="text-muted-foreground italic">{formattedValue}</span>
                                    ) : (
                                      <span className="text-foreground">{formattedValue}</span>
                                    )}
                                  </div>
                                </div>

                                {field.fieldOptions && field.fieldOptions.length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    Options: {field.fieldOptions.map(opt => opt.option_label).join(', ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                    })()}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to generate CSV export
const generateCSVExport = (submissions: FormSubmission[]): string => {
  if (submissions.length === 0) return '';

  // Collect all unique field keys across all submissions
  const allFieldKeys = new Set<string>();
  submissions.forEach(submission => {
    Object.keys(submission.submission_data || {}).forEach(key => {
      allFieldKeys.add(key);
    });
  });

  // Define CSV headers
  const headers = [
    'Response ID',
    'Form ID',
    'Submitted At',
    'Status',
    'Participant Type',
    'Guest Name',
    'Guest Email',
    'Guest Phone',
    'Guest Company',
    ...Array.from(allFieldKeys).sort()
  ];

  // Create CSV rows
  const rows = [headers.join(',')];

  submissions.forEach(submission => {
    const row = [
      submission.id,
      submission.form_id,
      `"${new Date(submission.submitted_at).toLocaleString()}"`,
      submission.status,
      submission.participant_type,
      `"${submission.guest?.name || ''}"`,
      `"${submission.guest?.email || ''}"`,
      `"${submission.guest?.phone || ''}"`,
      `"${submission.guest?.company || ''}"`,
      ...Array.from(allFieldKeys).sort().map(key => {
        const value = submission.submission_data?.[key] || '';
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escapedValue = typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
          ? `"${value.replace(/"/g, '""')}"`
          : `"${value}"`;
        return escapedValue;
      })
    ];

    rows.push(row.join(','));
  });

  return rows.join('\n');
};

export default GoogleFormsStyleAnalytics;
