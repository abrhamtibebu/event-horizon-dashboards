import { useNavigate } from 'react-router-dom'
import { Ticket, Gift, ArrowRight, Users, DollarSign, Calendar, Star, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Breadcrumbs from '@/components/Breadcrumbs'
import { useAuth } from '@/hooks/use-auth'

function FeatureRow({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  )
}

export default function EventTypeSelection() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isPlatformAdmin = user?.role === 'admin' || user?.role === 'superadmin'

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Events', href: '/dashboard/events' },
            { label: 'Create Event' },
          ]}
          className="mb-4"
        />

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Create event
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Choose a type to start. You can edit all details later.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => navigate('/dashboard/events')} variant="outline">
              Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Free */}
          <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-foreground/15">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    <Gift className="h-5 w-5" />
                  </span>
                  Free event
                </div>
                <p className="text-sm text-muted-foreground">
                  Best for meetups, community gatherings, and corporate events.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <FeatureRow icon={Users} title="Guest types" subtitle="VIP, speakers, staff, and custom types." />
              <FeatureRow icon={Calendar} title="Registration" subtitle="Simple registration flow for attendees." />
              <FeatureRow icon={Star} title="Tracking" subtitle="Basic attendee tracking and check-in." />
            </div>

            <div className="mt-6">
              <Button onClick={() => navigate('/dashboard/events/create/free')} className="w-full">
                Create free event
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Ticketed */}
          <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-colors hover:border-foreground/15">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-700 dark:text-violet-300">
                    <Ticket className="h-5 w-5" />
                  </span>
                  Ticketed event
                </div>
                <p className="text-sm text-muted-foreground">
                  Best for conferences, workshops, and paid experiences.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <FeatureRow icon={Ticket} title="Ticket tiers" subtitle="Multiple ticket types and pricing." />
              <FeatureRow icon={DollarSign} title="Payments" subtitle="Sell tickets and track revenue." />
              <FeatureRow icon={Calendar} title="Analytics" subtitle="Ticketing analytics and reporting." />
            </div>

            <div className="mt-6">
              <Button onClick={() => navigate('/dashboard/events/create/ticketed')} className="w-full">
                Create ticketed event
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* External (admin only) */}
        {isPlatformAdmin && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 dark:text-sky-300">
                    <ExternalLink className="h-5 w-5" />
                  </span>
                  External event (admins)
                </div>
                <p className="text-sm text-muted-foreground">
                  Publish an event managed outside Evella and link users to an external registration.
                </p>
              </div>
              <Button onClick={() => navigate('/dashboard/events/create/external')}>
                Create external event
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 