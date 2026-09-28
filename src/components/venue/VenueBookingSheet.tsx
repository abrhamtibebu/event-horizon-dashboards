import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { venueApi, type VenueBooking, type VenueSpacePackage } from '@/lib/api/venues'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { bookingSourceLabel, bookingTitle } from './bookingLabels'
import { VenueStatusBadge } from './VenueStatusBadge'

const balanceClass: Record<string, string> = {
  unquoted: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  unpaid: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  partial: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
}

function money(amount?: number | null, currency = 'ETB') {
  if (amount == null || Number.isNaN(Number(amount))) return '—'
  return `${currency} ${Number(amount).toLocaleString()}`
}

export function VenueBookingSheet({
  booking,
  onOpenChange,
  onChanged,
}: {
  booking: VenueBooking | null
  onOpenChange: (open: boolean) => void
  onChanged: (booking: VenueBooking) => void
}) {
  const [current, setCurrent] = useState<VenueBooking | null>(booking)
  const [reply, setReply] = useState('')
  const [replySubject, setReplySubject] = useState('')
  const [replying, setReplying] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [packages, setPackages] = useState<VenueSpacePackage[]>([])
  const [quotePackage, setQuotePackage] = useState('custom')
  const [quoteAmount, setQuoteAmount] = useState('')
  const [quoteCurrency, setQuoteCurrency] = useState('ETB')
  const [savingQuote, setSavingQuote] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('cash')
  const [payReference, setPayReference] = useState('')
  const [payDate, setPayDate] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)

  useEffect(() => {
    setCurrent(booking)
    setReply('')
    setReplySubject(booking ? `Re: ${bookingTitle(booking)}` : '')
  }, [booking])

  useEffect(() => {
    if (!current) return
    setQuotePackage(current.package_id ? String(current.package_id) : 'custom')
    setQuoteAmount(current.quoted_amount != null ? String(current.quoted_amount) : '')
    setQuoteCurrency(current.currency || 'ETB')
  }, [current])

  useEffect(() => {
    if (!current?.space_id) {
      setPackages([])
      return
    }
    venueApi
      .packages(current.space_id)
      .then((res) => setPackages(res.data))
      .catch(() => setPackages(current.space?.packages || []))
  }, [current?.space_id, current?.space?.packages])

  const applyBooking = (next: VenueBooking) => {
    setCurrent(next)
    onChanged(next)
  }

  const setStatus = async (next: string) => {
    if (!current) return
    setUpdating(true)
    try {
      const res = await venueApi.updateBooking(current.id, { status: next })
      applyBooking(res.data)
      toast.success(`Booking ${next}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not update booking')
    } finally {
      setUpdating(false)
    }
  }

  const sendReply = async () => {
    if (!current || !reply.trim()) return
    setReplying(true)
    try {
      const res = await venueApi.replyBooking(current.id, {
        message: reply.trim(),
        subject: replySubject.trim() || undefined,
      })
      const next = res.data.booking as VenueBooking
      setCurrent(next)
      setReply('')
      onChanged(next)
      toast.success('Reply sent')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not send reply')
    } finally {
      setReplying(false)
    }
  }

  const saveQuote = async () => {
    if (!current) return
    setSavingQuote(true)
    try {
      const payload: Record<string, unknown> = {
        currency: (quoteCurrency || 'ETB').toUpperCase(),
        package_id: quotePackage === 'custom' ? null : Number(quotePackage),
        quoted_amount: quoteAmount.trim() === '' ? null : Number(quoteAmount),
      }
      const res = await venueApi.updateBooking(current.id, payload)
      applyBooking(res.data)
      toast.success('Quote saved')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not save quote')
    } finally {
      setSavingQuote(false)
    }
  }

  const recordPayment = async () => {
    if (!current || !payAmount) {
      toast.error('Amount is required')
      return
    }
    setSavingPayment(true)
    try {
      const res = await venueApi.recordPayment(current.id, {
        amount: Number(payAmount),
        method: payMethod,
        reference: payReference.trim() || undefined,
        paid_at: payDate || undefined,
      })
      applyBooking(res.data)
      setPayAmount('')
      setPayReference('')
      setPayDate('')
      toast.success('Payment recorded')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not record payment')
    } finally {
      setSavingPayment(false)
    }
  }

  const removePayment = async (paymentId: number) => {
    if (!current || !window.confirm('Remove this payment?')) return
    try {
      const res = await venueApi.deletePayment(current.id, paymentId)
      applyBooking(res.data)
      toast.success('Payment removed')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not remove payment')
    }
  }

  const balance = current?.balance_status || 'unquoted'
  const currency = current?.currency || quoteCurrency || 'ETB'

  return (
    <Sheet open={!!booking} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        {current ? (
          <>
            <SheetHeader>
              <SheetTitle>{bookingTitle(current)}</SheetTitle>
              <SheetDescription>
                {bookingSourceLabel(current.source)} · {current.space?.name || 'Space'}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">When</p>
                <p className="font-medium">
                  {format(new Date(current.starts_at), 'MMM d, yyyy HH:mm')} –{' '}
                  {format(new Date(current.ends_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <VenueStatusBadge status={current.status} />
                  <Badge variant="outline" className={cn('capitalize', balanceClass[balance])}>
                    {balance}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Contact</p>
                <p className="font-medium">{current.contact_name || current.organizer?.name || '—'}</p>
                <p>{current.contact_email || '—'}</p>
                <p>{current.contact_phone || '—'}</p>
              </div>
              {current.notes ? (
                <div>
                  <p className="text-muted-foreground">Notes</p>
                  <p className="whitespace-pre-wrap">{current.notes}</p>
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {current.status === 'pending' && (
                  <>
                    <Button size="sm" disabled={updating} onClick={() => setStatus('confirmed')}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="outline" disabled={updating} onClick={() => setStatus('cancelled')}>
                      Reject
                    </Button>
                  </>
                )}
                {current.status === 'confirmed' && (
                  <>
                    <Button size="sm" variant="outline" disabled={updating} onClick={() => setStatus('completed')}>
                      Mark completed
                    </Button>
                    <Button size="sm" variant="outline" disabled={updating} onClick={() => setStatus('cancelled')}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium">Quote</p>
                  <p className="text-right text-muted-foreground">
                    Paid {money(current.paid_total ?? 0, currency)}
                    {current.quoted_amount != null ? ` of ${money(current.quoted_amount, currency)}` : ''}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Package</Label>
                  <Select
                    value={quotePackage}
                    onValueChange={(value) => {
                      setQuotePackage(value)
                      if (value === 'custom') return
                      const selected = packages.find((pkg) => String(pkg.id) === value)
                      if (selected) {
                        setQuoteAmount(String(selected.price))
                        setQuoteCurrency(selected.currency || 'ETB')
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Custom amount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom amount</SelectItem>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={String(pkg.id)}>
                          {pkg.name} · {pkg.currency || 'ETB'} {Number(pkg.price).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[1fr_88px] gap-2">
                  <div className="space-y-1">
                    <Label>Amount</Label>
                    <Input type="number" min="0" value={quoteAmount} onChange={(e) => setQuoteAmount(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Currency</Label>
                    <Input
                      maxLength={3}
                      value={quoteCurrency}
                      onChange={(e) => setQuoteCurrency(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
                <Button size="sm" variant="outline" disabled={savingQuote} onClick={saveQuote}>
                  {savingQuote ? 'Saving…' : 'Save quote'}
                </Button>
              </div>

              <div className="space-y-3 border-t border-border pt-4">
                <p className="font-medium">Payments</p>
                {(current.payments ?? []).length === 0 ? (
                  <p className="text-muted-foreground">No payments recorded yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {(current.payments ?? []).map((payment) => (
                      <li key={payment.id} className="flex items-start justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2">
                        <div>
                          <p className="font-medium capitalize">
                            {payment.method} · {money(payment.amount, currency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(payment.paid_at), 'MMM d, yyyy')}
                            {payment.reference ? ` · ${payment.reference}` : ''}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => removePayment(payment.id)}>
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Amount</Label>
                    <Input type="number" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Method</Label>
                    <Select value={payMethod} onValueChange={setPayMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                        <SelectItem value="chapa">Chapa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Reference</Label>
                    <Input value={payReference} onChange={(e) => setPayReference(e.target.value)} placeholder="Receipt or tx ref" />
                  </div>
                  <div className="space-y-1">
                    <Label>Paid on</Label>
                    <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
                  </div>
                </div>
                <Button size="sm" disabled={savingPayment} onClick={recordPayment}>
                  {savingPayment ? 'Saving…' : 'Record payment'}
                </Button>
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <Label>Reply by email</Label>
                <Input placeholder="Subject" value={replySubject} onChange={(e) => setReplySubject(e.target.value)} />
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
  )
}
