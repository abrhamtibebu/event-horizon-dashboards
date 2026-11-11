import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Download, FileCheck2, FileText, MapPin, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { venueApi, type Venue, type VenueBooking, type VenueCommercialDocument } from '@/lib/api/venues'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/lib/api/errorMessage'

export default function PublicVenueCommercialDocumentPage() {
  const { token = '' } = useParams()
  const [document, setDocument] = useState<VenueCommercialDocument | null>(null)
  const [booking, setBooking] = useState<VenueBooking | null>(null)
  const [venue, setVenue] = useState<Venue | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    venueApi.publicCommercialDocument(token)
      .then(({ data }) => { setDocument(data.document); setBooking(data.booking); setVenue(data.venue) })
      .catch(() => toast.error('This document link is unavailable'))
      .finally(() => setLoading(false))
  }, [token])

  const submitSignedCopy = async () => {
    if (!file) return
    setSigning(true)
    try {
      const { data } = await venueApi.signCommercialDocument(token, file)
      setDocument((current) => current ? { ...current, status: 'signed', signed_at: new Date().toISOString() } : current)
      toast.success(data.email_sent ? 'Signed contract uploaded and sent to the venue' : 'Signed contract uploaded successfully')
    } catch (error: unknown) {
      toast.error(apiErrorMessage(error, 'Could not upload the signed contract'))
    } finally { setSigning(false) }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner text="Loading document…" /></div>
  if (!document || !booking || !venue) return <main className="mx-auto max-w-xl p-8 text-center"><h1 className="text-2xl font-bold">Document unavailable</h1><p className="mt-2 text-muted-foreground">This secure link may have expired or been replaced. Contact the venue for help.</p></main>

  const isContract = document.type === 'contract'
  const downloadUrl = venueApi.commercialDocumentUrl(token)

  return <main className="min-h-screen bg-muted/30 px-4 py-10">
    <article className="mx-auto max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-5 bg-[hsl(215,51%,20%)] p-7 text-white">
        <div className="flex items-center gap-4">{venue.logo_url ? <img src={venue.logo_url} alt="" className="size-14 rounded-lg bg-white object-contain p-1" /> : isContract ? <FileCheck2 className="size-10" /> : <FileText className="size-10" />}<div><h1 className="text-xl font-bold">{venue.name}</h1><p className="text-sm text-white/75">{venue.email} {venue.phone ? `· ${venue.phone}` : ''}</p></div></div>
        <div className="text-right"><p className="text-xs uppercase tracking-widest text-white/70">{isContract ? 'Venue contract' : 'Invoice'}</p><p className="font-semibold">{document.number}</p></div>
      </header>
      <div className="space-y-6 p-6 sm:p-9">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-2xl font-bold">{booking.title || booking.event?.name || 'Venue booking'}</h2><p className="mt-1 text-sm text-muted-foreground">Prepared for {booking.contact_name || booking.organizer?.name || 'Client'}</p><p className="mt-2 inline-flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-4" />{venue.formatted_address || venue.city || venue.name}</p></div><div className="text-right"><span className="rounded-full bg-muted px-3 py-1 text-sm capitalize">{document.status.replaceAll('_', ' ')}</span><p className="mt-3 text-xs text-muted-foreground">Issued {new Date(document.issued_at).toLocaleDateString()}{document.due_at ? ` · Due ${new Date(`${document.due_at}T12:00:00`).toLocaleDateString()}` : ''}</p></div></div>
        <div className="rounded-xl border p-4 text-sm"><p><b>Document:</b> {document.number}</p><p className="mt-1"><b>Space:</b> {booking.space?.name || 'Venue space'}</p><p className="mt-1"><b>Booking time:</b> {new Date(booking.starts_at).toLocaleString()} – {new Date(booking.ends_at).toLocaleString()}</p><div className="ml-auto mt-5 max-w-sm space-y-2 border-t pt-4">{document.snapshot?.subtotal != null && <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{document.currency} {Number(document.snapshot.subtotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}{Number(document.snapshot?.discount_amount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>− {document.currency} {Number(document.snapshot?.discount_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}{Number(document.snapshot?.tax_amount) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">{document.snapshot?.tax_rate != null ? `Tax (${document.snapshot.tax_rate}%)` : 'Tax'}</span><span>{document.currency} {Number(document.snapshot?.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>}<div className="flex justify-between border-t pt-3 text-base font-bold"><span>Total due</span><span>{document.currency} {document.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>{Number(document.snapshot?.deposit_amount) > 0 && <p className="text-right text-xs text-muted-foreground">Deposit requested: {document.currency} {Number(document.snapshot?.deposit_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>}</div></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"><Button asChild variant="outline"><a href={downloadUrl}><Download className="mr-2 size-4" />Download PDF</a></Button><p className="text-xs text-muted-foreground">Questions? Contact {venue.email || venue.phone || venue.name}.</p></div>
        {isContract && document.status === 'awaiting_signature' ? <section className="space-y-3 rounded-xl bg-muted/40 p-4"><h3 className="font-semibold">Return the signed contract</h3><p className="text-sm text-muted-foreground">Download the agreement, sign it, then upload the signed PDF. The venue will receive the signed copy.</p><input className="block w-full text-sm" type="file" accept="application/pdf,.pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} /><Button onClick={submitSignedCopy} disabled={!file || signing}><Upload className="mr-2 size-4" />{signing ? 'Uploading…' : 'Upload signed contract'}</Button></section> : null}
        {isContract && document.status === 'signed' ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-emerald-500/10 p-4"><p className="text-sm text-emerald-800 dark:text-emerald-300">Signed contract received {document.signed_at ? new Date(document.signed_at).toLocaleDateString() : ''}.</p><Button asChild size="sm" variant="outline"><a href={venueApi.signedCommercialDocumentUrl(token)}><Download className="mr-2 size-4" />Signed copy</a></Button></div> : null}
      </div>
    </article>
  </main>
}
