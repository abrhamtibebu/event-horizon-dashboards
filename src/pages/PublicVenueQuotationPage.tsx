import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download, FileCheck2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Spinner } from '@/components/ui/spinner'
import { venueApi, type Venue, type VenueBooking, type VenueBookingQuote } from '@/lib/api/venues'
import { toast } from 'sonner'

export default function PublicVenueQuotationPage() {
  const { token = '' } = useParams()
  const [quote, setQuote] = useState<VenueBookingQuote | null>(null)
  const [booking, setBooking] = useState<VenueBooking | null>(null)
  const [venue, setVenue] = useState<Venue | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [responding, setResponding] = useState(false)

  const load = () => venueApi.publicBookingQuote(token).then(({ data }) => {
    setQuote(data.quote)
    setBooking(data.booking)
    setVenue(data.venue)
  })

  useEffect(() => { load().catch(() => toast.error('Quotation link is unavailable')).finally(() => setLoading(false)) }, [token])

  const respond = async (action: 'accepted' | 'changes_requested' | 'declined') => {
    setResponding(true)
    try {
      const { data } = await venueApi.respondToBookingQuote(token, action, note.trim() || undefined)
      setQuote(data.quote)
      toast.success(action === 'accepted' ? 'Quotation accepted. The venue has been notified.' : action === 'declined' ? 'Quotation declined.' : 'Change request sent to the venue.')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not submit your response')
      load().catch(() => undefined)
    } finally { setResponding(false) }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner text="Loading quotation…" /></div>
  if (!quote || !booking || !venue) return <div className="mx-auto max-w-xl p-8 text-center"><h1 className="text-2xl font-bold">Quotation unavailable</h1><p className="mt-2 text-muted-foreground">This secure link may have expired or been replaced. Contact the venue for help.</p></div>

  const canRespond = quote.status === 'sent'
  const expired = quote.status === 'expired'
  const statusText = quote.status.replaceAll('_', ' ')
  const download = venueApi.bookingQuoteDocumentUrl(token)

  return <main className="min-h-screen bg-muted/30 px-4 py-10">
    <article className="mx-auto max-w-3xl overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-5 bg-[hsl(215,51%,20%)] p-7 text-white">
        <div className="flex items-center gap-4">{venue.logo_url ? <img src={venue.logo_url} alt="" className="size-14 rounded-lg bg-white object-contain p-1" /> : <FileCheck2 className="size-10" />}<div><h1 className="text-xl font-bold">{venue.name}</h1><p className="text-sm text-white/75">{venue.email} {venue.phone ? `· ${venue.phone}` : ''}</p></div></div>
        <div className="text-right"><p className="text-xs uppercase tracking-widest text-white/70">Proforma quotation</p><p className="font-semibold">Version {quote.version}</p></div>
      </header>
      <div className="space-y-7 p-6 sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-bold">{booking.title || booking.event?.name || 'Venue booking'}</h2><p className="mt-1 text-sm text-muted-foreground">Prepared for {booking.contact_name || booking.organizer?.name || 'Client'}</p><p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" />{venue.formatted_address || venue.city || venue.name}</p></div><div className="text-right"><span className="rounded-full bg-muted px-3 py-1 text-sm capitalize">{statusText}</span><p className="mt-3 text-xs text-muted-foreground">{quote.valid_until ? `Valid through ${new Date(`${quote.valid_until}T12:00:00`).toLocaleDateString()}` : 'No expiry specified'}</p></div></div>
        <div className="rounded-xl border p-4 text-sm"><p><b>Space:</b> {booking.space?.name || 'Venue space'}</p><p className="mt-1"><b>Booking time:</b> {new Date(booking.starts_at).toLocaleString()} – {new Date(booking.ends_at).toLocaleString()}</p></div>
        <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><thead className="bg-muted/60"><tr><th className="p-3 text-left">Description</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Unit</th><th className="p-3 text-right">Amount</th></tr></thead><tbody>{quote.items.map((item, index) => <tr key={index} className="border-t"><td className="p-3">{item.description}</td><td className="p-3 text-right">{item.quantity}</td><td className="p-3 text-right">{quote.currency} {Number(item.unit_price).toLocaleString()}</td><td className="p-3 text-right">{quote.currency} {Number(item.amount).toLocaleString()}</td></tr>)}</tbody></table></div>
        <div className="ml-auto max-w-sm space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{quote.currency} {quote.subtotal.toLocaleString()}</span></div>{quote.discount_amount > 0 && <div className="flex justify-between"><span>Discount</span><span>− {quote.currency} {quote.discount_amount.toLocaleString()}</span></div>}{quote.tax_amount > 0 && <div className="flex justify-between"><span>Tax ({quote.tax_rate}%)</span><span>{quote.currency} {quote.tax_amount.toLocaleString()}</span></div>}<div className="flex justify-between border-t pt-3 text-lg font-bold"><span>Total</span><span>{quote.currency} {quote.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>{quote.deposit_amount > 0 && <p className="text-right text-muted-foreground">Deposit requested: {quote.currency} {quote.deposit_amount.toLocaleString()}</p>}</div>
        {quote.terms && <section><h3 className="font-semibold">Terms and payment instructions</h3><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{quote.terms}</p></section>}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"><Button asChild variant="outline"><a href={download}><Download className="mr-2 size-4" />Download PDF</a></Button><p className="text-xs text-muted-foreground">Questions? Contact {venue.email || venue.phone || venue.name}.</p></div>
        {canRespond ? <section className="space-y-3 rounded-xl bg-muted/40 p-4"><h3 className="font-semibold">Respond to this quotation</h3><Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note or requested changes" rows={3} /><div className="flex flex-wrap gap-2"><Button onClick={() => respond('accepted')} disabled={responding}>Accept quotation</Button><Button variant="outline" onClick={() => respond('changes_requested')} disabled={responding}>Request changes</Button><Button variant="ghost" onClick={() => respond('declined')} disabled={responding}>Decline</Button></div></section> : <p className={`rounded-lg p-4 text-sm capitalize ${expired ? 'bg-amber-500/10 text-amber-800' : 'bg-muted text-muted-foreground'}`}>This quotation is {statusText}. {quote.response_note}</p>}
      </div>
    </article>
  </main>
}
