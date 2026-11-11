import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Mail, MapPin, Phone, Plus, Search, UserRound, Users } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { venueApi, type VenueBooking, type VenueClient } from '@/lib/api/venues'
import { toast } from 'sonner'

type ClientForm = {
  client_type: string; name: string; organization_name: string; contact_person: string;
  email: string; phone: string; address: string; registration_number: string; notes: string
}
const blank: ClientForm = { client_type: 'individual', name: '', organization_name: '', contact_person: '', email: '', phone: '', address: '', registration_number: '', notes: '' }

export default function VenueClientsPage() {
  const [clients, setClients] = useState<VenueClient[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<VenueClient | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<VenueClient | null>(null)
  const [form, setForm] = useState<ClientForm>(blank)
  const [saving, setSaving] = useState(false)

  const load = () => venueApi.clients().then(({ data }) => setClients(data)).catch((error) => toast.error(error.response?.data?.error || 'Could not load clients')).finally(() => setLoading(false))
  useEffect(() => { void load() }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return clients
    return clients.filter((client) => [client.name, client.organization_name, client.contact_person, client.email, client.phone].some((value) => value?.toLowerCase().includes(term)))
  }, [clients, query])

  const openCreate = () => { setEditing(null); setForm(blank); setFormOpen(true) }
  const openEdit = (client: VenueClient) => {
    setEditing(client)
    setForm({ client_type: client.client_type, name: client.name, organization_name: client.organization_name || '', contact_person: client.contact_person || '', email: client.email || '', phone: client.phone || '', address: client.address || '', registration_number: client.registration_number || '', notes: client.notes || '' })
    setFormOpen(true)
  }

  const save = async () => {
    if (!form.name.trim() || (!form.email.trim() && !form.phone.trim())) { toast.error('Enter a client name and an email or phone number.'); return }
    setSaving(true)
    try {
      const payload = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim() || null])) as Partial<VenueClient>
      if (editing) await venueApi.updateClient(editing.id, payload)
      else await venueApi.createClient(payload)
      toast.success(editing ? 'Client updated' : 'Client registered')
      setFormOpen(false)
      await load()
      if (editing) {
        const { data } = await venueApi.client(editing.id)
        setSelected(data)
      }
    } catch (error: any) { toast.error(error.response?.data?.error || 'Could not save client') }
    finally { setSaving(false) }
  }

  const showClient = async (client: VenueClient) => {
    try { const { data } = await venueApi.client(client.id); setSelected(data) }
    catch (error: any) { toast.error(error.response?.data?.error || 'Could not open client profile') }
  }

  return <div className="space-y-6">
    <VenuePageHeader icon={Users} title="Clients" subtitle="Maintain client and organization records with linked booking and payment history." actions={<Button onClick={openCreate}><Plus className="mr-2 size-4" />Register client</Button>} />
    <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search clients" /></div>
    {loading ? <div className="rounded-2xl border p-8 text-sm text-muted-foreground">Loading clients…</div> : filtered.length === 0 ? <VenueEmptyState icon={Users} title={clients.length ? 'No clients match' : 'No clients registered yet'} description={clients.length ? 'Try another name, email, or phone.' : 'Client records from manually logged bookings and new registrations will appear here.'} action={<Button variant="outline" onClick={openCreate}>Register a client</Button>} /> : <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="hidden grid-cols-[1.4fr_1fr_1fr_100px_110px] gap-4 border-b bg-muted/40 px-5 py-3 text-xs font-semibold uppercase text-muted-foreground md:grid"><span>Client</span><span>Contact</span><span>Type</span><span>Bookings</span><span /></div>
      {filtered.map((client) => <article key={client.id} className="grid gap-3 border-b px-5 py-4 last:border-0 md:grid-cols-[1.4fr_1fr_1fr_100px_110px] md:items-center md:gap-4">
        <button className="flex min-w-0 items-center gap-3 text-left" onClick={() => void showClient(client)}><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{client.organization_name ? <Building2 className="size-5" /> : <UserRound className="size-5" />}</span><span className="min-w-0"><b className="block truncate">{client.name}</b><small className="block truncate text-muted-foreground">{client.organization_name || client.contact_person || 'Client profile'}</small></span></button>
        <div className="space-y-1 text-sm">{client.email ? <p className="flex items-center gap-2 truncate"><Mail className="size-3.5 text-muted-foreground" />{client.email}</p> : null}{client.phone ? <p className="flex items-center gap-2"><Phone className="size-3.5 text-muted-foreground" />{client.phone}</p> : null}</div>
        <Badge variant="outline" className="w-fit capitalize">{client.client_type.replaceAll('_', ' ')}</Badge>
        <span className="text-sm">{client.bookings_count || 0}</span>
        <Button size="sm" variant="outline" onClick={() => openEdit(client)}>Edit profile</Button>
      </article>)}
    </div>}

    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{selected?.name}</DialogTitle></DialogHeader>
        {selected ? <div className="space-y-5">
          <div className="grid gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-2"><p><Badge variant="outline" className="capitalize">{selected.client_type.replaceAll('_', ' ')}</Badge></p>{selected.organization_name ? <p>{selected.organization_name}</p> : null}{selected.email ? <p>{selected.email}</p> : null}{selected.phone ? <p>{selected.phone}</p> : null}{selected.address ? <p className="flex items-start gap-1"><MapPin className="mt-0.5 size-4" />{selected.address}</p> : null}{selected.registration_number ? <p>Registration: {selected.registration_number}</p> : null}{selected.notes ? <p className="whitespace-pre-wrap sm:col-span-2">{selected.notes}</p> : null}</div>
          <section><h3 className="mb-2 font-semibold">Booking & payment history</h3>{(selected.bookings || []).length === 0 ? <p className="text-sm text-muted-foreground">No linked bookings yet.</p> : <ul className="divide-y">{(selected.bookings || []).map((booking: VenueBooking) => <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p className="font-medium">{booking.title || booking.event?.name || 'Venue booking'}</p><p className="text-xs text-muted-foreground">{booking.space?.name || 'Space'} · {format(new Date(booking.starts_at), 'MMM d, yyyy')} · {booking.status}</p></div><div className="text-right"><p>{booking.currency || 'ETB'} {Number(booking.paid_total || 0).toLocaleString()} paid</p><Link className="text-xs text-primary underline" to={`/dashboard/venue/calendar?view=list&booking_id=${booking.id}`} onClick={() => setSelected(null)}>Open booking</Link></div></li>)}</ul>}</section>
        </div> : null}
        <DialogFooter>{selected ? <Button variant="outline" onClick={() => openEdit(selected)}>Edit client</Button> : null}</DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{editing ? 'Edit client' : 'Register client'}</DialogTitle></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1"><Label>Client type</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.client_type} onChange={(e) => setForm({ ...form, client_type: e.target.value })}><option value="individual">Individual</option><option value="company">Company</option><option value="organization">Organization</option><option value="government">Government institution</option><option value="event_agency">Event agency</option></select></div>
        <div className="space-y-1"><Label>{form.client_type === 'individual' ? 'Full name' : 'Record name'}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        {form.client_type !== 'individual' ? <div className="space-y-1"><Label>Organization name</Label><Input value={form.organization_name} onChange={(e) => setForm({ ...form, organization_name: e.target.value })} /></div> : null}
        <div className="space-y-1"><Label>Contact person</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
        <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
        <div className="space-y-1"><Label>Phone</Label><Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="space-y-1"><Label>Registration / ID number</Label><Input value={form.registration_number} onChange={(e) => setForm({ ...form, registration_number: e.target.value })} /></div>
        <div className="space-y-1"><Label>Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="space-y-1 sm:col-span-2"><Label>Notes</Label><Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Register client'}</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>
}
