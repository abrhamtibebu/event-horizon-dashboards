import { useCallback, useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Copy, Download, FileCheck2, FileText, Plus, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { venueApi, type VenueBooking, type VenueBookingQuote, type VenueCommercialDocument } from '@/lib/api/venues'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/lib/api/errorMessage'

type DocumentType = 'contract' | 'invoice'
type BookingDocuments = { booking: VenueBooking; document?: VenueCommercialDocument; acceptedQuote?: VenueBookingQuote }

export default function VenueCommercialDocumentsPage({ type }: { type: DocumentType }) {
  const [rows, setRows] = useState<BookingDocuments[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [dueDate, setDueDate] = useState('')
  const isInvoice = type === 'invoice'
  const title = isInvoice ? 'Invoices' : 'Contracts'
  const Icon = isInvoice ? FileText : FileCheck2

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data: bookings } = await venueApi.bookings()
      const bookingRows = await Promise.all(bookings.map(async (booking) => {
        try {
          const [documents, quotes] = await Promise.all([venueApi.commercialDocuments(booking.id), venueApi.bookingQuotes(booking.id)])
          return {
            booking,
            document: documents.data.find((item) => item.type === type),
            acceptedQuote: quotes.data.find((quote) => quote.status === 'accepted'),
          }
        } catch {
          return { booking }
        }
      }))
      setRows(bookingRows.sort((a, b) => new Date(b.booking.starts_at).getTime() - new Date(a.booking.starts_at).getTime()))
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, `Could not load ${title.toLowerCase()}`))
    } finally {
      setLoading(false)
    }
  }, [type, title])

  useEffect(() => { void load() }, [load])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return rows.filter(({ booking }) => !query || [booking.title, booking.event?.name, booking.contact_name, booking.organizer?.name, booking.space?.name].filter(Boolean).join(' ').toLowerCase().includes(query))
  }, [rows, search])

  const issue = async ({ booking, acceptedQuote }: BookingDocuments) => {
    if (!acceptedQuote) return
    setBusyId(booking.id)
    try {
      const { data } = await venueApi.issueCommercialDocument(booking.id, {
        type,
        quote_id: acceptedQuote.id,
        ...(isInvoice && dueDate ? { due_at: new Date(`${dueDate}T23:59:59`).toISOString() } : {}),
      })
      toast.success(data.email_sent ? `${title.slice(0, -1)} sent to the client` : data.message || `${title.slice(0, -1)} created`)
      await load()
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, `Could not issue ${type}`))
    } finally {
      setBusyId(null)
    }
  }

  const copyLink = async (document: VenueCommercialDocument) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/venue/document/${document.token}`)
      toast.success('Client link copied')
    } catch {
      toast.error('Could not access clipboard')
    }
  }

  const documents = rows.flatMap((row) => row.document ? [row.document] : [])
  const outstanding = documents.filter((document) => isInvoice ? document.status !== 'paid' : document.status !== 'signed').length

  return <div className="space-y-6">
    <VenuePageHeader icon={Icon} title={title} subtitle={isInvoice ? 'Issue and track invoices from accepted booking quotations.' : 'Create and track agreements for accepted booking quotations.'} />

    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border bg-card p-4"><p className="text-sm text-muted-foreground">Issued</p><p className="mt-1 text-2xl font-semibold">{documents.length}</p></div>
      <div className="rounded-2xl border bg-card p-4"><p className="text-sm text-muted-foreground">{isInvoice ? 'Outstanding' : 'Awaiting signature'}</p><p className="mt-1 text-2xl font-semibold">{outstanding}</p></div>
      <div className="rounded-2xl border bg-card p-4"><p className="text-sm text-muted-foreground">Ready to issue</p><p className="mt-1 text-2xl font-semibold">{rows.filter((row) => row.acceptedQuote && !row.document).length}</p></div>
    </div>

    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 className="font-semibold">Booking documents</h2><p className="text-sm text-muted-foreground">Documents can be issued once a client accepts a quotation.</p></div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {isInvoice ? <Input aria-label="Invoice due date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="sm:w-44" /> : null}
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search bookings" className="pl-9 sm:w-56" /></div>
      </div>
    </div>

    {loading ? <div className="flex h-48 items-center justify-center"><Spinner text={`Loading ${title.toLowerCase()}…`} /></div> : filtered.length === 0 ? (
      <VenueEmptyState icon={Icon} title={rows.length ? 'No bookings match your search' : `No ${title.toLowerCase()} yet`} description={rows.length ? 'Try another booking or client name.' : 'Accepted booking quotations will appear here, ready for document issuance.'} />
    ) : <div className="space-y-3">
      {filtered.map((row) => {
        const booking = row.booking
        const document = row.document
        const bookingTitle = booking.title || booking.event?.name || 'Venue booking'
        return <article key={booking.id} className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{bookingTitle}</h3>{document ? <Badge variant="outline" className="capitalize">{document.status.replaceAll('_', ' ')}</Badge> : null}</div>
              <p className="mt-1 text-sm text-muted-foreground">{booking.space?.name || 'Venue space'} · {format(new Date(booking.starts_at), 'MMM d, yyyy')} · {booking.contact_name || booking.organizer?.name || 'No client contact'}</p>
              {document ? <><p className="mt-2 text-sm"><span className="font-medium">{document.number}</span><span className="text-muted-foreground"> · {document.currency} {Number(document.amount).toLocaleString()} · issued {format(new Date(document.issued_at), 'MMM d, yyyy')}</span></p><p className="mt-1 text-xs text-muted-foreground">Subtotal {document.currency} {Number(document.snapshot?.subtotal ?? document.amount).toLocaleString()}{Number(document.snapshot?.discount_amount) > 0 ? ` · Discount −${document.currency} ${Number(document.snapshot?.discount_amount).toLocaleString()}` : ''}{Number(document.snapshot?.tax_amount) > 0 ? ` · Tax ${document.snapshot?.tax_rate || 0}% (${document.currency} ${Number(document.snapshot?.tax_amount).toLocaleString()})` : ''}</p></> : row.acceptedQuote ? <div className="mt-2 space-y-1 text-xs text-emerald-700 dark:text-emerald-400"><p>Accepted quotation · Total {row.acceptedQuote.currency} {Number(row.acceptedQuote.total).toLocaleString()}</p><p className="text-muted-foreground">Subtotal {row.acceptedQuote.currency} {Number(row.acceptedQuote.subtotal).toLocaleString()}{row.acceptedQuote.discount_amount > 0 ? ` · Discount −${row.acceptedQuote.currency} ${Number(row.acceptedQuote.discount_amount).toLocaleString()}` : ''}{row.acceptedQuote.tax_amount > 0 ? ` · Tax ${row.acceptedQuote.tax_rate}% (${row.acceptedQuote.currency} ${Number(row.acceptedQuote.tax_amount).toLocaleString()})` : ''}</p></div> : <p className="mt-2 text-xs text-muted-foreground">Waiting for an accepted quotation</p>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {document ? <>
                <Button asChild size="sm" variant="outline"><a href={venueApi.commercialDocumentUrl(document.token)}><Download className="mr-2 size-4" />PDF</a></Button>
                <Button size="sm" variant="ghost" onClick={() => void copyLink(document)}><Copy className="mr-2 size-4" />Client link</Button>
                {isInvoice && document.status !== 'paid' && document.due_at ? <span className="self-center text-xs text-muted-foreground">Due {format(new Date(document.due_at), 'MMM d, yyyy')}</span> : null}
              </> : <Button size="sm" onClick={() => void issue(row)} disabled={!row.acceptedQuote || busyId === booking.id}><Plus className="mr-2 size-4" />{busyId === booking.id ? 'Issuing…' : `Issue ${type}`}</Button>}
            </div>
          </div>
        </article>
      })}
    </div>}
  </div>
}
