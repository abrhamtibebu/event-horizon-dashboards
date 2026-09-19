import { Activity } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { VenueDashboardActivity } from '@/lib/api/venues'

function formatWhen(iso?: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function VenueRecentActivityCard({
  items = [],
  className,
}: {
  items?: VenueDashboardActivity[]
  className?: string
}) {
  return (
    <Card className={cn('rounded-2xl border-border shadow-sm dark:ring-0', className)}>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Bookings and blocked dates</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <Activity className="size-6 text-muted-foreground" />
            </div>
            <p className="font-semibold">Quiet so far</p>
            <p className="max-w-xs text-sm text-muted-foreground">Booking and blackout updates will list here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item, idx) => (
              <li key={`${item.type}-${item.time}-${idx}`} className="flex gap-3">
                <span
                  className={cn(
                    'mt-1 size-2 shrink-0 rounded-full',
                    item.type === 'blackout' ? 'bg-amber-500' : 'bg-primary'
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{formatWhen(item.time)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
