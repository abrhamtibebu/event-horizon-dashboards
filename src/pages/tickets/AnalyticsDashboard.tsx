import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { SalesOverviewChart } from '@/components/tickets/analytics/SalesOverviewChart';
import { RevenueTrendChart } from '@/components/tickets/analytics/RevenueTrendChart';
import { TicketTypeBreakdownChart } from '@/components/tickets/analytics/TicketTypeBreakdownChart';
import { ExportReportButton } from '@/components/tickets/analytics/ExportReportButton';
import { getTicketAnalytics } from '@/lib/api/tickets';
import { TrendingUp, DollarSign, Ticket, BarChart3, Download, Users, CheckCircle, XCircle, RefreshCw, TrendingDown, Percent } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import api from '@/lib/api';

export default function AnalyticsDashboard() {
  const { eventId: paramEventId } = useParams();
  const [selectedEventId, setSelectedEventId] = useState<number>(paramEventId ? Number(paramEventId) : 0);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  // Fetch events for dropdown
  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.get('/events');
      return response.data;
    },
  });

  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['ticket-analytics', selectedEventId],
    queryFn: () => getTicketAnalytics(selectedEventId),
    enabled: !!selectedEventId,
  });

  if (!selectedEventId && events?.data?.length > 0) {
    setSelectedEventId(events.data[0].id);
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-brand-gradient bg-clip-text text-transparent">
            Event Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive revenue, sales performance, and attendance insights
          </p>
        </div>
        {selectedEventId && analytics && (
          <ExportReportButton eventId={selectedEventId} />
        )}
      </div>

      {/* Event Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Select
            value={selectedEventId?.toString() || ''}
            onValueChange={(value) => setSelectedEventId(Number(value))}
          >
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events?.data?.map((event: any) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" variant="primary" text="Loading analytics..." />
        </div>
      ) : !analytics ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-semibold">No Event Selected</p>
            <p className="text-sm text-muted-foreground">Select an event to view analytics</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Key Revenue Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Revenue Card */}
            <Card className="bg-success/10 border-success/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-success">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">
                  ETB {analytics.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-success">Avg. ETB {analytics.average_ticket_price.toFixed(2)}</span>
                  <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
                    {analytics.total_tickets_sold} tickets
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Attendance Metrics */}
            <Card className="bg-info/10 border-info/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-info">
                  <Users className="w-4 h-4 mr-2" />
                  Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-info">
                  {analytics.tickets_by_status.used}
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-info">Attendance Rate</span>
                    <span className="font-semibold text-info">{analytics.validation_rate.toFixed(1)}%</span>
                  </div>
                  <Progress value={analytics.validation_rate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Sales Performance */}
            <Card className="bg-primary/10 border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center text-primary">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Sales Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {analytics.total_tickets_sold}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-sm">
                    <div className="text-primary">Confirmed</div>
                    <div className="font-semibold text-primary">{analytics.tickets_by_status.confirmed}</div>
                  </div>
                  <div className="text-sm text-right">
                    <div className="text-warning">Pending</div>
                    <div className="font-semibold text-warning">{analytics.tickets_by_status.pending}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Refund Rate</p>
                    <p className="text-2xl font-bold mt-1">
                      {analytics.total_tickets_sold > 0 
                        ? ((analytics.tickets_by_status.refunded / analytics.total_tickets_sold) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-warning" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {analytics.tickets_by_status.refunded} refunded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cancellation Rate</p>
                    <p className="text-2xl font-bold mt-1">
                      {analytics.total_tickets_sold > 0 
                        ? ((analytics.tickets_by_status.cancelled / analytics.total_tickets_sold) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-error" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {analytics.tickets_by_status.cancelled} cancelled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold mt-1 text-success">
                      {analytics.total_tickets_sold > 0 
                        ? ((analytics.tickets_by_status.confirmed / analytics.total_tickets_sold) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {analytics.tickets_by_status.confirmed} confirmed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Price</p>
                    <p className="text-2xl font-bold mt-1">
                      ETB {analytics.average_ticket_price.toFixed(0)}
                    </p>
                  </div>
                  <Percent className="w-8 h-8 text-info" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Per ticket sold
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown Section */}
            <Card className="border-2 border-success/30">
            <CardHeader>
              <CardTitle className="flex items-center text-success">
                <DollarSign className="w-5 h-5 mr-2" />
                Revenue Breakdown by Ticket Type
              </CardTitle>
              <CardDescription>Detailed revenue analysis across different ticket categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.tickets_by_type.map((type: any, index: number) => {
                  const percentageOfTotal = analytics.total_revenue > 0 
                    ? (type.revenue / analytics.total_revenue) * 100 
                    : 0;
                  const soldPercentage = type.quantity > 0 
                    ? (type.tickets_sold / type.quantity) * 100 
                    : 0;
                  
                  return (
                    <div key={type.ticket_type_id} className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-gradient-to-r from-white to-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-lg">{type.ticket_type_name}</h4>
                            <span className="text-2xl font-bold text-success">
                              ETB {type.revenue.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {percentageOfTotal.toFixed(1)}% of total revenue
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Tickets Sold</p>
                          <p className="text-lg font-semibold">{type.tickets_sold}{type.quantity ? ` / ${type.quantity}` : ''}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Price per Ticket</p>
                          <p className="text-lg font-semibold">
                            ETB {type.tickets_sold > 0 ? (type.revenue / type.tickets_sold).toFixed(2) : '0.00'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Remaining</p>
                          <p className="text-lg font-semibold">{type.available !== null ? type.available : 'Unlimited'}</p>
                        </div>
                      </div>
                      
                      {type.quantity > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Sales Progress</span>
                            <span>{soldPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={soldPercentage} className="h-2" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Overview Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Daily ticket sales over time</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <SalesOverviewChart data={analytics.sales_by_date} />
              </CardContent>
            </Card>

            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Cumulative revenue growth</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <RevenueTrendChart data={analytics.sales_by_date} />
              </CardContent>
            </Card>
          </div>

          {/* Ticket Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Type Distribution</CardTitle>
              <CardDescription>Visual breakdown of ticket sales by type</CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <TicketTypeBreakdownChart data={analytics.tickets_by_type} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

