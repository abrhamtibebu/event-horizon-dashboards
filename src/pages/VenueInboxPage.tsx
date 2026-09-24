import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format, formatDistanceToNow } from 'date-fns'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { VenueBookingSheet } from '@/components/venue/VenueBookingSheet'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { bookingSourceLabel, bookingTitle, pendingExpiresSoon } from '@/components/venue/bookingLabels'
import { venueApi, type VenueBooking } from '@/lib/api/venues'
import { toast } from 'sonner'

export default function VenueInboxPage() {
  const [bookings, setBookings] = useState<VenueBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState<VenueBooking | null>(null)

  const load = () =>
    venueApi
      .bookings({ status: 'pending' })
      .then((res) => setBookings(res.data))
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
          <div className="flex justify-center py-16">
            <Spinner text="Loading requests..." />
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
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Request</TableHead>
                <TableHead>Space</TableHead>
                <TableHead>When</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const expiring = pendingExpiresSoon(booking.created_at)
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
                      {format(new Date(booking.starts_at), 'MMM d, HH:mm')} – {format(new Date(booking.ends_at), 'MMM d, HH:mm')}
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
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
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
