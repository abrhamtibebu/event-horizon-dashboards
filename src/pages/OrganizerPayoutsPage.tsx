import { useEffect, useState, type ReactNode } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Banknote, Clock, Hourglass, Wallet } from 'lucide-react'
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
  type PayoutAccount,
  type PayoutBalance,
  type PayoutMethod,
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

export default function OrganizerPayoutsPage() {
  const [balance, setBalance] = useState<PayoutBalance | null>(null)
  const [requests, setRequests] = useState<PayoutRequest[]>([])
  const [accounts, setAccounts] = useState<PayoutAccount[]>([])
  const [loading, setLoading] = useState(true)

  const [requestOpen, setRequestOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [accountOpen, setAccountOpen] = useState(false)
  const [accountForm, setAccountForm] = useState<{
    method: PayoutMethod
    bank_name: string
    account_name: string
    account_number: string
  }>({ method: 'bank_transfer', bank_name: '', account_name: '', account_number: '' })

  const currency = balance?.currency || 'ETB'

  const load = async () => {
    try {
      const [balanceRes, listRes, accountsRes] = await Promise.all([
        payoutApi.balance(),
        payoutApi.list({ per_page: 25 }),
        payoutApi.accounts(),
      ])
      setBalance(balanceRes.data)
      setRequests(listRes.data.data || (listRes.data as unknown as PayoutRequest[]))
      setAccounts(accountsRes.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not load your payout information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openRequest = () => {
    setAmount(balance ? String(balance.available) : '')
    setAccountId(String(accounts.find((a) => a.is_default)?.id ?? accounts[0]?.id ?? ''))
    setNotes('')
    setRequestOpen(true)
  }

  const submitRequest = async () => {
    const value = Number(amount)

    if (!Number.isFinite(value) || value <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    if (balance && value > balance.available) {
      toast.error(`You can withdraw at most ${money(balance.available, currency)}`)
      return
    }
    if (balance && value < balance.minimum_payout_amount) {
      toast.error(`The minimum withdrawal is ${money(balance.minimum_payout_amount, currency)}`)
      return
    }

    setSubmitting(true)
    try {
      await payoutApi.request({
        amount: value,
        payout_account_id: accountId ? Number(accountId) : null,
        notes: notes || undefined,
      })
      toast.success('Withdrawal requested. Evella will review it shortly.')
      setRequestOpen(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not submit the request')
    } finally {
      setSubmitting(false)
    }
  }

  const submitAccount = async () => {
    if (!accountForm.account_name.trim() || !accountForm.account_number.trim()) {
      toast.error('Account name and number are both required')
      return
    }

    setSubmitting(true)
    try {
      await payoutApi.createAccount({
        method: accountForm.method,
        bank_name: accountForm.bank_name || undefined,
        account_name: accountForm.account_name,
        account_number: accountForm.account_number,
      })
      toast.success('Payout account added. Evella will verify it before your first withdrawal.')
      setAccountOpen(false)
      setAccountForm({ method: 'bank_transfer', bank_name: '', account_name: '', account_number: '' })
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not save the account')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelRequest = async (payout: PayoutRequest) => {
    try {
      await payoutApi.cancel(payout.id)
      toast.success('Request cancelled')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not cancel the request')
    }
  }

  const removeAccount = async (account: PayoutAccount) => {
    try {
      await payoutApi.deleteAccount(account.id)
      toast.success('Account removed')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not remove the account')
    }
  }

  if (loading) {
    return <Spinner text="Loading payouts..." />
  }

  const hasVerifiedAccount = accounts.some((a) => a.verified_at)
  const canRequest = (balance?.available ?? 0) > 0 && hasVerifiedAccount

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payouts</h1>
          <p className="text-sm text-muted-foreground">
            Ticket revenue we collected on your behalf, minus the{' '}
            {((balance?.platform_fee_rate ?? 0.03) * 100).toFixed(0)}% Evella commission.
          </p>
        </div>
        <Button onClick={openRequest} disabled={!canRequest}>
          Request withdrawal
        </Button>
      </div>

      {!hasVerifiedAccount && (
        <Card className="border-dashed">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm">
            <span className="text-muted-foreground">
              {accounts.length === 0
                ? 'Add a bank or Telebirr account to receive your earnings.'
                : 'Your payout account is awaiting verification by Evella.'}
            </span>
            {accounts.length === 0 && (
              <Button size="sm" variant="outline" onClick={() => setAccountOpen(true)}>
                Add payout account
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BalanceCard
          title="Available now"
          icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
          value={money(balance?.available, currency)}
          hint={`Minimum withdrawal ${money(balance?.minimum_payout_amount, currency)}`}
        />
        <BalanceCard
          title="Pending clearance"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          value={money(balance?.pending_clearance, currency)}
          hint={
            balance?.next_release_at
              ? `Next release ${format(new Date(balance.next_release_at), 'MMM d, yyyy')}`
              : 'Released once the event has ended'
          }
        />
        <BalanceCard
          title="In review"
          icon={<Hourglass className="h-4 w-4 text-muted-foreground" />}
          value={money(balance?.in_review, currency)}
          hint="Requested and awaiting approval"
        />
        <BalanceCard
          title="Paid out"
          icon={<Banknote className="h-4 w-4 text-muted-foreground" />}
          value={money(balance?.paid_out, currency)}
          hint={`${money(balance?.platform_fees, currency)} commission to date`}
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Payout accounts</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAccountOpen(true)}>
            Add account
          </Button>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payout accounts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">
                      {account.method === 'telebirr' ? 'Telebirr' : account.bank_name || 'Bank transfer'}
                      {account.is_default && (
                        <Badge variant="secondary" className="ml-2">
                          Default
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {account.account_name} · {account.masked_account_number || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.verified_at ? 'default' : 'secondary'}>
                        {account.verified_at ? 'Verified' : 'Pending verification'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => removeAccount(account)}>
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Withdrawal history</CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">You have not requested a withdrawal yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Settled</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{payout.reference}</TableCell>
                    <TableCell>{money(payout.amount, payout.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[payout.status] || 'secondary'}>{payout.status}</Badge>
                      {payout.status === 'rejected' && payout.rejection_reason && (
                        <p className="mt-1 text-xs text-muted-foreground">{payout.rejection_reason}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {payout.created_at ? format(new Date(payout.created_at), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell>
                      {payout.paid_at ? format(new Date(payout.paid_at), 'MMM d, yyyy') : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      {payout.status === 'pending' && (
                        <Button size="sm" variant="ghost" onClick={() => cancelRequest(payout)}>
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request a withdrawal</DialogTitle>
            <DialogDescription>
              {money(balance?.available, currency)} is available right now.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="payout-amount">Amount ({currency})</Label>
              <Input
                id="payout-amount"
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Send to</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter((a) => a.verified_at)
                    .map((a) => (
                      <SelectItem key={a.id} value={String(a.id)}>
                        {a.method === 'telebirr' ? 'Telebirr' : a.bank_name || 'Bank'} ·{' '}
                        {a.masked_account_number}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payout-notes">Note (optional)</Label>
              <Textarea
                id="payout-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRequestOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRequest} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add a payout account</DialogTitle>
            <DialogDescription>
              Evella verifies the account before your first withdrawal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select
                value={accountForm.method}
                onValueChange={(value) =>
                  setAccountForm((prev) => ({ ...prev, method: value as PayoutMethod }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank transfer</SelectItem>
                  <SelectItem value="telebirr">Telebirr</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {accountForm.method === 'bank_transfer' && (
              <div className="space-y-1.5">
                <Label htmlFor="bank-name">Bank</Label>
                <Input
                  id="bank-name"
                  value={accountForm.bank_name}
                  onChange={(e) => setAccountForm((prev) => ({ ...prev, bank_name: e.target.value }))}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="account-name">Account holder name</Label>
              <Input
                id="account-name"
                value={accountForm.account_name}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, account_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="account-number">
                {accountForm.method === 'telebirr' ? 'Telebirr number' : 'Account number'}
              </Label>
              <Input
                id="account-number"
                value={accountForm.account_number}
                onChange={(e) => setAccountForm((prev) => ({ ...prev, account_number: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAccountOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitAccount} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function BalanceCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string
  value: string
  hint?: string
  icon?: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}
