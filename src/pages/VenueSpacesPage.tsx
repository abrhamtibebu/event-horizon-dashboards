import { useEffect, useMemo, useState } from 'react'
import { FileText, ImageIcon, LayoutGrid, Plus, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { venueApi, type VenueSpace, type VenueSpacePackage } from '@/lib/api/venues'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/use-auth'
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

const emptyPackage = {
  name: '',
  unit: 'hourly' as 'hourly' | 'daily',
  price: '',
  currency: 'ETB',
}

export default function VenueSpacesPage() {
  const { user } = useAuth()
  const canManage = user?.role === 'venue_admin' || user?.role === 'admin' || user?.role === 'superadmin'
  const [spaces, setSpaces] = useState<VenueSpace[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [packageOpen, setPackageOpen] = useState(false)
  const [editing, setEditing] = useState<VenueSpace | null>(null)
  const [packageSpace, setPackageSpace] = useState<VenueSpace | null>(null)
  const [editingPackage, setEditingPackage] = useState<VenueSpacePackage | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [amenities, setAmenities] = useState<string[]>([])
  const [photos, setPhotos] = useState<FileList | null>(null)
  const [floorPlan, setFloorPlan] = useState<File | null>(null)
  const [removePhotos, setRemovePhotos] = useState<string[]>([])
  const [removeFloorPlan, setRemoveFloorPlan] = useState(false)
  const [packageForm, setPackageForm] = useState(emptyPackage)
  const [saving, setSaving] = useState(false)

  const load = () =>
    venueApi.spaces().then((res) => setSpaces(res.data)).finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const gallery = useMemo(() => {
    if (!editing) return []
    const paths = editing.photos || []
    const urls = editing.photo_urls || []
    return paths
      .map((path, i) => ({ path, url: urls[i] }))
      .filter((item) => item.url && !removePhotos.includes(item.path))
  }, [editing, removePhotos])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setAmenities([])
    setPhotos(null)
    setFloorPlan(null)
    setRemovePhotos([])
    setRemoveFloorPlan(false)
    setOpen(true)
  }

  const openEdit = (space: VenueSpace) => {
    setEditing(space)
    const layouts = space.layout_capacities || {}
    setForm({
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
    })
    setAmenities(space.amenities || [])
    setPhotos(null)
    setFloorPlan(null)
    setRemovePhotos([])
    setRemoveFloorPlan(false)
    setOpen(true)
  }

  const openPackage = (space: VenueSpace, pkg?: VenueSpacePackage) => {
    setPackageSpace(space)
    setEditingPackage(pkg || null)
    setPackageForm(
      pkg
        ? {
            name: pkg.name,
            unit: pkg.unit,
            price: String(pkg.price),
            currency: pkg.currency || 'ETB',
          }
        : emptyPackage,
    )
    setPackageOpen(true)
  }

  const buildFormData = () => {
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
    return data
  }

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      const payload = buildFormData()
      if (editing) {
        await venueApi.updateSpace(editing.id, payload)
        toast.success('Space updated')
      } else {
        await venueApi.createSpace(payload)
        toast.success('Space added')
      }
      setOpen(false)
      load()
    } catch (err: any) {
      const errors = err.response?.data
      const first =
        typeof errors === 'object' && errors
          ? (Object.values(errors).flat()?.[0] as string)
          : null
      toast.error(first || err.response?.data?.error || 'Could not save space')
    } finally {
      setSaving(false)
    }
  }

  const savePackage = async () => {
    if (!packageSpace) return
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
      if (editingPackage) {
        await venueApi.updatePackage(editingPackage.id, payload)
        toast.success('Package updated')
      } else {
        await venueApi.createPackage(packageSpace.id, payload)
        toast.success('Package added')
      }
      setPackageOpen(false)
      setEditingPackage(null)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not save package')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (space: VenueSpace) => {
    if (!confirm(`Delete ${space.name}?`)) return
    try {
      await venueApi.deleteSpace(space.id)
      toast.success('Space deleted')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not delete space')
    }
  }

  const removePackage = async (pkg: VenueSpacePackage) => {
    try {
      await venueApi.deletePackage(pkg.id)
      toast.success('Package deleted')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not delete package')
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner text="Loading spaces..." />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <LayoutGrid className="h-5 w-5 text-[hsl(var(--color-rich-black))]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Halls & spaces</h1>
            <p className="text-muted-foreground">Rooms organizers can request, with media, layouts, and packages.</p>
          </div>
        </div>
        {canManage ? (
          <Button className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg" onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add space
          </Button>
        ) : null}
      </div>

      {spaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <LayoutGrid className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold text-foreground">No spaces yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Add your main hall or rooms so organizers can request the right space.
          </p>
          <Button className="mt-5" onClick={openCreate} disabled={!canManage}>
            <Plus className="mr-2 h-4 w-4" />
            Add your first space
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {spaces.map((space) => {
            const cover = space.photo_urls?.[0]
            const layouts = space.layout_capacities || {}
            return (
              <article
                key={space.id}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-primary/40 hover:shadow-lg"
              >
                <div className="relative h-36 bg-gradient-to-br from-primary/15 via-muted to-background">
                  {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-semibold text-white drop-shadow">{space.name}</h2>
                      {space.is_default ? (
                        <Badge variant="outline" className="mt-1 border-white/40 bg-white/15 text-white">
                          Default
                        </Badge>
                      ) : null}
                    </div>
                    {canManage ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(space)}>
                          Edit
                        </Button>
                        <Button size="icon" variant="secondary" onClick={() => remove(space)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  {space.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">{space.description}</p>
                  ) : null}

                  <div className="flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1">
                      <Users className="h-3.5 w-3.5" />
                      {space.capacity ?? '—'} guests
                    </span>
                    {space.floor_area != null ? (
                      <span className="rounded-lg bg-muted px-2.5 py-1">{space.floor_area} m²</span>
                    ) : null}
                    {(space.amenities?.length || 0) > 0 ? (
                      <span className="rounded-lg bg-muted px-2.5 py-1">{space.amenities!.length} amenities</span>
                    ) : null}
                    {space.floor_plan_url ? (
                      <a
                        href={space.floor_plan_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 hover:text-foreground"
                      >
                        <FileText className="h-3.5 w-3.5" /> Floor plan
                      </a>
                    ) : null}
                  </div>

                  {LAYOUT_KEYS.some((l) => layouts[l.key]) ? (
                    <div className="flex flex-wrap gap-1.5">
                      {LAYOUT_KEYS.map((l) =>
                        layouts[l.key] ? (
                          <Badge key={l.key} variant="outline" className="rounded-full text-[10px]">
                            {l.label} {layouts[l.key]}
                          </Badge>
                        ) : null,
                      )}
                    </div>
                  ) : null}

                  {(space.setup_minutes || space.teardown_minutes) ? (
                    <p className="text-xs text-muted-foreground">
                      Buffers: {space.setup_minutes || 0} min setup · {space.teardown_minutes || 0} min teardown
                    </p>
                  ) : null}

                  <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Packages</p>
                      {canManage ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openPackage(space)}>
                          <Plus className="mr-1 h-3.5 w-3.5" /> Add
                        </Button>
                      ) : null}
                    </div>
                    {(space.packages ?? []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No named packages yet.</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {(space.packages ?? []).map((pkg) => (
                          <li key={pkg.id} className="flex items-center justify-between gap-2 text-xs text-foreground">
                            <button
                              type="button"
                              className="text-left hover:underline"
                              onClick={() => canManage && openPackage(space, pkg)}
                            >
                              {pkg.name}
                              {' · '}
                              {pkg.currency || 'ETB'} {Number(pkg.price).toLocaleString()}
                              /{pkg.unit === 'daily' ? 'day' : 'hr'}
                            </button>
                            {canManage ? (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removePackage(pkg)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit space' : 'Add space'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Basics</h3>
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="space-y-1">
                  <Label>Capacity</Label>
                  <Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Area m²</Label>
                  <Input type="number" value={form.floor_area} onChange={(e) => setForm({ ...form, floor_area: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Hourly rate</Label>
                  <Input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Sort order</Label>
                  <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={form.is_default} onCheckedChange={(c) => setForm({ ...form, is_default: Boolean(c) })} />
                Default space
              </label>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Dimensions (m)</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label>Length</Label>
                  <Input type="number" value={form.length_m} onChange={(e) => setForm({ ...form, length_m: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Width</Label>
                  <Input type="number" value={form.width_m} onChange={(e) => setForm({ ...form, width_m: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label>Ceiling</Label>
                  <Input
                    type="number"
                    value={form.ceiling_height_m}
                    onChange={(e) => setForm({ ...form, ceiling_height_m: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Layout capacities</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {LAYOUT_KEYS.map((l) => (
                  <div key={l.key} className="space-y-1">
                    <Label>{l.label}</Label>
                    <Input
                      type="number"
                      value={form[l.key]}
                      onChange={(e) => setForm({ ...form, [l.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Amenities</h3>
              <div className="grid grid-cols-2 gap-2">
                {SPACE_AMENITIES.map((item) => {
                  const checked = amenities.includes(item)
                  return (
                    <label
                      key={item}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                        checked ? 'border-primary/40 bg-primary/10' : 'border-border',
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

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Buffers</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Setup (minutes)</Label>
                  <Input
                    type="number"
                    value={form.setup_minutes}
                    onChange={(e) => setForm({ ...form, setup_minutes: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Teardown (minutes)</Label>
                  <Input
                    type="number"
                    value={form.teardown_minutes}
                    onChange={(e) => setForm({ ...form, teardown_minutes: e.target.value })}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold">Media</h3>
              </div>
              {gallery.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {gallery.map((item) => (
                    <div key={item.path} className="group relative overflow-hidden rounded-xl border">
                      <img src={item.url} alt="" className="aspect-video w-full object-cover" />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="absolute right-1 top-1 opacity-0 group-hover:opacity-100"
                        onClick={() => setRemovePhotos((prev) => [...prev, item.path])}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="space-y-1">
                <Label>Gallery photos</Label>
                <Input type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} />
              </div>
              <div className="space-y-1">
                <Label>Floor plan (image or PDF)</Label>
                {editing?.floor_plan_url && !removeFloorPlan ? (
                  <div className="flex items-center gap-2 text-sm">
                    <a href={editing.floor_plan_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      Current floor plan
                    </a>
                    <Button type="button" size="sm" variant="outline" onClick={() => setRemoveFloorPlan(true)}>
                      Remove
                    </Button>
                  </div>
                ) : null}
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFloorPlan(e.target.files?.[0] || null)}
                />
              </div>
            </section>

            <section className="space-y-1">
              <Label>Rules</Label>
              <Textarea
                rows={3}
                value={form.rules}
                onChange={(e) => setForm({ ...form, rules: e.target.value })}
                placeholder="Noise curfew, no open flame, load-in rules…"
              />
            </section>
          </div>
          <DialogFooter>
            <Button onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={packageOpen}
        onOpenChange={(openNext) => {
          setPackageOpen(openNext)
          if (!openNext) setEditingPackage(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit package' : 'Add package'}
              {packageSpace ? ` · ${packageSpace.name}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={packageForm.name}
                onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                placeholder="Half day, Weekend, Full day…"
              />
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
                <Input
                  type="number"
                  value={packageForm.price}
                  onChange={(e) => setPackageForm({ ...packageForm, price: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Currency</Label>
                <Input
                  value={packageForm.currency}
                  onChange={(e) => setPackageForm({ ...packageForm, currency: e.target.value.toUpperCase() })}
                  maxLength={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={savePackage} disabled={saving}>
              {saving ? 'Saving…' : editingPackage ? 'Save package' : 'Add package'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
