import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Delta, DeltaIcon, DeltaValue } from '@/components/delta'
import type { VenueDashboardData } from '@/lib/api/venues'

type Props = {
  metrics: VenueDashboardData['keyMetrics']
}

export function VenueDashboardStats({ metrics }: Props) {
  const stats = [
    {
      label: 'Pending requests',
      value: String(metrics.pendingRequests ?? 0),
      delta: metrics.pendingDelta ?? 0,
      footnote: 'vs prior period',
      lowerIsBetter: true,
    },
    {
      label: 'Upcoming bookings',
      value: String(metrics.upcomingBookings ?? 0),
      delta: metrics.upcomingDelta ?? 0,
      footnote: 'on the calendar',
      lowerIsBetter: false,
    },
    {
      label: 'Confirmed this week',
      value: String(metrics.confirmedThisWeek ?? 0),
      delta: metrics.confirmedDelta ?? 0,
      footnote: 'next 7 days',
      lowerIsBetter: false,
    },
    {
      label: 'Spaces',
      value: String(metrics.spaces ?? 0),
      delta: 0,
      footnote: 'halls & rooms',
      lowerIsBetter: false,
    },
  ]

  return (
    <>
      {stats.map((s) => (
        <Card
          key={s.label}
          className="rounded-2xl border-border shadow-sm dark:ring-0"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {s.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-3xl font-bold tabular-nums text-foreground">{s.value}</p>
            <div className="flex items-center gap-1 text-xs">
              {s.delta !== 0 ? (
                <Delta value={s.lowerIsBetter ? -s.delta : s.delta}>
                  <DeltaIcon />
                  <DeltaValue />
                </Delta>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
              <span className="text-muted-foreground">{s.footnote}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  )
}
