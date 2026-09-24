import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { venueApi, type VenueSpace } from '@/lib/api/venues'
import { toast } from 'sonner'

const empty = {
  space_id: '',
  title: '',
  starts_at: '',
  ends_at: '',
  notes: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  quoted_amount: '',
}

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
  onCreated: () => void
  defaults?: Partial<typeof empty>
}) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm({ ...empty, ...defaults })
    // Apply defaults only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const create = async () => {
    if (!form.space_id || !form.starts_at || !form.ends_at) {
      toast.error('Space and times are required')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = { ...form, space_id: Number(form.space_id) }
      if (form.quoted_amount.trim()) {
        payload.quoted_amount = Number(form.quoted_amount)
        payload.currency = 'ETB'
      } else {
        delete payload.quoted_amount
      }
      await venueApi.createBooking(payload)
      toast.success('Booking added')
      onOpenChange(false)
      onCreated()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not create booking')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log a booking</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Space</Label>
            <Select value={form.space_id} onValueChange={(v) => setForm({ ...form, space_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select space" />
              </SelectTrigger>
              <SelectContent>
                {spaces.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Starts</Label>
              <Input
                type="datetime-local"
                value={form.starts_at}
                onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Ends</Label>
              <Input
                type="datetime-local"
                value={form.ends_at}
                onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Quote (ETB, optional)</Label>
            <Input
              type="number"
              min="0"
              value={form.quoted_amount}
              onChange={(e) => setForm({ ...form, quoted_amount: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Input
              placeholder="Contact name"
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={form.contact_phone}
              onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={create} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
