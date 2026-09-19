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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { venueApi, type VenueStaffMember } from '@/lib/api/venues'
import { toast } from 'sonner'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/use-auth'

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
    if (!window.confirm(`Remove ${member.name || member.email} from this venue?`)) return
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
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="font-semibold">Staff management is for venue admins</p>
        <p className="mt-1 text-sm text-muted-foreground">Ask an admin if you need someone invited.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
            <Users className="h-5 w-5 text-[hsl(var(--color-rich-black))]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Team</h1>
            <p className="text-muted-foreground">Invite venue admins and staff for this venue.</p>
          </div>
        </div>
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
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner text="Loading team..." />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.name || `${member.first_name || ''} ${member.last_name || ''}`.trim() || '—'}
                    {member.is_primary_contact ? (
                      <Badge variant="secondary" className="ml-2">
                        Primary
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Select value={member.role} onValueChange={(role) => changeRole(member, role)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="venue_admin">Admin</SelectItem>
                        <SelectItem value="venue_staff">Staff</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    {member.id !== user?.id ? (
                      <Button size="sm" variant="outline" onClick={() => remove(member)}>
                        Remove
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">You</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
              <p className="font-medium">Share this temporary password securely:</p>
              <code className="block break-all rounded-lg bg-background px-3 py-2">{tempPassword}</code>
              <p className="text-muted-foreground">They should change it after first sign-in.</p>
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
            {tempPassword ? (
              <Button onClick={() => setOpen(false)}>Done</Button>
            ) : (
              <Button onClick={invite}>Invite</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
