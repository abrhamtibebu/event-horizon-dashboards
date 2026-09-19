import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import GoogleVenueAutocompleteInput from '@/components/GoogleVenueAutocompleteInput'
import { venueApi } from '@/lib/api/venues'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { SpinnerInline } from '@/components/ui/spinner'

export default function VenueSetupPage() {
  const navigate = useNavigate()
  const { user, setUser } = useAuth()
  const [saving, setSaving] = useState(false)
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

  const submit = async (e: React.FormEvent) => {
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
      setUser(res.data.user)
      toast.success('Venue created')
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.name?.[0] || 'Could not create venue')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Building2 className="h-6 w-6 text-[hsl(var(--color-rich-black))]" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Set up your venue</h1>
          <p className="text-muted-foreground">
            Tell organizers where you are. You can add halls, photos, and hours next.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
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
        <Button
          type="submit"
          className="w-full bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg"
          disabled={saving}
        >
          {saving ? <SpinnerInline /> : 'Create venue'}
        </Button>
      </form>
    </div>
  )
}
