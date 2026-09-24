import { useEffect, useState } from 'react'
import { format } from 'date-fns'
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
import { venueApi, type VenueBlackout, type VenueSpace } from '@/lib/api/venues'
import { toast } from 'sonner'

const empty = { space_id: 'all', starts_at: '', ends_at: '', reason: '' }

export function VenueBlackoutDialog({
  open,
  onOpenChange,
  spaces,
  editing,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  spaces: VenueSpace[]
  editing: VenueBlackout | null
  onSaved: () => void
}) {
  const [form, setForm] = useState(empty)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setForm({
        space_id: editing.space_id ? String(editing.space_id) : 'all',
        starts_at: format(new Date(editing.starts_at), "yyyy-MM-dd'T'HH:mm"),
        ends_at: format(new Date(editing.ends_at), "yyyy-MM-dd'T'HH:mm"),
        reason: editing.reason || '',
      })
    } else {
      setForm(empty)
    }
  }, [open, editing])

  const save = async (force = false) => {
    if (!form.starts_at || !form.ends_at) {
      toast.error('Start and end times are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        space_id: form.space_id === 'all' ? null : Number(form.space_id),
        starts_at: form.starts_at,
        ends_at: form.ends_at,
        reason: form.reason || null,
      }
      if (editing) {
        await venueApi.updateBlackout(editing.id, payload)
        toast.success('Blackout updated')
      } else {
        await venueApi.createBlackout({ ...payload, force })
        toast.success('Dates blocked')
      }
      onOpenChange(false)
      onSaved()
    } catch (err: any) {
      if (err.response?.data?.requires_force) {
        const ok = window.confirm(`${err.response.data.error}\n\nBlock anyway?`)
        if (ok) {
          setSaving(false)
          return save(true)
        }
      }
      toast.error(err.response?.data?.error || 'Could not block dates')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit blackout' : 'Block dates'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Scope</Label>
            <Select value={form.space_id} onValueChange={(v) => setForm({ ...form, space_id: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Entire venue</SelectItem>
                {spaces.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label>Reason</Label>
            <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => save(false)} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save' : 'Block dates'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
