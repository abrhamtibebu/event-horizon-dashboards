import AdminDashboard from './AdminDashboard'
import OrganizerDashboard from './OrganizerDashboard'
import UsherDashboard from './UsherDashboard'
import AttendeeDashboard from './AttendeeDashboard'
import { useAuth } from '@/hooks/use-auth.tsx'

export default function RoleDashboard() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {(user.role === 'admin' || user.role === 'superadmin') && (
        <AdminDashboard />
      )}
      {(user.role === 'organizer' || user.role === 'organizer_admin') && <OrganizerDashboard />}
      {user.role === 'usher' && <UsherDashboard />}
      {user.role === 'attendee' && <AttendeeDashboard />}
    </div>
  )
}
