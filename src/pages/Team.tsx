import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Pencil, Trash2, UserCog, Star } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function Team() {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editMember, setEditMember] = useState<any>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [removeMember, setRemoveMember] = useState<any>(null)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [roleMember, setRoleMember] = useState<any>(null)
  const [roleLoading, setRoleLoading] = useState(false)
  const [newRole, setNewRole] = useState('usher')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newOrganizer, setNewOrganizer] = useState({
    name: '',
    email: '',
    password: '',
  })

  useEffect(() => {
    if (!user?.organizer_id) return
    setTeamLoading(true)
    api
      .get(`/organizers/${user.organizer_id}/contacts`)
      .then((res) => setTeamMembers(res.data))
      .catch(() => setTeamMembers([]))
      .finally(() => setTeamLoading(false))
  }, [user?.organizer_id])

  const handleEditMember = (member: any) => {
    setEditMember({ ...member })
    setEditDialogOpen(true)
  }
  const handleEditInput = (field: string, value: any) => {
    setEditMember((prev: any) => ({ ...prev, [field]: value }))
  }
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setEditLoading(true)
    try {
      await api.put(`/users/${editMember.id}`, {
        name: editMember.name,
        email: editMember.email,
        status: editMember.status,
      })
      toast.success('Team member updated!')
      setEditDialogOpen(false)
      setEditMember(null)
      // Refresh team list
      const res = await api.get(`/organizers/${user.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update team member')
    } finally {
      setEditLoading(false)
    }
  }
  const handleRemoveMember = (member: any) => {
    setRemoveMember(member)
    setRemoveDialogOpen(true)
  }
  const handleRemoveConfirm = async () => {
    setRemoveLoading(true)
    try {
      await api.delete(
        `/organizers/${user.organizer_id}/contacts/${removeMember.id}`
      )
      toast.success('Team member removed!')
      setRemoveDialogOpen(false)
      setRemoveMember(null)
      // Refresh team list
      const res = await api.get(`/organizers/${user.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove team member')
    } finally {
      setRemoveLoading(false)
    }
  }
  const handleRoleMember = (member: any) => {
    setRoleMember(member)
    setNewRole(member.role)
    setRoleDialogOpen(true)
  }
  const handleRoleChange = async () => {
    setRoleLoading(true)
    try {
      await api.put(`/users/${roleMember.id}`, { role: newRole })
      toast.success('Role updated!')
      setRoleDialogOpen(false)
      setRoleMember(null)
      // Refresh team list
      const res = await api.get(`/organizers/${user.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update role')
    } finally {
      setRoleLoading(false)
    }
  }
  const handleSetPrimary = async (member: any) => {
    try {
      await api.post(
        `/organizers/${user.organizer_id}/contacts/${member.id}/primary`
      )
      toast.success('Primary contact updated!')
      // Refresh team list
      const res = await api.get(`/organizers/${user.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to set primary contact')
    }
  }
  const isPrimaryContact =
    user?.is_primary_contact && user?.role === 'organizer'
  const handleAddOrganizer = async () => {
    setAdding(true)
    try {
      await api.post('/organizer/ushers', {
        ...newOrganizer,
        role: 'organizer',
      })
      toast.success('Organizer added!')
      setAddDialogOpen(false)
      setNewOrganizer({ name: '', email: '', password: '' })
      // Refresh team list
      const res = await api.get(`/organizers/${user.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add organizer')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 w-full">
      <h1 className="text-3xl font-bold mb-6">My Team</h1>
      {isPrimaryContact && (
        <div className="flex justify-end mb-4">
          <Button onClick={() => setAddDialogOpen(true)} variant="outline">
            Add Organizer
          </Button>
        </div>
      )}
      <div className="space-y-4">
        {teamLoading ? (
          <div>Loading team members...</div>
        ) : teamMembers.length === 0 ? (
          <div className="text-gray-400">No team members found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-2 border">Name</th>
                  <th className="px-4 py-2 border">Email</th>
                  <th className="px-4 py-2 border">Role</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-2 border">
                      {member.name}
                      {member.is_primary_contact &&
                        member.role === 'organizer' && (
                          <span className="ml-2 text-yellow-600 font-bold">
                            (Primary)
                          </span>
                        )}
                    </td>
                    <td className="px-4 py-2 border">{member.email}</td>
                    <td className="px-4 py-2 border">{member.role}</td>
                    <td className="px-4 py-2 border">{member.status}</td>
                    <td className="px-4 py-2 border">
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleEditMember(member)}
                      >
                        <Pencil className="w-4 h-4" /> Edit
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => handleRemoveMember(member)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" /> Remove
                      </Button>
                      {!(
                        member.is_primary_contact && member.role === 'organizer'
                      ) && (
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => handleRoleMember(member)}
                        >
                          <UserCog className="w-4 h-4 text-blue-500" /> Change
                          Role
                        </Button>
                      )}
                      {member.role === 'organizer' &&
                        !member.is_primary_contact && (
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => handleSetPrimary(member)}
                          >
                            <Star className="w-4 h-4 text-yellow-500" /> Set
                            Primary
                          </Button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
            </DialogHeader>
            {editMember && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <Input
                  placeholder="Name"
                  value={editMember.name}
                  onChange={(e) => handleEditInput('name', e.target.value)}
                  required
                />
                <Input
                  placeholder="Email"
                  type="email"
                  value={editMember.email}
                  onChange={(e) => handleEditInput('email', e.target.value)}
                  required
                />
                <Select
                  value={editMember.status}
                  onValueChange={(value) => handleEditInput('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    disabled={editLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editLoading}>
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Team Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {removeMember?.name} from your
                team? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setRemoveDialogOpen(false)}
                disabled={removeLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRemoveConfirm}
                disabled={removeLoading}
              >
                {removeLoading ? 'Removing...' : 'Remove'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Role</DialogTitle>
            </DialogHeader>
            {roleMember && (
              <div className="space-y-4">
                <div>
                  <span className="font-semibold">{roleMember.name}</span> (
                  {roleMember.email})
                </div>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usher">Usher</SelectItem>
                    <SelectItem value="organizer">Organizer</SelectItem>
                  </SelectContent>
                </Select>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRoleDialogOpen(false)}
                    disabled={roleLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRoleChange}
                    disabled={roleLoading || newRole === roleMember.role}
                  >
                    {roleLoading ? 'Saving...' : 'Save Role'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Organizer</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new organizer to your team.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Full Name"
                value={newOrganizer.name}
                onChange={(e) =>
                  setNewOrganizer({ ...newOrganizer, name: e.target.value })
                }
              />
              <Input
                placeholder="Email Address"
                type="email"
                value={newOrganizer.email}
                onChange={(e) =>
                  setNewOrganizer({ ...newOrganizer, email: e.target.value })
                }
              />
              <Input
                placeholder="Password"
                type="password"
                value={newOrganizer.password}
                onChange={(e) =>
                  setNewOrganizer({ ...newOrganizer, password: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
                disabled={adding}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddOrganizer}
                disabled={
                  adding ||
                  !newOrganizer.name ||
                  !newOrganizer.email ||
                  !newOrganizer.password
                }
              >
                {adding ? 'Adding...' : 'Add Organizer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
