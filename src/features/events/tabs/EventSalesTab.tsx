import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  CheckCircle,
  DollarSign,
  Percent,
  RefreshCw,
  Share2,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { SalesOverviewChart } from '@/components/tickets/analytics/SalesOverviewChart'
import { RevenueTrendChart } from '@/components/tickets/analytics/RevenueTrendChart'
import { TicketTypeBreakdownChart } from '@/components/tickets/analytics/TicketTypeBreakdownChart'
import { ExportReportButton } from '@/components/tickets/analytics/ExportReportButton'
import { getTicketAnalytics } from '@/lib/api/tickets'

interface EventSalesTabProps {
  eventId: number
  showHeader?: boolean
  showExportButton?: boolean
  onOpenReferrals?: () => void
}

export function EventSalesTab({
  eventId,
  showHeader = true,
  showExportButton = true,
  onOpenReferrals,
}: EventSalesTabProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['ticket-analytics', eventId],
    queryFn: () => getTicketAnalytics(eventId),
    enabled: !!eventId,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <Spinner size="lg" variant="primary" text="Loading ticket sales..." />
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-semibold">No sales data available</p>
          <p className="text-sm text-muted-foreground">
            Ticket sales analytics will appear here once purchases start.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Ticket Sales</h2>
            <p className="text-sm text-muted-foreground">
              Revenue, conversion, and attendance trends for this event.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={(value) => setTimeRange(value as typeof timeRange)}>
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
            {showExportButton ? <ExportReportButton eventId={eventId} /> : null}
          </div>
        </div>
      )}

      {onOpenReferrals && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Share2 className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">Referral-attributed sales</p>
                <p className="text-sm text-muted-foreground">
                  Track vendor referrals, invitation codes, and buyer discounts from the Referrals tab.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onOpenReferrals}>
              Open Referrals
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="border-primary/30 bg-primary/10 dark:border-primary/20 dark:bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-primary">
              <DollarSign className="mr-2 h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              ETB {analytics.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-primary">
                Avg. ETB {analytics.average_ticket_price.toFixed(2)}
              </span>
              <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                {analytics.total_tickets_sold} tickets
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/10 dark:border-blue-500/20 dark:bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
              <Users className="mr-2 h-4 w-4" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {analytics.tickets_by_status.used}
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-600 dark:text-blue-400">Attendance Rate</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {analytics.validation_rate.toFixed(1)}%
                </span>
              </div>
              <Progress value={analytics.validation_rate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/30 bg-primary/10">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm font-medium text-primary">
              <TrendingUp className="mr-2 h-4 w-4" />
              Sales Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{analytics.total_tickets_sold}</div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="text-primary">Confirmed</div>
                <div className="font-semibold text-primary">{analytics.tickets_by_status.confirmed}</div>
              </div>
              <div className="text-right text-sm">
                <div className="text-warning">Pending</div>
                <div className="font-semibold text-warning">{analytics.tickets_by_status.pending}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Refund Rate"
          value={`${analytics.total_tickets_sold > 0 ? ((analytics.tickets_by_status.refunded / analytics.total_tickets_sold) * 100).toFixed(1) : 0}%`}
          meta={`${analytics.tickets_by_status.refunded} refunded`}
          icon={<RefreshCw className="h-8 w-8 text-warning" />}
        />
        <MetricCard
          label="Cancellation Rate"
          value={`${analytics.total_tickets_sold > 0 ? ((analytics.tickets_by_status.cancelled / analytics.total_tickets_sold) * 100).toFixed(1) : 0}%`}
          meta={`${analytics.tickets_by_status.cancelled} cancelled`}
          icon={<XCircle className="h-8 w-8 text-error" />}
        />
        <MetricCard
          label="Success Rate"
          value={`${analytics.total_tickets_sold > 0 ? ((analytics.tickets_by_status.confirmed / analytics.total_tickets_sold) * 100).toFixed(1) : 0}%`}
          meta={`${analytics.tickets_by_status.confirmed} confirmed`}
          icon={<CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />}
        />
        <MetricCard
          label="Avg. Price"
          value={`ETB ${analytics.average_ticket_price.toFixed(0)}`}
          meta="Per ticket sold"
          icon={<Percent className="h-8 w-8 text-info" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SalesOverviewChart data={analytics.sales_by_date} />
        <RevenueTrendChart data={analytics.sales_by_date} />
      </div>

      <TicketTypeBreakdownChart data={analytics.tickets_by_type} />
    </div>
  )
}

function MetricCard({
  label,
  value,
  meta,
  icon,
}: {
  label: string
  value: string
  meta: string
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
          {icon}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{meta}</p>
      </CardContent>
    </Card>
  )
}
