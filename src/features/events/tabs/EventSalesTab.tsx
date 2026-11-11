import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart3,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard
          label="Total revenue"
          value={`ETB ${analytics.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          meta={`${analytics.total_tickets_sold} tickets`}
        />
        <MetricCard
          label="Checked in"
          value={String(analytics.tickets_by_status.used)}
          meta={`${analytics.validation_rate.toFixed(1)}% attendance`}
        />
        <MetricCard
          label="Tickets sold"
          value={String(analytics.total_tickets_sold)}
          meta={`${analytics.tickets_by_status.confirmed} confirmed, ${analytics.tickets_by_status.pending} pending`}
        />
        <MetricCard
          label="Avg. price"
          value={`ETB ${analytics.average_ticket_price.toFixed(2)}`}
          meta="Per ticket"
        />
        <MetricCard
          label="Refund rate"
          value={`${analytics.total_tickets_sold > 0 ? ((analytics.tickets_by_status.refunded / analytics.total_tickets_sold) * 100).toFixed(1) : 0}%`}
          meta={`${analytics.tickets_by_status.refunded} refunded`}
        />
        <MetricCard
          label="Cancellation rate"
          value={`${analytics.total_tickets_sold > 0 ? ((analytics.tickets_by_status.cancelled / analytics.total_tickets_sold) * 100).toFixed(1) : 0}%`}
          meta={`${analytics.tickets_by_status.cancelled} cancelled`}
        />
        <MetricCard
          label="Confirmed rate"
          value={`${analytics.total_tickets_sold > 0 ? ((analytics.tickets_by_status.confirmed / analytics.total_tickets_sold) * 100).toFixed(1) : 0}%`}
          meta={`${analytics.tickets_by_status.confirmed} confirmed`}
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
}: {
  label: string
  value: string
  meta: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
    </div>
  )
}
