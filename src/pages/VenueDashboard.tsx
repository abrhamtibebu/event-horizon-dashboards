import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CalendarDays, LayoutGrid, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/use-auth'
import { VenueDashboardGrid } from '@/components/venue-dashboard/VenueDashboardGrid'
import { venueApi, type VenueDashboardData } from '@/lib/api/venues'

export default function VenueDashboard() {
  const { user } = useAuth()
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

  const venueName = data.venue?.name || 'your venue'
  const location = data.venue?.city || data.venue?.formatted_address

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary">
            <Building2 className="size-6 text-[hsl(var(--color-rich-black))]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Welcome{user?.name ? `, ${user.name}` : ''}!
            </h1>
            <p className="text-muted-foreground">
              {venueName}
              {location ? (
                <span className="inline-flex items-center gap-1">
                  {' · '}
                  <MapPin className="inline size-3.5" />
                  {location}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg">
            <Link to="/dashboard/venue/bookings">
              <CalendarDays className="mr-2 size-4" />
              Manage bookings
            </Link>
          </Button>
          <Button asChild variant="outline" className="shadow-sm">
            <Link to="/dashboard/venue/spaces">
              <LayoutGrid className="mr-2 size-4" />
              Spaces
            </Link>
          </Button>
          <Button asChild variant="outline" className="shadow-sm">
            <Link to="/dashboard/venue/profile">
              <MapPin className="mr-2 size-4" />
              Profile
            </Link>
          </Button>
        </div>
      </div>

      <VenueDashboardGrid data={data} />
    </div>
  )
}
