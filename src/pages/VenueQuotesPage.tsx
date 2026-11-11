import { useEffect, useMemo, useState } from 'react'
import { Download, FileText, Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { venueApi, type VenueBookingQuote } from '@/lib/api/venues'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { VenueQuotationDialog } from '@/components/venue/VenueQuotationDialog'
import type { VenueBooking } from '@/lib/api/venues'

const statusStyle: Record<string, string> = {
  sent: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300',
  accepted: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  changes_requested: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  declined: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  expired: 'border-muted-foreground/30 bg-muted text-muted-foreground',
  superseded: 'border-muted-foreground/30 bg-muted text-muted-foreground',
}

const titleFor = (quote: VenueBookingQuote) => quote.booking?.title || quote.booking?.event?.name || 'Booking quotation'

export default function VenueQuotesPage() {
  const [quotes, setQuotes] = useState<VenueBookingQuote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [bookings, setBookings] = useState<VenueBooking[]>([])
  const [bookingPickerOpen, setBookingPickerOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [quoteBooking, setQuoteBooking] = useState<VenueBooking | null>(null)
  const [acceptingQuoteId, setAcceptingQuoteId] = useState<number | null>(null)

  useEffect(() => {
    Promise.all([venueApi.venueQuotes(), venueApi.bookings()])
      .then(([quoteResponse, bookingResponse]) => { setQuotes(quoteResponse.data); setBookings(bookingResponse.data) })
      .catch((error) => toast.error(error.response?.data?.error || 'Could not load venue quotations'))
      .finally(() => setLoading(false))
  }, [])

  const startQuote = () => {
    const selected = bookings.find((booking) => String(booking.id) === selectedBookingId)
    if (!selected) {
      toast.error('Choose a booking first.')
      return
    }
    setBookingPickerOpen(false)
    setQuoteBooking(selected)
  }

  const refreshQuotes = async () => {
    try { const { data } = await venueApi.venueQuotes(); setQuotes(data) }
    catch { toast.error('Quotation sent, but the list could not refresh.') }
  }

  const acceptQuote = async (quote: VenueBookingQuote) => {
    if (!window.confirm(`Mark the quotation for “${titleFor(quote)}” as accepted?`)) return
    setAcceptingQuoteId(quote.id)
    try {
      const { data } = await venueApi.acceptVenueQuote(quote.id)
      setQuotes((items) => items.map((item) => item.id === quote.id ? data.quote : item))
      toast.success('Quotation marked as accepted')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not accept quotation')
    } finally {
      setAcceptingQuoteId(null)
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return quotes.filter((quote) => {
      const matchesStatus = status === 'all' || quote.status === status
      const text = [titleFor(quote), quote.booking?.contact_name, quote.booking?.organizer?.name, quote.booking?.space?.name, quote.currency].filter(Boolean).join(' ').toLowerCase()
      return matchesStatus && (!query || text.includes(query))
    })
  }, [quotes, search, status])

  return <div className="space-y-7">
    <VenuePageHeader icon={FileText} title="Quotations" subtitle="Create, track, and download proforma quotations for venue bookings." actions={<Button onClick={() => { setSelectedBookingId(''); setBookingPickerOpen(true) }}><Plus className="mr-2 size-4" />Create quotation</Button>} />
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search booking, client, or space" /></div>
      <Select value={status} onValueChange={setStatus}><SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="sent">Awaiting response</SelectItem><SelectItem value="accepted">Accepted</SelectItem><SelectItem value="changes_requested">Changes requested</SelectItem><SelectItem value="declined">Declined</SelectItem><SelectItem value="expired">Expired</SelectItem><SelectItem value="superseded">Replaced versions</SelectItem></SelectContent></Select>
    </div>
    {loading ? <div className="flex h-56 items-center justify-center"><Spinner text="Loading quotations…" /></div> : filtered.length === 0 ? <VenueEmptyState icon={FileText} title={quotes.length ? 'No quotations match' : 'No quotations sent yet'} description={quotes.length ? 'Adjust your search or status filter.' : 'Create a quotation here by selecting a booking. Sent versions will appear in this list.'} action={!quotes.length ? <Button onClick={() => { setSelectedBookingId(''); setBookingPickerOpen(true) }}><Plus className="mr-2 size-4" />Create quotation</Button> : undefined} /> : <>
      <p className="text-sm text-muted-foreground">Showing {filtered.length} of {quotes.length} quotation versions</p>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="hidden overflow-x-auto md:block"><Table><TableHeader><TableRow className="bg-muted/40"><TableHead>Booking / client</TableHead><TableHead>Version</TableHead><TableHead>Sent</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Subtotal</TableHead><TableHead className="text-right">Discount</TableHead><TableHead className="text-right">Tax</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{filtered.map((quote) => <TableRow key={quote.id}><TableCell><div className="font-medium">{titleFor(quote)}</div><div className="text-xs text-muted-foreground">{quote.booking?.contact_name || quote.booking?.organizer?.name || 'Client'} · {quote.booking?.space?.name || 'Space'}</div></TableCell><TableCell>v{quote.version}</TableCell><TableCell>{quote.sent_at ? new Date(quote.sent_at).toLocaleDateString() : '—'}</TableCell><TableCell><Badge variant="outline" className={`capitalize ${statusStyle[quote.status] || ''}`}>{quote.status.replaceAll('_', ' ')}</Badge></TableCell><TableCell className="text-right tabular-nums">{quote.currency} {quote.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell><TableCell className="text-right tabular-nums">{quote.discount_amount ? `− ${quote.currency} ${quote.discount_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}</TableCell><TableCell className="text-right tabular-nums">{quote.tax_amount ? `${quote.tax_rate}% · ${quote.currency} ${quote.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}</TableCell><TableCell className="text-right font-semibold tabular-nums">{quote.currency} {quote.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell><TableCell><div className="flex justify-end gap-2">{quote.status === 'sent' && <Button size="sm" disabled={acceptingQuoteId === quote.id} onClick={() => void acceptQuote(quote)}>{acceptingQuoteId === quote.id ? 'Updating…' : 'Mark accepted'}</Button>}<Button asChild size="sm" variant="outline"><a href={venueApi.bookingQuoteDocumentUrl(quote.token)}><Download className="mr-2 size-4" />PDF</a></Button></div></TableCell></TableRow>)}</TableBody></Table></div>
        <div className="divide-y md:hidden">{filtered.map((quote) => <article key={quote.id} className="space-y-3 p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{titleFor(quote)}</p><p className="text-xs text-muted-foreground">{quote.booking?.contact_name || quote.booking?.organizer?.name || 'Client'} · {quote.booking?.space?.name || 'Space'}</p></div><Badge variant="outline" className={`shrink-0 capitalize ${statusStyle[quote.status] || ''}`}>{quote.status.replaceAll('_', ' ')}</Badge></div><div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/30 p-3 text-sm"><span className="text-muted-foreground">Subtotal</span><span className="text-right">{quote.currency} {quote.subtotal.toLocaleString()}</span>{quote.discount_amount > 0 && <><span className="text-muted-foreground">Discount</span><span className="text-right">− {quote.currency} {quote.discount_amount.toLocaleString()}</span></>}{quote.tax_amount > 0 && <><span className="text-muted-foreground">Tax ({quote.tax_rate}%)</span><span className="text-right">{quote.currency} {quote.tax_amount.toLocaleString()}</span></>}<span className="border-t pt-2 font-semibold">Total</span><b className="border-t pt-2 text-right">{quote.currency} {quote.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div><div className="flex items-center justify-between text-xs text-muted-foreground"><span>Version {quote.version}{quote.sent_at ? ` · ${new Date(quote.sent_at).toLocaleDateString()}` : ''}</span></div><div className="flex gap-2">{quote.status === 'sent' && <Button className="flex-1" disabled={acceptingQuoteId === quote.id} onClick={() => void acceptQuote(quote)}>{acceptingQuoteId === quote.id ? 'Updating…' : 'Mark accepted'}</Button>}<Button asChild size="sm" variant="outline" className="flex-1"><a href={venueApi.bookingQuoteDocumentUrl(quote.token)}><Download className="mr-2 size-4" />Download PDF</a></Button></div></article>)}</div>
      </div>
    </>}
    <Dialog open={bookingPickerOpen} onOpenChange={setBookingPickerOpen}><DialogContent><DialogHeader><DialogTitle>Choose a booking</DialogTitle><DialogDescription>Select the booking this quotation should be for.</DialogDescription></DialogHeader><Select value={selectedBookingId} onValueChange={setSelectedBookingId}><SelectTrigger><SelectValue placeholder="Select a booking" /></SelectTrigger><SelectContent>{bookings.filter((booking) => booking.status !== 'cancelled').map((booking) => <SelectItem key={booking.id} value={String(booking.id)}>{booking.title || booking.event?.name || `Booking ${booking.id}`} · {booking.contact_name || booking.organizer?.name || 'Client'}</SelectItem>)}</SelectContent></Select><DialogFooter><Button variant="outline" onClick={() => setBookingPickerOpen(false)}>Cancel</Button><Button onClick={startQuote} disabled={!selectedBookingId}>Continue</Button></DialogFooter></DialogContent></Dialog>
    {quoteBooking && <VenueQuotationDialog booking={quoteBooking} open onOpenChange={(open) => { if (!open) setQuoteBooking(null) }} onSent={() => { setQuoteBooking(null); void refreshQuotes() }} />}
  </div>
}
