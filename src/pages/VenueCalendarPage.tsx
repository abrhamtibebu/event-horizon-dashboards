import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  addMonths,
  addDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { Ban, CalendarDays, CalendarCheck2, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { VenueBlackoutDialog } from '@/components/venue/VenueBlackoutDialog'
import { VenueBookingSheet } from '@/components/venue/VenueBookingSheet'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenueLogBookingDialog } from '@/components/venue/VenueLogBookingDialog'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { VenueStatusBadge } from '@/components/venue/VenueStatusBadge'
import { bookingDateRange, bookingSourceLabel, bookingTitle, overlapsRange, PENDING_HOLD_DAYS } from '@/components/venue/bookingLabels'
import { venueApi, type VenueBlackout, type VenueBooking, type VenueSpace } from '@/lib/api/venues'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

type StatusFilter = 'active' | 'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
type SourceFilter = 'all' | 'manual' | 'event_request' | 'public_request'

function toneFor(status: string) {
  if (status === 'pending') return 'bg-amber-500/15 text-amber-800 dark:text-amber-200'
  if (status === 'cancelled') return 'bg-rose-500/10 text-rose-700 line-through dark:text-rose-300'
  if (status === 'completed') return 'bg-slate-500/15 text-slate-700 dark:text-slate-200'
  return 'bg-primary/15 text-foreground'
}

export default function VenueCalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [view, setView] = useState<'month' | 'agenda' | 'list'>(() => (searchParams.get('view') as any) || 'month')
  const [query, setQuery] = useState('')
  const [month, setMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date>(new Date())
  const [spaceFilter, setSpaceFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [bookings, setBookings] = useState<VenueBooking[]>([])
  const [blackouts, setBlackouts] = useState<VenueBlackout[]>([])
  const [spaces, setSpaces] = useState<VenueSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<VenueBooking | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [blackoutOpen, setBlackoutOpen] = useState(false)
  const [editingBlackout, setEditingBlackout] = useState<VenueBlackout | null>(null)
  const [removingBlackout, setRemovingBlackout] = useState<VenueBlackout | null>(null)
  const [requestedBookingId, setRequestedBookingId] = useState<string | null>(null)

  useEffect(() => {
    const requestedSpace = searchParams.get('space_id')
    const requestedBooking = searchParams.get('booking_id')
    if (requestedSpace) setSpaceFilter(requestedSpace)
    if (requestedBooking) setRequestedBookingId(requestedBooking)
    if (searchParams.get('dialog') === 'log-booking') setCreateOpen(true)
    if (searchParams.get('dialog') === 'block-dates') setBlackoutOpen(true)
    setSearchParams({}, { replace: true })
  }, [])

  useEffect(() => {
    if (!requestedBookingId) return
    venueApi.booking(Number(requestedBookingId))
      .then((res) => setDetail(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'Could not load booking details'))
      .finally(() => setRequestedBookingId(null))
  }, [requestedBookingId])

  useEffect(() => { if (view === 'list') setStatusFilter('all') }, [view])

  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 })
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const load = () => {
    const params = {
      from: format(gridStart, 'yyyy-MM-dd'),
      to: format(gridEnd, 'yyyy-MM-dd'),
    }
    return Promise.all([venueApi.bookings(params), venueApi.blackouts(params), venueApi.spaces()])
      .then(([b, bl, s]) => {
        setBookings(b.data)
        setBlackouts(bl.data)
        setSpaces(s.data)
      })
      .catch((err) => toast.error(err.response?.data?.error || 'Could not load calendar'))
  }

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [month])

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (spaceFilter !== 'all' && String(booking.space_id) !== spaceFilter) return false
      if (statusFilter === 'active' && booking.status !== 'pending' && booking.status !== 'confirmed') return false
      if (statusFilter !== 'active' && statusFilter !== 'all' && booking.status !== statusFilter) return false
      if (sourceFilter !== 'all' && booking.source !== sourceFilter) return false
      const term = query.trim().toLowerCase()
      if (term && ![bookingTitle(booking), booking.contact_name, booking.contact_phone, booking.contact_email].some((v) => v?.toLowerCase().includes(term))) return false
      return true
    })
  }, [bookings, spaceFilter, statusFilter, sourceFilter, query])

  const filteredBlackouts = useMemo(() => {
    return blackouts.filter((blackout) => {
      if (spaceFilter === 'all') return true
      return !blackout.space_id || String(blackout.space_id) === spaceFilter
    })
  }, [blackouts, spaceFilter])

  const dayItems = useMemo(() => {
    const dayStart = startOfDay(selectedDay)
    const dayEnd = endOfDay(selectedDay)
    return {
      bookings: filteredBookings.filter((b) => overlapsRange(b.starts_at, b.ends_at, dayStart, dayEnd)),
      blackouts: filteredBlackouts.filter((b) => overlapsRange(b.starts_at, b.ends_at, dayStart, dayEnd)),
    }
  }, [filteredBookings, filteredBlackouts, selectedDay])

  const pendingCount = filteredBookings.filter((booking) => booking.status === 'pending').length
  const confirmedCount = filteredBookings.filter((booking) => booking.status === 'confirmed').length
  const selectedDateCount = dayItems.bookings.length

  const shiftMonth = (dir: number) => {
    const next = addMonths(month, dir)
    setMonth(next)
    setSelectedDay(isSameMonth(selectedDay, month) ? addMonths(selectedDay, dir) : startOfMonth(next))
  }

  const removeBlackout = async (blackout: VenueBlackout) => {
    try {
      await venueApi.deleteBlackout(blackout.id)
      toast.success('Blackout removed')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not remove blackout')
    }
  }

  return (
    <div className="space-y-6">
      <VenuePageHeader
        icon={CalendarDays}
        title="Schedule"
        subtitle="Plan bookings, manage availability, and keep every space on track."
        actions={
          <>
            <Button variant="outline" onClick={() => { setEditingBlackout(null); setBlackoutOpen(true) }}><Ban className="mr-2 size-4" />Block dates</Button>
            <Button className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg" onClick={() => setCreateOpen(true)}><Plus className="mr-2 size-4" />Log booking</Button>
          </>
        }
      />

      <section aria-label="Schedule summary" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ScheduleStat icon={CalendarDays} label="Bookings this view" value={filteredBookings.length} />
        <ScheduleStat icon={CalendarCheck2} label="Confirmed" value={confirmedCount} tone="emerald" />
        <ScheduleStat icon={CalendarDays} label="Awaiting reply" value={pendingCount} tone="amber" />
        <ScheduleStat icon={CalendarDays} label="Selected day" value={selectedDateCount} tone="primary" />
      </section>

      <section className="rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Previous month" onClick={() => shiftMonth(-1)}><ChevronLeft className="size-4" /></Button>
            <h2 className="min-w-36 text-center text-lg font-semibold tracking-tight">{format(month, 'MMMM yyyy')}</h2>
            <Button variant="outline" size="icon" aria-label="Next month" onClick={() => shiftMonth(1)}><ChevronRight className="size-4" /></Button>
            <Button variant="outline" onClick={() => { const today = new Date(); setMonth(today); setSelectedDay(today) }}>Today</Button>
          </div>
          <div className="inline-flex w-full rounded-xl bg-muted p-1 sm:w-auto">
            {(['month', 'agenda', 'list'] as const).map((item) => <button key={item} type="button" aria-pressed={view === item} onClick={() => { setView(item); if (item === 'list' && statusFilter === 'active') setStatusFilter('all') }} className={cn('flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-all sm:flex-none', view === item ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>{item}</button>)}
          </div>
        </div>
        <div className="mt-4 grid gap-2 border-t border-border pt-4 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(150px,190px))]">
          <div className="relative sm:col-span-2 xl:col-span-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search booking or contact" className="pl-9" /></div>
          <Select value={spaceFilter} onValueChange={setSpaceFilter}>
            <SelectTrigger><SelectValue placeholder="All spaces" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All spaces</SelectItem>{spaces.map((space) => <SelectItem key={space.id} value={String(space.id)}>{space.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent><SelectItem value="active">Pending and confirmed</SelectItem><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem><SelectItem value="completed">Completed</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as SourceFilter)}>
            <SelectTrigger><SelectValue placeholder="All sources" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All sources</SelectItem><SelectItem value="manual">Manual</SelectItem><SelectItem value="event_request">Event request</SelectItem><SelectItem value="public_request">Public request</SelectItem></SelectContent>
          </Select>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <Legend swatch="bg-amber-500" label="Pending" />
          <Legend swatch="bg-primary" label="Confirmed" />
          <Legend swatch="bg-slate-500" label="Completed" />
          <Legend swatch="bg-rose-500" label="Blocked" />
        </div>
      </section>

      {loading ? (
        <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <div className="grid grid-cols-7 gap-2">{Array.from({ length: 7 }, (_, i) => <Skeleton key={`h-${i}`} className="h-5" />)}</div>
          <div className="grid grid-cols-7 gap-2">{Array.from({ length: 35 }, (_, i) => <Skeleton key={i} className="min-h-20" />)}</div>
        </div>
      ) : view === 'list' ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {filteredBookings.length ? <>
            <div className="divide-y divide-border md:hidden">{filteredBookings.map((booking) => <button key={booking.id} type="button" className="w-full p-4 text-left transition-colors hover:bg-muted/40" onClick={() => setDetail(booking)}><div className="flex items-start justify-between gap-3"><span className="min-w-0 truncate font-semibold">{bookingTitle(booking)}</span><VenueStatusBadge status={booking.status} /></div><p className="mt-1 text-sm text-muted-foreground">{booking.space?.name || 'Venue space'} · {bookingDateRange(booking.starts_at, booking.ends_at)}</p><p className="mt-1 truncate text-xs text-muted-foreground">{booking.contact_name || 'No contact'}{booking.contact_phone ? ` · ${booking.contact_phone}` : ''} · {bookingSourceLabel(booking.source)}</p>{booking.status === 'pending' && booking.created_at ? <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">Hold ends {format(addDays(new Date(booking.created_at), PENDING_HOLD_DAYS), 'MMM d, HH:mm')}</p> : null}</button>)}</div>
            <div className="hidden md:block"><Table><TableHeader><TableRow className="bg-muted/40"><TableHead>Booking</TableHead><TableHead>Space</TableHead><TableHead>Date</TableHead><TableHead>Source</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>{filteredBookings.map((booking) => <TableRow key={booking.id} className="cursor-pointer" onClick={() => setDetail(booking)}><TableCell><div className="font-medium">{bookingTitle(booking)}</div><div className="text-xs text-muted-foreground">{booking.contact_name} {booking.contact_phone}</div>{booking.status === 'pending' && booking.created_at && <div className="text-xs text-amber-700 dark:text-amber-300">Hold ends {format(addDays(new Date(booking.created_at), PENDING_HOLD_DAYS), 'MMM d, HH:mm')}</div>}</TableCell><TableCell>{booking.space?.name || '—'}</TableCell><TableCell className="whitespace-nowrap">{bookingDateRange(booking.starts_at, booking.ends_at)}</TableCell><TableCell>{bookingSourceLabel(booking.source)}</TableCell><TableCell><VenueStatusBadge status={booking.status} /></TableCell></TableRow>)}</TableBody></Table></div>
          </> : <VenueEmptyState icon={CalendarDays} title="No bookings match" description="Try another search or change the filters." />}
        </div>
      ) : view === 'month' ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {WEEKDAYS.map((label) => (
              <div key={label} className="px-0.5 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:px-2 sm:py-3 sm:text-xs">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border p-px">
            {days.map((day) => {
              const start = startOfDay(day)
              const end = endOfDay(day)
              const dayBookings = filteredBookings.filter((b) => overlapsRange(b.starts_at, b.ends_at, start, end))
              const dayBlackouts = filteredBlackouts.filter((b) => overlapsRange(b.starts_at, b.ends_at, start, end))
              const inMonth = isSameMonth(day, month)
              const selected = isSameDay(day, selectedDay)
              const today = isSameDay(day, new Date())
              const visible = [...dayBlackouts.map((b) => ({ kind: 'blackout' as const, blackout: b })), ...dayBookings.map((b) => ({ kind: 'booking' as const, booking: b }))]
              const shown = visible.slice(0, 3)
              const extra = visible.length - shown.length

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    'min-h-[76px] min-w-0 overflow-hidden bg-card p-1 text-left transition-colors sm:min-h-32 sm:p-2',
                    !inMonth && 'bg-muted/30 text-muted-foreground',
                    selected && 'bg-primary/[0.06] ring-1 ring-inset ring-primary/30',
                  )}
                >
                  <button
                    type="button"
                    aria-label={format(day, 'EEEE, MMMM d')}
                    aria-pressed={selected}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      'mb-1 flex size-6 items-center justify-center rounded-full text-xs font-semibold sm:size-7 sm:text-sm',
                      today && 'bg-primary text-[hsl(var(--color-rich-black))] shadow-sm',
                      selected && !today && 'bg-primary/10 text-primary',
                      !today && inMonth && 'text-foreground',
                      !today && !inMonth && 'text-muted-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                  <div className="hidden space-y-1 sm:block">
                    {shown.map((item) =>
                      item.kind === 'blackout' ? (
                        <button
                          key={`blackout-${item.blackout.id}`}
                          type="button"
                          onClick={() => {
                            setEditingBlackout(item.blackout)
                            setBlackoutOpen(true)
                          }}
                          className="block w-full truncate rounded-md bg-rose-500/10 px-1.5 py-1 text-left text-[11px] font-medium text-rose-700 dark:text-rose-300"
                        >
                          {item.blackout.reason || 'Blocked'}
                        </button>
                      ) : (
                        <button
                          key={`booking-${item.booking.id}`}
                          type="button"
                          onClick={() => setDetail(item.booking)}
                          className={cn(
                            'block w-full truncate rounded-md px-1.5 py-1 text-left text-[11px] font-medium',
                            toneFor(item.booking.status),
                          )}
                        >
                          {bookingTitle(item.booking)}
                          {item.booking.status === 'pending' && item.booking.created_at ? ` · hold ${format(addDays(new Date(item.booking.created_at), PENDING_HOLD_DAYS), 'MMM d')}` : ''}
                        </button>
                      ),
                    )}
                    {extra > 0 ? (
                      <button
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className="px-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                      >
                        +{extra} more
                      </button>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-0.5 sm:hidden" aria-hidden="true">
                    {visible.slice(0, 5).map((item, index) => <span key={`${item.kind}-${index}`} className={cn('size-1.5 rounded-full', item.kind === 'blackout' ? 'bg-rose-500' : item.booking.status === 'pending' ? 'bg-amber-500' : item.booking.status === 'completed' ? 'bg-slate-500' : 'bg-primary')} />)}
                    {visible.length > 5 ? <span className="ml-0.5 text-[9px] leading-none text-muted-foreground">+{visible.length - 5}</span> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {!loading && view !== 'list' ? (
        <DayAgenda
          day={selectedDay}
          showDayNav={view === 'agenda'}
          onShiftDay={(dir) => {
            const nextDay = addDays(selectedDay, dir)
            setSelectedDay(nextDay)
            if (!isSameMonth(nextDay, month)) setMonth(nextDay)
          }}
          bookings={dayItems.bookings}
          blackouts={dayItems.blackouts}
          onOpen={setDetail}
          onEditBlackout={(blackout) => {
            setEditingBlackout(blackout)
            setBlackoutOpen(true)
          }}
          onRemoveBlackout={setRemovingBlackout}
        />
      ) : null}

      <VenueBookingSheet
        booking={detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
        onChanged={() => load()}
      />
      <VenueLogBookingDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        spaces={spaces}
        defaults={{ starts_at: format(selectedDay, 'yyyy-MM-dd'), ends_at: format(selectedDay, 'yyyy-MM-dd') }}
        onCreated={(booking) => {
          void load()
          if (booking) setDetail(booking)
        }}
      />
      <VenueBlackoutDialog
        open={blackoutOpen}
        onOpenChange={(open) => {
          setBlackoutOpen(open)
          if (!open) setEditingBlackout(null)
        }}
        spaces={spaces}
        editing={editingBlackout}
        onSaved={load}
      />
      <AlertDialog open={!!removingBlackout} onOpenChange={(open) => !open && setRemovingBlackout(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove blocked dates?</AlertDialogTitle><AlertDialogDescription>This will make the selected time available for bookings again.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep blocked</AlertDialogCancel><AlertDialogAction onClick={() => { if (removingBlackout) void removeBlackout(removingBlackout); setRemovingBlackout(null) }}>Remove blackout</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-2.5 rounded-full', swatch)} />
      {label}
    </span>
  )
}

function ScheduleStat({
  icon: Icon,
  label,
  value,
  tone = 'slate',
}: {
  icon: typeof CalendarDays
  label: string
  value: number
  tone?: 'slate' | 'emerald' | 'amber' | 'primary'
}) {
  const tones = {
    slate: 'bg-muted text-muted-foreground',
    emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    amber: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
    primary: 'bg-primary/10 text-primary',
  }

  return (
    <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm sm:p-4">
      <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', tones[tone])}><Icon className="size-4" /></span>
      <div className="min-w-0"><p className="truncate text-xs font-medium text-muted-foreground">{label}</p><p className="text-xl font-semibold tabular-nums text-foreground">{value}</p></div>
    </div>
  )
}

function DayAgenda({
  day,
  showDayNav,
  onShiftDay,
  bookings,
  blackouts,
  onOpen,
  onEditBlackout,
  onRemoveBlackout,
}: {
  day: Date
  showDayNav?: boolean
  onShiftDay?: (dir: number) => void
  bookings: VenueBooking[]
  blackouts: VenueBlackout[]
  onOpen: (booking: VenueBooking) => void
  onEditBlackout: (blackout: VenueBlackout) => void
  onRemoveBlackout: (blackout: VenueBlackout) => void
}) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">{format(day, 'EEEE, MMMM d')}</h2>
          {showDayNav ? (
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={() => onShiftDay?.(-1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="icon" onClick={() => onShiftDay?.(1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          ) : null}
        </div>
        {bookings.length === 0 ? (
          <VenueEmptyState icon={CalendarDays} title="No bookings this day" description="Pick another date or log a booking." />
        ) : (
          <>
          <div className="divide-y divide-border md:hidden">
            {bookings.map((booking) => <button key={booking.id} type="button" className="w-full p-4 text-left hover:bg-muted/40" onClick={() => onOpen(booking)}>
              <div className="flex items-start justify-between gap-3"><span className="font-semibold">{bookingTitle(booking)}</span><VenueStatusBadge status={booking.status} /></div>
              <p className="mt-1 text-sm text-muted-foreground">{booking.space?.name || 'Venue space'} · {bookingDateRange(booking.starts_at, booking.ends_at)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{booking.contact_name || 'No contact'} · {bookingSourceLabel(booking.source)}</p>
            </button>)}
          </div>
          <div className="hidden md:block"><Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Title</TableHead>
                <TableHead>Space</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id} className="cursor-pointer hover:bg-accent/40" onClick={() => onOpen(booking)}>
                  <TableCell className="font-medium">{bookingTitle(booking)}</TableCell>
                  <TableCell>{booking.space?.name}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {bookingDateRange(booking.starts_at, booking.ends_at)}
                  </TableCell>
                  <TableCell>{bookingSourceLabel(booking.source)}</TableCell>
                  <TableCell>
                    <VenueStatusBadge status={booking.status} />
                    {booking.status === 'pending' && booking.created_at ? (
                      <div className="mt-1 text-xs text-amber-700 dark:text-amber-300">Hold ends {format(addDays(new Date(booking.created_at), PENDING_HOLD_DAYS), 'MMM d, HH:mm')}</div>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
          </>
        )}
      </div>
      {(blackouts.length > 0 || showDayNav) ? (
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold">Blocked dates</h2>
          </div>
          {blackouts.length === 0 ? (
            <VenueEmptyState icon={Ban} title="No blocked dates" description="Block a space when it is closed for maintenance or a private hold." />
          ) : (
          <>
          <div className="divide-y divide-border md:hidden">{blackouts.map((blackout) => <div key={blackout.id} className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="font-medium">{blackout.reason || 'Blocked time'}</p><p className="text-xs text-muted-foreground">{blackout.space?.name || 'Entire venue'} · {bookingDateRange(blackout.starts_at, blackout.ends_at)}</p></div><div className="flex shrink-0 gap-1"><Button size="sm" variant="outline" onClick={() => onEditBlackout(blackout)}>Edit</Button><Button size="sm" variant="ghost" onClick={() => onRemoveBlackout(blackout)}>Remove</Button></div></div>)}</div>
          <div className="hidden md:block"><Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Scope</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {blackouts.map((blackout) => (
                <TableRow key={blackout.id}>
                  <TableCell>{blackout.space?.name || 'Entire venue'}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {bookingDateRange(blackout.starts_at, blackout.ends_at)}
                  </TableCell>
                  <TableCell>{blackout.reason || '—'}</TableCell>
                  <TableCell className="space-x-1 text-right">
                    <Button size="sm" variant="outline" onClick={() => onEditBlackout(blackout)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onRemoveBlackout(blackout)}>
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
          </>
          )}
        </div>
      ) : null}
    </div>
  )
}
