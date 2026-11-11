import { useEffect, useState } from 'react'
import { addDays, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { venueApi, type VenueBooking, type VenueCommercialDocument } from '@/lib/api/venues'
import { toast } from 'sonner'
import { bookingDateRange, bookingSourceLabel, bookingTitle, PENDING_HOLD_DAYS } from './bookingLabels'
import { VenueStatusBadge } from './VenueStatusBadge'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  const [updating, setUpdating] = useState(false)
  const [commercialDocuments, setCommercialDocuments] = useState<VenueCommercialDocument[]>([])
  const [acceptedQuoteId, setAcceptedQuoteId] = useState<number | null>(null)
  const [acceptedDeposit, setAcceptedDeposit] = useState(0)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [manualConfirmOpen, setManualConfirmOpen] = useState(false)
  const { hasRole } = usePermissionCheck()
  const canManuallyConfirm = hasRole(['admin', 'superadmin', 'venue_admin', 'venue_manager'])

  useEffect(() => {
    setCurrent(booking)
    setManualConfirmOpen(false)
  }, [booking])

  useEffect(() => {
    if (!current) {
      setCommercialDocuments([])
      setAcceptedQuoteId(null)
      setAcceptedDeposit(0)
      return
    }
    let active = true
    const refreshCommercialState = () => {
      setDocumentsLoading(true)
      Promise.all([venueApi.commercialDocuments(current.id), venueApi.bookingQuotes(current.id)])
        .then(([documents, quotes]) => {
          if (!active) return
          setCommercialDocuments(documents.data)
          const accepted = quotes.data.find((quote) => quote.status === 'accepted')
          setAcceptedQuoteId(accepted?.id ?? null)
          setAcceptedDeposit(Number(accepted?.deposit_amount ?? 0))
        })
        .catch(() => undefined)
        .finally(() => { if (active) setDocumentsLoading(false) })
    }
    refreshCommercialState()
    const intervalId = window.setInterval(refreshCommercialState, 15000)
    window.addEventListener('focus', refreshCommercialState)
    return () => {
      active = false
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshCommercialState)
    }
  }, [current?.id])


  const applyBooking = (next: VenueBooking) => {
    setCurrent(next)
    onChanged(next)
    Promise.all([venueApi.commercialDocuments(next.id), venueApi.bookingQuotes(next.id)])
      .then(([documents, quotes]) => {
        setCommercialDocuments(documents.data)
        const accepted = quotes.data.find((quote) => quote.status === 'accepted')
        setAcceptedQuoteId(accepted?.id ?? null)
        setAcceptedDeposit(Number(accepted?.deposit_amount ?? 0))
      })
      .catch(() => undefined)
  }

  const signedAcceptedContract = commercialDocuments.some((document) =>
    document.type === 'contract' && document.venue_booking_quote_id === acceptedQuoteId && document.status === 'signed')
  const depositDue = Math.max(0, acceptedDeposit - Number(current?.paid_total ?? 0))
  const confirmationBlockers = [
    !acceptedQuoteId ? 'Client acceptance of a quotation is required.' : null,
    acceptedQuoteId && !signedAcceptedContract ? 'The accepted quotation contract must be signed.' : null,
    acceptedQuoteId && depositDue > 0.001 ? `Required deposit outstanding: ${money(depositDue, current?.currency || 'ETB')}.` : null,
  ].filter(Boolean) as string[]
  const setStatus = async (next: string, manualConfirmation = false) => {
    if (!current) return
    setUpdating(true)
    try {
      const res = manualConfirmation
        ? await venueApi.manuallyConfirmBooking(current.id)
        : await venueApi.updateBooking(current.id, { status: next })
      applyBooking(res.data)
      setManualConfirmOpen(false)
      toast.success(`Booking ${next}`)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not update booking')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Dialog open={!!booking} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {current ? (
          <>
            <DialogHeader>
              <DialogTitle>{bookingTitle(current)}</DialogTitle>
              <DialogDescription>
                {bookingSourceLabel(current.source)} · {current.space?.name || 'Space'}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">When</p>
                <p className="font-medium">
                  {bookingDateRange(current.starts_at, current.ends_at)}
                </p>
                {current.status === 'pending' && current.created_at ? <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">7-day hold ends {format(addDays(new Date(current.created_at), PENDING_HOLD_DAYS), 'MMM d, yyyy HH:mm')}</p> : null}
              </div>
              <div>
                <p className="text-muted-foreground">Event status</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <VenueStatusBadge status={current.status} />
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
              {current.event_type || current.expected_attendance || current.event_requirements ? (
                <div className="space-y-2 rounded-lg bg-muted/40 p-3">
                  <p className="text-sm font-semibold">Event requirements</p>
                  {current.event_type ? <p className="text-sm"><span className="text-muted-foreground">Type: </span>{current.event_type}</p> : null}
                  {current.expected_attendance ? <p className="text-sm"><span className="text-muted-foreground">Expected attendance: </span>{current.expected_attendance.toLocaleString()}</p> : null}
                  {current.event_requirements ? <p className="whitespace-pre-wrap text-sm">{current.event_requirements}</p> : null}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {current.status === 'pending' && (
                  <>
                    <Button size="sm" disabled={updating || documentsLoading || confirmationBlockers.length > 0} onClick={() => setStatus('confirmed')}>
                      Confirm
                    </Button>
                    {canManuallyConfirm && confirmationBlockers.length > 0 ? <Button size="sm" variant="outline" disabled={updating} onClick={() => setManualConfirmOpen(true)}>Confirm manually</Button> : null}
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
              {current.status === 'pending' && confirmationBlockers.length > 0 ? <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">Before confirmation: {confirmationBlockers.join(' ')}</p> : null}

              <div className="space-y-3 border-t border-border pt-4">
                <p className="font-medium">Invoice & contract status</p>
                {(['invoice', 'contract'] as const).map((type) => {
                  const document = commercialDocuments.find((item) => item.type === type)
                  return (
                    <div key={type} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                      <span className="capitalize">{type}</span>
                      <Badge variant="outline" className="capitalize">
                        {documentsLoading ? 'Loading…' : document?.status.replaceAll('_', ' ') || 'Not issued'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : null}
      </DialogContent>
      <AlertDialog open={manualConfirmOpen} onOpenChange={setManualConfirmOpen}>
        <AlertDialogContent className="z-[80]">
          <AlertDialogHeader>
            <AlertDialogTitle>Manually confirm this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This confirms the booking without an accepted quotation, signed contract, or required deposit. Any balance stays outstanding, and the action is recorded in the audit log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updating}>Back</AlertDialogCancel>
            <AlertDialogAction disabled={updating} onClick={() => void setStatus('confirmed', true)}>
              {updating ? 'Confirming…' : 'Confirm booking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
