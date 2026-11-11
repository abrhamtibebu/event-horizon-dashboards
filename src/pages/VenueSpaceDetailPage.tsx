import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowUpRight, Check, Clock3, DollarSign, FileText, ImageIcon, LayoutGrid, Plus, Ruler, Star, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
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
import { Spinner } from '@/components/ui/spinner'
import { AttachedImagePreview } from '@/components/venue/AttachedImagePreview'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { venueApi, type VenueSpace, type VenueSpacePackage, type VenueSpaceSettings } from '@/lib/api/venues'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const SPACE_AMENITIES = [
  'AV / projector',
  'Microphone',
  'Wi‑Fi',
  'Stage',
  'Dressing room',
  'Catering kitchen',
  'Power / outlets',
  'Natural light',
  'Blackout curtains',
  'Accessible entry',
]

const LAYOUT_KEYS = [
  { key: 'theater', label: 'Theater' },
  { key: 'banquet', label: 'Banquet' },
  { key: 'classroom', label: 'Classroom' },
  { key: 'u_shape', label: 'U-shape' },
  { key: 'boardroom', label: 'Boardroom' },
  { key: 'cocktail', label: 'Cocktail' },
] as const

const emptyForm = {
  name: '',
  space_type: 'other',
  status: 'active',
  description: '',
  capacity: '',
  recommended_capacity: '',
  minimum_capacity: '',
  floor_level: '',
  floor_area: '',
  hourly_rate: '',
  length_m: '',
  width_m: '',
  ceiling_height_m: '',
  setup_minutes: '0',
  teardown_minutes: '0',
  rules: '',
  sort_order: '0',
  is_default: false,
  is_accessible: false,
  contact_person: '',
  contact_number: '',
  internal_notes: '',
  terms_conditions: '',
  theater: '',
  banquet: '',
  classroom: '',
  u_shape: '',
  boardroom: '',
  cocktail: '',
}

const emptyPackage = { name: '', unit: 'hourly' as 'hourly' | 'daily', price: '', currency: 'ETB' }
const OPERATING_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DETAIL_TABS = [
  { id: 'basics', label: 'Basics', hint: 'Name, size and status' },
  { id: 'setup', label: 'Setup', hint: 'Layouts and facilities' },
  { id: 'booking', label: 'Booking', hint: 'Rates and availability' },
  { id: 'media', label: 'Photos & contacts', hint: 'Images and extra details' },
] as const

function settingText(settings: VenueSpaceSettings, key: string, fallback = '') {
  const value = settings[key]
  return value == null ? fallback : String(value)
}

function formFromSpace(space: VenueSpace) {
  const layouts = space.layout_capacities || {}
  return {
    name: space.name,
    space_type: space.space_type || 'other',
    status: space.status || 'active',
    description: space.description || '',
    capacity: space.capacity ? String(space.capacity) : '',
    recommended_capacity: space.recommended_capacity != null ? String(space.recommended_capacity) : '',
    minimum_capacity: space.minimum_capacity != null ? String(space.minimum_capacity) : '',
    floor_level: space.floor_level || '',
    floor_area: space.floor_area != null ? String(space.floor_area) : '',
    hourly_rate: space.hourly_rate != null ? String(space.hourly_rate) : '',
    length_m: space.length_m != null ? String(space.length_m) : '',
    width_m: space.width_m != null ? String(space.width_m) : '',
    ceiling_height_m: space.ceiling_height_m != null ? String(space.ceiling_height_m) : '',
    setup_minutes: String(space.setup_minutes ?? 0),
    teardown_minutes: String(space.teardown_minutes ?? 0),
    rules: space.rules || '',
    sort_order: String(space.sort_order ?? 0),
    is_default: space.is_default,
    is_accessible: !!space.is_accessible,
    contact_person: space.contact_person || '',
    contact_number: space.contact_number || '',
    internal_notes: space.internal_notes || '',
    terms_conditions: space.terms_conditions || '',
    theater: layouts.theater != null ? String(layouts.theater) : '',
    banquet: layouts.banquet != null ? String(layouts.banquet) : '',
    classroom: layouts.classroom != null ? String(layouts.classroom) : '',
    u_shape: layouts.u_shape != null ? String(layouts.u_shape) : '',
    boardroom: layouts.boardroom != null ? String(layouts.boardroom) : '',
    cocktail: layouts.cocktail != null ? String(layouts.cocktail) : '',
  }
}

export default function VenueSpaceDetailPage() {
  const { spaceId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canManage = user?.role === 'venue_admin' || user?.role === 'venue_manager' || user?.role === 'admin' || user?.role === 'superadmin'
  const [space, setSpace] = useState<VenueSpace | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [activeTab, setActiveTab] = useState<(typeof DETAIL_TABS)[number]['id']>('basics')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [amenities, setAmenities] = useState<string[]>([])
  const [customFacilities, setCustomFacilities] = useState<string[]>([])
  const [pricingDetails, setPricingDetails] = useState<VenueSpaceSettings>({})
  const [availabilitySettings, setAvailabilitySettings] = useState<VenueSpaceSettings>({})
  const [layoutConfig, setLayoutConfig] = useState<VenueSpaceSettings>({})
  const [photos, setPhotos] = useState<FileList | null>(null)
  const [floorPlan, setFloorPlan] = useState<File | null>(null)
  const [removePhotos, setRemovePhotos] = useState<string[]>([])
  const [removeFloorPlan, setRemoveFloorPlan] = useState(false)
  const [packageOpen, setPackageOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<VenueSpacePackage | null>(null)
  const [packageForm, setPackageForm] = useState(emptyPackage)

  const apply = (next: VenueSpace) => {
    setSpace(next)
    setForm(formFromSpace(next))
    setAmenities(next.amenities || [])
    setCustomFacilities(next.custom_facilities || [])
    setPricingDetails(next.pricing_details || {})
    setAvailabilitySettings(next.availability_settings || {})
    setLayoutConfig(next.layout_config || {})
    setPhotos(null)
    setFloorPlan(null)
    setRemovePhotos([])
    setRemoveFloorPlan(false)
  }

  const load = () =>
    venueApi.spaces().then((res) => {
      const found = res.data.find((item) => String(item.id) === String(spaceId))
      if (!found) {
        setMissing(true)
        setSpace(null)
        return
      }
      setMissing(false)
      apply(found)
    })

  useEffect(() => {
    setActiveTab('basics')
    setLoading(true)
    load()
      .catch((err) => toast.error(err.response?.data?.error || 'Could not load space'))
      .finally(() => setLoading(false))
  }, [spaceId])

  const gallery = useMemo(() => {
    if (!space) return []
    const paths = space.photos || []
    const urls = space.photo_urls || []
    return paths
      .map((path, i) => ({ path, url: urls[i] }))
      .filter((item) => item.url && !removePhotos.includes(item.path))
  }, [space, removePhotos])

  const cancelEdits = () => {
    if (!space) return
    apply(space)
    setEditing(false)
  }

  const save = async () => {
    if (!space) return
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const data = new FormData()
      data.append('name', form.name.trim())
      data.append('space_type', form.space_type)
      data.append('status', form.status)
      if (form.description) data.append('description', form.description)
      if (form.capacity) data.append('capacity', form.capacity)
      if (form.recommended_capacity) data.append('recommended_capacity', form.recommended_capacity)
      if (form.minimum_capacity) data.append('minimum_capacity', form.minimum_capacity)
      if (form.floor_level) data.append('floor_level', form.floor_level)
      data.append('is_accessible', form.is_accessible ? '1' : '0')
      if (form.floor_area) data.append('floor_area', form.floor_area)
      if (form.hourly_rate) data.append('hourly_rate', form.hourly_rate)
      if (form.length_m) data.append('length_m', form.length_m)
      if (form.width_m) data.append('width_m', form.width_m)
      if (form.ceiling_height_m) data.append('ceiling_height_m', form.ceiling_height_m)
      data.append('setup_minutes', form.setup_minutes || '0')
      data.append('teardown_minutes', form.teardown_minutes || '0')
      data.append('sort_order', form.sort_order || '0')
      data.append('is_default', form.is_default ? '1' : '0')
      if (form.rules) data.append('rules', form.rules)
      data.append('contact_person', form.contact_person)
      data.append('contact_number', form.contact_number)
      data.append('internal_notes', form.internal_notes)
      data.append('terms_conditions', form.terms_conditions)
      data.append('amenities', JSON.stringify(amenities))
      data.append('custom_facilities', JSON.stringify(customFacilities))
      data.append('pricing_details', JSON.stringify(pricingDetails))
      data.append('availability_settings', JSON.stringify(availabilitySettings))
      data.append('layout_config', JSON.stringify(layoutConfig))
      data.append(
        'layout_capacities',
        JSON.stringify({
          theater: form.theater || null,
          banquet: form.banquet || null,
          classroom: form.classroom || null,
          cocktail: form.cocktail || null,
          u_shape: form.u_shape || null,
          boardroom: form.boardroom || null,
        }),
      )
      if (removePhotos.length) data.append('remove_photos', JSON.stringify(removePhotos))
      if (removeFloorPlan) data.append('remove_floor_plan', '1')
      if (photos) Array.from(photos).forEach((file) => data.append('photos[]', file))
      if (floorPlan) data.append('floor_plan', floorPlan)
      const res = await venueApi.updateSpace(space.id, data)
      apply(res.data)
      setEditing(false)
      toast.success('Space updated')
    } catch (err: any) {
      const errors = err.response?.data
      const first = typeof errors === 'object' && errors ? (Object.values(errors).flat()?.[0] as string) : null
      toast.error(first || err.response?.data?.error || 'Could not save space')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!space) return
    try {
      await venueApi.deleteSpace(space.id)
      toast.success('Space deleted')
      setDeleteOpen(false)
      navigate('/dashboard/venue')
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not delete space')
    }
  }

  const openPackage = (pkg?: VenueSpacePackage) => {
    setEditingPackage(pkg || null)
    setPackageForm(
      pkg
        ? { name: pkg.name, unit: pkg.unit, price: String(pkg.price), currency: pkg.currency || 'ETB' }
        : emptyPackage,
    )
    setPackageOpen(true)
  }

  const savePackage = async () => {
    if (!space) return
    if (!packageForm.name.trim() || !packageForm.price) {
      toast.error('Name and price are required')
      return
    }
    setSaving(true)
    const payload = {
      name: packageForm.name,
      unit: packageForm.unit,
      price: Number(packageForm.price),
      currency: packageForm.currency || 'ETB',
    }
    try {
      if (editingPackage) await venueApi.updatePackage(editingPackage.id, payload)
      else await venueApi.createPackage(space.id, payload)
      toast.success(editingPackage ? 'Package updated' : 'Package added')
      setPackageOpen(false)
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not save package')
    } finally {
      setSaving(false)
    }
  }

  const removePackage = async (pkg: VenueSpacePackage) => {
    try {
      await venueApi.deletePackage(pkg.id)
      toast.success('Package deleted')
      await load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not delete package')
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner text="Loading space..." />
      </div>
    )
  }

  if (missing || !space) {
    return (
      <VenueEmptyState
        icon={LayoutGrid}
        title="Space not found"
        description="It may have been removed."
        action={
          <Button asChild variant="outline">
            <Link to="/dashboard/venue">Back to venue</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 pb-8">
      <Button asChild variant="ghost" className="-ml-2 w-fit text-muted-foreground hover:text-foreground">
        <Link to="/dashboard/venue">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Venue
        </Link>
      </Button>
      <section className="relative isolate overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/[0.08] via-transparent to-muted/70" />
        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative flex min-h-[260px] flex-col justify-end overflow-hidden p-6 sm:min-h-[320px] sm:p-9">
            {gallery[0]?.url && <img src={gallery[0].url} alt="" className="absolute inset-0 -z-10 size-full object-cover" />}
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            <div className="mb-auto flex items-center gap-2">
              <Badge className="border-white/20 bg-black/30 text-white backdrop-blur-md">{space.status?.replaceAll('_', ' ') || 'Active'}</Badge>
              {space.space_code && <Badge variant="outline" className="border-white/25 bg-black/20 text-white backdrop-blur-md">{space.space_code}</Badge>}
              {gallery.length > 0 && <Badge variant="outline" className="border-white/25 bg-black/20 text-white backdrop-blur-md"><ImageIcon className="mr-1 size-3" />{gallery.length} photos</Badge>}
            </div>
            <div className="max-w-2xl text-white">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/75">Space profile</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{space.name}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/80">{space.description || 'A closer look at this venue space, its capacity, layouts and booking details.'}</p>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 border-t border-border bg-background/70 p-6 backdrop-blur-sm sm:p-7 lg:border-l lg:border-t-0">
            <div><p className="text-sm font-medium text-muted-foreground">Space at a glance</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-border bg-card p-4"><Users className="size-4 text-primary" /><p className="mt-3 text-xl font-semibold">{space.capacity ? Number(space.capacity).toLocaleString() : '—'}</p><p className="text-xs text-muted-foreground">guest capacity</p></div>
                <div className="rounded-2xl border border-border bg-card p-4"><DollarSign className="size-4 text-primary" /><p className="mt-3 truncate text-lg font-semibold">{space.hourly_rate != null ? `ETB ${Number(space.hourly_rate).toLocaleString()}` : 'On request'}</p><p className="text-xs text-muted-foreground">per hour</p></div>
                <div className="rounded-2xl border border-border bg-card p-4"><Ruler className="size-4 text-primary" /><p className="mt-3 text-lg font-semibold">{space.floor_area ? `${space.floor_area} m²` : '—'}</p><p className="text-xs text-muted-foreground">floor area</p></div>
                <div className="rounded-2xl border border-border bg-card p-4"><Clock3 className="size-4 text-primary" /><p className="mt-3 text-lg font-semibold">{space.setup_minutes || 0} min</p><p className="text-xs text-muted-foreground">setup time</p></div>
              </div>
            </div>
            {canManage ? <div className="flex flex-wrap gap-2"><Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(true)}><Trash2 className="mr-2 size-4" />Delete</Button>{editing ? <Button variant="outline" className="flex-1" onClick={cancelEdits}>Cancel edits</Button> : <Button className="flex-1 bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-sm" onClick={() => setEditing(true)}>Edit details</Button>}</div> : <p className="rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">View only. Ask a venue admin to edit this space.</p>}
          </div>
        </div>
      </section>

      <nav aria-label="Space details sections" className="grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-2 sm:grid-cols-4">
        {DETAIL_TABS.map((tab) => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined} className={cn('rounded-xl px-3 py-2.5 text-left transition-colors', activeTab === tab.id ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground')}>
            <span className="block text-sm font-medium">{tab.label}</span><span className="mt-0.5 hidden text-xs sm:block">{tab.hint}</span>
          </button>
        ))}
      </nav>

      <fieldset disabled={!canManage || !editing} className="disabled:opacity-80">
       <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
        <section id="space-basics" hidden={activeTab !== 'basics'} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">01 · Details</p><h2 className="mt-1 text-xl font-semibold">Basics</h2><p className="mt-1 text-sm text-muted-foreground">Set the name, size and key information organizers will see.</p></div>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Space type</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.space_type} onChange={(e) => setForm({ ...form, space_type: e.target.value })}>{['Main Hall', 'Conference Room', 'Meeting Room', 'Ballroom', 'Auditorium', 'Exhibition Space', 'Outdoor Garden', 'VIP Lounge', 'Rooftop', 'Banquet Hall', 'Other'].map((item) => <option key={item} value={item.toLowerCase().replaceAll(' ', '_')}>{item}</option>)}</select></div>
            <div className="space-y-1"><Label>Status</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{[['active', 'Active'], ['inactive', 'Inactive'], ['under_maintenance', 'Under Maintenance'], ['temporarily_unavailable', 'Temporarily Unavailable']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field label="Capacity" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} />
            <Field label="Recommended capacity" value={form.recommended_capacity} onChange={(v) => setForm({ ...form, recommended_capacity: v })} />
            <Field label="Minimum capacity" value={form.minimum_capacity} onChange={(v) => setForm({ ...form, minimum_capacity: v })} />
            <Field label="Area m²" value={form.floor_area} onChange={(v) => setForm({ ...form, floor_area: v })} />
            <div className="space-y-1"><Label>Floor level</Label><Input value={form.floor_level} onChange={(e) => setForm({ ...form, floor_level: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Length (m)" value={form.length_m} onChange={(v) => setForm({ ...form, length_m: v })} />
            <Field label="Width (m)" value={form.width_m} onChange={(v) => setForm({ ...form, width_m: v })} />
            <Field label="Ceiling (m)" value={form.ceiling_height_m} onChange={(v) => setForm({ ...form, ceiling_height_m: v })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.is_default} onCheckedChange={(c) => setForm({ ...form, is_default: Boolean(c) })} />
            Default space
          </label>
          <label className="flex items-center gap-2 text-sm"><Checkbox checked={form.is_accessible} onCheckedChange={(c) => setForm({ ...form, is_accessible: Boolean(c) })} />Accessible space</label>
        </section>

        <section id="space-layouts" hidden={activeTab !== 'setup'} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">02 · Configurations</p><h2 className="mt-1 text-xl font-semibold">Layouts</h2><p className="mt-1 text-sm text-muted-foreground">Add capacity by seating arrangement.</p></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {LAYOUT_KEYS.map((layout) => (
              <Field
                key={layout.key}
                label={layout.label}
                value={form[layout.key]}
                onChange={(v) => setForm({ ...form, [layout.key]: v })}
              />
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label>Default seating arrangement</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={settingText(layoutConfig, 'default_arrangement', 'theater')} onChange={(event) => setLayoutConfig({ ...layoutConfig, default_arrangement: event.target.value })}>{['theater', 'classroom', 'banquet', 'u_shape', 'boardroom', 'cocktail'].map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}</select></div>
            <div className="space-y-1"><Label>Table arrangement</Label><Input value={settingText(layoutConfig, 'table_arrangement')} onChange={(event) => setLayoutConfig({ ...layoutConfig, table_arrangement: event.target.value })} placeholder="Rows, rounds, custom setup…" /></div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3">{([['Stage available', 'stage'], ['Dance floor', 'dance_floor'], ['Reception area', 'reception_area'], ['VIP section', 'vip_section']] as const).map(([label, key]) => <label key={key} className="flex items-center gap-2 text-sm"><Checkbox checked={Boolean(layoutConfig[key])} onCheckedChange={(checked) => setLayoutConfig({ ...layoutConfig, [key]: Boolean(checked) })} />{label}</label>)}</div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><Label>Entrance points</Label><Input value={settingText(layoutConfig, 'entrance_points')} onChange={(event) => setLayoutConfig({ ...layoutConfig, entrance_points: event.target.value })} /></div><div className="space-y-1"><Label>Emergency exits</Label><Input value={settingText(layoutConfig, 'emergency_exits')} onChange={(event) => setLayoutConfig({ ...layoutConfig, emergency_exits: event.target.value })} /></div></div>
        </section>

        <section id="space-amenities" hidden={activeTab !== 'setup'} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">03 · Features</p><h2 className="mt-1 text-xl font-semibold">Amenities</h2><p className="mt-1 text-sm text-muted-foreground">Highlight what is included in this space.</p></div>
          <div className="grid grid-cols-2 gap-2">
            {SPACE_AMENITIES.map((item) => {
              const checked = amenities.includes(item)
              return (
                <label
                  key={item}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                    checked ? 'border-primary/40 bg-primary/10' : 'border-border',
                    canManage && 'cursor-pointer',
                  )}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(value) => {
                      setAmenities((prev) => (value ? [...prev, item] : prev.filter((a) => a !== item)))
                    }}
                  />
                  {item}
                </label>
              )
            })}
          </div>
          <div className="space-y-1"><Label>Custom facilities</Label><Input value={customFacilities.join(', ')} onChange={(event) => setCustomFacilities(event.target.value.split(',').map((value) => value.trim()).filter(Boolean))} placeholder="Add facilities separated by commas" /></div>
        </section>

        <section id="space-pricing" hidden={activeTab !== 'booking'} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-center justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">04 · Booking</p><h2 className="mt-1 text-xl font-semibold">Pricing & packages</h2></div>
            {canManage ? (
              <Button type="button" variant="outline" size="sm" onClick={() => openPackage()}>
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Hourly rate" value={form.hourly_rate} onChange={(v) => setForm({ ...form, hourly_rate: v })} />
            <Field label="Setup (minutes)" value={form.setup_minutes} onChange={(v) => setForm({ ...form, setup_minutes: v })} />
            <Field label="Teardown (minutes)" value={form.teardown_minutes} onChange={(v) => setForm({ ...form, teardown_minutes: v })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label>Pricing model</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={settingText(pricingDetails, 'model', 'hourly')} onChange={(event) => setPricingDetails({ ...pricingDetails, model: event.target.value })}>{[['fixed_price', 'Fixed price'], ['hourly', 'Hourly'], ['half_day', 'Half-day'], ['full_day', 'Full-day'], ['custom_pricing', 'Custom pricing']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            <div className="space-y-1"><Label>Currency</Label><select className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={settingText(pricingDetails, 'currency', 'ETB')} onChange={(event) => setPricingDetails({ ...pricingDetails, currency: event.target.value })}>{['ETB', 'USD', 'EUR', 'GBP'].map((currency) => <option key={currency} value={currency}>{currency}</option>)}</select></div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{([['Base rental price', 'base_price'], ['Half-day rate', 'half_day_rate'], ['Full-day rate', 'full_day_rate'], ['Weekend rate', 'weekend_rate'], ['Overtime rate', 'overtime_rate'], ['Security deposit', 'security_deposit'], ['Cleaning fee', 'cleaning_fee'], ['Setup fee', 'setup_fee'], ['Tax (%)', 'tax_percent'], ['Minimum duration (hours)', 'minimum_duration'], ['Maximum duration (hours)', 'maximum_duration']] as const).map(([label, key]) => <Field key={key} label={label} value={settingText(pricingDetails, key)} onChange={(value) => setPricingDetails({ ...pricingDetails, [key]: value })} />)}</div>
          <div className="flex flex-wrap gap-5">{([['Enable custom quotations', 'enable_custom_quotes'], ['Allow discounts', 'allow_discounts']] as const).map(([label, key]) => <label key={key} className="flex items-center gap-2 text-sm"><Checkbox checked={Boolean(pricingDetails[key])} onCheckedChange={(checked) => setPricingDetails({ ...pricingDetails, [key]: Boolean(checked) })} />{label}</label>)}</div>
          {(space.packages ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No named packages yet.</p>
          ) : (
            <ul className="space-y-2">
              {(space.packages ?? []).map((pkg) => (
                <li key={pkg.id} className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm transition-colors hover:bg-muted/50">
                  <button type="button" className="text-left" onClick={() => canManage && openPackage(pkg)} disabled={!canManage}>
                    {pkg.name} · {pkg.currency || 'ETB'} {Number(pkg.price).toLocaleString()}/{pkg.unit === 'daily' ? 'day' : 'hr'}
                  </button>
                  {canManage ? (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removePackage(pkg)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="space-availability" hidden={activeTab !== 'booking'} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">05 · Availability</p><h2 className="mt-1 text-xl font-semibold">Availability & booking rules</h2><p className="mt-1 text-sm text-muted-foreground">Set normal hours and booking preferences. Event setup and teardown buffers are included in availability checks.</p></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label>Opening time</Label><Input type="time" value={settingText(availabilitySettings, 'opening_time', '08:00')} onChange={(event) => setAvailabilitySettings({ ...availabilitySettings, opening_time: event.target.value })} /></div><div className="space-y-1"><Label>Closing time</Label><Input type="time" value={settingText(availabilitySettings, 'closing_time', '22:00')} onChange={(event) => setAvailabilitySettings({ ...availabilitySettings, closing_time: event.target.value })} /></div><Field label="Advance booking period (days)" value={settingText(availabilitySettings, 'advance_booking_days')} onChange={(value) => setAvailabilitySettings({ ...availabilitySettings, advance_booking_days: value })} /><Field label="Minimum notice (hours)" value={settingText(availabilitySettings, 'minimum_notice_hours')} onChange={(value) => setAvailabilitySettings({ ...availabilitySettings, minimum_notice_hours: value })} /></div>
          <div><p className="mb-2 text-sm font-medium">Operating days</p><div className="flex flex-wrap gap-3">{OPERATING_DAYS.map((day) => { const selectedDays = Array.isArray(availabilitySettings.operating_days) ? availabilitySettings.operating_days : OPERATING_DAYS; return <label key={day} className="flex items-center gap-2 text-sm"><Checkbox checked={selectedDays.includes(day)} onCheckedChange={(checked) => setAvailabilitySettings({ ...availabilitySettings, operating_days: checked ? [...selectedDays, day] : selectedDays.filter((value) => value !== day) })} />{day}</label> })}</div></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Setup buffer (minutes)" value={form.setup_minutes} onChange={(value) => setForm({ ...form, setup_minutes: value })} /><Field label="Teardown buffer (minutes)" value={form.teardown_minutes} onChange={(value) => setForm({ ...form, teardown_minutes: value })} /></div>
          <div className="flex flex-wrap gap-x-5 gap-y-3">{([['Allow multiple bookings', 'allow_multiple_bookings'], ['Require approval', 'require_approval'], ['Allow recurring bookings', 'allow_recurring'], ['Available on holidays', 'holiday_availability']] as const).map(([label, key]) => <label key={key} className="flex items-center gap-2 text-sm"><Checkbox checked={Boolean(availabilitySettings[key])} onCheckedChange={(checked) => setAvailabilitySettings({ ...availabilitySettings, [key]: Boolean(checked) })} />{label}</label>)}</div>
        </section>

        <section id="space-photos" hidden={activeTab !== 'media'} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Photos</h2>
          </div>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.map((item) => (
                <div key={item.path} className="group relative overflow-hidden rounded-xl border">
                  <img src={item.url} alt="" className="aspect-video w-full object-cover" />
                  {canManage ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="absolute right-1 top-1"
                      onClick={() => setRemovePhotos((prev) => [...prev, item.path])}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No photos yet.</p>
          )}
          {canManage ? (
            <label
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (e.dataTransfer.files?.length) setPhotos(e.dataTransfer.files)
              }}
            >
              Drop photos here, or click to choose
              <input className="sr-only" type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} />
            </label>
          ) : null}
          <AttachedImagePreview files={photos} />
        </section>

        <section id="space-rules" hidden={activeTab !== 'booking'} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">06 · Guidance</p><h2 className="mt-1 text-xl font-semibold">Space rules</h2></div>
          <Textarea
            rows={4}
            value={form.rules}
            onChange={(e) => setForm({ ...form, rules: e.target.value })}
            placeholder="Noise curfew, no open flame, load-in rules…"
          />
        </section>

        <section hidden={activeTab !== 'media'} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">07 · Contacts</p><h2 className="mt-1 text-xl font-semibold">Additional information</h2></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><Label>Contact person</Label><Input value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div><div className="space-y-1"><Label>Contact number</Label><Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} /></div></div>
          <div className="space-y-1"><Label>Internal notes</Label><Textarea value={form.internal_notes} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} /></div>
          <div className="space-y-1"><Label>Terms & conditions</Label><Textarea value={form.terms_conditions} onChange={(e) => setForm({ ...form, terms_conditions: e.target.value })} /></div>
        </section>

        <section hidden={activeTab !== 'media'} className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold">Floor plan</h2>
          </div>
          {space.floor_plan_url && !removeFloorPlan ? (
            <div className="flex items-center gap-2 text-sm">
              <a href={space.floor_plan_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                Current floor plan
              </a>
              {canManage ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setRemoveFloorPlan(true)}>
                  Remove
                </Button>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No floor plan uploaded.</p>
          )}
          {canManage ? (
            <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFloorPlan(e.target.files?.[0] || null)} />
          ) : null}
          <AttachedImagePreview files={floorPlan} />
          {floorPlan && !floorPlan.type.startsWith('image/') ? (
            <p className="text-sm text-muted-foreground">{floorPlan.name}</p>
          ) : null}
        </section>
        {canManage && editing && <div className="flex flex-wrap justify-end gap-2 rounded-xl border border-border bg-card p-3"><Button type="button" variant="outline" onClick={cancelEdits}>Cancel edits</Button><Button type="button" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button></div>}
        </div>
        <aside className="space-y-5">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-semibold">Space summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Status</span><Badge variant="secondary">{space.status?.replaceAll('_', ' ') || 'Active'}</Badge></div>
              <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Packages</span><span className="font-medium">{space.packages?.length || 0}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Photos</span><span className="font-medium">{gallery.length}</span></div>
              <div className="flex items-center justify-between gap-3"><span className="text-muted-foreground">Default space</span><span className="font-medium">{space.is_default ? 'Yes' : 'No'}</span></div>
            </div>
            <div className="mt-5 rounded-xl bg-primary/[0.07] p-4"><div className="flex items-center gap-2 text-sm font-medium"><Star className="size-4 text-primary" />Good to know</div><p className="mt-2 text-xs leading-5 text-muted-foreground">Complete the space details and add photos to help organizers choose the right setup.</p></div>
          </section>
          <Button asChild variant="outline" className="w-full justify-between"><Link to="/dashboard/venue"><span className="inline-flex items-center"><ArrowLeft className="mr-2 size-4" />All venue spaces</span><ArrowUpRight className="size-4" /></Link></Button>
        </aside>
       </div>
      </fieldset>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent><DialogHeader><DialogTitle>Delete this space?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">{space.name} and its packages will be removed from the venue.</p><DialogFooter><Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button><Button variant="destructive" onClick={remove}>Delete space</Button></DialogFooter></DialogContent>
      </Dialog>

      <Dialog
        open={packageOpen}
        onOpenChange={(next) => {
          setPackageOpen(next)
          if (!next) setEditingPackage(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Edit package' : 'Add package'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={packageForm.name} onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>Unit</Label>
                <Select
                  value={packageForm.unit}
                  onValueChange={(v: 'hourly' | 'daily') => setPackageForm({ ...packageForm, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Price</Label>
                <Input type="number" value={packageForm.price} onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <Input
                  value={packageForm.currency}
                  maxLength={3}
                  onChange={(e) => setPackageForm({ ...packageForm, currency: e.target.value.toUpperCase() })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={savePackage} disabled={saving}>
              {saving ? 'Saving…' : 'Save package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
