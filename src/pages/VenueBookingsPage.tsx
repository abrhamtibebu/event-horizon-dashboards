import { useEffect, useMemo, useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { Ban, CalendarDays, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { venueApi, type VenueBlackout, type VenueBooking, type VenueSpace } from '@/lib/api/venues'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const statusClass: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  completed: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
}

function sourceLabel(booking: VenueBooking) {
  if (booking.source === 'event_request') return 'Event request'
  if (booking.source === 'public_request') return 'Public request'
  return 'Manual'
}

export default function VenueBookingsPage() {
  const [bookings, setBookings] = useState<VenueBooking[]>([])
  const [blackouts, setBlackouts] = useState<VenueBlackout[]>([])
  const [spaces, setSpaces] = useState<VenueSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [spaceFilter, setSpaceFilter] = useState('all')
  const [month, setMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(new Date())
  const [createOpen, setCreateOpen] = useState(false)
  const [blackoutOpen, setBlackoutOpen] = useState(false)
  const [detail, setDetail] = useState<VenueBooking | null>(null)
  const [reply, setReply] = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [replying, setReplying] = useState(false)
  const [editingBlackout, setEditingBlackout] = useState<VenueBlackout | null>(null)
  const [form, setForm] = useState({
    space_id: '',
    title: '',
    starts_at: '',
    ends_at: '',
    notes: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
  })
  const [blackoutForm, setBlackoutForm] = useState({
    space_id: 'all',
    starts_at: '',
    ends_at: '',
    reason: '',
  })

  const load = () => {
    const from = format(startOfMonth(month), 'yyyy-MM-dd')
    const to = format(endOfMonth(month), 'yyyy-MM-dd')
    return Promise.all([
      venueApi.bookings({
        status,
        from,
        to,
        space_id: spaceFilter === 'all' ? undefined : Number(spaceFilter),
      }),
      venueApi.blackouts({ from, to, space_id: spaceFilter === 'all' ? undefined : Number(spaceFilter) }),
      venueApi.spaces(),
    ]).then(([b, bl, s]) => {
      setBookings(b.data)
      setBlackouts(bl.data)
      setSpaces(s.data)
    })
  }

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [status, month, spaceFilter])

  const bookedDays = useMemo(
    () => bookings.filter((b) => b.status !== 'cancelled').map((b) => new Date(b.starts_at)),
    [bookings],
  )

  const blockedDays = useMemo(() => blackouts.map((b) => new Date(b.starts_at)), [blackouts])

  const dayBookings = bookings.filter((b) => {
    if (!selectedDay) return true
    return format(new Date(b.starts_at), 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd')
  })

  const dayBlackouts = blackouts.filter((b) => {
    if (!selectedDay) return true
    const day = format(selectedDay, 'yyyy-MM-dd')
    const start = format(new Date(b.starts_at), 'yyyy-MM-dd')
    const end = format(new Date(b.ends_at), 'yyyy-MM-dd')
    return day >= start && day <= end
  })

  const visibleBookings = selectedDay ? dayBookings : bookings
  const visibleBlackouts = selectedDay ? dayBlackouts : blackouts

  const setStatusAction = async (booking: VenueBooking, next: string) => {
    try {
      const res = await venueApi.updateBooking(booking.id, { status: next })
      toast.success(`Booking ${next}`)
      if (detail?.id === booking.id) setDetail(res.data)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not update booking')
    }
  }

  const create = async () => {
    if (!form.space_id || !form.starts_at || !form.ends_at) {
      toast.error('Space and times are required')
      return
    }
    try {
      await venueApi.createBooking({ ...form, space_id: Number(form.space_id) })
      toast.success('Booking added')
      setCreateOpen(false)
      setForm({ space_id: '', title: '', starts_at: '', ends_at: '', notes: '', contact_name: '', contact_email: '', contact_phone: '' })
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not create booking')
    }
  }

  const createBlackout = async (force = false) => {
    if (!blackoutForm.starts_at || !blackoutForm.ends_at) {
      toast.error('Start and end times are required')
      return
    }
    try {
      if (editingBlackout) {
        await venueApi.updateBlackout(editingBlackout.id, {
          space_id: blackoutForm.space_id === 'all' ? null : Number(blackoutForm.space_id),
          starts_at: blackoutForm.starts_at,
          ends_at: blackoutForm.ends_at,
          reason: blackoutForm.reason || null,
        })
        toast.success('Blackout updated')
      } else {
        await venueApi.createBlackout({
          space_id: blackoutForm.space_id === 'all' ? null : Number(blackoutForm.space_id),
          starts_at: blackoutForm.starts_at,
          ends_at: blackoutForm.ends_at,
          reason: blackoutForm.reason || null,
          force,
        })
        toast.success('Dates blocked')
      }
      setBlackoutOpen(false)
      setEditingBlackout(null)
      setBlackoutForm({ space_id: 'all', starts_at: '', ends_at: '', reason: '' })
      load()
    } catch (err: any) {
      if (err.response?.data?.requires_force) {
        const ok = window.confirm(`${err.response.data.error}\n\nBlock anyway?`)
        if (ok) return createBlackout(true)
      }
      toast.error(err.response?.data?.error || 'Could not block dates')
    }
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

  const sendReply = async () => {
    if (!detail || !reply.trim()) return
    setReplying(true)
    try {
      const res = await venueApi.replyBooking(detail.id, {
        message: reply.trim(),
        subject: replySubject.trim() || undefined,
      })
      setDetail(res.data.booking)
      setReply('')
      setReplySubject('')
      toast.success('Reply sent')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not send reply')
    } finally {
      setReplying(false)
    }
  }

  const openBlackoutEdit = (b: VenueBlackout) => {
    setEditingBlackout(b)
    setBlackoutForm({
      space_id: b.space_id ? String(b.space_id) : 'all',
      starts_at: format(new Date(b.starts_at), "yyyy-MM-dd'T'HH:mm"),
      ends_at: format(new Date(b.ends_at), "yyyy-MM-dd'T'HH:mm"),
      reason: b.reason || '',
    })
    setBlackoutOpen(true)
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <CalendarDays className="h-5 w-5 text-[hsl(var(--color-rich-black))]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bookings</h1>
            <p className="text-muted-foreground">
              {selectedDay ? format(selectedDay, 'EEEE, MMM d') : format(month, 'MMMM yyyy')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={spaceFilter} onValueChange={setSpaceFilter}>
            <SelectTrigger className="w-40 bg-card shadow-sm">
              <SelectValue placeholder="Space" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All spaces</SelectItem>
              {spaces.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40 bg-card shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            className="shadow-sm"
            onClick={() => {
              setEditingBlackout(null)
              setBlackoutForm({ space_id: 'all', starts_at: '', ends_at: '', reason: '' })
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <Calendar
            mode="single"
            selected={selectedDay}
            onSelect={setSelectedDay}
            month={month}
            onMonthChange={setMonth}
            modifiers={{ booked: bookedDays, blocked: blockedDays }}
            modifiersClassNames={{
              booked: 'bg-primary/15 font-semibold',
              blocked: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
            }}
            className="mx-auto"
          />
          <div className="mt-3 flex flex-wrap gap-3 border-t border-border px-2 pt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary/40" /> Booked
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/40" /> Blocked
            </span>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold tracking-tight">Schedule</h2>
              <span className="text-sm text-muted-foreground">
                {visibleBookings.length} booking{visibleBookings.length === 1 ? '' : 's'}
              </span>
            </div>
            {loading ? (
              <div className="flex justify-center py-16">
                <Spinner text="Loading bookings..." />
              </div>
            ) : visibleBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                  <CalendarDays className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-semibold text-foreground">No bookings here</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Log a booking or wait for organizer and public requests.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Title</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Space</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">When</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Status</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleBookings.map((b) => (
                    <TableRow
                      key={b.id}
                      className="cursor-pointer hover:bg-accent/40"
                      onClick={() => {
                        setDetail(b)
                        setReply('')
                        setReplySubject(`Re: ${b.title || 'Your venue request'}`)
                      }}
                    >
                      <TableCell>
                        <div className="font-medium">{b.title || b.event?.name || 'Booking'}</div>
                        <div className="text-xs text-muted-foreground">
                          {sourceLabel(b)}
                          {b.organizer?.name ? ` · ${b.organizer.name}` : b.contact_name ? ` · ${b.contact_name}` : ''}
                        </div>
                      </TableCell>
                      <TableCell>{b.space?.name}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(b.starts_at), 'MMM d, HH:mm')} – {format(new Date(b.ends_at), 'HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize', statusClass[b.status])}>
                          {b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="space-x-1 text-right" onClick={(e) => e.stopPropagation()}>
                        {b.status === 'pending' && (
                          <>
                            <Button size="sm" onClick={() => setStatusAction(b, 'confirmed')}>
                              Confirm
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setStatusAction(b, 'cancelled')}>
                              Reject
                            </Button>
                          </>
                        )}
                        {b.status === 'confirmed' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setStatusAction(b, 'completed')}>
                              Complete
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setStatusAction(b, 'cancelled')}>
                              Cancel
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {visibleBlackouts.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-lg font-semibold tracking-tight">Blocked dates</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Scope</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">When</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider">Reason</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleBlackouts.map((b) => (
                    <TableRow key={b.id} className="hover:bg-accent/40">
                      <TableCell>{b.space?.name || 'Entire venue'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(b.starts_at), 'MMM d, HH:mm')} – {format(new Date(b.ends_at), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell>{b.reason || '—'}</TableCell>
                      <TableCell className="space-x-1 text-right">
                        <Button size="sm" variant="outline" onClick={() => openBlackoutEdit(b)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => removeBlackout(b)}>
                          Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      <Sheet open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          {detail ? (
            <>
              <SheetHeader>
                <SheetTitle>{detail.title || detail.event?.name || `Booking #${detail.id}`}</SheetTitle>
                <SheetDescription>
                  {sourceLabel(detail)} · {detail.space?.name || 'Space'}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="text-muted-foreground">When</p>
                  <p className="font-medium">
                    {format(new Date(detail.starts_at), 'MMM d, yyyy HH:mm')} –{' '}
                    {format(new Date(detail.ends_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="outline" className={cn('mt-1 capitalize', statusClass[detail.status])}>
                    {detail.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p className="font-medium">{detail.contact_name || detail.organizer?.name || '—'}</p>
                  <p>{detail.contact_email || '—'}</p>
                  <p>{detail.contact_phone || '—'}</p>
                </div>
                {detail.notes ? (
                  <div>
                    <p className="text-muted-foreground">Notes</p>
                    <p className="whitespace-pre-wrap">{detail.notes}</p>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  {detail.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => setStatusAction(detail, 'confirmed')}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setStatusAction(detail, 'cancelled')}>
                        Reject
                      </Button>
                    </>
                  )}
                  {detail.status === 'confirmed' && (
                    <Button size="sm" variant="outline" onClick={() => setStatusAction(detail, 'completed')}>
                      Mark completed
                    </Button>
                  )}
                </div>
                <div className="space-y-2 border-t border-border pt-4">
                  <Label>Reply by email</Label>
                  <Input
                    placeholder="Subject"
                    value={replySubject}
                    onChange={(e) => setReplySubject(e.target.value)}
                  />
                  <Textarea
                    rows={4}
                    placeholder="Write a short reply to the requester…"
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                  />
                  <Button disabled={replying || !reply.trim()} onClick={sendReply}>
                    {replying ? 'Sending…' : 'Send reply'}
                  </Button>
                </div>
              </div>
              <SheetFooter />
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log a booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Space</Label>
              <Select value={form.space_id} onValueChange={(v) => setForm({ ...form, space_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select space" />
                </SelectTrigger>
                <SelectContent>
                  {spaces.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Starts</Label>
                <Input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Ends</Label>
                <Input
                  type="datetime-local"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Contact name"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              />
              <Input
                placeholder="Email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
              <Input
                placeholder="Phone"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={create}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={blackoutOpen}
        onOpenChange={(open) => {
          setBlackoutOpen(open)
          if (!open) setEditingBlackout(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBlackout ? 'Edit blackout' : 'Block dates'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Scope</Label>
              <Select
                value={blackoutForm.space_id}
                onValueChange={(v) => setBlackoutForm({ ...blackoutForm, space_id: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Entire venue</SelectItem>
                  {spaces.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Starts</Label>
                <Input
                  type="datetime-local"
                  value={blackoutForm.starts_at}
                  onChange={(e) => setBlackoutForm({ ...blackoutForm, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Ends</Label>
                <Input
                  type="datetime-local"
                  value={blackoutForm.ends_at}
                  onChange={(e) => setBlackoutForm({ ...blackoutForm, ends_at: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Reason</Label>
              <Input
                value={blackoutForm.reason}
                onChange={(e) => setBlackoutForm({ ...blackoutForm, reason: e.target.value })}
                placeholder="Maintenance, private event…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createBlackout(false)}>{editingBlackout ? 'Save' : 'Block'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
