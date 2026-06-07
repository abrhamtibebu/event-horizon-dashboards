import { Calendar, Clock, AlertTriangle, ArrowUpRight, Sparkles, CalendarX } from 'lucide-react'
import { Button } from '@/components/ui/button'

const EVELLA_URL = 'https://evella.et'

export type RegistrationUnavailableVariant =
  | 'not-found'
  | 'registration-ended'
  | 'registration-not-started'
  | 'event-passed'
  | 'inactive'

interface RegistrationUnavailableProps {
  variant: RegistrationUnavailableVariant
  eventName?: string | null
  registrationEndDate?: string | null
  registrationStartDate?: string | null
  eventStartDate?: string | null
  /** Custom message override. If not provided, a sensible default is used. */
  message?: string
}

interface VariantContent {
  icon: typeof Calendar
  iconBg: string
  iconColor: string
  ringColor: string
  title: string
  defaultMessage: string
}

const VARIANT_CONTENT: Record<RegistrationUnavailableVariant, VariantContent> = {
  'not-found': {
    icon: AlertTriangle,
    iconBg: 'bg-rose-50 dark:bg-rose-950/40',
    iconColor: 'text-rose-500 dark:text-rose-400',
    ringColor: 'ring-rose-100 dark:ring-rose-900/40',
    title: 'Event not available',
    defaultMessage:
      "We couldn't find the event you're looking for. It may have been removed, or the link may be incorrect.",
  },
  'registration-ended': {
    icon: CalendarX,
    iconBg: 'bg-amber-50 dark:bg-amber-950/40',
    iconColor: 'text-amber-500 dark:text-amber-400',
    ringColor: 'ring-amber-100 dark:ring-amber-900/40',
    title: 'Registration has ended',
    defaultMessage:
      'The registration window for this event has closed. We hope to see you at a future event!',
  },
  'registration-not-started': {
    icon: Clock,
    iconBg: 'bg-sky-50 dark:bg-sky-950/40',
    iconColor: 'text-sky-500 dark:text-sky-400',
    ringColor: 'ring-sky-100 dark:ring-sky-900/40',
    title: 'Registration opens soon',
    defaultMessage:
      "We're getting things ready. Please check back when registration opens.",
  },
  'event-passed': {
    icon: Calendar,
    iconBg: 'bg-slate-100 dark:bg-slate-800/60',
    iconColor: 'text-slate-500 dark:text-slate-400',
    ringColor: 'ring-slate-200 dark:ring-slate-700/60',
    title: 'This event has already taken place',
    defaultMessage:
      'Thanks for your interest. This event has already happened — but there are plenty more on Evella.',
  },
  inactive: {
    icon: AlertTriangle,
    iconBg: 'bg-slate-100 dark:bg-slate-800/60',
    iconColor: 'text-slate-500 dark:text-slate-400',
    ringColor: 'ring-slate-200 dark:ring-slate-700/60',
    title: 'Registration unavailable',
    defaultMessage:
      'This event is not currently accepting registrations.',
  },
}

function formatLongDate(value?: string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(value?: string | null): string | null {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function RegistrationUnavailable({
  variant,
  eventName,
  registrationEndDate,
  registrationStartDate,
  eventStartDate,
  message,
}: RegistrationUnavailableProps) {
  const content = VARIANT_CONTENT[variant]
  const Icon = content.icon

  const dateLine =
    variant === 'registration-ended' && registrationEndDate
      ? `Registration closed on ${formatLongDate(registrationEndDate)}${
          formatTime(registrationEndDate) ? ` at ${formatTime(registrationEndDate)}` : ''
        }`
      : variant === 'registration-not-started' && registrationStartDate
      ? `Registration opens on ${formatLongDate(registrationStartDate)}${
          formatTime(registrationStartDate) ? ` at ${formatTime(registrationStartDate)}` : ''
        }`
      : variant === 'event-passed' && eventStartDate
      ? `Held on ${formatLongDate(eventStartDate)}`
      : null

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      {/* Logo header */}
      <header className="w-full pt-8 pb-2 flex items-center justify-center">
        <a
          href={EVELLA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 group"
          aria-label="Go to Evella.et"
        >
          <img
            src="/evella-logo.png"
            alt="Evella"
            className="h-8 w-auto sm:h-9 transition-transform group-hover:scale-[1.02]"
          />
        </a>
      </header>

      {/* Main card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-border/60 shadow-xl shadow-slate-900/[0.04] dark:shadow-black/40 p-6 sm:p-8 text-center">
            <div
              className={`mx-auto h-16 w-16 sm:h-20 sm:w-20 rounded-2xl ${content.iconBg} ring-8 ${content.ringColor} flex items-center justify-center mb-5 sm:mb-6`}
            >
              <Icon className={`h-8 w-8 sm:h-10 sm:w-10 ${content.iconColor}`} strokeWidth={1.75} />
            </div>

            <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight mb-2">
              {content.title}
            </h1>

            {eventName && (
              <p className="text-sm sm:text-base font-medium text-muted-foreground mb-3 line-clamp-2">
                {eventName}
              </p>
            )}

            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {message ?? content.defaultMessage}
            </p>

            {dateLine && (
              <div className="inline-flex items-center gap-2 text-xs sm:text-[13px] font-medium text-foreground bg-muted/60 rounded-full px-3 py-1.5 mb-6">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{dateLine}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Button
                asChild
                size="lg"
                className="w-full h-11 font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85 shadow-md shadow-primary/20"
              >
                <a href={EVELLA_URL} target="_blank" rel="noopener noreferrer">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Browse events on Evella
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </a>
              </Button>

              <p className="text-[11px] text-muted-foreground/80">
                Discover concerts, conferences, workshops and more on{' '}
                <a
                  href={EVELLA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground/80 underline underline-offset-2 decoration-muted-foreground/40 hover:decoration-primary"
                >
                  evella.et
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer brand */}
      <footer className="py-6 flex flex-col items-center gap-2 text-center px-4">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest">
            Powered by
          </span>
          <a
            href={EVELLA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5"
            aria-label="Evella.et"
          >
            <img src="/evella-logo.png" alt="Evella" className="h-4 w-auto opacity-80" />
          </a>
        </div>
      </footer>
    </div>
  )
}
