import { useEffect, useMemo, useState } from 'react'
import { format, startOfMonth } from 'date-fns'
import { Download, Plus, Receipt, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { venueApi, type VenueBooking, type VenueExpense } from '@/lib/api/venues'
import { toast } from 'sonner'

type ExpenseForm = { description: string; category: string; amount: string; currency: string; spent_at: string; vendor: string; reference: string; venue_booking_id: string; notes: string }
const blank: ExpenseForm = { description: '', category: 'other', amount: '', currency: 'ETB', spent_at: format(new Date(), 'yyyy-MM-dd'), vendor: '', reference: '', venue_booking_id: '', notes: '' }
const categories = ['venue_rental', 'staff', 'cleaning', 'utilities', 'maintenance', 'equipment', 'catering', 'security', 'transport', 'other']
const label = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())

export default function VenueExpensesPage() {
  const [expenses, setExpenses] = useState<VenueExpense[]>([])
  const [bookings, setBookings] = useState<VenueBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<VenueExpense | null>(null)
  const [form, setForm] = useState<ExpenseForm>(blank)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    try {
      const [expensesRes, bookingsRes] = await Promise.all([venueApi.expenses({ from, to }), venueApi.bookings({ status: 'all' })])
      setExpenses(expensesRes.data)
      setBookings(bookingsRes.data)
    } catch (error: any) { toast.error(error.response?.data?.error || 'Could not load expenses') }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [from, to])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return expenses.filter((expense) => !term || [expense.description, expense.category, expense.vendor, expense.reference, expense.booking?.title, expense.booking?.contact_name].some((value) => value?.toLowerCase().includes(term)))
  }, [expenses, query])
  const bookingLinkedCount = filtered.filter((expense) => expense.venue_booking_id).length
  const summarize = (rows: VenueExpense[]) => [...rows.reduce((totals, expense) => totals.set(expense.currency, (totals.get(expense.currency) || 0) + Number(expense.amount)), new Map<string, number>())]
    .map(([currency, amount]) => `${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`).join(' · ') || 'ETB 0.00'

  const openCreate = () => { setEditing(null); setForm(blank); setReceipt(null); setOpen(true) }
  const openEdit = (expense: VenueExpense) => {
    setEditing(expense)
    setForm({ description: expense.description, category: expense.category, amount: String(expense.amount), currency: expense.currency, spent_at: expense.spent_at.slice(0, 10), vendor: expense.vendor || '', reference: expense.reference || '', venue_booking_id: expense.venue_booking_id ? String(expense.venue_booking_id) : '', notes: expense.notes || '' })
    setReceipt(null)
    setOpen(true)
  }

  const save = async () => {
    if (!form.description.trim() || Number(form.amount) <= 0 || !form.spent_at) { toast.error('Description, valid amount, and date are required.'); return }
    setSaving(true)
    const data = new FormData()
    data.append('description', form.description.trim())
    data.append('category', form.category)
    data.append('amount', String(Number(form.amount)))
    data.append('currency', form.currency.toUpperCase())
    data.append('spent_at', form.spent_at)
    if (form.venue_booking_id) data.append('venue_booking_id', form.venue_booking_id)
    if (form.vendor.trim()) data.append('vendor', form.vendor.trim())
    if (form.reference.trim()) data.append('reference', form.reference.trim())
    if (form.notes.trim()) data.append('notes', form.notes.trim())
    if (receipt) data.append('receipt', receipt)
    try {
      if (editing) await venueApi.updateExpense(editing.id, data)
      else await venueApi.createExpense(data)
      toast.success(editing ? 'Expense updated' : 'Expense recorded')
      setOpen(false)
      await load()
    } catch (error: any) { toast.error(error.response?.data?.error || 'Could not save expense') }
    finally { setSaving(false) }
  }

  const downloadReceipt = async (expense: VenueExpense) => {
    try {
      const { data } = await venueApi.expenseReceipt(expense.id)
      const url = URL.createObjectURL(data)
      const anchor = document.createElement('a'); anchor.href = url; anchor.download = `expense-${expense.id}-receipt`; anchor.click(); URL.revokeObjectURL(url)
    } catch (error: any) { toast.error(error.response?.data?.error || 'Receipt unavailable') }
  }

  return <div className="space-y-6">
    <VenuePageHeader icon={Receipt} title="Expenses" subtitle="Record operating costs, attach receipts, and link expenses to bookings for financial closure." actions={<Button onClick={openCreate}><Plus className="mr-2 size-4" />Record expense</Button>} />
    <div className="grid gap-4 sm:grid-cols-2"><Card><CardHeader className="pb-2"><CardDescription>Expenses in selected period</CardDescription><CardTitle>{filtered.length.toLocaleString()} records</CardTitle></CardHeader><CardContent className="text-sm font-semibold">{summarize(filtered)}</CardContent></Card><Card><CardHeader className="pb-2"><CardDescription>Booking-linked costs</CardDescription><CardTitle>{bookingLinkedCount.toLocaleString()} records</CardTitle></CardHeader><CardContent className="text-sm font-semibold">{summarize(filtered.filter((expense) => expense.venue_booking_id))}</CardContent></Card></div>
    <div className="flex flex-wrap items-end gap-3"><div className="relative min-w-56 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search expense, vendor, booking" /></div><div className="space-y-1"><Label htmlFor="expense-from">From</Label><Input id="expense-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></div><div className="space-y-1"><Label htmlFor="expense-to">To</Label><Input id="expense-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} /></div></div>
    {loading ? <div className="rounded-2xl border p-8 text-sm text-muted-foreground">Loading expenses…</div> : filtered.length === 0 ? <VenueEmptyState icon={Receipt} title="No expenses in this period" description="Record venue or event costs here. Expenses can be linked to a booking and supported with a receipt." action={<Button variant="outline" onClick={openCreate}>Record an expense</Button>} /> : <div className="overflow-x-auto rounded-2xl border bg-card"><table className="w-full min-w-[800px] text-sm"><thead className="bg-muted/40 text-left"><tr>{['Date', 'Expense', 'Category', 'Booking', 'Vendor', 'Amount', ''].map((heading) => <th key={heading} className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">{heading}</th>)}</tr></thead><tbody>{filtered.map((expense) => <tr key={expense.id} className="border-t"><td className="whitespace-nowrap px-4 py-3">{format(new Date(`${expense.spent_at}T12:00:00`), 'MMM d, yyyy')}</td><td className="px-4 py-3"><p className="font-medium">{expense.description}</p>{expense.reference ? <p className="text-xs text-muted-foreground">Ref: {expense.reference}</p> : null}</td><td className="px-4 py-3">{label(expense.category)}</td><td className="px-4 py-3">{expense.booking?.title || expense.booking?.contact_name || 'General venue cost'}</td><td className="px-4 py-3">{expense.vendor || '—'}</td><td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{expense.currency} {Number(expense.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td className="px-4 py-3"><div className="flex justify-end gap-1">{expense.has_receipt ? <Button size="sm" variant="ghost" aria-label="Download receipt" onClick={() => void downloadReceipt(expense)}><Download className="size-4" /></Button> : null}<Button size="sm" variant="outline" onClick={() => openEdit(expense)}>Edit</Button></div></td></tr>)}</tbody></table></div>}

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{editing ? 'Edit expense' : 'Record expense'}</DialogTitle></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Stage lighting repair" /></div>
        <div className="space-y-1"><Label>Category</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.map((category) => <option key={category} value={category}>{label(category)}</option>)}</select></div>
        <div className="space-y-1"><Label>Amount</Label><Input type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
        <div className="space-y-1"><Label>Currency</Label><Input maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></div>
        <div className="space-y-1"><Label>Spent on</Label><Input type="date" value={form.spent_at} onChange={(e) => setForm({ ...form, spent_at: e.target.value })} /></div>
        <div className="space-y-1 sm:col-span-2"><Label>Related booking</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.venue_booking_id} onChange={(e) => setForm({ ...form, venue_booking_id: e.target.value })}><option value="">General venue expense</option>{bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.title || booking.event?.name || 'Booking'} · {booking.contact_name || 'Client'} · {format(new Date(booking.starts_at), 'MMM d, yyyy')}</option>)}</select></div>
        <div className="space-y-1"><Label>Vendor / payee</Label><Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
        <div className="space-y-1"><Label>Reference</Label><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></div>
        <div className="space-y-1 sm:col-span-2"><Label>Receipt (PDF or image, max 10 MB)</Label><Input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setReceipt(e.target.files?.[0] || null)} /><p className="text-xs text-muted-foreground">{receipt ? receipt.name : editing ? 'Upload a replacement receipt if needed.' : 'Attach a receipt for audit records.'}</p></div>
        <div className="space-y-1 sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Record expense'}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>
}
