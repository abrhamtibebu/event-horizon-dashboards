import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  Search,
  Filter,
  Eye,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  X,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

import { formSubmissionApi } from '@/lib/api/forms';
import type { FormSubmission, ExportOptions } from '@/types/forms';
import { toast } from 'sonner';

interface FormSubmissionsViewerProps {
  formId: number;
  onClose: () => void;
}

export const FormSubmissionsViewer: React.FC<FormSubmissionsViewerProps> = ({
  formId,
  onClose
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [participantTypeFilter, setParticipantTypeFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch submissions
  const {
    data: submissionsData,
    isLoading,
    error
  } = useQuery({
    queryKey: [
      'form-submissions',
      formId,
      currentPage,
      perPage,
      searchTerm,
      statusFilter,
      participantTypeFilter
    ],
    queryFn: () => formSubmissionApi.getSubmissions(formId, {
      page: currentPage,
      per_page: perPage,
      search: searchTerm || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
      participant_type: participantTypeFilter === 'all' ? undefined : participantTypeFilter,
    }),
  });

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      // For now, we'll implement CSV export by fetching all submissions and converting to CSV
      // Since the backend export endpoint doesn't exist, we'll do client-side export
      if (format !== 'csv') {
        toast.error('Only CSV export is currently supported. Excel and PDF exports will be available soon.');
        setIsExporting(false);
        return;
      }

      // Fetch all submissions for export (we'll get them in batches if needed)
      const allSubmissions: any[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await formSubmissionApi.getSubmissions(formId, {
          page: currentPage,
          per_page: 1000, // Large batch to minimize requests
          status: statusFilter === 'all' ? undefined : statusFilter,
          participant_type: participantTypeFilter === 'all' ? undefined : participantTypeFilter,
          search: searchTerm || undefined,
        });

        allSubmissions.push(...response.data);

        if (currentPage >= response.last_page) {
          hasMorePages = false;
        } else {
          currentPage++;
        }
      }

      // Convert submissions to CSV
      const csvContent = convertSubmissionsToCSV(allSubmissions);

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `form_submissions_${formId}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`CSV export completed successfully! ${allSubmissions.length} submissions exported.`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const convertSubmissionsToCSV = (submissions: any[]): string => {
    if (submissions.length === 0) return '';

    // Define CSV headers
    const headers = [
      'Submission ID',
      'Submitted At',
      'Status',
      'Participant Type',
      'Guest Name',
      'Guest Email',
      'Guest Phone',
      'Guest Company',
      'Guest Job Title',
      'Guest Gender',
      'Guest Country'
    ];

    // Add dynamic headers for form fields
    const formFields = new Set<string>();
    submissions.forEach(submission => {
      Object.keys(submission.submission_data || {}).forEach(key => {
        formFields.add(key);
      });
    });

    const dynamicHeaders = Array.from(formFields).sort();
    headers.push(...dynamicHeaders);

    // Create CSV rows
    const rows = [headers.join(',')];

    submissions.forEach(submission => {
      const row = [
        submission.id,
        `"${new Date(submission.submitted_at).toLocaleString()}"`,
        submission.status,
        submission.participant_type,
        `"${submission.guest?.name || ''}"`,
        `"${submission.guest?.email || ''}"`,
        `"${submission.guest?.phone || ''}"`,
        `"${submission.guest?.company || ''}"`,
        `"${submission.guest?.jobtitle || ''}"`,
        `"${submission.guest?.gender || ''}"`,
        `"${submission.guest?.country || ''}"`
      ];

      // Add form field values
      dynamicHeaders.forEach(header => {
        const value = submission.submission_data?.[header] || '';
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const escapedValue = typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
          ? `"${value.replace(/"/g, '""')}"`
          : `"${value}"`;
        row.push(escapedValue);
      });

      rows.push(row.join(','));
    });

    return rows.join('\n');
  };

  const formatSubmissionData = (data: any): string => {
    if (!data) return 'N/A';

    if (typeof data === 'object') {
      return Object.entries(data)
        .map(([key, value]) => `${key}: ${value || 'N/A'}`)
        .join('\n');
    }

    return String(data);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load submissions. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const submissions = submissionsData?.data || [];
  const pagination = submissionsData;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Forms
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <h2 className="text-lg font-semibold">Form Submissions</h2>
            <p className="text-sm text-muted-foreground">
              {pagination?.total || 0} total submissions
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b bg-muted/20">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search submissions..."
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

          <Select value={participantTypeFilter} onValueChange={setParticipantTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="attendee">Attendee</SelectItem>
              <SelectItem value="exhibitor">Exhibitor</SelectItem>
              <SelectItem value="speaker">Speaker</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="sponsor">Sponsor</SelectItem>
            </SelectContent>
          </Select>

          <Select value={perPage.toString()} onValueChange={(value) => setPerPage(Number(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="25">25 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
              <SelectItem value="100">100 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="flex-1 overflow-auto">
        {submissions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Submission ID</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-mono text-sm">
                    #{submission.id}
                  </TableCell>
                  <TableCell>
                    {new Date(submission.submitted_at).toLocaleDateString()}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      {new Date(submission.submitted_at).toLocaleTimeString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    {submission.guest?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {submission.guest?.email || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(submission.status)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {submission.participant_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedSubmission(submission)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Submission Details</DialogTitle>
                          <DialogDescription>
                            Detailed view of form submission with all responses and guest information.
                          </DialogDescription>
                        </DialogHeader>
                        {selectedSubmission && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Submission ID</Label>
                                <p className="text-sm text-muted-foreground">#{selectedSubmission.id}</p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <div className="mt-1">{getStatusBadge(selectedSubmission.status)}</div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Submitted At</Label>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(selectedSubmission.submitted_at).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Participant Type</Label>
                                <Badge variant="outline" className="capitalize mt-1">
                                  {selectedSubmission.participant_type}
                                </Badge>
                              </div>
                            </div>

                            <Separator />

                            {selectedSubmission.guest && (
                              <>
                                <div>
                                  <h4 className="font-medium mb-3 flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Guest Information
                                  </h4>
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Name</Label>
                                      <p>{selectedSubmission.guest.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Email</Label>
                                      <p>{selectedSubmission.guest.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Phone</Label>
                                      <p>{selectedSubmission.guest.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Company</Label>
                                      <p>{selectedSubmission.guest.company || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>
                                <Separator />
                              </>
                            )}

                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Form Responses
                              </h4>
                              <div className="space-y-3 max-h-96 overflow-y-auto">
                                {Object.entries(selectedSubmission.submission_data).map(([key, value]) => (
                                  <div key={key} className="flex justify-between items-start p-3 bg-muted/50 rounded">
                                    <span className="font-medium text-sm capitalize">
                                      {key.replace(/_/g, ' ')}:
                                    </span>
                                    <span className="text-sm text-right max-w-xs break-words">
                                      {formatSubmissionData(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No submissions found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter || participantTypeFilter
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No form submissions have been received yet.'
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
            {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
            {pagination.total} submissions
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={pagination.current_page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
              disabled={pagination.current_page === pagination.last_page}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormSubmissionsViewer;
