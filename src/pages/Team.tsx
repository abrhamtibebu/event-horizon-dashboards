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
import Breadcrumbs from '@/components/Breadcrumbs'
import { useAuth } from '@/hooks/use-auth'
import { useOrganizerRoles } from '@/hooks/use-organizer-roles'
import { RoleSelector } from '@/components/RoleSelector'
import api from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'

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
  organizer_role_id?: number | null
  organizer_role_name?: string | null
  organizer_role?: {
    id: number
    name: string
    description?: string
  } | null
}

export default function Team() {
  const { user } = useAuth()
  const { roles, assignRoleToUser, removeRoleFromUser, isLoading: rolesLoading } = useOrganizerRoles()
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
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [newOrganizer, setNewOrganizer] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    bio: '',
    role: 'organizer' as 'organizer' | 'usher',
    organizer_role_id: null as number | null,
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
    if (!removeMember) return
    
    // Check if this is a primary contact
    if (removeMember.is_primary_contact) {
      // Count primary contacts for this organizer
      const primaryContactCount = teamMembers.filter((m: any) => m.is_primary_contact).length
      
      if (primaryContactCount <= 1) {
        toast.error('Cannot remove the only primary contact. Please assign another primary contact first.')
        setRemoveDialogOpen(false)
        setRemoveMember(null)
        return
      }
      
      // Show confirmation for removing primary contact
      if (!confirm(`Are you sure you want to remove ${removeMember.name} as a primary contact? This organizer has ${primaryContactCount} primary contact(s).`)) {
        setRemoveDialogOpen(false)
        setRemoveMember(null)
        return
      }
    }
    
    setRemoveLoading(true)
    try {
      await api.delete(
        `/organizers/${user?.organizer_id}/contacts/${removeMember.id}`
      )
      toast.success(removeMember.is_primary_contact ? 'Primary contact removed successfully!' : 'Team member removed successfully!')
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
    // Get the organizer role ID from the member if available
    setSelectedRoleId((member as any).organizer_role_id || null)
    setRoleDialogOpen(true)
  }

  const handleRoleChange = async () => {
    if (!roleMember) return

    setRoleLoading(true)
    try {
      // If a role is selected, assign it
      if (selectedRoleId) {
        await assignRoleToUser(selectedRoleId, roleMember.id)
        toast.success('Role assigned successfully!')
      } else if (selectedRoleId === null && (roleMember as any).organizer_role_id) {
        // If role was removed (set to null), remove it
        await removeRoleFromUser((roleMember as any).organizer_role_id, roleMember.id)
        toast.success('Role removed successfully!')
      }

      setRoleDialogOpen(false)
      setRoleMember(null)
      setSelectedRoleId(null)
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

  const isPrimaryContact = (user?.is_primary_contact && user?.role === 'organizer') || user?.role === 'organizer_admin'

  const handleAddOrganizer = async () => {
    setAdding(true)
    try {
      // Split name into first_name and last_name
      const nameParts = newOrganizer.name.trim().split(/\s+/)
      const first_name = nameParts[0] || ''
      // If no last name provided, use first name or a default
      const last_name = nameParts.slice(1).join(' ') || first_name || 'User'
      
      // Prepare form data for backend
      const formData: any = {
        first_name,
        last_name,
        email: newOrganizer.email,
        password: newOrganizer.password,
        password_confirmation: newOrganizer.password_confirmation || newOrganizer.password,
        role: newOrganizer.role,
        phone: newOrganizer.phone || '',
        bio: newOrganizer.bio || '',
      }
      
      const response = await api.post('/users', formData)
      const newUserId = response.data.id
      
      // If a custom organizer role was selected, assign it to the user
      if (newOrganizer.organizer_role_id && newUserId) {
        try {
          await assignRoleToUser(newOrganizer.organizer_role_id, newUserId)
        } catch (roleErr: any) {
          // Log error but don't fail the entire operation
          console.error('Failed to assign custom role:', roleErr)
          toast.warning('User created but failed to assign custom role. You can assign it manually later.')
        }
      }
      
      toast.success(`${newOrganizer.role === 'organizer' ? 'Organizer' : 'Usher'} added successfully!`)
      setAddDialogOpen(false)
      setNewOrganizer({ 
        name: '', 
        email: '', 
        password: '', 
        password_confirmation: '',
        phone: '', 
        bio: '',
        role: 'organizer',
        organizer_role_id: null,
      })
      // Refresh team list
      const res = await api.get(`/organizers/${user?.organizer_id}/contacts`)
      setTeamMembers(res.data)
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || `Failed to add ${newOrganizer.role}`)
    } finally {
      setAdding(false)
    }
  }

  const getRoleBadge = (member: TeamMember) => {
    // If member has a custom organizer role, display that instead of base role
    const displayRole = member.organizer_role_name || member.organizer_role?.name || member.role
    const baseRole = member.role
    
    const roleConfig = {
      organizer: { color: 'bg-info/10 text-info border-info/30', icon: Shield },
      organizer_admin: { color: 'bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400', icon: Crown },
      usher: { color: 'bg-success/10 text-success border-success/30', icon: UserCheck },
      admin: { color: 'bg-primary/10 text-primary border-primary/30', icon: Crown },
    }
    
    // Use base role for styling, but custom role name for display
    const config = roleConfig[baseRole as keyof typeof roleConfig] || { color: 'bg-muted text-muted-foreground border-border', icon: Users }
    const Icon = config.icon
    
    // If custom role exists, show it; otherwise show base role
    let displayName = displayRole
    if (displayRole === 'organizer_admin') {
      displayName = 'Organizer Admin'
    } else if (displayRole === 'organizer' && !member.organizer_role_name && !member.organizer_role?.name) {
      displayName = 'Organizer'
    } else if (displayRole === 'usher') {
      displayName = 'Usher'
    } else {
      // Custom role name
      displayName = displayRole
    }
    
    return (
      <Badge variant="outline" className={cn("border", config.color)}>
        <Icon className="w-3 h-3 mr-1" />
        {displayName}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-success/10 text-success border-success/30', icon: Activity },
      inactive: { color: 'bg-muted text-muted-foreground border-border', icon: UserX },
      suspended: { color: 'bg-error/10 text-error border-error/30', icon: UserX },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
    const Icon = config.icon
    return (
      <Badge variant="outline" className={cn("border", config.color)}>
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
    organizers: teamMembers.filter(m => m.role === 'organizer' || m.role === 'organizer_admin').length,
    ushers: teamMembers.filter(m => m.role === 'usher').length,
    active: teamMembers.filter(m => m.status === 'active').length,
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'My Team', href: '/dashboard/team' }
          ]}
          className="mb-4"
        />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">My Team</h1>
              <p className="text-muted-foreground mt-2">Manage your team members and their roles</p>
            </div>
      {isPrimaryContact && (
              <Button onClick={() => setAddDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
            Add Team Member
          </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card/80 backdrop-blur-md border border-border shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Total Members
                    </p>
                    <p className="text-4xl font-extrabold text-foreground mb-1 leading-tight">
                      {stats.total}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl shadow flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-md border border-border shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Organizers
                    </p>
                    <p className="text-4xl font-extrabold text-primary mb-1 leading-tight">
                      {stats.organizers}
                    </p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-xl shadow flex items-center justify-center">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-md border border-border shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Ushers
                    </p>
                    <p className="text-4xl font-extrabold text-[hsl(var(--color-success))] mb-1 leading-tight">
                      {stats.ushers}
                    </p>
                  </div>
                  <div className="p-3 bg-success/10 rounded-xl shadow flex items-center justify-center">
                    <UserCheck className="w-8 h-8 text-[hsl(var(--color-success))]" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/80 backdrop-blur-md border border-border shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                      Active
                    </p>
                    <p className="text-4xl font-extrabold text-[hsl(var(--color-success))] mb-1 leading-tight">
                      {stats.active}
                    </p>
                  </div>
                  <div className="p-3 bg-success/10 rounded-xl shadow flex items-center justify-center">
                    <Activity className="w-8 h-8 text-[hsl(var(--color-success))]" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-card/80 backdrop-blur-md border border-border shadow-lg rounded-xl">
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
                      <SelectItem value="organizer_admin">Organizer Admins</SelectItem>
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
          <Card className="bg-card/80 backdrop-blur-md border border-border shadow-lg rounded-xl">
            <CardContent className="p-12 text-center">
              <Spinner size="md" variant="primary" text="Loading team members..." />
            </CardContent>
          </Card>
        ) : filteredMembers.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-md border border-border shadow-lg rounded-xl">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No team members found</h3>
              <p className="text-muted-foreground mb-6">
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
              <Card key={member.id} className="bg-card/80 backdrop-blur-md border border-border shadow-lg rounded-xl hover:shadow-xl transition-all duration-200">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {member.name.split(' ').map(n => n[0]).slice(0,2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                      {member.name}
                          {(member.is_primary_contact || member.role === 'organizer_admin') && (
                            <Crown className="w-4 h-4 text-[hsl(var(--color-warning))]" />
                        )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-muted-foreground">
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
                        {!(member.is_primary_contact && (member.role === 'organizer' || member.role === 'organizer_admin')) && member.role !== 'organizer_admin' && (
                          <DropdownMenuItem onClick={() => handleRoleMember(member)}>
                            <UserCog className="w-4 h-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                        )}
                        {(member.role === 'organizer' || member.role === 'organizer_admin') && !member.is_primary_contact && member.role !== 'organizer_admin' && (
                          <DropdownMenuItem onClick={() => handleSetPrimary(member)}>
                            <Star className="w-4 h-4 mr-2" />
                            Set as Primary
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                        onClick={() => handleRemoveMember(member)}
                          className={member.is_primary_contact ? "text-[hsl(var(--color-warning))]" : "text-destructive"}
                      >
                          <Trash2 className="w-4 h-4 mr-2" />
                          {member.is_primary_contact ? 'Remove Primary Contact' : 'Remove Member'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Role</span>
                    {getRoleBadge(member)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                    {getStatusBadge(member.status)}
                  </div>
                  {member.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      {member.phone}
                    </div>
                  )}
                  {member.created_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
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
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input
                    placeholder="Enter full name"
                  value={editMember.name}
                  onChange={(e) => handleEditInput('name', e.target.value)}
                  required
                />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input
                    placeholder="Enter email address"
                  type="email"
                  value={editMember.email}
                  onChange={(e) => handleEditInput('email', e.target.value)}
                  required
                />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <Input
                    placeholder="Enter phone number"
                    value={editMember.phone || ''}
                    onChange={(e) => handleEditInput('phone', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Bio</label>
                  <Input
                    placeholder="Enter bio"
                    value={editMember.bio || ''}
                    onChange={(e) => handleEditInput('bio', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Status</label>
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
              <DialogTitle>Assign Organizer Role</DialogTitle>
              <DialogDescription>
                Assign a custom role to <strong>{roleMember?.name}</strong> ({roleMember?.email}).
                This will control what features they can access.
              </DialogDescription>
            </DialogHeader>
            {roleMember && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Organizer Role</label>
                  <RoleSelector
                    value={selectedRoleId}
                    onValueChange={setSelectedRoleId}
                    placeholder="Select a role"
                    showEmpty={true}
                  />
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRoleDialogOpen(false)
                      setSelectedRoleId(null)
                    }}
                    disabled={roleLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRoleChange}
                    disabled={roleLoading}
                  >
                    {roleLoading ? 'Saving...' : 'Update Role'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Team Member Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
              <DialogDescription>
                Fill in the details to add a new team member. They will receive login credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input
                  placeholder="Enter full name"
                  value={newOrganizer.name}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <Input
                  placeholder="Enter email address"
                  type="email"
                  value={newOrganizer.email}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Select Role</label>
                <Select
                  value={newOrganizer.organizer_role_id 
                    ? `custom_${newOrganizer.organizer_role_id}` 
                    : newOrganizer.role}
                  onValueChange={(value) => {
                    if (value.startsWith('custom_')) {
                      // Custom organizer role selected
                      const roleId = parseInt(value.replace('custom_', ''), 10)
                      setNewOrganizer({ 
                        ...newOrganizer, 
                        role: 'organizer',
                        organizer_role_id: roleId 
                      })
                    } else {
                      // Base role selected (organizer or usher)
                      setNewOrganizer({ 
                        ...newOrganizer, 
                        role: value as 'organizer' | 'usher',
                        organizer_role_id: null 
                      })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="organizer">Organizer</SelectItem>
                    <SelectItem value="usher">Usher</SelectItem>
                    {user?.role === 'organizer_admin' && roles.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          Custom Roles
                        </div>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={`custom_${role.id}`}>
                            <div className="flex items-center justify-between w-full">
                              <span>{role.name}</span>
                              {role.description && (
                                <span className="ml-2 text-xs text-muted-foreground truncate">({role.description})</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {user?.role === 'organizer_admin' && roles.length > 0
                    ? 'Select a base role or a custom organizer role with specific permissions'
                    : 'Select the role for this team member'}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <Input
                  placeholder="Enter phone number"
                  value={newOrganizer.phone}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Bio</label>
                <Input
                  placeholder="Enter bio"
                  value={newOrganizer.bio}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, bio: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Password</label>
                <Input
                  placeholder="Enter password (min 6 characters)"
                  type="password"
                  value={newOrganizer.password}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, password: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Confirm Password</label>
                <Input
                  placeholder="Confirm password"
                  type="password"
                  value={newOrganizer.password_confirmation}
                  onChange={(e) =>
                    setNewOrganizer({ ...newOrganizer, password_confirmation: e.target.value })
                  }
                  required
                  minLength={6}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAddDialogOpen(false)
                  setNewOrganizer({ 
                    name: '', 
                    email: '', 
                    password: '', 
                    password_confirmation: '',
                    phone: '', 
                    bio: '',
                    role: 'organizer',
                    organizer_role_id: null,
                  })
                }}
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
                  !newOrganizer.password ||
                  !newOrganizer.password_confirmation ||
                  newOrganizer.password !== newOrganizer.password_confirmation ||
                  newOrganizer.password.length < 6
                }
              >
                {adding ? 'Adding...' : (() => {
                  if (newOrganizer.organizer_role_id) {
                    const selectedRole = roles.find(r => r.id === newOrganizer.organizer_role_id)
                    return `Add ${selectedRole?.name || 'Team Member'}`
                  }
                  return `Add ${newOrganizer.role === 'organizer' ? 'Organizer' : 'Usher'}`
                })()}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
