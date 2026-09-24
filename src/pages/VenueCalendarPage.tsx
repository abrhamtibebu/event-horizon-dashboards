import { useEffect, useMemo, useState } from 'react'
import {
  addMonths,
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
import { Ban, CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { VenueBlackoutDialog } from '@/components/venue/VenueBlackoutDialog'
import { VenueBookingSheet } from '@/components/venue/VenueBookingSheet'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenueLogBookingDialog } from '@/components/venue/VenueLogBookingDialog'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { VenueStatusBadge } from '@/components/venue/VenueStatusBadge'
import { bookingSourceLabel, bookingTitle, overlapsRange } from '@/components/venue/bookingLabels'
import { venueApi, type VenueBlackout, type VenueBooking, type VenueSpace } from '@/lib/api/venues'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
      return true
    })
  }, [bookings, spaceFilter, statusFilter, sourceFilter])

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
        title="Calendar"
        subtitle={format(month, 'MMMM yyyy')}
        actions={
          <>
            <Button variant="outline" size="icon" className="shadow-sm" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="shadow-sm"
              onClick={() => {
                const today = new Date()
                setMonth(today)
                setSelectedDay(today)
              }}
            >
              Today
            </Button>
            <Button variant="outline" size="icon" className="shadow-sm" onClick={() => shiftMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="shadow-sm"
              onClick={() => {
                setEditingBlackout(null)
                setBlackoutOpen(true)
              }}
            >
              <Ban className="mr-2 h-4 w-4" />
              Block dates
            </Button>
            <Button
              className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Log booking
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Select value={spaceFilter} onValueChange={setSpaceFilter}>
          <SelectTrigger className="w-44 bg-card shadow-sm">
            <SelectValue placeholder="Space" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All spaces</SelectItem>
            {spaces.map((space) => (
              <SelectItem key={space.id} value={String(space.id)}>
                {space.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-40 bg-card shadow-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Pending and confirmed</SelectItem>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(value) => setSourceFilter(value as SourceFilter)}>
          <SelectTrigger className="w-44 bg-card shadow-sm">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="event_request">Event request</SelectItem>
            <SelectItem value="public_request">Public request</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Legend swatch="bg-amber-500/40" label="Pending" />
        <Legend swatch="bg-primary/40" label="Confirmed" />
        <Legend swatch="bg-slate-500/40" label="Completed" />
        <Legend swatch="bg-rose-500/40" label="Blocked" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner text="Loading calendar..." />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {WEEKDAYS.map((label) => (
              <div key={label} className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
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
                    'min-h-28 border-b border-r border-border p-1.5 text-left last:border-r-0 sm:min-h-32',
                    !inMonth && 'bg-muted/20',
                    selected && 'bg-primary/5',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      'mb-1 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold',
                      today && 'bg-primary text-[hsl(var(--color-rich-black))]',
                      !today && inMonth && 'text-foreground',
                      !today && !inMonth && 'text-muted-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                  <div className="space-y-1">
                    {shown.map((item) =>
                      item.kind === 'blackout' ? (
                        <button
                          key={`blackout-${item.blackout.id}`}
                          type="button"
                          onClick={() => {
                            setEditingBlackout(item.blackout)
                            setBlackoutOpen(true)
                          }}
                          className="block w-full truncate rounded-md bg-rose-500/15 px-1.5 py-0.5 text-left text-[11px] font-medium text-rose-700 dark:text-rose-300"
                        >
                          {item.blackout.reason || 'Blocked'}
                        </button>
                      ) : (
                        <button
                          key={`booking-${item.booking.id}`}
                          type="button"
                          onClick={() => setDetail(item.booking)}
                          className={cn(
                            'block w-full truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium',
                            toneFor(item.booking.status),
                          )}
                        >
                          {format(new Date(item.booking.starts_at), 'HH:mm')} {bookingTitle(item.booking)}
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
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!loading ? (
        <DayAgenda
          day={selectedDay}
          bookings={dayItems.bookings}
          blackouts={dayItems.blackouts}
          onOpen={setDetail}
          onEditBlackout={(blackout) => {
            setEditingBlackout(blackout)
            setBlackoutOpen(true)
          }}
          onRemoveBlackout={removeBlackout}
        />
      ) : null}

      <VenueBookingSheet
        booking={detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
        onChanged={() => load()}
      />
      <VenueLogBookingDialog open={createOpen} onOpenChange={setCreateOpen} spaces={spaces} onCreated={load} />
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
    </div>
  )
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('h-2.5 w-2.5 rounded-full', swatch)} />
      {label}
    </span>
  )
}

function DayAgenda({
  day,
  bookings,
  blackouts,
  onOpen,
  onEditBlackout,
  onRemoveBlackout,
}: {
  day: Date
  bookings: VenueBooking[]
  blackouts: VenueBlackout[]
  onOpen: (booking: VenueBooking) => void
  onEditBlackout: (blackout: VenueBlackout) => void
  onRemoveBlackout: (blackout: VenueBlackout) => void
}) {
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold">{format(day, 'EEEE, MMMM d')}</h2>
        </div>
        {bookings.length === 0 ? (
          <VenueEmptyState icon={CalendarDays} title="No bookings this day" description="Pick another date or log a booking." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Title</TableHead>
                <TableHead>Space</TableHead>
                <TableHead>When</TableHead>
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
                    {format(new Date(booking.starts_at), 'HH:mm')} – {format(new Date(booking.ends_at), 'HH:mm')}
                  </TableCell>
                  <TableCell>{bookingSourceLabel(booking.source)}</TableCell>
                  <TableCell>
                    <VenueStatusBadge status={booking.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {blackouts.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-lg font-semibold">Blocked dates</h2>
          </div>
          <Table>
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
                    {format(new Date(blackout.starts_at), 'MMM d, HH:mm')} – {format(new Date(blackout.ends_at), 'MMM d, HH:mm')}
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
          </Table>
        </div>
      ) : null}
    </div>
  )
}
