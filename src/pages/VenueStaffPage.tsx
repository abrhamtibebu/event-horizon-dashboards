import { useEffect, useState } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
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
import { Spinner } from '@/components/ui/spinner'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { venueApi, type VenueStaffMember } from '@/lib/api/venues'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'

function displayName(member: VenueStaffMember) {
  return member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Team member'
}

function initials(member: VenueStaffMember) {
  const name = displayName(member)
  const parts = name.split(' ').filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || 'V'
}

export default function VenueStaffPage() {
  const { user } = useAuth()
  const [staff, setStaff] = useState<VenueStaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'venue_staff' })
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  const load = () =>
    venueApi
      .staff()
      .then((res) => setStaff(res.data))
      .catch((err) => toast.error(err.response?.data?.error || 'Could not load staff'))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const invite = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    try {
      const res = await venueApi.inviteStaff({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        role: form.role,
      })
      setTempPassword(res.data.temporary_password || null)
      toast.success(res.data.message || 'Staff invited')
      setForm({ name: '', email: '', phone: '', role: 'venue_staff' })
      if (!res.data.temporary_password) setOpen(false)
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not invite staff')
    }
  }

  const changeRole = async (member: VenueStaffMember, role: string) => {
    try {
      await venueApi.updateStaff(member.id, { role })
      toast.success('Role updated')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not update role')
    }
  }

  const remove = async (member: VenueStaffMember) => {
    if (!window.confirm(`Remove ${displayName(member)} from this venue?`)) return
    try {
      await venueApi.removeStaff(member.id)
      toast.success('Staff removed')
      load()
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not remove staff')
    }
  }

  if (user?.role === 'venue_staff') {
    return (
      <VenueEmptyState
        icon={Users}
        title="Staff management is for venue admins"
        description="Ask an admin if you need someone invited."
      />
    )
  }

  return (
    <div className="space-y-8">
      <VenuePageHeader
        icon={Users}
        title="Team"
        subtitle="Invite venue admins and staff for this venue."
        actions={
          <Button
            className="bg-brand-gradient bg-brand-gradient-hover text-foreground shadow-lg"
            onClick={() => {
              setTempPassword(null)
              setOpen(true)
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Invite staff
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner text="Loading team..." />
          </div>
        ) : staff.length === 0 ? (
          <VenueEmptyState icon={Users} title="No teammates yet" description="Invite someone who helps run the venue." />
        ) : (
          <ul>
            {staff.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center gap-4 border-b border-border px-5 py-4 last:border-b-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-sm font-semibold text-foreground">
                  {initials(member)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{displayName(member)}</p>
                    {member.is_primary_contact ? <Badge variant="secondary">Primary</Badge> : null}
                    <Badge variant="outline" className="capitalize">
                      {member.role === 'venue_admin' ? 'Admin' : 'Staff'}
                    </Badge>
                    {member.id === user?.id ? <span className="text-xs text-muted-foreground">You</span> : null}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                  {member.phone ? <p className="text-xs text-muted-foreground">{member.phone}</p> : null}
                </div>
                <Select value={member.role} onValueChange={(role) => changeRole(member, role)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venue_admin">Admin</SelectItem>
                    <SelectItem value="venue_staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
                {member.id !== user?.id ? (
                  <Button size="sm" variant="outline" onClick={() => remove(member)}>
                    Remove
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setTempPassword(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite staff</DialogTitle>
          </DialogHeader>
          {tempPassword ? (
            <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
              <p className="font-medium">Share this temporary password once:</p>
              <code className="block break-all rounded-lg bg-background px-3 py-2">{tempPassword}</code>
              <p className="text-muted-foreground">They should change it after first sign-in. It will not be shown again.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(role) => setForm({ ...form, role })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venue_staff">Staff</SelectItem>
                    <SelectItem value="venue_admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            {tempPassword ? <Button onClick={() => setOpen(false)}>Done</Button> : <Button onClick={invite}>Invite</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
