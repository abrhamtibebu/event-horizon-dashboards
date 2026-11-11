import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, format, formatDistanceToNow } from 'date-fns'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { VenueBookingSheet } from '@/components/venue/VenueBookingSheet'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { bookingDateRange, bookingSourceLabel, bookingTitle, pendingExpiresSoon, PENDING_HOLD_DAYS } from '@/components/venue/bookingLabels'
import { venueApi, type VenueBooking } from '@/lib/api/venues'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export default function VenueInboxPage() {
  const [bookings, setBookings] = useState<VenueBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<VenueBooking | null>(null)

  const load = () =>
    venueApi
      .bookings({ status: 'pending' })
      .then((res) => setBookings([...res.data].sort((a, b) => {
        const aCreated = a.created_at ? new Date(a.created_at).getTime() : 0
        const bCreated = b.created_at ? new Date(b.created_at).getTime() : 0
        return aCreated - bCreated
      })))
      .catch((err) => toast.error(err.response?.data?.error || 'Could not load requests'))

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-8">
      <VenuePageHeader
        icon={Inbox}
        title="Inbox"
        subtitle="Requests waiting for a yes, a no, or a reply."
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3].map((row) => <div key={row} className="flex items-center gap-4 rounded-xl border border-border p-4"><Skeleton className="h-10 w-10 rounded-xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-3 w-2/3" /></div><Skeleton className="h-6 w-24" /></div>)}
          </div>
        ) : bookings.length === 0 ? (
          <VenueEmptyState
            icon={Inbox}
            title="Inbox is clear"
            description="Public and organizer requests will land here until you confirm or decline them."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button asChild variant="outline">
                  <Link to="/dashboard/venue/calendar">Open calendar</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/dashboard/venue/profile">View listing</Link>
                </Button>
              </div>
            }
          />
        ) : (
          <>
          <div className="divide-y divide-border md:hidden">
            {bookings.map((booking) => {
              const expiry = booking.created_at ? addDays(new Date(booking.created_at), PENDING_HOLD_DAYS) : null
              return <button key={booking.id} className="block w-full space-y-3 p-4 text-left" onClick={() => setDetail(booking)}>
                <div className="flex items-start justify-between gap-3"><div className="font-semibold">{bookingTitle(booking)}<p className="text-xs font-normal text-muted-foreground">{bookingSourceLabel(booking.source)} · {booking.space?.name || 'Space'}</p></div><Badge variant="outline">Pending</Badge></div>
                <p className="text-sm">{bookingDateRange(booking.starts_at, booking.ends_at)}</p>
                <p className="text-xs text-muted-foreground">{booking.contact_name || booking.organizer?.name || 'No contact'}{booking.contact_phone ? ` · ${booking.contact_phone}` : ''}</p>
                <p className="text-xs text-muted-foreground">Quote: {booking.quoted_amount != null ? `${booking.currency || 'ETB'} ${Number(booking.quoted_amount).toLocaleString()}` : 'Not set'} · Balance: {booking.balance_status || 'unquoted'}</p>
                {expiry && <p className="text-xs font-medium text-amber-700 dark:text-amber-300">7-day hold ends {format(expiry, 'MMM d, yyyy HH:mm')}</p>}
              </button>
            })}
          </div>
          <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Request</TableHead>
                <TableHead>Space</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Quote / balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const expiring = pendingExpiresSoon(booking.created_at)
                const expiry = booking.created_at ? addDays(new Date(booking.created_at), PENDING_HOLD_DAYS) : null
                return (
                  <TableRow
                    key={booking.id}
                    className="cursor-pointer hover:bg-accent/40"
                    onClick={() => setDetail(booking)}
                  >
                    <TableCell>
                      <div className="font-medium">{bookingTitle(booking)}</div>
                      <div className="text-xs text-muted-foreground">{bookingSourceLabel(booking.source)}</div>
                    </TableCell>
                    <TableCell>{booking.space?.name || '—'}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">
                      {bookingDateRange(booking.starts_at, booking.ends_at)}
                    </TableCell>
                    <TableCell>
                      {booking.contact_name || booking.organizer?.name || '—'}
                      {booking.contact_email ? (
                        <div className="text-xs text-muted-foreground">{booking.contact_email}</div>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {booking.created_at ? formatDistanceToNow(new Date(booking.created_at), { addSuffix: true }) : '—'}
                      </div>
                      {expiring ? (
                        <Badge variant="outline" className="mt-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          Expiring soon
                        </Badge>
                      ) : null}
                      {expiry ? <div className="mt-1 text-xs text-muted-foreground">Hold ends {format(expiry, 'MMM d, HH:mm')}</div> : null}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{booking.quoted_amount != null ? `${booking.currency || 'ETB'} ${Number(booking.quoted_amount).toLocaleString()}` : '—'}<div className="text-xs capitalize text-muted-foreground">{booking.balance_status || 'unquoted'}</div></TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
          </>
        )}
      </div>

      <VenueBookingSheet
        booking={detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
        onChanged={() => {
          load()
        }}
      />
    </div>
  )
}
