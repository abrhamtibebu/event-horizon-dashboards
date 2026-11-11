import { useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import { Download, Plus, Send, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { venueApi, type Venue, type VenueBooking, type VenueBookingQuote } from '@/lib/api/venues'
import { bookingDateRange } from '@/components/venue/bookingLabels'
import { toast } from 'sonner'
import { apiErrorMessage } from '@/lib/api/errorMessage'

type QuoteLine = { description: string; quantity: string; unit_price: string }

function asDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export function VenueQuotationDialog({
  booking,
  open,
  onOpenChange,
  onSent,
}: {
  booking: VenueBooking
  open: boolean
  onOpenChange: (open: boolean) => void
  onSent: (booking: VenueBooking) => void
}) {
  const [venue, setVenue] = useState<Venue | null>(null)
  const [history, setHistory] = useState<VenueBookingQuote[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [lines, setLines] = useState<QuoteLine[]>([{ description: `Venue hire - ${booking.space?.name || 'Space'}`, quantity: '1', unit_price: String(booking.quoted_amount ?? booking.package?.price ?? '') }])
  const [discount, setDiscount] = useState('0')
  const [taxRate, setTaxRate] = useState('0')
  const [deposit, setDeposit] = useState('0')
  const [validUntil, setValidUntil] = useState('')
  const [terms, setTerms] = useState('')
  const [currency, setCurrency] = useState(booking.currency || 'ETB')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    setLines([{ description: `Venue hire - ${booking.space?.name || 'Space'}`, quantity: '1', unit_price: String(booking.quoted_amount ?? booking.package?.price ?? '') }])
    setCurrency(booking.currency || 'ETB')
    setDiscount('0')
    setTaxRate(String(booking.space?.pricing_details?.tax_percent ?? '0'))
    setDeposit('0')
    setValidUntil('')
    setTerms('')
  }, [booking.id, booking.currency, booking.package?.price, booking.quoted_amount, booking.space?.name, booking.space?.pricing_details?.tax_percent])

  useEffect(() => {
    if (!open) return
    setHistoryLoading(true)
    venueApi.profile().then(({ data }) => setVenue(data)).catch(() => undefined)
    venueApi.bookingQuotes(booking.id).then(({ data }) => setHistory(data)).catch(() => setHistory([])).finally(() => setHistoryLoading(false))
  }, [open, booking.id])

  const subtotal = useMemo(() => Math.round(lines.reduce((sum, line) => {
    const quantity = Math.round((Number(line.quantity) || 0) * 100) / 100
    const unitPrice = Math.round((Number(line.unit_price) || 0) * 100) / 100
    return sum + Math.round(quantity * unitPrice * 100) / 100
  }, 0) * 100) / 100, [lines])
  const discountValue = Math.round((Number(discount) || 0) * 100) / 100
  const normalizedTaxRate = Math.round((Number(taxRate) || 0) * 100) / 100
  const depositValue = Math.round((Number(deposit) || 0) * 100) / 100
  const taxValue = Math.round(Math.max(0, subtotal - discountValue) * normalizedTaxRate) / 100
  const total = Math.max(0, Math.round((subtotal - discountValue + taxValue) * 100) / 100)
  const discountsEnabled = booking.space?.pricing_details?.allow_discounts !== false
  const nextVersion = Math.max(0, ...history.map((quote) => quote.version)) + 1

  const buildPdf = async (items: Array<{ description: string; quantity: number; unit_price: number; amount: number }>) => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    let fontName = 'helvetica'
    try {
      const response = await fetch('/fonts/AbyssinicaSIL-Regular.ttf')
      if (response.ok) {
        const bytes = new Uint8Array(await response.arrayBuffer())
        let binary = ''
        for (let offset = 0; offset < bytes.length; offset += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
        }
        pdf.addFileToVFS('AbyssinicaSIL-Regular.ttf', btoa(binary))
        pdf.addFont('AbyssinicaSIL-Regular.ttf', 'Abyssinica', 'normal')
        fontName = 'Abyssinica'
      }
    } catch { /* Use jsPDF's built-in font when the Ethiopic font is unavailable. */ }
    const setPdfFont = (bold = false) => pdf.setFont(fontName, fontName === 'Abyssinica' ? 'normal' : bold ? 'bold' : 'normal')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 42
    pdf.setFillColor(25, 48, 77)
    pdf.rect(0, 0, pageWidth, 122, 'F')
    let textX = margin
    if (venue?.logo_url) {
      try {
        const logoData = await asDataUrl(await fetch(venue.logo_url).then((response) => response.blob()))
        pdf.addImage(logoData, 'PNG', margin, 30, 54, 54, undefined, 'FAST')
        textX = margin + 68
      } catch { /* Keep the text brand if a remote logo is unavailable. */ }
    }
    pdf.setTextColor(255, 255, 255)
    setPdfFont(true)
    pdf.setFontSize(20)
    pdf.text(venue?.name || 'Venue', textX, 48)
    setPdfFont()
    pdf.setFontSize(9)
    pdf.text([venue?.email, venue?.phone, venue?.formatted_address || venue?.city].filter(Boolean).join('  |  '), textX, 66, { maxWidth: pageWidth - textX - margin })
    setPdfFont(true)
    pdf.setFontSize(16)
    pdf.text('PROFORMA QUOTATION', margin, 158)
    setPdfFont()
    pdf.setFontSize(10)
    pdf.setTextColor(65, 75, 90)
    pdf.text(`Version ${nextVersion}  |  Prepared ${new Date().toLocaleDateString()}`, margin, 178)
    pdf.text(`Valid until ${validUntil || 'as agreed with venue'}`, pageWidth - margin, 178, { align: 'right' })
    setPdfFont(true)
    pdf.setTextColor(30, 40, 55)
    pdf.text('Prepared for', margin, 215)
    setPdfFont()
    pdf.text(booking.contact_name || booking.organizer?.name || 'Client', margin, 232)
    pdf.text(booking.contact_email || '', margin, 247)
    pdf.text(`Event: ${booking.title || booking.event?.name || 'Event booking'}`, pageWidth / 2, 232, { maxWidth: pageWidth / 2 - margin })
    pdf.text(`Space: ${booking.space?.name || 'Venue space'}`, pageWidth / 2, 247)
    pdf.text(`Date: ${bookingDateRange(booking.starts_at, booking.ends_at)}`, pageWidth / 2, 262, { maxWidth: pageWidth / 2 - margin })
    let y = 300
    const right = pageWidth - margin
    pdf.setFillColor(239, 243, 248)
    pdf.rect(margin, y - 16, pageWidth - margin * 2, 27, 'F')
    pdf.setFont('helvetica', 'bold')
    pdf.text('Description', margin + 8, y)
    pdf.text('Qty', right - 170, y, { align: 'right' })
    pdf.text('Unit price', right - 88, y, { align: 'right' })
    pdf.text('Amount', right - 8, y, { align: 'right' })
    y += 30
    pdf.setFont('helvetica', 'normal')
    for (const item of items) {
      if (y > 720) { pdf.addPage(); y = 60 }
      const desc = pdf.splitTextToSize(item.description, pageWidth - margin * 2 - 210)
      pdf.text(desc, margin + 8, y)
      pdf.text(String(item.quantity), right - 170, y, { align: 'right' })
      pdf.text(`${currency} ${item.unit_price.toLocaleString()}`, right - 88, y, { align: 'right' })
      pdf.text(`${currency} ${item.amount.toLocaleString()}`, right - 8, y, { align: 'right' })
      y += Math.max(24, desc.length * 12 + 10)
      pdf.setDrawColor(225, 230, 236)
      pdf.line(margin, y - 8, right, y - 8)
    }
    y += 12
    const row = (label: string, amount: number, bold = false) => {
      setPdfFont(bold)
      pdf.text(label, right - 165, y)
      pdf.text(`${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, right - 8, y, { align: 'right' })
      y += 19
    }
    row('Subtotal', subtotal)
    if (discountValue) row('Discount', -discountValue)
    if (Number(taxRate)) row(`Tax (${Number(taxRate)}%)`, taxValue)
    row('Total', total, true)
    if (depositValue) row('Deposit requested', depositValue)
    y += 10
    if (terms.trim()) {
      setPdfFont(true); pdf.text('Terms and payment instructions', margin, y); y += 16
      setPdfFont()
      pdf.text(pdf.splitTextToSize(terms.trim(), pageWidth - margin * 2), margin, y)
    }
    pdf.setFontSize(8)
    pdf.setTextColor(110, 120, 130)
    pdf.text(`Booking ${booking.id} - quotation version ${nextVersion} - ${venue?.name || 'venue'}`, margin, 810)
    return pdf.output('blob')
  }

  const send = async () => {
    if (lines.some((line) => !line.description.trim() || Number(line.quantity) <= 0 || Number(line.unit_price) < 0)) {
      toast.error('Complete each quotation line with a description, quantity and price.')
      return
    }
    if (discountValue > subtotal || depositValue > total) {
      toast.error('Discount or deposit is greater than the quotation total.')
      return
    }
    setSending(true)
    try {
      const items = lines.map((line) => {
        const quantity = Math.round(Number(line.quantity) * 100) / 100
        const unit_price = Math.round(Number(line.unit_price) * 100) / 100
        return { description: line.description.trim(), quantity, unit_price, amount: Math.round(quantity * unit_price * 100) / 100 }
      })
      const pdfBlob = await buildPdf(items)
      const form = new FormData()
      form.append('version', String(nextVersion))
      form.append('items', JSON.stringify(items))
      form.append('discount_amount', String(discountValue))
      form.append('tax_rate', String(normalizedTaxRate))
      form.append('deposit_amount', String(depositValue))
      form.append('currency', currency.toUpperCase())
      if (validUntil) form.append('valid_until', validUntil)
      if (terms.trim()) form.append('terms', terms.trim())
      form.append('document', pdfBlob, `quotation-${booking.id}.pdf`)
      const { data } = await venueApi.sendBookingQuote(booking.id, form)
      setHistory((current) => [data.quote, ...current.map((quote) => quote.status === 'sent' ? { ...quote, status: 'superseded' as const } : quote)])
      onSent(data.booking)
      toast.success('Branded quotation sent to the client')
      onOpenChange(false)
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Could not send quotation'))
    } finally {
      setSending(false)
    }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader><DialogTitle>Create proforma quotation</DialogTitle><DialogDescription>A numbered, branded PDF will be emailed to {booking.contact_email || 'the client'} and saved in this booking’s history.</DialogDescription></DialogHeader>
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-semibold">Line items</h3><Button size="sm" variant="outline" onClick={() => setLines((current) => [...current, { description: '', quantity: '1', unit_price: '0' }])}><Plus className="mr-1 size-4" />Add item</Button></div>
          {lines.map((line, index) => <div key={index} className="grid grid-cols-[minmax(0,1fr)_84px_120px_36px] gap-2 items-end">
            <div className="space-y-1"><Label>Description</Label><Input value={line.description} onChange={(event) => setLines((current) => current.map((entry, i) => i === index ? { ...entry, description: event.target.value } : entry))} /></div>
            <div className="space-y-1"><Label>Qty</Label><Input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(event) => setLines((current) => current.map((entry, i) => i === index ? { ...entry, quantity: event.target.value } : entry))} /></div>
            <div className="space-y-1"><Label>Unit price</Label><Input type="number" min="0" step="0.01" value={line.unit_price} onChange={(event) => setLines((current) => current.map((entry, i) => i === index ? { ...entry, unit_price: event.target.value } : entry))} /></div>
            <Button aria-label="Remove line" variant="ghost" size="icon" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, i) => i !== index))}><Trash2 className="size-4" /></Button>
          </div>)}
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1"><Label>Discount amount</Label><Input type="number" min="0" step="0.01" value={discount} disabled={!discountsEnabled} onChange={(e) => setDiscount(e.target.value)} />{!discountsEnabled && <p className="text-[11px] text-muted-foreground">Disabled for this space</p>}</div>
          <div className="space-y-1"><Label>Tax %</Label><Input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} /></div>
          <div className="space-y-1"><Label>Deposit</Label><Input type="number" min="0" step="0.01" value={deposit} onChange={(e) => setDeposit(e.target.value)} /></div>
          <div className="space-y-1"><Label>Currency</Label><Input maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1"><Label>Valid until</Label><Input type="date" min={new Date().toISOString().slice(0, 10)} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} /></div>
          <div className="flex items-end justify-between rounded-lg bg-muted/60 px-4 py-2"><span className="font-medium">Quotation total</span><span className="text-lg font-bold">{currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
        </div>
        <div className="space-y-1"><Label>Terms and payment instructions</Label><Textarea rows={3} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Deposit schedule, cancellation policy, payment instructions…" /></div>
        {history.length > 0 && <section className="space-y-2 border-t pt-4"><h3 className="font-semibold">Quote history</h3>{history.map((quote) => <div key={quote.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"><div><p>Version {quote.version} · {quote.sent_at ? new Date(quote.sent_at).toLocaleDateString() : 'Not sent'}</p><p className="capitalize text-muted-foreground">{quote.currency} {quote.total.toLocaleString()} · {quote.status.replace('_', ' ')}</p></div><Button asChild size="sm" variant="outline"><a href={venueApi.bookingQuoteDocumentUrl(quote.token)}><Download className="mr-2 size-4" />Download PDF</a></Button></div>)}</section>}
      </div>
      <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={send} disabled={sending || historyLoading || !venue}><Send className="mr-2 size-4" />{sending ? 'Sending…' : historyLoading ? 'Loading quote history…' : 'Generate PDF & send'}</Button></DialogFooter>
    </DialogContent>
  </Dialog>
}
