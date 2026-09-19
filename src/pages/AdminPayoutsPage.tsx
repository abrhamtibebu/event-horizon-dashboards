import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  payoutApi,
  type AdminPayoutStats,
  type PayoutRequest,
  type PayoutStatus,
} from '@/lib/api/payouts'

const statusVariant: Record<PayoutStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  processing: 'default',
  paid: 'default',
  rejected: 'destructive',
  failed: 'destructive',
  cancelled: 'outline',
}

const money = (value: number | string | undefined, currency = 'ETB') =>
  `${currency} ${Number(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<PayoutRequest[]>([])
  const [stats, setStats] = useState<AdminPayoutStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('pending')

  const [detail, setDetail] = useState<PayoutRequest | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [rejectTarget, setRejectTarget] = useState<PayoutRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [payTarget, setPayTarget] = useState<PayoutRequest | null>(null)
  const [payReference, setPayReference] = useState('')
  const [payNotes, setPayNotes] = useState('')
  const [receipt, setReceipt] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const load = () =>
    Promise.all([payoutApi.adminList({ search, status, per_page: 50 }), payoutApi.adminStats()])
      .then(([listRes, statsRes]) => {
        setPayouts(listRes.data.data || (listRes.data as unknown as PayoutRequest[]))
        setStats(statsRes.data)
      })
      .catch((err: any) => toast.error(err.response?.data?.error || 'Could not load payouts'))
      .finally(() => setLoading(false))

  useEffect(() => {
    setLoading(true)
    load()
  }, [status])

  const openDetail = async (id: number) => {
    setDetailLoading(true)
    try {
      const res = await payoutApi.adminShow(id)
      setDetail(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not load the payout')
    } finally {
      setDetailLoading(false)
    }
  }

  const approve = async (payout: PayoutRequest) => {
    try {
      await payoutApi.adminApprove(payout.id)
      toast.success(`${payout.reference} approved`)
      load()
      if (detail?.id === payout.id) openDetail(payout.id)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Action failed')
    }
  }

  const submitReject = async () => {
    if (!rejectTarget) return
    if (!rejectReason.trim()) {
      toast.error('Give the organizer a reason')
      return
    }

    setSubmitting(true)
    try {
      await payoutApi.adminReject(rejectTarget.id, rejectReason)
      toast.success(`${rejectTarget.reference} rejected. The earnings are back in their balance.`)
      setRejectTarget(null)
      setRejectReason('')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  const submitPaid = async () => {
    if (!payTarget) return
    if (!payReference.trim()) {
      toast.error('Enter the bank or Telebirr transfer reference')
      return
    }

    setSubmitting(true)
    try {
      await payoutApi.adminMarkPaid(payTarget.id, {
        reference: payReference,
        notes: payNotes || undefined,
        receipt,
      })
      toast.success(`${payTarget.reference} marked as paid`)
      setPayTarget(null)
      setPayReference('')
      setPayNotes('')
      setReceipt(null)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Action failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payout requests</h1>
        <p className="text-sm text-muted-foreground">
          Approve organizer withdrawals, then record the transfer once the money has been sent.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Awaiting review"
          value={String(stats?.pending_requests ?? 0)}
          hint={money(stats?.pending_amount, stats?.currency)}
        />
        <StatCard
          title="Owed to organizers"
          value={money(stats?.owed_to_organizers, stats?.currency)}
          hint="Not yet paid out"
        />
        <StatCard
          title="Platform commission"
          value={money(stats?.platform_revenue, stats?.currency)}
          hint={`${((stats?.platform_fee_rate ?? 0.03) * 100).toFixed(0)}% of ${money(stats?.gross_collected, stats?.currency)} collected`}
        />
        <StatCard
          title="Paid out"
          value={money(stats?.paid_out, stats?.currency)}
          hint="Settled to date"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search reference or organizer"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setLoading(true)
            load()
          }}
        >
          Search
        </Button>
      </div>

      {loading ? (
        <Spinner text="Loading payouts..." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Organizer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {payouts.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                  No payout requests match this filter.
                </TableCell>
              </TableRow>
            )}
            {payouts.map((payout) => (
              <TableRow
                key={payout.id}
                className="cursor-pointer"
                onClick={() => openDetail(payout.id)}
              >
                <TableCell className="font-medium">{payout.reference}</TableCell>
                <TableCell>{payout.organizer?.name || '—'}</TableCell>
                <TableCell>{money(payout.amount, payout.currency)}</TableCell>
                <TableCell>
                  {payout.payout_account
                    ? `${payout.payout_account.method === 'telebirr' ? 'Telebirr' : payout.payout_account.bank_name || 'Bank'} · ${payout.payout_account.masked_account_number || ''}`
                    : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[payout.status] || 'secondary'}>{payout.status}</Badge>
                </TableCell>
                <TableCell>
                  {payout.created_at ? format(new Date(payout.created_at), 'MMM d, yyyy') : '—'}
                </TableCell>
                <TableCell className="space-x-1 text-right" onClick={(e) => e.stopPropagation()}>
                  {payout.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => approve(payout)}>
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setRejectTarget(payout)}>
                        Reject
                      </Button>
                    </>
                  )}
                  {(payout.status === 'approved' || payout.status === 'processing' || payout.status === 'failed') && (
                    <Button size="sm" onClick={() => setPayTarget(payout)}>
                      Mark paid
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!detail || detailLoading} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.reference || 'Payout detail'}</DialogTitle>
          </DialogHeader>
          {detailLoading || !detail ? (
            <Spinner text="Loading..." />
          ) : (
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-muted-foreground">Organizer:</span> {detail.organizer?.name || '—'}{' '}
                {detail.organizer?.email && `(${detail.organizer.email})`}
              </p>
              <p>
                <span className="text-muted-foreground">Amount:</span>{' '}
                {money(detail.amount, detail.currency)}
              </p>
              <p>
                <span className="text-muted-foreground">Status:</span> {detail.status}
              </p>
              {detail.payout_account && (
                <p>
                  <span className="text-muted-foreground">Destination:</span>{' '}
                  {detail.payout_account.method === 'telebirr'
                    ? 'Telebirr'
                    : detail.payout_account.bank_name}{' '}
                  · {detail.payout_account.account_name} ·{' '}
                  {detail.payout_account.masked_account_number}{' '}
                  {!detail.payout_account.verified_at && <Badge variant="secondary">Unverified</Badge>}
                </p>
              )}
              <p>
                <span className="text-muted-foreground">Requested by:</span>{' '}
                {detail.requester?.name || detail.requester?.email || '—'}
              </p>
              {detail.provider_reference && (
                <p>
                  <span className="text-muted-foreground">Transfer reference:</span>{' '}
                  {detail.provider_reference}
                </p>
              )}
              {detail.rejection_reason && (
                <p>
                  <span className="text-muted-foreground">Rejection reason:</span>{' '}
                  {detail.rejection_reason}
                </p>
              )}
              {detail.notes && (
                <p>
                  <span className="text-muted-foreground">Notes:</span> {detail.notes}
                </p>
              )}
              <div>
                <p className="mb-1 font-medium">Covered earnings ({detail.items?.length || 0})</p>
                <ul className="list-inside list-disc text-muted-foreground">
                  {(detail.items || []).map((item) => (
                    <li key={item.id}>
                      {item.ledger_entry?.event?.name || 'Event'} ·{' '}
                      {money(item.net_payable, detail.currency)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject {rejectTarget?.reference}</DialogTitle>
            <DialogDescription>
              The earnings return to the organizer's available balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={submitReject} disabled={submitting}>
              {submitting ? 'Rejecting...' : 'Reject request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payTarget} onOpenChange={(open) => !open && setPayTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record payment for {payTarget?.reference}</DialogTitle>
            <DialogDescription>
              Send {money(payTarget?.amount, payTarget?.currency)} to the organizer's account, then
              record the reference here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="transfer-reference">Transfer reference</Label>
              <Input
                id="transfer-reference"
                value={payReference}
                onChange={(e) => setPayReference(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transfer-receipt">Receipt (optional)</Label>
              <Input
                id="transfer-receipt"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transfer-notes">Notes (optional)</Label>
              <Textarea
                id="transfer-notes"
                rows={2}
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submitPaid} disabled={submitting}>
              {submitting ? 'Saving...' : 'Mark as paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
