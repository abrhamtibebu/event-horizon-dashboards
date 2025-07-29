import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Pencil, 
  Trash2, 
  UserCog, 
  Star, 
  Plus, 
  MoreVertical, 
  Users, 
  Shield, 
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Activity,
  Crown
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import api from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface TeamMember {
  id: number
  name: string
  email: string
  role: string
  status: string
  is_primary_contact?: boolean
  phone?: string
  bio?: string
  created_at?: string
  last_login?: string
}

export default function Team() {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamLoading, setTeamLoading] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editMember, setEditMember] = useState<TeamMember | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
  const [removeMember, setRemoveMember] = useState<TeamMember | null>(null)
  const [removeLoading, setRemoveLoading] = useState(false)
  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [roleMember, setRoleMember] = useState<TeamMember | null>(null)
  const [roleLoading, setRoleLoading] = useState(false)
  const [newRole, setNewRole] = useState('usher')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [newOrganizer, setNewOrganizer] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    bio: '',
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

  const handleEditMember = (member: TeamMember) => {
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
      await api.put(`/users/${editMember?.id}`, {
        name: editMember?.name,
        email: editMember?.email,
        status: editMember?.status,
        phone: editMember?.phone,
        bio: editMember?.bio,
      })
      toast.success('Team member updated successfully!')
      setEditDialogOpen(false)
      setEditMember(null)
      // Refresh team list
      const res = await api.get(`/organizers/${user?.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update team member')
    } finally {
      setEditLoading(false)
    }
  }

  const handleRemoveMember = (member: TeamMember) => {
    setRemoveMember(member)
    setRemoveDialogOpen(true)
  }

  const handleRemoveConfirm = async () => {
    setRemoveLoading(true)
    try {
      await api.delete(
        `/organizers/${user?.organizer_id}/contacts/${removeMember?.id}`
      )
      toast.success('Team member removed successfully!')
      setRemoveDialogOpen(false)
      setRemoveMember(null)
      // Refresh team list
      const res = await api.get(`/organizers/${user?.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to remove team member')
    } finally {
      setRemoveLoading(false)
    }
  }

  const handleRoleMember = (member: TeamMember) => {
    setRoleMember(member)
    setNewRole(member.role)
    setRoleDialogOpen(true)
  }

  const handleRoleChange = async () => {
    setRoleLoading(true)
    try {
      await api.put(`/users/${roleMember?.id}`, { role: newRole })
      toast.success('Role updated successfully!')
      setRoleDialogOpen(false)
      setRoleMember(null)
      // Refresh team list
      const res = await api.get(`/organizers/${user?.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update role')
    } finally {
      setRoleLoading(false)
    }
  }

  const handleSetPrimary = async (member: TeamMember) => {
    try {
      await api.post(
        `/organizers/${user?.organizer_id}/contacts/${member.id}/primary`
      )
      toast.success('Primary contact updated successfully!')
      // Refresh team list
      const res = await api.get(`/organizers/${user?.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to set primary contact')
    }
  }

  const isPrimaryContact = user?.is_primary_contact && user?.role === 'organizer'

  const handleAddOrganizer = async () => {
    setAdding(true)
    try {
      await api.post('/organizer/ushers', {
        ...newOrganizer,
        role: 'organizer',
      })
      toast.success('Organizer added successfully!')
      setAddDialogOpen(false)
      setNewOrganizer({ name: '', email: '', password: '', phone: '', bio: '' })
      // Refresh team list
      const res = await api.get(`/organizers/${user?.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add organizer')
    } finally {
      setAdding(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      organizer: { color: 'bg-blue-100 text-blue-800', icon: Shield },
      usher: { color: 'bg-green-100 text-green-800', icon: UserCheck },
      admin: { color: 'bg-purple-100 text-purple-800', icon: Crown },
    }
    const config = roleConfig[role as keyof typeof roleConfig] || { color: 'bg-gray-100 text-gray-800', icon: Users }
    const Icon = config.icon
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: Activity },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: UserX },
      suspended: { color: 'bg-red-100 text-red-800', icon: UserX },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
    const Icon = config.icon
    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' || member.role === filterRole
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = {
    total: teamMembers.length,
    organizers: teamMembers.filter(m => m.role === 'organizer').length,
    ushers: teamMembers.filter(m => m.role === 'usher').length,
    active: teamMembers.filter(m => m.status === 'active').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Team</h1>
              <p className="text-gray-600 mt-2">Manage your team members and their roles</p>
            </div>
      {isPrimaryContact && (
              <Button onClick={() => setAddDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
            Add Organizer
          </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Total Members
                    </p>
                    <p className="text-4xl font-extrabold text-gray-900 mb-1 leading-tight">
                      {stats.total}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl shadow flex items-center justify-center">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Organizers
                    </p>
                    <p className="text-4xl font-extrabold text-blue-600 mb-1 leading-tight">
                      {stats.organizers}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl shadow flex items-center justify-center">
                    <Shield className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Ushers
                    </p>
                    <p className="text-4xl font-extrabold text-green-600 mb-1 leading-tight">
                      {stats.ushers}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow flex items-center justify-center">
                    <UserCheck className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Active
                    </p>
                    <p className="text-4xl font-extrabold text-green-600 mb-1 leading-tight">
                      {stats.active}
                    </p>
                  </div>
                  <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow flex items-center justify-center">
                    <Activity className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                <div className="flex gap-3">
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="organizer">Organizers</SelectItem>
                      <SelectItem value="usher">Ushers</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members Grid */}
        {teamLoading ? (
          <Card className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl">
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading team members...</p>
            </CardContent>
          </Card>
        ) : filteredMembers.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No team members found</h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filterRole !== 'all' || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first team member'
                }
              </p>
              {isPrimaryContact && !searchQuery && filterRole === 'all' && filterStatus === 'all' && (
                <Button onClick={() => setAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Member
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member.id} className="bg-white/80 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 font-semibold">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                      {member.name}
                          {member.is_primary_contact && member.role === 'organizer' && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </CardDescription>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditMember(member)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit Member
                        </DropdownMenuItem>
                        {!(member.is_primary_contact && member.role === 'organizer') && (
                          <DropdownMenuItem onClick={() => handleRoleMember(member)}>
                            <UserCog className="w-4 h-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                        )}
                        {member.role === 'organizer' && !member.is_primary_contact && (
                          <DropdownMenuItem onClick={() => handleSetPrimary(member)}>
                            <Star className="w-4 h-4 mr-2" />
                            Set as Primary
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                        onClick={() => handleRemoveMember(member)}
                          className="text-red-600"
                      >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Role</span>
                    {getRoleBadge(member.role)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Status</span>
                    {getStatusBadge(member.status)}
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      {member.phone}
                    </div>
                  )}
                  {member.created_at && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      Joined {new Date(member.created_at).toLocaleDateString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update the team member's information and status.
              </DialogDescription>
            </DialogHeader>
            {editMember && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                <Input
                    placeholder="Enter full name"
                  value={editMember.name}
                  onChange={(e) => handleEditInput('name', e.target.value)}
                  required
                />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                <Input
                    placeholder="Enter email address"
                  type="email"
                  value={editMember.email}
                  onChange={(e) => handleEditInput('email', e.target.value)}
                  required
                />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    placeholder="Enter phone number"
                    value={editMember.phone || ''}
                    onChange={(e) => handleEditInput('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Bio</label>
                  <Input
                    placeholder="Enter bio"
                    value={editMember.bio || ''}
                    onChange={(e) => handleEditInput('bio', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                <Select
                  value={editMember.status}
                  onValueChange={(value) => handleEditInput('status', value)}
                >
                  <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                </div>
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

        {/* Remove Dialog */}
        <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Team Member</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove <strong>{removeMember?.name}</strong> from your team? 
                This action cannot be undone and will revoke their access to the system.
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
                {removeLoading ? 'Removing...' : 'Remove Member'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Role Change Dialog */}
        <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Role</DialogTitle>
              <DialogDescription>
                Update the role for <strong>{roleMember?.name}</strong> ({roleMember?.email})
              </DialogDescription>
            </DialogHeader>
            {roleMember && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Role</label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usher">Usher</SelectItem>
                    <SelectItem value="organizer">Organizer</SelectItem>
                  </SelectContent>
                </Select>
                </div>
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
                    {roleLoading ? 'Saving...' : 'Update Role'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Organizer Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Organizer</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new organizer to your team. They will receive an email with login credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
              <Input
                  placeholder="Enter full name"
                value={newOrganizer.name}
                onChange={(e) =>
                  setNewOrganizer({ ...newOrganizer, name: e.target.value })
                }
              />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
              <Input
                  placeholder="Enter email address"
                type="email"
                value={newOrganizer.email}
                onChange={(e) =>
                  setNewOrganizer({ ...newOrganizer, email: e.target.value })
                }
              />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  placeholder="Enter phone number"
                  value={newOrganizer.phone}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bio</label>
                <Input
                  placeholder="Enter bio"
                  value={newOrganizer.bio}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, bio: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
              <Input
                  placeholder="Enter password"
                type="password"
                value={newOrganizer.password}
                onChange={(e) =>
                  setNewOrganizer({ ...newOrganizer, password: e.target.value })
                }
              />
              </div>
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
