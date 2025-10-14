import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Target,
  Award,
  Zap,
} from 'lucide-react';
import { analyticsApi, VendorAnalytics, ReportFilters, ExportOptions } from '@/lib/analyticsApi';

interface VendorAnalyticsProps {
  className?: string;
}

export function VendorAnalytics({ className }: VendorAnalyticsProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    date_to: new Date().toISOString().split('T')[0],
  });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    include_charts: true,
    include_details: true,
  });

  // Fetch analytics data
  const { data: analytics, isLoading, error, refetch } = useQuery({
    queryKey: ['vendor-analytics', filters],
    queryFn: () => analyticsApi.getVendorAnalytics(filters),
    retry: 1,
    staleTime: 30000,
  });

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async (reportType: 'performance' | 'financial' | 'tasks' | 'comprehensive') => {
    try {
      const blob = await analyticsApi.exportReport(reportType, filters, exportOptions);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendor-${reportType}-report.${exportOptions.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Analytics</h3>
        <p className="text-gray-600 mb-4">There was an error loading the analytics data. Please try again.</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  const data = analytics || {
    total_vendors: 0,
    active_vendors: 0,
    pending_approval: 0,
    suspended_vendors: 0,
    total_quotations: 0,
    pending_quotations: 0,
    approved_quotations: 0,
    rejected_quotations: 0,
    total_payments: 0,
    pending_payments: 0,
    paid_payments: 0,
    total_tasks: 0,
    pending_tasks: 0,
    completed_tasks: 0,
    overdue_tasks: 0,
    total_revenue: 0,
    pending_revenue: 0,
    paid_revenue: 0,
    average_quotation_value: 0,
    average_payment_time: 0,
    top_performing_vendors: [],
    vendor_performance_by_category: [],
    monthly_trends: [],
    task_completion_rates: {
      overall: 0,
      by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
      by_type: { deliverable: 0, milestone: 0, review: 0, payment: 0, other: 0 }
    },
    payment_analytics: {
      by_method: { bank_transfer: 0, cash: 0, check: 0, digital_wallet: 0, other: 0 },
      by_status: { pending: 0, paid: 0, partial: 0, overdue: 0, cancelled: 0 },
      average_processing_time: 0
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Analytics & Reports</h2>
          <p className="text-gray-600">Comprehensive insights into vendor performance and business metrics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowExportDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date-from">From Date</Label>
              <Input
                id="date-from"
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to">To Date</Label>
              <Input
                id="date-to"
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status || 'all'} onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={filters.category || 'all'} onValueChange={(value) => handleFilterChange('category', value === 'all' ? undefined : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="catering">Catering</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="audio_visual">Audio/Visual</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_vendors}</div>
            <p className="text-xs text-muted-foreground">
              {data.active_vendors} active, {data.pending_approval} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.total_revenue)}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(data.paid_revenue)} paid, {formatCurrency(data.pending_revenue)} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quotations</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_quotations}</div>
            <p className="text-xs text-muted-foreground">
              {data.approved_quotations} approved, {data.pending_quotations} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.task_completion_rates.overall)}</div>
            <p className="text-xs text-muted-foreground">
              {data.completed_tasks} completed, {data.overdue_tasks} overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing Vendors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Performing Vendors
                </CardTitle>
                <CardDescription>Vendors with highest performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.top_performing_vendors.slice(0, 5).map((vendor, index) => (
                    <div key={vendor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{vendor.name}</div>
                          <div className="text-sm text-gray-500">
                            {vendor.total_quotations} quotations • {vendor.total_payments} payments
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(vendor.total_revenue)}</div>
                        <div className="text-sm text-gray-500">{formatPercentage(vendor.completion_rate)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Performance by Category
                </CardTitle>
                <CardDescription>Vendor performance breakdown by service category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.vendor_performance_by_category.map((category) => (
                    <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{category.category}</div>
                        <div className="text-sm text-gray-500">
                          {category.vendor_count} vendors • {category.total_quotations} quotations
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatCurrency(category.total_revenue)}</div>
                        <div className="text-sm text-gray-500">⭐ {category.average_rating}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Monthly Trends
              </CardTitle>
              <CardDescription>Performance trends over the last 4 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead>Vendors Added</TableHead>
                      <TableHead>Quotations</TableHead>
                      <TableHead>Payments</TableHead>
                      <TableHead>Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.monthly_trends.map((trend) => (
                      <TableRow key={trend.month}>
                        <TableCell className="font-medium">
                          {new Date(trend.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </TableCell>
                        <TableCell>{trend.vendors_added}</TableCell>
                        <TableCell>{trend.quotations_created}</TableCell>
                        <TableCell>{trend.payments_processed}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(trend.revenue_generated)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Active</span>
                    </div>
                    <span className="font-semibold">{data.active_vendors}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>Pending Approval</span>
                    </div>
                    <span className="font-semibold">{data.pending_approval}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Suspended</span>
                    </div>
                    <span className="font-semibold">{data.suspended_vendors}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quotation Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Approved</span>
                    </div>
                    <span className="font-semibold">{data.approved_quotations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span>Pending</span>
                    </div>
                    <span className="font-semibold">{data.pending_quotations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span>Rejected</span>
                    </div>
                    <span className="font-semibold">{data.rejected_quotations}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.payment_analytics.by_method).map(([method, count]) => (
                    <div key={method} className="flex items-center justify-between">
                      <span className="capitalize">{method.replace('_', ' ')}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.payment_analytics.by_status).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="capitalize">{status}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{formatCurrency(data.paid_revenue)}</div>
                  <div className="text-sm text-gray-500">Paid Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{formatCurrency(data.pending_revenue)}</div>
                  <div className="text-sm text-gray-500">Pending Revenue</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{data.payment_analytics.average_processing_time} days</div>
                  <div className="text-sm text-gray-500">Avg Processing Time</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Completion by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.task_completion_rates.by_priority).map(([priority, rate]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={
                            priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {priority}
                        </Badge>
                      </div>
                      <span className="font-semibold">{formatPercentage(rate)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Task Completion by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(data.task_completion_rates.by_type).map(([type, rate]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="capitalize">{type}</span>
                      <span className="font-semibold">{formatPercentage(rate)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Report</DialogTitle>
            <DialogDescription>
              Choose the report type and format for export
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={() => handleExport('performance')} variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Performance Report
              </Button>
              <Button onClick={() => handleExport('financial')} variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Financial Report
              </Button>
              <Button onClick={() => handleExport('tasks')} variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Task Report
              </Button>
              <Button onClick={() => handleExport('comprehensive')} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Comprehensive Report
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Export Format</Label>
              <Select value={exportOptions.format} onValueChange={(value: 'pdf' | 'excel' | 'csv') => setExportOptions(prev => ({ ...prev, format: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}














