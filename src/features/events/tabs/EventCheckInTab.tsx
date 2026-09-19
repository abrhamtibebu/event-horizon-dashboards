import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, ScanLine, Ticket, UserCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Spinner } from '@/components/ui/spinner'
import { getEventValidationStats } from '@/lib/api/tickets'

interface EventCheckInTabProps {
  eventId: number
}

export function EventCheckInTab({ eventId }: EventCheckInTabProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['event-validation-stats', eventId],
    queryFn: () => getEventValidationStats(eventId),
    enabled: !!eventId,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Spinner size="lg" variant="primary" text="Loading check-in summary..." />
      </div>
    )
  }

  const stats = data ?? {
    total_tickets: 0,
    validated_tickets: 0,
    pending_tickets: 0,
    confirmed_tickets: 0,
    refunded_tickets: 0,
    validation_rate: 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Check-in</h2>
          <p className="text-sm text-muted-foreground">
            Monitor ticket redemption and send ushers straight to the scan flow.
          </p>
        </div>
        <Button asChild className="h-11 rounded-xl px-5">
          <Link to="/dashboard/usher/redemption">
            Open scanner
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Tickets sold" value={stats.total_tickets} icon={<Ticket className="h-5 w-5 text-primary" />} />
        <StatCard title="Checked in" value={stats.validated_tickets} icon={<UserCheck className="h-5 w-5 text-green-600" />} />
        <StatCard title="Pending entry" value={stats.pending_tickets} icon={<ScanLine className="h-5 w-5 text-warning" />} />
        <StatCard title="Confirmed" value={stats.confirmed_tickets} icon={<CheckCircle2 className="h-5 w-5 text-info" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Redemption progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Validation rate</p>
              <p className="text-3xl font-bold text-foreground">
                {Number(stats.validation_rate || 0).toFixed(1)}%
              </p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>{stats.validated_tickets} scanned</p>
              <p>{stats.pending_tickets} waiting</p>
            </div>
          </div>
          <Progress value={Number(stats.validation_rate || 0)} className="h-2.5" />
          <div className="grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              Refunds removed from entry: <span className="font-semibold text-foreground">{stats.refunded_tickets}</span>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-4">
              Active confirmations: <span className="font-semibold text-foreground">{stats.confirmed_tickets}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: number
  icon: React.ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
        </div>
        <div className="rounded-xl bg-muted/40 p-3">{icon}</div>
      </CardContent>
    </Card>
  )
}
