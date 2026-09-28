import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import GoogleVenueAutocompleteInput from '@/components/GoogleVenueAutocompleteInput'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { venueApi } from '@/lib/api/venues'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

type PendingUser = Parameters<ReturnType<typeof useAuth>['setUser']>[0]

export default function VenueSetupPage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [pendingUser, setPendingUser] = useState<PendingUser>(null)
  const [spaceId, setSpaceId] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    city: '',
    formatted_address: '',
    description: '',
    website: '',
    latitude: null as number | null,
    longitude: null as number | null,
  })
  const [space, setSpace] = useState({ name: 'Main Hall', capacity: '' })
  const [listed, setListed] = useState(true)
  const [hours, setHours] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    Object.fromEntries(DAYS.map((day) => [day, { open: '09:00', close: '18:00', closed: false }])),
  )

  const finish = (nextUser = pendingUser) => {
    if (nextUser && typeof nextUser === 'object') setUser(nextUser)
    navigate('/dashboard', { replace: true })
  }

  const submitBasics = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Venue name is required')
      return
    }
    setSaving(true)
    try {
      const data = new FormData()
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== '') data.append(key, String(value))
      })
      const res = await venueApi.setup(data)
      const created = res.data.venue?.spaces?.[0]
      setSpaceId(created?.id ?? null)
      if (created?.name) setSpace((prev) => ({ ...prev, name: created.name }))
      setPendingUser(res.data.user)
      toast.success('Venue created')
      setStep(2)
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.name?.[0] || 'Could not create venue')
    } finally {
      setSaving(false)
    }
  }

  const submitSpace = async () => {
    if (!space.name.trim()) {
      toast.error('Space name is required')
      return
    }
    setSaving(true)
    try {
      const data = new FormData()
      data.append('name', space.name.trim())
      if (space.capacity) data.append('capacity', space.capacity)
      if (spaceId) await venueApi.updateSpace(spaceId, data)
      else await venueApi.createSpace(data)
      toast.success('Space saved')
      setStep(3)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not save space')
    } finally {
      setSaving(false)
    }
  }

  const submitHours = async () => {
    setSaving(true)
    try {
      const data = new FormData()
      data.append('opening_hours', JSON.stringify(hours))
      data.append('is_listed', listed ? '1' : '0')
      await venueApi.updateProfile(data)
      toast.success('Listing updated')
      finish()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not save hours')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <VenuePageHeader
        icon={Building2}
        title="Set up your venue"
        subtitle={`Step ${step} of 3 · ${step === 1 ? 'Basics' : step === 2 ? 'First hall' : 'Hours and listing'}`}
      />

      <div className="flex gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className={cn('h-1.5 flex-1 rounded-full', n <= step ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>

      {step === 1 ? (
        <form onSubmit={submitBasics} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label>Venue name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <Label>Address</Label>
            <GoogleVenueAutocompleteInput
              value={form.formatted_address || form.name}
              onChange={(value) => setForm((prev) => ({ ...prev, formatted_address: value }))}
              onPlaceSelected={(selection) => {
                setForm((prev) => ({
                  ...prev,
                  name: prev.name || selection.venueName,
                  formatted_address: selection.formattedAddress,
                  city: selection.city || prev.city,
                  latitude: selection.latitude,
                  longitude: selection.longitude,
                }))
              }}
              placeholder="Search Google for your address"
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
          </div>
          <Button type="submit" className="w-full bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg" disabled={saving}>
            {saving ? 'Saving…' : 'Continue'}
          </Button>
        </form>
      ) : null}

      {step === 2 ? (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Name the hall guests will request. You can add more rooms later.</p>
          <div className="space-y-2">
            <Label>Space name</Label>
            <Input value={space.name} onChange={(e) => setSpace({ ...space, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input type="number" value={space.capacity} onChange={(e) => setSpace({ ...space, capacity: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(3)} disabled={saving}>
              Skip
            </Button>
            <Button className="flex-1 bg-brand-gradient bg-brand-gradient-hover text-foreground" onClick={submitSpace} disabled={saving}>
              {saving ? 'Saving…' : 'Continue'}
            </Button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">List on Evella</p>
              <p className="text-sm text-muted-foreground">Organizers can find you in the public directory.</p>
            </div>
            <Switch checked={listed} onCheckedChange={setListed} />
          </div>
          <div className="space-y-3">
            {DAYS.map((day) => {
              const row = hours[day]
              return (
                <div key={day} className="grid items-center gap-2 sm:grid-cols-[110px_1fr_1fr_auto]">
                  <p className="text-sm font-medium capitalize">{day}</p>
                  <Input
                    type="time"
                    value={row.open}
                    disabled={row.closed}
                    onChange={(e) => setHours({ ...hours, [day]: { ...row, open: e.target.value } })}
                  />
                  <Input
                    type="time"
                    value={row.close}
                    disabled={row.closed}
                    onChange={(e) => setHours({ ...hours, [day]: { ...row, close: e.target.value } })}
                  />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox
                      checked={row.closed}
                      onCheckedChange={(value) => setHours({ ...hours, [day]: { ...row, closed: !!value } })}
                    />
                    Closed
                  </label>
                </div>
              )
            })}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => finish()} disabled={saving}>
              Skip
            </Button>
            <Button className="flex-1 bg-brand-gradient bg-brand-gradient-hover text-foreground" onClick={submitHours} disabled={saving}>
              {saving ? 'Saving…' : 'Finish'}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
