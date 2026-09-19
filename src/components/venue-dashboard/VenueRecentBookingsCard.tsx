import { Link } from 'react-router-dom'
import { CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { VenueBooking } from '@/lib/api/venues'

const statusStyles: Record<string, string> = {
  pending: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  confirmed: 'border-primary/30 bg-primary/10 text-primary',
  cancelled: 'border-destructive/40 bg-destructive/10 text-destructive',
  completed: 'border-border bg-muted text-muted-foreground',
}

const sourceLabels: Record<string, string> = {
  manual: 'Manual',
  event_request: 'Event',
  public_request: 'Public',
}

function formatWhen(iso?: string) {
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

export function VenueRecentBookingsCard({
  bookings = [],
  className,
}: {
  bookings?: VenueBooking[]
  className?: string
}) {
  return (
    <Card className={cn('rounded-2xl border-border shadow-sm md:col-span-2 dark:ring-0', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Recent bookings</CardTitle>
          <CardDescription>Latest requests and holds</CardDescription>
        </div>
        <Link to="/dashboard/venue/bookings" className="text-sm font-semibold text-primary hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <CalendarClock className="size-6 text-muted-foreground" />
            </div>
            <p className="font-semibold">No bookings yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              When organizers or guests request your venue, they show up here.
            </p>
            <Link to="/dashboard/venue/bookings" className="mt-1 text-sm font-semibold text-primary hover:underline">
              Create a booking
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {bookings.map((b) => (
              <li key={b.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {b.title || b.contact_name || b.event?.name || `Booking #${b.id}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.space?.name || 'Venue'} · {formatWhen(b.starts_at)}
                    {b.source ? ` · ${sourceLabels[b.source] || b.source}` : ''}
                  </p>
                </div>
                <Badge variant="outline" className={cn('w-fit shrink-0 rounded-full capitalize', statusStyles[b.status])}>
                  {b.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
