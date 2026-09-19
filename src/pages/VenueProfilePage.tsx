import { useEffect, useMemo, useState } from 'react'
import { ImageIcon, MapPin, Save, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import GoogleVenueAutocompleteInput from '@/components/GoogleVenueAutocompleteInput'
import { venueApi, type Venue } from '@/lib/api/venues'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const AMENITY_OPTIONS = ['Wi‑Fi', 'Parking', 'AV / projector', 'Stage', 'Catering', 'Air conditioning', 'Outdoor space', 'Accessibility']

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const

type DayHours = { open?: string; close?: string; closed?: boolean }

const defaultHours = (): Record<string, DayHours> =>
  Object.fromEntries(DAYS.map((d) => [d.key, { open: '09:00', close: '18:00', closed: false }]))

export default function VenueProfilePage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'venue_admin' || user?.role === 'admin' || user?.role === 'superadmin'
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [venue, setVenue] = useState<Venue | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    formatted_address: '',
    website: '',
    description: '',
    latitude: '' as string | number | null,
    longitude: '' as string | number | null,
  })
  const [amenities, setAmenities] = useState<string[]>([])
  const [openingHours, setOpeningHours] = useState<Record<string, DayHours>>(defaultHours())
  const [isListed, setIsListed] = useState(true)
  const [logo, setLogo] = useState<File | null>(null)
  const [banner, setBanner] = useState<File | null>(null)
  const [photos, setPhotos] = useState<FileList | null>(null)
  const [removePhotos, setRemovePhotos] = useState<string[]>([])

  useEffect(() => {
    venueApi
      .profile()
      .then((res) => {
        const v = res.data
        setVenue(v)
        setForm({
          name: v.name || '',
          email: v.email || '',
          phone: v.phone || '',
          city: v.city || '',
          formatted_address: v.formatted_address || '',
          website: v.website || '',
          description: v.description || '',
          latitude: v.latitude ?? '',
          longitude: v.longitude ?? '',
        })
        setAmenities(v.amenities || [])
        setIsListed(v.is_listed !== false)
        setOpeningHours({ ...defaultHours(), ...(v.opening_hours || {}) })
      })
      .finally(() => setLoading(false))
  }, [])

  const gallery = useMemo(() => {
    const paths = venue?.photos || []
    const urls = venue?.photo_urls || []
    return paths
      .map((path, i) => ({ path, url: urls[i] }))
      .filter((item) => item.url && !removePhotos.includes(item.path))
  }, [venue, removePhotos])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin) {
      toast.error('Only venue admins can edit the profile')
      return
    }
    setSaving(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== '') data.append(key, String(value))
      })
      data.append('amenities', JSON.stringify(amenities))
      data.append('opening_hours', JSON.stringify(openingHours))
      data.append('is_listed', isListed ? '1' : '0')
      if (removePhotos.length) data.append('remove_photos', JSON.stringify(removePhotos))
      if (logo) data.append('logo', logo)
      if (banner) data.append('banner', banner)
      if (photos) {
        Array.from(photos).forEach((file) => data.append('photos[]', file))
      }
      const res = await venueApi.updateProfile(data)
      setVenue(res.data)
      setLogo(null)
      setBanner(null)
      setPhotos(null)
      setRemovePhotos([])
      toast.success('Profile saved')
    } catch (err: any) {
      const errors = err.response?.data
      const first =
        typeof errors === 'object' && errors
          ? Object.values(errors).flat()?.[0]
          : null
      toast.error((first as string) || err.response?.data?.error || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner text="Loading profile..." />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <MapPin className="h-5 w-5 text-[hsl(var(--color-rich-black))]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Venue profile</h1>
            <p className="text-muted-foreground">How your venue appears to organizers and on Evella.</p>
          </div>
        </div>
        {isAdmin ? (
          <Button
            form="venue-profile-form"
            type="submit"
            disabled={saving}
            className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save profile'}
          </Button>
        ) : null}
      </div>

      {(venue?.banner_url || venue?.logo_url) && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative h-36 bg-gradient-to-br from-primary/20 via-muted to-background">
            {venue?.banner_url ? <img src={venue.banner_url} alt="" className="h-full w-full object-cover" /> : null}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {venue?.logo_url ? (
              <img
                src={venue.logo_url}
                alt=""
                className="absolute bottom-4 left-4 h-16 w-16 rounded-2xl border-2 border-background object-cover shadow-lg"
              />
            ) : null}
            <div className="absolute bottom-4 left-24">
              <p className="text-lg font-bold text-white drop-shadow">{venue?.name}</p>
              {venue?.city ? <p className="text-sm text-white/80">{venue.city}</p> : null}
            </div>
          </div>
        </div>
      )}

      <form id="venue-profile-form" onSubmit={save} className="space-y-6" aria-disabled={!isAdmin}>
        <fieldset disabled={!isAdmin} className="space-y-6 disabled:opacity-80">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Public directory</h2>
                <p className="text-sm text-muted-foreground">Show this venue on Evella and in organizer pickers.</p>
              </div>
              <Switch checked={isListed} onCheckedChange={setIsListed} />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Identity</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Location</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Address</Label>
                <GoogleVenueAutocompleteInput
                  value={form.formatted_address}
                  onChange={(value) => setForm((prev) => ({ ...prev, formatted_address: value }))}
                  onPlaceSelected={(selection) => {
                    setForm((prev) => ({
                      ...prev,
                      formatted_address: selection.formattedAddress,
                      city: selection.city || prev.city,
                      latitude: selection.latitude,
                      longitude: selection.longitude,
                    }))
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Opening hours</h2>
            <div className="space-y-3">
              {DAYS.map((day) => {
                const row = openingHours[day.key] || { open: '09:00', close: '18:00', closed: false }
                return (
                  <div key={day.key} className="grid items-center gap-3 sm:grid-cols-[120px_1fr_1fr_auto]">
                    <p className="text-sm font-medium">{day.label}</p>
                    <Input
                      type="time"
                      value={row.open || ''}
                      disabled={!!row.closed}
                      onChange={(e) =>
                        setOpeningHours((prev) => ({ ...prev, [day.key]: { ...row, open: e.target.value } }))
                      }
                    />
                    <Input
                      type="time"
                      value={row.close || ''}
                      disabled={!!row.closed}
                      onChange={(e) =>
                        setOpeningHours((prev) => ({ ...prev, [day.key]: { ...row, close: e.target.value } }))
                      }
                    />
                    <label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Checkbox
                        checked={!!row.closed}
                        onCheckedChange={(value) =>
                          setOpeningHours((prev) => ({ ...prev, [day.key]: { ...row, closed: !!value } }))
                        }
                      />
                      Closed
                    </label>
                  </div>
                )
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">Amenities</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AMENITY_OPTIONS.map((item) => {
                const checked = amenities.includes(item)
                return (
                  <label
                    key={item}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                      checked
                        ? 'border-primary/40 bg-primary/10 font-medium text-foreground'
                        : 'border-border bg-muted/20 text-muted-foreground hover:border-primary/30',
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

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-semibold tracking-tight">Media</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Logo</Label>
                {venue?.logo_url ? <img src={venue.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover" /> : null}
                <Input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
              </div>
              <div className="space-y-2">
                <Label>Banner</Label>
                {venue?.banner_url ? <img src={venue.banner_url} alt="" className="h-14 w-full rounded-xl object-cover" /> : null}
                <Input type="file" accept="image/*" onChange={(e) => setBanner(e.target.files?.[0] || null)} />
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Label>Gallery photos</Label>
              {gallery.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {gallery.map((item) => (
                    <div key={item.path} className="group relative overflow-hidden rounded-xl border border-border">
                      <img src={item.url} alt="" className="aspect-video w-full object-cover" />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100"
                        onClick={() => setRemovePhotos((prev) => [...prev, item.path])}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No gallery photos yet.</p>
              )}
              <Input type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} />
            </div>
          </section>
        </fieldset>
      </form>
    </div>
  )
}
