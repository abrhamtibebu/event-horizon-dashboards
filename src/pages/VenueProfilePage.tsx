import { useEffect, useMemo, useState } from 'react'
import { ImageIcon, MapPin, Save, Trash2, Copy, ExternalLink, Code2, Download, Wifi, CarFront, Presentation, MicVocal, Utensils, Snowflake, Trees, Accessibility, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
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
import { getSharePreviewBaseURL, getVenuePublicSiteURL } from '@/config/env'

const AMENITY_OPTIONS = ['Wi‑Fi', 'Parking', 'AV / projector', 'Stage', 'Catering', 'Air conditioning', 'Outdoor space', 'Accessibility']
const AMENITY_ICONS = [Wifi, CarFront, Presentation, MicVocal, Utensils, Snowflake, Trees, Accessibility]
const LISTING_SECTIONS = [
  { key: 'identity', label: 'Identity', hint: 'Venue details' },
  { key: 'location', label: 'Location', hint: 'Where to find you' },
  { key: 'hours', label: 'Hours', hint: 'Availability' },
  { key: 'amenities', label: 'Amenities', hint: 'What you offer' },
  { key: 'photos', label: 'Photos', hint: 'Show your space' },
  { key: 'visibility', label: 'Visibility', hint: 'Publish your listing' },
] as const

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
  const [activeSection, setActiveSection] = useState<(typeof LISTING_SECTIONS)[number]['key']>('identity')
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
    if (!form.name.trim()) {
      setActiveSection('identity')
      toast.error('Add a venue name before saving')
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
  const publicBase = getVenuePublicSiteURL()
  const reservationUrl = venue ? `${publicBase}/venues/${venue.id}?utm_source=direct_link&utm_medium=share#venue-request-form` : ''
  const embedUrl = venue ? `${publicBase}/embed/venues/${venue.id}?utm_source=website_embed&utm_medium=iframe` : ''
  const socialUrl = venue ? `${getSharePreviewBaseURL()}/share/venues/${venue.id}?utm_source=social&utm_medium=share` : ''
  const copyShareValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Could not access clipboard. Copy the link manually.')
    }
  }

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

      <div className="rounded-2xl border border-border bg-background p-3 shadow-sm sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-sm font-semibold">Listing setup</p>
            <p className="text-xs text-muted-foreground">A few details make it easier for organizers to choose your venue.</p>
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{LISTING_SECTIONS.findIndex((section) => section.key === activeSection) + 1} of {LISTING_SECTIONS.length}</span>
        </div>
        <div className="mb-3 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((LISTING_SECTIONS.findIndex((section) => section.key === activeSection) + 1) / LISTING_SECTIONS.length) * 100}%` }} />
        </div>
        <nav aria-label="Listing sections" className="flex gap-2 overflow-x-auto pb-1">
          {LISTING_SECTIONS.map((section, index) => {
            const selected = activeSection === section.key
            const visited = index < LISTING_SECTIONS.findIndex((item) => item.key === activeSection)
            return (
              <button
                key={section.key}
                type="button"
                aria-current={selected ? 'step' : undefined}
                onClick={() => setActiveSection(section.key)}
                className={cn('flex min-w-[148px] shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors sm:min-w-0 sm:flex-1', selected ? 'border-primary/30 bg-primary/[0.07] text-foreground' : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/50')}
              >
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold', selected ? 'bg-primary text-primary-foreground' : visited ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>{index + 1}</span>
                <span className="min-w-0"><span className={cn('block text-sm font-medium', selected && 'text-primary')}>{section.label}</span><span className="hidden truncate text-[11px] sm:block">{section.hint}</span></span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form id="venue-profile-form" onSubmit={save} className="space-y-6">
          <fieldset disabled={!isAdmin} className="space-y-6 disabled:opacity-80">
            <section id="listing-identity" hidden={activeSection !== 'identity'} className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-6 border-b border-border pb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Section 01</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Tell organizers about your venue</h2><p className="mt-1 text-sm text-muted-foreground">Start with the details people will use to recognize and contact you.</p></div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
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

            <section id="listing-location" hidden={activeSection !== 'location'} className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-6 border-b border-border pb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Section 02</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Where can guests find you?</h2><p className="mt-1 text-sm text-muted-foreground">A precise location helps organizers plan transport and timing.</p></div>
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

            <section id="listing-hours" hidden={activeSection !== 'hours'} className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-6 border-b border-border pb-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Section 03</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Set your opening hours</h2><p className="mt-1 text-sm text-muted-foreground">Let organizers know when they can visit or get in touch.</p></div>
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

            <section id="listing-amenities" hidden={activeSection !== 'amenities'} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-gradient-to-br from-primary/[0.07] via-card to-card px-6 py-5 sm:px-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl border border-primary/15 bg-background p-2.5 text-primary shadow-sm"><ImageIcon className="h-5 w-5" /></div>
                    <div>
                      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your listing</p>
                      <h2 className="text-xl font-semibold tracking-tight">Amenities</h2>
                      <p className="mt-1 max-w-lg text-sm text-muted-foreground">Help organizers find the right fit by highlighting what your venue offers.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 self-center">
                    <Badge variant="secondary" className="rounded-full px-3 py-1 tabular-nums">{amenities.length} selected</Badge>
                    {amenities.length > 0 && isAdmin ? (
                      <button type="button" onClick={() => setAmenities([])} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Clear all</button>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-7">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {AMENITY_OPTIONS.map((item, index) => {
                    const checked = amenities.includes(item)
                    const AmenityIcon = AMENITY_ICONS[index]
                    return (
                      <label
                        key={item}
                        className={cn(
                          'group relative flex min-h-[86px] items-center gap-3 rounded-xl border p-4 transition-all',
                          checked
                            ? 'border-primary/40 bg-primary/[0.07] shadow-sm shadow-primary/5'
                            : 'border-border bg-background hover:border-primary/30 hover:bg-muted/30',
                          isAdmin && 'cursor-pointer',
                        )}
                      >
                        <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors', checked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground')}>
                          <AmenityIcon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-foreground">{item}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">{checked ? 'Included in your listing' : 'Add to your listing'}</span>
                        </span>
                        <Checkbox
                          checked={checked}
                          aria-label={item}
                          className="sr-only"
                          onCheckedChange={(value) => {
                            setAmenities((prev) => (value ? [...prev, item] : prev.filter((a) => a !== item)))
                          }}
                        />
                        <span aria-hidden="true" className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors', checked ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background')}>
                          {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                        </span>
                      </label>
                    )
                  })}
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Only select amenities that are available to guests at your venue.</p>
              </div>
            </section>

            <section id="listing-photos" hidden={activeSection !== 'photos'} className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="mb-4 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-semibold tracking-tight">Photos</h2>
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
                <label
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    if (e.dataTransfer.files?.length) setPhotos(e.dataTransfer.files)
                  }}
                >
                  Drop gallery photos here, or click to choose
                  <input className="sr-only" type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} />
                </label>
                <AttachedImagePreview files={photos} />
              </div>
            </section>

            <section id="listing-visibility" hidden={activeSection !== 'visibility'} className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-tight">Visibility</h2>
                  <p className="text-sm text-muted-foreground">Show this venue on Evella and in organizer pickers.</p>
                </div>
                <Switch checked={isListed} onCheckedChange={setIsListed} />
              </div>
            </section>
          </fieldset>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card/80 p-3 sm:p-4">
            <Button type="button" variant="outline" disabled={activeSection === LISTING_SECTIONS[0].key} onClick={() => setActiveSection(LISTING_SECTIONS[Math.max(0, LISTING_SECTIONS.findIndex((section) => section.key === activeSection) - 1)].key)}>Previous</Button>
            <p className="hidden text-xs text-muted-foreground sm:block">Your changes are saved when you click Save listing.</p>
            {activeSection === LISTING_SECTIONS[LISTING_SECTIONS.length - 1].key ? (
              isAdmin ? <Button type="submit" disabled={saving} className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg"><Save className="mr-2 h-4 w-4" />{saving ? 'Saving…' : 'Save listing'}</Button> : <span className="text-sm text-muted-foreground">Listing setup complete</span>
            ) : (
              <Button type="button" onClick={() => setActiveSection(LISTING_SECTIONS[LISTING_SECTIONS.findIndex((section) => section.key === activeSection) + 1].key)}>Continue</Button>
            )}
          </div>
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

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><Code2 className="h-5 w-5" /></div>
          <div><h2 className="text-lg font-semibold">Share & embed</h2><p className="text-sm text-muted-foreground">Send clients to your reservation request or add it to your website.</p></div>
        </div>
        {!isListed ? <p className="mb-4 rounded-lg bg-amber-500/10 p-3 text-sm text-amber-800">Publish your listing before sharing it with clients.</p> : null}
        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <div className="space-y-4">
            <div className="space-y-2"><Label>Reservation link</Label><div className="flex gap-2"><Input readOnly value={reservationUrl} /><Button type="button" variant="outline" onClick={() => void copyShareValue(reservationUrl, 'Reservation link')}><Copy className="mr-2 h-4 w-4"/>Copy</Button><a href={reservationUrl} target="_blank" rel="noreferrer" aria-label="Open reservation link" className="inline-flex h-10 items-center rounded-md border px-3"><ExternalLink className="h-4 w-4"/></a></div></div>
            <div className="space-y-2"><Label>Social preview link</Label><div className="flex gap-2"><Input readOnly value={socialUrl} /><Button type="button" variant="outline" onClick={() => void copyShareValue(socialUrl, 'Social link')}><Copy className="mr-2 h-4 w-4"/>Copy</Button><a href={`https://wa.me/?text=${encodeURIComponent(`${form.name || venue?.name} — Request a venue space: ${reservationUrl}`)}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-md border px-3 text-sm">WhatsApp</a></div></div>
            <div className="space-y-2"><Label>Website embed code</Label><Textarea readOnly rows={3} value={`<iframe src="${embedUrl}" title="${form.name || venue?.name} reservation form" width="100%" height="760" loading="lazy" style="border:0;border-radius:16px" referrerpolicy="strict-origin-when-cross-origin"></iframe>`}/><Button type="button" variant="outline" onClick={() => void copyShareValue(`<iframe src="${embedUrl}" title="${form.name || venue?.name} reservation form" width="100%" height="760" loading="lazy" style="border:0;border-radius:16px" referrerpolicy="strict-origin-when-cross-origin"></iframe>`, 'Embed code')}><Copy className="mr-2 h-4 w-4"/>Copy embed code</Button></div>
            <p className="text-xs text-muted-foreground">The embed shows a request form. The venue confirms availability and booking separately.</p>
          </div>
          <div className="flex flex-col items-center gap-3 rounded-xl border p-4"><QRCodeSVG id="venue-reservation-qr" value={reservationUrl || publicBase} size={172} title="Venue reservation QR code"/><span className="text-sm font-medium">Scan to request</span><Button type="button" size="sm" variant="outline" onClick={() => { const svg=document.getElementById('venue-reservation-qr'); if (!svg) return; const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='venue-reservation-qr.svg'; a.click(); URL.revokeObjectURL(url) }}><Download className="mr-2 h-4 w-4"/>Download QR</Button></div>
        </div>
      </section>

    </div>
  )
}
