import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowUpRight, Building2, Check, LayoutGrid, MapPin, Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { venueApi, type Venue, type VenueSpace } from '@/lib/api/venues'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { apiErrorMessage } from '@/lib/api/errorMessage'

const SPACE_TYPES = ['Main Hall', 'Conference Room', 'Meeting Room', 'Ballroom', 'Auditorium', 'Exhibition Space', 'Outdoor Garden', 'VIP Lounge', 'Rooftop', 'Banquet Hall', 'Other']

export default function VenueSpacesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const canManage = user?.role === 'venue_admin' || user?.role === 'venue_manager' || user?.role === 'admin' || user?.role === 'superadmin'
  const [spaces, setSpaces] = useState<VenueSpace[]>([])
  const [venue, setVenue] = useState<Venue | null>(null)
  const [savingVisibility, setSavingVisibility] = useState(false)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', space_type: 'main_hall', capacity: '' })
  const [query, setQuery] = useState('')

  const visibleSpaces = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return spaces
    return spaces.filter((space) => `${space.name} ${space.description || ''}`.toLowerCase().includes(search))
  }, [spaces, query])
  const totalCapacity = spaces.reduce((total, space) => total + (Number(space.capacity) || 0), 0)
  const packageCount = spaces.reduce((total, space) => total + (space.packages?.length || 0), 0)

  useEffect(() => {
    Promise.all([venueApi.spaces(), venueApi.profile()])
      .then(([spaceRes, venueRes]) => { setSpaces(spaceRes.data); setVenue(venueRes.data) })
      .catch((err) => toast.error(err.response?.data?.error || 'Could not load spaces'))
      .finally(() => setLoading(false))
  }, [])

  const create = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const data = new FormData()
      data.append('name', form.name.trim())
      data.append('description', form.description)
      data.append('space_type', form.space_type)
      data.append('capacity', form.capacity)
      const res = await venueApi.createSpace(data)
      toast.success('Space added')
      navigate(`/dashboard/venue/spaces/${res.data.id}`)
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Could not add space'))
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm({ name: '', description: '', space_type: 'main_hall', capacity: '' })
  }

  const setListed = async (listed: boolean) => {
    if (!canManage) return
    setSavingVisibility(true)
    try {
      const data = new FormData()
      data.append('is_listed', listed ? '1' : '0')
      const result = await venueApi.updateProfile(data)
      setVenue(result.data)
      toast.success(listed ? 'Venue listing published' : 'Venue listing hidden')
    } catch (err: unknown) {
      toast.error(apiErrorMessage(err, 'Could not update venue visibility'))
    } finally { setSavingVisibility(false) }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner text="Loading spaces..." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-7 pb-8">
      <VenuePageHeader
        icon={Building2}
        title="Venue"
        subtitle="Your public listing and the spaces organizers can request."
        actions={
          canManage ? (
            <Button
              className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg"
              onClick={() => {
                resetForm()
                setOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add space
            </Button>
          ) : null
        }
      />

      <section className="relative isolate overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="absolute inset-y-0 right-0 -z-10 w-2/3 bg-gradient-to-l from-primary/[0.08] via-primary/[0.03] to-transparent" />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-10">
            <div className="mb-5 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Venue overview</div>
            <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">Make room for remarkable events.</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Manage the spaces, capacities and packages organizers can discover and request.</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-sm font-medium"><Building2 className="size-4 text-primary" />{venue?.name || 'Venue listing'}</span>
              {venue?.city && <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"><MapPin className="size-4" />{venue.city}</span>}
              <Badge variant="outline" className={venue?.is_listed ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : ''}>
                {venue?.is_listed ? <><Check className="mr-1 size-3" />Publicly listed</> : 'Listing hidden'}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 border-t border-border bg-background/40 p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-medium text-muted-foreground">Spaces</p><p className="mt-2 text-2xl font-semibold">{spaces.length}</p></div>
              <div className="rounded-2xl border border-border bg-card p-4"><p className="text-xs font-medium text-muted-foreground">Total capacity</p><p className="mt-2 text-2xl font-semibold">{totalCapacity.toLocaleString()}</p><p className="text-xs text-muted-foreground">guests</p></div>
            </div>
            {canManage ? <div className="space-y-3">
              <label className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"><span className="font-medium">Show venue publicly</span><Switch checked={!!venue?.is_listed} disabled={savingVisibility} onCheckedChange={setListed} /></label>
              <Button asChild variant="outline" className="w-full"><Link to="/dashboard/venue/profile">Edit venue listing<ArrowUpRight className="ml-2 size-4" /></Link></Button>
            </div> : <p className="text-sm text-muted-foreground">Contact your venue admin to update the public listing.</p>}
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><div className="flex items-center gap-2"><h2 className="text-xl font-semibold tracking-tight">Your spaces</h2><Badge variant="secondary">{spaces.length}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Rooms and areas available for event bookings.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative sm:w-64"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search spaces" className="pl-9" /></div>
            {canManage && <Button className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-sm" onClick={() => { resetForm(); setOpen(true) }}><Plus className="mr-2 size-4" />Add a space</Button>}
          </div>
        </div>
        {spaces.length > 0 && <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span>{packageCount} bookable package{packageCount === 1 ? '' : 's'}</span><span>•</span><span>{spaces.filter((space) => space.is_default).length} default space{spaces.filter((space) => space.is_default).length === 1 ? '' : 's'}</span></div>}
      </section>

      {spaces.length === 0 ? (
        <VenueEmptyState
          icon={LayoutGrid}
          title="No spaces yet"
          description="Add your main hall so organizers can request the right room."
          action={
            canManage ? (
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add your first space
              </Button>
            ) : null
          }
        />
      ) : visibleSpaces.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center"><Search className="mx-auto size-8 text-muted-foreground/60" /><h3 className="mt-3 font-semibold">No matching spaces</h3><p className="mt-1 text-sm text-muted-foreground">Try another name or clear your search.</p><Button variant="ghost" className="mt-2" onClick={() => setQuery('')}>Clear search</Button></div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleSpaces.map((space) => {
            const cover = space.photo_urls?.[0]
            return (
              <Link
                key={space.id}
                to={`/dashboard/venue/spaces/${space.id}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative h-48 bg-gradient-to-br from-primary/15 via-muted to-background">
                  {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute left-4 right-4 top-4 flex items-start justify-between">
                    <Badge className="border-white/20 bg-black/30 text-white backdrop-blur-md">{space.space_type?.replaceAll('_', ' ') || (space.is_default ? 'Default space' : 'Event space')}</Badge>
                    <span className="grid size-9 place-items-center rounded-full border border-white/20 bg-black/25 text-white backdrop-blur-md transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"><ArrowUpRight className="size-4" /></span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-semibold text-white drop-shadow">{space.name}</h3>
                    {space.description && <p className="mt-1 line-clamp-1 text-sm text-white/80">{space.description}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-3 divide-x divide-border px-1 py-4">
                  <div className="px-3"><span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground"><Users className="size-3.5" />Capacity</span><p className="mt-1.5 text-sm font-semibold">{space.capacity ? `${Number(space.capacity).toLocaleString()} guests` : 'Not set'}</p></div>
                  <div className="px-3"><span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Starting at</span><p className="mt-1.5 truncate text-sm font-semibold">{space.hourly_rate != null ? `ETB ${Number(space.hourly_rate).toLocaleString()}/hr` : 'Ask for rate'}</p></div>
                  <div className="px-3"><span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Packages</span><p className="mt-1.5 text-sm font-semibold">{(space.packages ?? []).length}</p></div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Add a space</DialogTitle>
            <p className="text-sm text-muted-foreground">Start with a few essentials. You can complete pricing, layouts, amenities, photos, and booking rules from the space details page.</p>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <SpaceField label="Space name *"><Input autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Main Conference Hall" /></SpaceField>
            <div className="grid gap-4 sm:grid-cols-2">
              <SpaceField label="Space type"><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.space_type} onChange={(event) => setForm({ ...form, space_type: event.target.value })}>{SPACE_TYPES.map((item) => <option key={item} value={item.toLowerCase().replaceAll(' ', '_')}>{item}</option>)}</select></SpaceField>
              <SpaceField label="Maximum capacity"><Input type="number" min="1" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} placeholder="Optional" /></SpaceField>
            </div>
            <SpaceField label="Description (optional)"><textarea className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="A short description of this space" /></SpaceField>
            <p className="text-xs text-muted-foreground">Your venue is attached automatically. A space code and active status are set for you.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="button" onClick={create} disabled={saving || !form.name.trim()}>{saving ? 'Creating…' : 'Create space'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


function SpaceField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>
}
