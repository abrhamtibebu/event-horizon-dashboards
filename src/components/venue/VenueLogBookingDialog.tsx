import { useEffect, useState } from 'react'
import { parseISO } from 'date-fns'
import { Check, ChevronLeft, ChevronRight, CircleAlert, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { venueApi, type Venue, type VenueBooking, type VenueSpace } from '@/lib/api/venues'
import { dateBoundaryIso, toDateInputValue } from '@/lib/venue/dateOnly'
import { toast } from 'sonner'

const empty = {
  space_id: '',
  title: '',
  event_type: '',
  expected_attendance: '',
  client_type: 'individual',
  organization_name: '',
  address: '',
  registration_number: '',
  starts_at: '',
  ends_at: '',
  requirements: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
}

const steps = ['Venue & date', 'Client & event details']

export function VenueLogBookingDialog({
  open,
  onOpenChange,
  spaces,
  onCreated,
  defaults,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaces: VenueSpace[]
  onCreated: (booking?: VenueBooking) => void
  defaults?: Partial<typeof empty>
}) {
  const [form, setForm] = useState(empty)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [checking, setChecking] = useState(false)
  const [availabilityChecked, setAvailabilityChecked] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [availabilityMessage, setAvailabilityMessage] = useState('')
  const [venue, setVenue] = useState<Venue | null>(null)

  useEffect(() => {
    if (!open) return
    setForm({ ...empty, ...defaults, starts_at: toDateInputValue(defaults?.starts_at || ''), ends_at: toDateInputValue(defaults?.ends_at || '') })
    setStep(0)
    setAvailabilityChecked(false)
    setAvailable(null)
    setAvailabilityMessage('')
    venueApi.profile().then(({ data }) => setVenue(data)).catch(() => setVenue(null))
  }, [open])

  const selectedSpace = spaces.find((space) => String(space.id) === form.space_id)
  const hasValidWindow = Boolean(form.starts_at && form.ends_at && form.ends_at >= form.starts_at)
  const clientContactValid = Boolean(form.contact_email.trim())
  const update = (field: keyof typeof empty, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
    if (['space_id', 'starts_at', 'ends_at'].includes(field)) {
      setAvailabilityChecked(false)
      setAvailable(null)
      setAvailabilityMessage('')
    }
  }

  const checkAvailability = async () => {
    if (!form.space_id || !hasValidWindow) {
      toast.error('Choose a space and valid start and end dates first.')
      return
    }
    setChecking(true)
    setAvailabilityChecked(false)
    try {
      const { data } = await venueApi.checkBookingAvailability({
        space_id: Number(form.space_id),
        starts_at: dateBoundaryIso(form.starts_at),
        ends_at: dateBoundaryIso(form.ends_at, true),
      })
      setAvailable(data.available)
      setAvailabilityChecked(true)
      setAvailabilityMessage(data.available
        ? 'This space is available for the full date range. Availability will be checked again when you submit.'
        : data.error || 'This space is unavailable for the selected date range.')
    } catch (err: any) {
      setAvailable(false)
      setAvailabilityChecked(true)
      setAvailabilityMessage(err.response?.data?.error || 'Could not check these dates. Review the date range and try again.')
    } finally {
      setChecking(false)
    }
  }

  const continueToClient = () => {
    if (!form.space_id || !hasValidWindow) {
      toast.error('Choose a space and valid start and end dates first.')
      return
    }
    if (!availabilityChecked || !available) {
      toast.error('Check and confirm availability before continuing.')
      return
    }
    setStep(1)
  }

  const create = async () => {
    if (!form.title.trim() || !form.contact_name.trim() || !clientContactValid) {
      toast.error('Enter an event name, client name, and client email to send the quotation.')
      return
    }
    if (!availabilityChecked || !available) {
      setStep(0)
      toast.error('Check availability before submitting this request.')
      return
    }

    setSaving(true)
    try {
      const { data } = await venueApi.createBooking({
        space_id: Number(form.space_id),
        title: form.title.trim(),
        starts_at: dateBoundaryIso(form.starts_at),
        ends_at: dateBoundaryIso(form.ends_at, true),
        event_type: form.event_type.trim() || null,
        expected_attendance: form.expected_attendance.trim() ? Number(form.expected_attendance) : null,
        event_requirements: form.requirements.trim() || null,
        contact_name: form.contact_name.trim(),
        contact_email: form.contact_email.trim() || null,
        contact_phone: form.contact_phone.trim() || null,
        client_type: form.client_type,
        organization_name: form.organization_name.trim() || null,
        address: form.address.trim() || null,
        registration_number: form.registration_number.trim() || null,
      })
      toast.success('Booking request created. Prepare and send its quotation for review.')
      onOpenChange(false)
      onCreated(data)
    } catch (err: any) {
      const serverError = err.response?.data?.error
      const message = serverError || 'Could not create booking request. Review the form and try again.'
      toast.error(message)
      if (err.response?.status === 409 || serverError) {
        setAvailable(false)
        setAvailabilityChecked(true)
        setAvailabilityMessage(message)
        setStep(0)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>New booking request</DialogTitle>
          <DialogDescription>Choose the space and event dates. The reservation holds that space for the full selected day or date range.</DialogDescription>
        </DialogHeader>

        <ol className="grid grid-cols-2 gap-2" aria-label="Booking request steps">
          {steps.map((label, index) => (
            <li key={label} className={`rounded-lg border px-3 py-2 text-xs font-medium ${step === index ? 'border-primary bg-primary/5 text-foreground' : index < step ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
              <span className="mr-2">{index < step ? <Check className="inline size-3.5" /> : `${index + 1}.`}</span>{label}
            </li>
          ))}
        </ol>

        {step === 0 ? <div className="space-y-4">
          <div className="space-y-1">
            <Label>Venue</Label>
            <Input value={venue?.name || 'Your assigned venue'} readOnly aria-readonly="true" />
            <p className="text-xs text-muted-foreground">The venue is determined by your staff account.</p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="booking-space">Space</Label>
            <select id="booking-space" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.space_id} onChange={(event) => update('space_id', event.target.value)}>
              <option value="">Select space</option>
              {spaces.map((space) => <option key={space.id} value={space.id}>{space.name}{space.capacity ? ` · capacity ${space.capacity}` : ''}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1"><Label htmlFor="booking-start">Start date</Label><Input id="booking-start" type="date" value={form.starts_at} onChange={(event) => update('starts_at', event.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="booking-end">End date</Label><Input id="booking-end" type="date" min={form.starts_at || undefined} value={form.ends_at} onChange={(event) => update('ends_at', event.target.value)} /></div>
          </div>
          {selectedSpace?.setup_minutes || selectedSpace?.teardown_minutes ? <p className="text-xs text-muted-foreground">Availability includes setup ({selectedSpace.setup_minutes || 0} min) and teardown ({selectedSpace.teardown_minutes || 0} min) buffers.</p> : null}
          <Button type="button" variant="outline" onClick={checkAvailability} disabled={checking || !form.space_id || !hasValidWindow}>
            {checking ? <><LoaderCircle className="mr-2 size-4 animate-spin" />Checking…</> : 'Check availability'}
          </Button>
          {availabilityChecked ? <div role="status" className={`flex gap-2 rounded-lg p-3 text-sm ${available ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' : 'bg-amber-500/10 text-amber-800 dark:text-amber-200'}`}>
            {available ? <Check className="mt-0.5 size-4 shrink-0" /> : <CircleAlert className="mt-0.5 size-4 shrink-0" />}{availabilityMessage}
          </div> : null}
        </div> : <div className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-3 text-sm"><p className="font-medium">{selectedSpace?.name} · {form.starts_at ? parseISO(form.starts_at).toLocaleDateString() : ''}{form.ends_at && form.ends_at !== form.starts_at ? ` – ${parseISO(form.ends_at).toLocaleDateString()}` : ''}</p><p className="text-muted-foreground">{venue?.name || 'Venue'}</p></div>
          <div className="space-y-1"><Label htmlFor="booking-client">Client name</Label><Input id="booking-client" autoComplete="name" value={form.contact_name} onChange={(event) => update('contact_name', event.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="booking-client-type">Client type</Label><select id="booking-client-type" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.client_type} onChange={(event) => update('client_type', event.target.value)}><option value="individual">Individual</option><option value="company">Company</option><option value="organization">Organization</option><option value="government">Government institution</option><option value="event_agency">Event agency</option></select></div>
          {form.client_type !== 'individual' ? <div className="space-y-1"><Label htmlFor="booking-organization">Organization name</Label><Input id="booking-organization" value={form.organization_name} onChange={(event) => update('organization_name', event.target.value)} /></div> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="booking-email">Email</Label><Input id="booking-email" type="email" autoComplete="email" value={form.contact_email} onChange={(event) => update('contact_email', event.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="booking-phone">Phone</Label><Input id="booking-phone" type="tel" autoComplete="tel" value={form.contact_phone} onChange={(event) => update('contact_phone', event.target.value)} /></div>
          </div>
          {form.client_type !== 'individual' ? <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1"><Label htmlFor="booking-client-address">Address</Label><Input id="booking-client-address" value={form.address} onChange={(event) => update('address', event.target.value)} /></div><div className="space-y-1"><Label htmlFor="booking-client-registration">Registration / ID number</Label><Input id="booking-client-registration" value={form.registration_number} onChange={(event) => update('registration_number', event.target.value)} /></div></div> : null}
          <p className="text-xs text-muted-foreground">Email is required to deliver the quotation and contract. Phone is optional.</p>
          <div className="space-y-1"><Label htmlFor="booking-title">Event name</Label><Input id="booking-title" value={form.title} onChange={(event) => update('title', event.target.value)} placeholder="e.g. Annual staff conference" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="booking-event-type">Event type</Label><Input id="booking-event-type" value={form.event_type} onChange={(event) => update('event_type', event.target.value)} placeholder="Conference, wedding…" /></div>
            <div className="space-y-1"><Label htmlFor="booking-attendance">Expected attendance</Label><Input id="booking-attendance" type="number" min="1" step="1" value={form.expected_attendance} onChange={(event) => update('expected_attendance', event.target.value)} placeholder="Number of guests" /></div>
          </div>
          <div className="space-y-1"><Label htmlFor="booking-requirements">Event requirements</Label><Textarea id="booking-requirements" rows={4} value={form.requirements} onChange={(event) => update('requirements', event.target.value)} placeholder="Setup, equipment, catering, accessibility, or other requirements" /></div>
          <p className="text-xs text-muted-foreground">After saving, the booking opens with actions to generate the quotation and continue the approval workflow.</p>
        </div>}

        <DialogFooter className="flex-row justify-between sm:justify-between">
          {step === 0 ? <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button> : <Button variant="outline" onClick={() => setStep(0)}><ChevronLeft className="mr-1 size-4" />Back</Button>}
          {step === 0 ? <Button onClick={continueToClient} disabled={!availabilityChecked || !available}>Client and event details<ChevronRight className="ml-1 size-4" /></Button> : <Button onClick={create} disabled={saving || !form.title.trim() || !form.contact_name.trim() || !clientContactValid || !available}>
            {saving ? 'Creating request…' : 'Create pending request'}
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
