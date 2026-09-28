import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, ImageIcon, LayoutGrid, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { venueApi, type VenueSpace, type VenueSpacePackage } from '@/lib/api/venues'
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
  { key: 'cocktail', label: 'Cocktail' },
] as const

const emptyForm = {
  name: '',
  description: '',
  capacity: '',
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
  theater: '',
  banquet: '',
  classroom: '',
  cocktail: '',
}

const emptyPackage = { name: '', unit: 'hourly' as 'hourly' | 'daily', price: '', currency: 'ETB' }

function formFromSpace(space: VenueSpace) {
  const layouts = space.layout_capacities || {}
  return {
    name: space.name,
    description: space.description || '',
    capacity: space.capacity ? String(space.capacity) : '',
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
    theater: layouts.theater != null ? String(layouts.theater) : '',
    banquet: layouts.banquet != null ? String(layouts.banquet) : '',
    classroom: layouts.classroom != null ? String(layouts.classroom) : '',
    cocktail: layouts.cocktail != null ? String(layouts.cocktail) : '',
  }
}

export default function VenueSpaceDetailPage() {
  const { spaceId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const canManage = user?.role === 'venue_admin' || user?.role === 'admin' || user?.role === 'superadmin'
  const [space, setSpace] = useState<VenueSpace | null>(null)
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [amenities, setAmenities] = useState<string[]>([])
  const [photos, setPhotos] = useState<FileList | null>(null)
  const [floorPlan, setFloorPlan] = useState<File | null>(null)
  const [removePhotos, setRemovePhotos] = useState<string[]>([])
  const [removeFloorPlan, setRemoveFloorPlan] = useState(false)
  const [packageOpen, setPackageOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState<VenueSpacePackage | null>(null)
  const [packageForm, setPackageForm] = useState(emptyPackage)

  const apply = (next: VenueSpace) => {
    setSpace(next)
    setForm(formFromSpace(next))
    setAmenities(next.amenities || [])
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
      if (form.description) data.append('description', form.description)
      if (form.capacity) data.append('capacity', form.capacity)
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
      data.append('amenities', JSON.stringify(amenities))
      data.append(
        'layout_capacities',
        JSON.stringify({
          theater: form.theater || null,
          banquet: form.banquet || null,
          classroom: form.classroom || null,
          cocktail: form.cocktail || null,
        }),
      )
      if (removePhotos.length) data.append('remove_photos', JSON.stringify(removePhotos))
      if (removeFloorPlan) data.append('remove_floor_plan', '1')
      if (photos) Array.from(photos).forEach((file) => data.append('photos[]', file))
      if (floorPlan) data.append('floor_plan', floorPlan)
      const res = await venueApi.updateSpace(space.id, data)
      apply(res.data)
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
    if (!space || !confirm(`Delete ${space.name}?`)) return
    try {
      await venueApi.deleteSpace(space.id)
      toast.success('Space deleted')
      navigate('/dashboard/venue/spaces')
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
            <Link to="/dashboard/venue/spaces">Back to spaces</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" className="-ml-2 w-fit">
        <Link to="/dashboard/venue/spaces">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Spaces
        </Link>
      </Button>
      <VenuePageHeader
        icon={LayoutGrid}
        title={space.name}
        subtitle={canManage ? 'Overview, layouts, packages, and media.' : 'View only. Ask a venue admin to edit this hall.'}
        actions={
          canManage ? (
            <>
              <Button variant="outline" onClick={remove}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button
                className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg"
                onClick={save}
                disabled={saving}
              >
                {saving ? 'Saving…' : 'Save space'}
              </Button>
            </>
          ) : null
        }
      />

      <fieldset disabled={!canManage} className="space-y-6 disabled:opacity-80">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Overview</h2>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Capacity" value={form.capacity} onChange={(v) => setForm({ ...form, capacity: v })} />
            <Field label="Area m²" value={form.floor_area} onChange={(v) => setForm({ ...form, floor_area: v })} />
            <Field label="Hourly rate" value={form.hourly_rate} onChange={(v) => setForm({ ...form, hourly_rate: v })} />
            <Field label="Sort order" value={form.sort_order} onChange={(v) => setForm({ ...form, sort_order: v })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Length (m)" value={form.length_m} onChange={(v) => setForm({ ...form, length_m: v })} />
            <Field label="Width (m)" value={form.width_m} onChange={(v) => setForm({ ...form, width_m: v })} />
            <Field label="Ceiling (m)" value={form.ceiling_height_m} onChange={(v) => setForm({ ...form, ceiling_height_m: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Setup (minutes)" value={form.setup_minutes} onChange={(v) => setForm({ ...form, setup_minutes: v })} />
            <Field label="Teardown (minutes)" value={form.teardown_minutes} onChange={(v) => setForm({ ...form, teardown_minutes: v })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={form.is_default} onCheckedChange={(c) => setForm({ ...form, is_default: Boolean(c) })} />
            Default space
          </label>
          <div className="space-y-1">
            <Label>Rules</Label>
            <Textarea
              rows={3}
              value={form.rules}
              onChange={(e) => setForm({ ...form, rules: e.target.value })}
              placeholder="Noise curfew, no open flame, load-in rules…"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Layouts</h2>
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
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Amenities</h2>
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
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Packages</h2>
            {canManage ? (
              <Button type="button" variant="outline" size="sm" onClick={() => openPackage()}>
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            ) : null}
          </div>
          {(space.packages ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No named packages yet.</p>
          ) : (
            <ul className="space-y-2">
              {(space.packages ?? []).map((pkg) => (
                <li key={pkg.id} className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
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

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
          {canManage ? <Input type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} /> : null}
          <AttachedImagePreview files={photos} />
        </section>

        <section className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
      </fieldset>

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
