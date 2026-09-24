import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { CalendarDays, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { VenueBookingSheet } from '@/components/venue/VenueBookingSheet'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenueLogBookingDialog } from '@/components/venue/VenueLogBookingDialog'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { VenueStatusBadge } from '@/components/venue/VenueStatusBadge'
import { bookingSourceLabel, bookingTitle } from '@/components/venue/bookingLabels'
import { venueApi, type VenueBooking, type VenueSpace } from '@/lib/api/venues'
import { toast } from 'sonner'

const STATUSES = ['confirmed', 'completed', 'cancelled'] as const

export default function VenueBookingsPage() {
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('confirmed')
  const [spaceFilter, setSpaceFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [bookings, setBookings] = useState<VenueBooking[]>([])
  const [spaces, setSpaces] = useState<VenueSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<VenueBooking | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const load = () =>
    Promise.all([
      venueApi.bookings({
        status,
        space_id: spaceFilter === 'all' ? undefined : Number(spaceFilter),
      }),
      venueApi.spaces(),
    ])
      .then(([b, s]) => {
        setBookings(b.data)
        setSpaces(s.data)
      })
      .catch((err) => toast.error(err.response?.data?.error || 'Could not load bookings'))

  useEffect(() => {
    setLoading(true)
    load().finally(() => setLoading(false))
  }, [status, spaceFilter])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return bookings
    return bookings.filter((b) => {
      const hay = [bookingTitle(b), b.contact_name, b.contact_email, b.organizer?.name, b.space?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [bookings, query])

  return (
    <div className="space-y-8">
      <VenuePageHeader
        icon={CalendarDays}
        title="Bookings"
        subtitle="Confirmed events and the history after them."
        actions={
          <>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search title or contact"
              className="w-56 bg-card shadow-sm"
            />
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

      <Tabs value={status} onValueChange={(value) => setStatus(value as (typeof STATUSES)[number])}>
        <TabsList>
          {STATUSES.map((item) => (
            <TabsTrigger key={item} value={item} className="capitalize">
              {item}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner text="Loading bookings..." />
          </div>
        ) : visible.length === 0 ? (
          <VenueEmptyState
            icon={CalendarDays}
            title="No bookings here"
            description="Confirmed, completed, and cancelled bookings show in these tabs. New requests live in Inbox."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Title</TableHead>
                <TableHead>Space</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((b) => (
                <TableRow key={b.id} className="cursor-pointer hover:bg-accent/40" onClick={() => setDetail(b)}>
                  <TableCell>
                    <div className="font-medium">{bookingTitle(b)}</div>
                    <div className="text-xs text-muted-foreground">
                      {bookingSourceLabel(b.source)}
                      {b.organizer?.name ? ` · ${b.organizer.name}` : b.contact_name ? ` · ${b.contact_name}` : ''}
                    </div>
                  </TableCell>
                  <TableCell>{b.space?.name}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {format(new Date(b.starts_at), 'MMM d, HH:mm')} – {format(new Date(b.ends_at), 'HH:mm')}
                  </TableCell>
                  <TableCell>
                    <VenueStatusBadge status={b.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <VenueBookingSheet
        booking={detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
        onChanged={() => load()}
      />
      <VenueLogBookingDialog open={createOpen} onOpenChange={setCreateOpen} spaces={spaces} onCreated={load} />
    </div>
  )
}
