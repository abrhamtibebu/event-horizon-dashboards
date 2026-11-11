import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, isSameDay } from 'date-fns'
import { ArrowRight, Ban, Banknote, Building2, CalendarDays, Inbox, LayoutGrid, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { MetricCard } from '@/components/MetricCard'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenueStatusBadge } from '@/components/venue/VenueStatusBadge'
import { VenueDashboardGrid } from '@/components/venue-dashboard/VenueDashboardGrid'
import { bookingDateRange, bookingSourceLabel, bookingTitle } from '@/components/venue/bookingLabels'
import { venueApi, type VenueBooking, type VenueDashboardData } from '@/lib/api/venues'
import { cn } from '@/lib/utils'

export default function VenueDashboard() {
  const [data, setData] = useState<VenueDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    venueApi.dashboard()
      .then((res) => setData(res.data))
      .catch(() => setError('Could not load venue dashboard.'))
      .finally(() => setLoading(false))
  }, [])

  const todayBookings = useMemo(() => {
    const today = new Date()
    return (data?.upcomingBookings || []).filter((booking) => isSameDay(new Date(booking.starts_at), today))
  }, [data])

  const bookingsBySpace = useMemo(() => {
    const map = new Map<string, VenueBooking[]>()
    todayBookings.forEach((booking) => {
      const name = booking.space?.name || 'Space'
      map.set(name, [...(map.get(name) || []), booking])
    })
    return Array.from(map.entries())
  }, [todayBookings])

  if (loading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Skeleton className="h-16 w-2/3" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="font-semibold text-foreground">{error || 'Dashboard unavailable'}</p>
        <Button className="mt-4" variant="outline" onClick={() => window.location.reload()}>Retry</Button>
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
        <p className="text-muted-foreground">Create your venue profile to unlock bookings, spaces, and this dashboard.</p>
        <Button asChild className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg">
          <Link to="/dashboard/venue/setup">Get started</Link>
        </Button>
      </div>
    )
  }

  const venue = data.venue
  const venueLocation = venue?.city || venue?.formatted_address
  const metrics = data.keyMetrics
  const pending = data.pendingRequests || []
  const money = (value: number | undefined) => `ETB ${Number(value ?? 0).toLocaleString()}`

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 pb-4">
      <section className="relative isolate overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-primary/[0.09] p-5 shadow-sm sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-[hsl(var(--color-rich-black))] shadow-sm sm:size-14"><Building2 className="size-6 sm:size-7" /></span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Venue dashboard</p>
              <h1 className="mt-1 truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{venue?.name || 'Venue overview'}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {venueLocation ? <span className="inline-flex items-center gap-1.5"><MapPin className="size-3.5" />{venueLocation}</span> : null}
                <span>{format(new Date(), 'EEEE, MMMM d')}</span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">Your bookings, spaces, and venue performance at a glance.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:shrink-0">
            <Button asChild className="shadow-sm"><Link to="/dashboard/venue/calendar?dialog=log-booking"><Plus className="mr-2 size-4" />Log booking</Link></Button>
            <Button asChild variant="outline" className="bg-background/70"><Link to="/dashboard/venue/calendar?dialog=block-dates"><Ban className="mr-2 size-4" />Block dates</Link></Button>
          </div>
        </div>
      </section>

      <Link
        to="/dashboard/venue/inbox"
        className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition-colors hover:border-primary/40"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
            <Inbox className="size-5" />
          </span>
          <div>
            <p className="font-semibold">{metrics.pendingRequests || pending.length} request{(metrics.pendingRequests || pending.length) === 1 ? '' : 's'} waiting</p>
            <p className="text-sm text-muted-foreground">
              {pending[0] ? `${bookingTitle(pending[0])} · ${pending[0].space?.name || 'Space'}` : 'Confirm, decline, or reply from the inbox.'}
            </p>
          </div>
        </div>
        <ArrowRight className="size-4 text-muted-foreground" />
      </Link>

      <section aria-label="Venue overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Upcoming bookings"
          value={metrics.upcomingBookings ?? 0}
          icon={<CalendarDays className="size-5" />}
          link="/dashboard/venue/calendar"
        />
        <MetricCard
          title="Confirmed this week"
          value={metrics.confirmedThisWeek ?? 0}
          icon={<CalendarDays className="size-5" />}
          link="/dashboard/venue/bookings"
        />
        <MetricCard
          title="Spaces"
          value={metrics.spaces ?? 0}
          icon={<LayoutGrid className="size-5" />}
          link="/dashboard/venue/spaces"
        />
        <MetricCard
          title="Outstanding payments"
          value={money(metrics.outstanding)}
          icon={<Banknote className="size-5" />}
          link="/dashboard/venue/revenue"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold">Today</h2>
              <p className="text-sm text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/venue/calendar">Schedule<ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </div>
          {bookingsBySpace.length === 0 ? (
            <VenueEmptyState
              icon={CalendarDays}
              title="Nothing scheduled today"
              description="Today’s bookings will show here, grouped by space."
              action={<Button asChild variant="outline"><Link to="/dashboard/venue/calendar?dialog=log-booking">Log a booking</Link></Button>}
            />
          ) : (
            <div className="space-y-5 p-5">
              {bookingsBySpace.map(([space, bookings]) => (
                <div key={space}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{space}</p>
                  <ul className="space-y-2">
                    {bookings.map((booking) => (
                      <li key={booking.id}>
                        <Link
                          to={`/dashboard/venue/calendar?view=list&booking_id=${booking.id}`}
                          className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">{bookingTitle(booking)}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {bookingDateRange(booking.starts_at, booking.ends_at)} · {bookingSourceLabel(booking.source)}
                            </p>
                          </div>
                          <VenueStatusBadge status={booking.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold">Spaces</h2>
              <p className="text-sm text-muted-foreground">Open or busy right now</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard/venue">Venue<ArrowRight className="ml-2 size-4" /></Link>
            </Button>
          </div>
          {(data.spaceLoad || []).length === 0 ? (
            <VenueEmptyState
              icon={LayoutGrid}
              title="No spaces yet"
              description="Add a space so requests can be assigned to a room."
              action={<Button asChild variant="outline"><Link to="/dashboard/venue">Add a space</Link></Button>}
            />
          ) : (
            <ul className="space-y-3 p-5">
              {data.spaceLoad?.map((space) => (
                <li key={space.id}>
                  <Link to={`/dashboard/venue/spaces/${space.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 px-3 py-3 transition-colors hover:border-primary/40">
                    <span className="font-medium">{space.name}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        space.status === 'Busy'
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                      )}
                    >
                      {space.status === 'Busy' ? 'Busy' : 'Open'}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <Link
        to="/dashboard/venue/revenue"
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition-colors hover:border-primary/40"
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Banknote className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">This month</p>
            <p className="font-semibold">{money(metrics.collectedThisMonth)} collected</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{money(metrics.outstanding)} outstanding</p>
      </Link>

      <section aria-label="Booking and venue trends" className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Venue performance</h2>
          <p className="text-sm text-muted-foreground">Booking activity, request sources, status, and recent changes.</p>
        </div>
        <VenueDashboardGrid data={data} />
      </section>
    </div>
  )
}
