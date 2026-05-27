import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe,
  MapPin,
  Image as ImageIcon,
  Building2,
  ExternalLink,
  Info,
  X,
  Upload,
  Calendar as CalendarIcon,
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import GoogleVenueAutocompleteInput from '@/components/GoogleVenueAutocompleteInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { showSuccessToast, showErrorToast } from '@/components/ui/ModernToast'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

// Ethiopian major cities
const ETHIOPIAN_CITIES = [
  'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Adama',
  'Hawassa', 'Bahir Dar', 'Jimma', 'Dessie', 'Jijiga'
]

function toLocalInputValue(d: Date | null) {
  if (!d) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const mi = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

function parseLocalInputValue(v: string): Date | null {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

export default function CreateExternalEvent() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (user?.role !== 'admin' && user?.role !== 'superadmin') {
      showErrorToast('Only admins and superadmins can create external events')
      navigate('/dashboard/events', { replace: true })
    }
  }, [authLoading, user, navigate])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    external_registration_url: '',
    event_category_id: '',
    city: '',
    venue_name: '',
    organizer_name: '',
  })

  const [scheduleStart, setScheduleStart] = useState<Date | null>(null)
  const [scheduleEnd, setScheduleEnd] = useState<Date | null>(null)

  const [locationMeta, setLocationMeta] = useState<{
    latitude: number | null
    longitude: number | null
    formattedAddress: string
  }>({
    latitude: null,
    longitude: null,
    formattedAddress: '',
  })

  const [eventImage, setEventImage] = useState<File | null>(null)
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null)
  const [orgLogo, setOrgLogo] = useState<File | null>(null)
  const [orgLogoPreview, setOrgLogoPreview] = useState<string | null>(null)
  const [orgBanner, setOrgBanner] = useState<File | null>(null)
  const [orgBannerPreview, setOrgBannerPreview] = useState<string | null>(null)

  const [categories, setCategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/event-categories')
      setCategories(response.data?.data || response.data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const isValidUrl = useMemo(() => {
    if (!formData.external_registration_url) return true
    try {
      const u = new URL(formData.external_registration_url)
      return u.protocol === 'https:' || u.protocol === 'http:'
    } catch {
      return false
    }
  }, [formData.external_registration_url])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'event' | 'logo' | 'banner') => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === 'event') {
        setEventImage(file)
        setEventImagePreview(URL.createObjectURL(file))
      } else if (type === 'logo') {
        setOrgLogo(file)
        setOrgLogoPreview(URL.createObjectURL(file))
      } else {
        setOrgBanner(file)
        setOrgBannerPreview(URL.createObjectURL(file))
      }
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.external_registration_url) {
      showErrorToast('Event name and registration URL are required')
      return
    }
    if (!isValidUrl) {
      showErrorToast('Please enter a valid URL (including https://)')
      return
    }
    if (!formData.event_category_id) {
      showErrorToast('Please select a category')
      return
    }
    if (!formData.city || !formData.venue_name) {
      showErrorToast('Please fill in both city and venue')
      return
    }
    if (!scheduleStart || !scheduleEnd) {
      showErrorToast('Please select both start and end date/time')
      return
    }
    if (scheduleEnd <= scheduleStart) {
      showErrorToast('End date/time must be after start date/time')
      return
    }

    setIsSubmitting(true)
    try {
      const data = new FormData()
      // NOTE: backend does not have a `city` column on `events`.
      // We keep `city` in UI state, but send it via `location` instead.
      data.append('name', formData.name)
      data.append('description', formData.description)
      data.append('external_registration_url', formData.external_registration_url)
      data.append('event_category_id', formData.event_category_id)
      data.append('venue_name', formData.venue_name)
      data.append('organizer_name', formData.organizer_name)
      data.append(
        'location',
        [formData.venue_name, formData.city].filter(Boolean).join(', '),
      )
      data.append('start_date', scheduleStart.toISOString())
      data.append('end_date', scheduleEnd.toISOString())
      
      if (locationMeta.latitude !== null) data.append('latitude', String(locationMeta.latitude))
      if (locationMeta.longitude !== null) data.append('longitude', String(locationMeta.longitude))
      if (locationMeta.formattedAddress) data.append('formatted_address', locationMeta.formattedAddress)
      
      if (eventImage) data.append('event_image', eventImage)
      if (orgLogo) data.append('organizer_logo', orgLogo)
      if (orgBanner) data.append('organizer_banner', orgBanner)
      
      // Mark as external event
      data.append('event_type', 'external')

      await api.post('/events/external/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      showSuccessToast('External event published successfully!')
      navigate('/dashboard/events')
    } catch (err: any) {
      showErrorToast(err.response?.data?.message || 'Failed to publish event')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Events', href: '/dashboard/events' },
            { label: 'External Event' },
          ]}
          className="mb-4"
        />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Publish external event
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Create a listing for an event hosted outside Evella and link users to an external registration page.
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard/events')}>
            Cancel
          </Button>
        </div>

        <form
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
        >
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Event details</CardTitle>
                <CardDescription>Name, category, and description.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Event name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. World Marathon 2024"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_category_id">Category</Label>
                    <Select
                      value={formData.event_category_id}
                      onValueChange={(val) => setFormData((prev) => ({ ...prev, event_category_id: val }))}
                    >
                      <SelectTrigger id="event_category_id">
                        <SelectValue placeholder={loadingCategories ? 'Loading categories…' : 'Select category'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What is this event about? Who is it for? What should attendees expect?"
                    rows={5}
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>Where the event takes place.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Select
                    value={formData.city}
                    onValueChange={(val) => setFormData((prev) => ({ ...prev, city: val }))}
                  >
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {ETHIOPIAN_CITIES.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="venue_name">Venue</Label>
                  <GoogleVenueAutocompleteInput
                    value={formData.venue_name}
                    onChange={(val) => setFormData((prev) => ({ ...prev, venue_name: val }))}
                    onPlaceSelected={(selection) => {
                      setFormData((prev) => ({ ...prev, venue_name: selection.venueName }))
                      if (selection.city && ETHIOPIAN_CITIES.includes(selection.city)) {
                        setFormData((prev) => ({ ...prev, city: selection.city }))
                      }
                      setLocationMeta({
                        latitude: selection.latitude,
                        longitude: selection.longitude,
                        formattedAddress: selection.formattedAddress,
                      })
                    }}
                    placeholder="Search venue"
                    className="h-10"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
                <CardDescription>Set start and end date/time.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Start</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduleStart ? scheduleStart.toLocaleDateString() : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={scheduleStart ?? undefined}
                          onSelect={(d) => {
                            if (!d) return
                            const prev = scheduleStart ?? new Date()
                            const next = new Date(d)
                            next.setHours(prev.getHours(), prev.getMinutes(), 0, 0)
                            setScheduleStart(next)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={scheduleStart ? toLocalInputValue(scheduleStart).slice(11) : ''}
                      onChange={(e) => {
                        const base = scheduleStart ?? new Date()
                        const [hh, mm] = e.target.value.split(':').map(Number)
                        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return
                        const next = new Date(base)
                        next.setHours(hh, mm, 0, 0)
                        setScheduleStart(next)
                      }}
                      className="w-32"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>End</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {scheduleEnd ? scheduleEnd.toLocaleDateString() : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={scheduleEnd ?? undefined}
                          onSelect={(d) => {
                            if (!d) return
                            const prev = scheduleEnd ?? new Date()
                            const next = new Date(d)
                            next.setHours(prev.getHours(), prev.getMinutes(), 0, 0)
                            setScheduleEnd(next)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={scheduleEnd ? toLocalInputValue(scheduleEnd).slice(11) : ''}
                      onChange={(e) => {
                        const base = scheduleEnd ?? new Date()
                        const [hh, mm] = e.target.value.split(':').map(Number)
                        if (!Number.isFinite(hh) || !Number.isFinite(mm)) return
                        const next = new Date(base)
                        next.setHours(hh, mm, 0, 0)
                        setScheduleEnd(next)
                      }}
                      className="w-32"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>External registration</CardTitle>
                <CardDescription>Where users will register.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Label htmlFor="external_registration_url">Registration URL</Label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="external_registration_url"
                    placeholder="https://example.com/register"
                    value={formData.external_registration_url}
                    onChange={handleInputChange}
                    className={cn('pl-9', !isValidUrl && 'border-destructive focus-visible:ring-destructive/20')}
                  />
                </div>
                {!isValidUrl && (
                  <p className="text-sm text-destructive">
                    Please enter a valid URL (including `https://`).
                  </p>
                )}
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Use a direct link to the external registration page.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Media</CardTitle>
                <CardDescription>Optional images for the listing.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Event banner</Label>
                  <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-20 overflow-hidden rounded-md bg-muted">
                        {eventImagePreview ? (
                          <img src={eventImagePreview} className="h-full w-full object-cover" alt="Event banner preview" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          id="event_file"
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, 'event')}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById('event_file')?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Organizer</Label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="organizer_name">Organizer name</Label>
                      <Input
                        id="organizer_name"
                        placeholder="Organizer name"
                        value={formData.organizer_name}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Organizer logo</Label>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                          {orgLogoPreview ? (
                            <img src={orgLogoPreview} className="h-full w-full object-cover" alt="Logo preview" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <input
                          id="logo_file"
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, 'logo')}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('logo_file')?.click()}
                        >
                          Upload
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Organizer banner</Label>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-16 overflow-hidden rounded-md bg-muted">
                          {orgBannerPreview ? (
                            <img src={orgBannerPreview} className="h-full w-full object-cover" alt="Banner preview" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <input
                          id="banner_file"
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, 'banner')}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('banner_file')?.click()}
                        >
                          Upload
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard/events')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-40">
                  {isSubmitting ? 'Publishing…' : 'Publish external event'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </div>
  )
}
