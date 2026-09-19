import { Navigate, useLocation } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export function VenueSetupGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  const isVenueRole = user?.role === 'venue_admin' || user?.role === 'venue_staff'
  const onSetup = location.pathname.startsWith('/dashboard/venue/setup')

  if (isVenueRole && !user?.venue_id && !onSetup) {
    if (user?.role === 'venue_staff') {
      return (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <Building2 className="size-7 text-muted-foreground" />
          </div>
          <h1 className="text-xl font-bold">Waiting for venue access</h1>
          <p className="text-sm text-muted-foreground">
            Ask your venue admin to invite this account. Staff cannot create a venue on their own.
          </p>
        </div>
      )
    }
    return <Navigate to="/dashboard/venue/setup" replace />
  }

  if (isVenueRole && user?.venue_id && onSetup) {
    return <Navigate to="/dashboard" replace />
  }

  if (user?.role === 'venue_staff' && onSetup) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
