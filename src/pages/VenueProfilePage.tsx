import { useEffect, useMemo, useState } from 'react'
import { ImageIcon, MapPin, Save, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import GoogleVenueAutocompleteInput from '@/components/GoogleVenueAutocompleteInput'
import { AttachedImagePreview } from '@/components/venue/AttachedImagePreview'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
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
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)

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

  useEffect(() => {
    if (!logo) {
      setLogoPreview(null)
      return
    }
    const url = URL.createObjectURL(logo)
    setLogoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logo])

  useEffect(() => {
    if (!banner) {
      setBannerPreview(null)
      return
    }
    const url = URL.createObjectURL(banner)
    setBannerPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [banner])

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
      if (photos) Array.from(photos).forEach((file) => data.append('photos[]', file))
      const res = await venueApi.updateProfile(data)
      setVenue(res.data)
      setLogo(null)
      setBanner(null)
      setPhotos(null)
      setRemovePhotos([])
      toast.success('Profile saved')
    } catch (err: any) {
      const errors = err.response?.data
      const first = typeof errors === 'object' && errors ? Object.values(errors).flat()?.[0] : null
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

  const cover = bannerPreview || venue?.banner_url
  const mark = logoPreview || venue?.logo_url
  const spaceCount = venue?.spaces_count ?? venue?.spaces?.length ?? 0

  return (
    <div className="space-y-8">
      <VenuePageHeader
        icon={MapPin}
        title="Listing"
        subtitle={isAdmin ? 'How your venue appears to organizers and on Evella.' : 'View only. Ask a venue admin to edit the listing.'}
        actions={
          isAdmin ? (
            <Button
              form="venue-profile-form"
              type="submit"
              disabled={saving}
              className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Save listing'}
            </Button>
          ) : null
        }
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form id="venue-profile-form" onSubmit={save} className="space-y-6">
          <fieldset disabled={!isAdmin} className="space-y-6 disabled:opacity-80">
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
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Hours</h2>
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
                        'flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                        checked
                          ? 'border-primary/40 bg-primary/10 font-medium text-foreground'
                          : 'border-border bg-muted/20 text-muted-foreground',
                        isAdmin && 'cursor-pointer hover:border-primary/30',
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
                  <Input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
                  <AttachedImagePreview files={logo} />
                </div>
                <div className="space-y-2">
                  <Label>Banner</Label>
                  <Input type="file" accept="image/*" onChange={(e) => setBanner(e.target.files?.[0] || null)} />
                  <AttachedImagePreview files={banner} />
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <Label>Gallery photos</Label>
                {gallery.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {gallery.map((item) => (
                      <div key={item.path} className="group relative overflow-hidden rounded-xl border border-border">
                        <img src={item.url} alt="" className="aspect-video w-full object-cover" />
                        {isAdmin ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="absolute right-2 top-2"
                            onClick={() => setRemovePhotos((prev) => [...prev, item.path])}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No gallery photos yet.</p>
                )}
                <Input type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} />
                <AttachedImagePreview files={photos} />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Visibility</h2>
                  <p className="text-sm text-muted-foreground">Show this venue on Evella and in organizer pickers.</p>
                </div>
                <Switch checked={isListed} onCheckedChange={setIsListed} />
              </div>
            </section>
          </fieldset>
        </form>

        <aside className="xl:sticky xl:top-6">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="relative h-36 bg-gradient-to-br from-primary/20 via-muted to-background">
              {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              {mark ? (
                <img src={mark} alt="" className="absolute bottom-3 left-3 h-14 w-14 rounded-2xl border-2 border-background object-cover" />
              ) : null}
            </div>
            <div className="space-y-3 p-5">
              <div>
                <p className="text-lg font-bold">{form.name || 'Venue name'}</p>
                <p className="text-sm text-muted-foreground">{form.city || form.formatted_address || 'Add a city'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className={isListed ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700' : ''}>
                  {isListed ? 'Listed' : 'Unlisted'}
                </Badge>
                {venue?.verified ? <Badge variant="outline">Verified</Badge> : <Badge variant="outline">Unverified</Badge>}
                {venue?.status ? <Badge variant="outline" className="capitalize">{venue.status}</Badge> : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {spaceCount} space{spaceCount === 1 ? '' : 's'}
              </p>
              {amenities.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {amenities.slice(0, 6).map((item) => (
                    <Badge key={item} variant="secondary" className="rounded-full">
                      {item}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {form.description ? <p className="line-clamp-4 text-sm text-muted-foreground">{form.description}</p> : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
