import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, isSameDay } from 'date-fns'
import { Building2, CalendarDays, Inbox, LayoutGrid, MapPin, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { MetricCard } from '@/components/MetricCard'
import { VenueDashboardGrid } from '@/components/venue-dashboard/VenueDashboardGrid'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { VenueStatusBadge } from '@/components/venue/VenueStatusBadge'
import { bookingSourceLabel, bookingTitle } from '@/components/venue/bookingLabels'
import { venueApi, type VenueBooking, type VenueDashboardData } from '@/lib/api/venues'
import { cn } from '@/lib/utils'

function trend(delta?: number, lowerIsBetter = false) {
  if (!delta) return undefined
  const good = lowerIsBetter ? delta < 0 : delta > 0
  return { value: Math.abs(delta), isPositive: good }
}

export default function VenueDashboard() {
  const [data, setData] = useState<VenueDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    venueApi
      .dashboard()
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load venue dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  const todayBookings = useMemo(() => {
    const today = new Date()
    return (data?.upcomingBookings || []).filter((booking) => isSameDay(new Date(booking.starts_at), today))
  }, [data])

  const grouped = useMemo(() => {
    const map = new Map<string, VenueBooking[]>()
    todayBookings.forEach((booking) => {
      const key = booking.space?.name || 'Space'
      map.set(key, [...(map.get(key) || []), booking])
    })
    return Array.from(map.entries())
  }, [todayBookings])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner text="Loading venue dashboard..." />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="font-semibold text-foreground">{error || 'Dashboard unavailable'}</p>
        <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    )
  }

  if (data.needs_setup) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary">
          <Building2 className="size-7 text-[hsl(var(--color-rich-black))]" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Set up your venue</h1>
        <p className="text-muted-foreground">
          Create your venue profile to unlock bookings, spaces, and this dashboard.
        </p>
        <Button asChild className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg">
          <Link to="/dashboard/venue/setup">Get started</Link>
        </Button>
      </div>
    )
  }

  const venueName = data.venue?.name || 'Your venue'
  const location = data.venue?.city || data.venue?.formatted_address
  const metrics = data.keyMetrics

  return (
    <div className="flex flex-col gap-8">
      <VenuePageHeader
        icon={Building2}
        title={venueName}
        subtitle={
          location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {location}
            </span>
          ) : (
            'Today at your venue'
          )
        }
        actions={
          <Button asChild className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg">
            <Link to="/dashboard/venue/inbox">
              <Inbox className="mr-2 size-4" />
              Inbox
            </Link>
          </Button>
        }
      />

      <Link
        to="/dashboard/venue/inbox"
        className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition-colors hover:border-primary/40"
      >
        <div>
          <p className="text-sm text-muted-foreground">Pending requests</p>
          <p className="text-3xl font-bold tabular-nums">{metrics.pendingRequests ?? 0}</p>
        </div>
        <span className="text-sm font-semibold text-primary">Review inbox</span>
      </Link>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Today</h2>
            <Link to="/dashboard/venue/calendar" className="text-sm font-semibold text-primary hover:underline">
              Open calendar
            </Link>
          </div>
          {grouped.length === 0 ? (
            <VenueEmptyState
              icon={CalendarDays}
              title="Nothing on today"
              description="Confirmed and pending bookings that start today will show here."
              action={
                <Button asChild variant="outline">
                  <Link to="/dashboard/venue/calendar">View calendar</Link>
                </Button>
              }
            />
          ) : (
            <div className="space-y-5">
              {grouped.map(([space, bookings]) => (
                <div key={space}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{space}</p>
                  <ul className="space-y-2">
                    {bookings.map((booking) => (
                      <li key={booking.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{bookingTitle(booking)}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(booking.starts_at), 'HH:mm')} – {format(new Date(booking.ends_at), 'HH:mm')}
                            {' · '}
                            {bookingSourceLabel(booking.source)}
                          </p>
                        </div>
                        <VenueStatusBadge status={booking.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Halls</h2>
            <Link to="/dashboard/venue/spaces" className="text-sm font-semibold text-primary hover:underline">
              Manage
            </Link>
          </div>
          {(data.spaceLoad || []).length === 0 ? (
            <VenueEmptyState
              icon={LayoutGrid}
              title="No halls yet"
              description="Add a space so requests have somewhere to land."
              action={
                <Button asChild variant="outline">
                  <Link to="/dashboard/venue/spaces">Add a space</Link>
                </Button>
              }
            />
          ) : (
            <ul className="space-y-2">
              {(data.spaceLoad || []).map((space) => (
                <li key={space.id}>
                  <Link
                    to={`/dashboard/venue/spaces/${space.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3 hover:border-primary/40"
                  >
                    <div>
                      <p className="font-medium">{space.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {space.open} open booking{space.open === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        space.status === 'Busy'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                      )}
                    >
                      {space.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          title="Pending requests"
          value={metrics.pendingRequests ?? 0}
          icon={<Inbox className="h-5 w-5" />}
          trend={trend(metrics.pendingDelta, true)}
          link="/dashboard/venue/inbox"
        />
        <MetricCard
          title="Upcoming bookings"
          value={metrics.upcomingBookings ?? 0}
          icon={<CalendarDays className="h-5 w-5" />}
          trend={trend(metrics.upcomingDelta)}
          link="/dashboard/venue/calendar"
        />
        <MetricCard
          title="Confirmed this week"
          value={metrics.confirmedThisWeek ?? 0}
          icon={<CalendarDays className="h-5 w-5" />}
          trend={trend(metrics.confirmedDelta)}
          link="/dashboard/venue/bookings"
        />
        <MetricCard
          title="Spaces"
          value={metrics.spaces ?? 0}
          icon={<LayoutGrid className="h-5 w-5" />}
          link="/dashboard/venue/spaces"
        />
        <MetricCard
          title="Collected this month"
          value={`ETB ${Number(metrics.collectedThisMonth ?? 0).toLocaleString()}`}
          icon={<Banknote className="h-5 w-5" />}
          link="/dashboard/venue/revenue"
        />
        <MetricCard
          title="Outstanding"
          value={`ETB ${Number(metrics.outstanding ?? 0).toLocaleString()}`}
          icon={<Banknote className="h-5 w-5" />}
          link="/dashboard/venue/revenue"
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">This month</h2>
        <VenueDashboardGrid data={data} />
      </section>
    </div>
  )
}
