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
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import {
  Pencil,
  Trash2,
  Plus,
  MoreVertical,
  Users2,
  ShieldCheck,
  UserCheck,
  Mail,
  Phone,
  Search,
  Filter,
  Crown,
  Check,
  Key,
  LayoutDashboard,
  MoreHorizontal,
  MailPlus,
  ArrowUpRight,
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { useAuth } from '@/hooks/use-auth'
import api from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Spinner } from '@/components/ui/spinner'
import { motion, AnimatePresence } from 'framer-motion'

interface TeamMember {
  id: number
  name: string
  email: string
  role: string
  roles?: string[]
  status: string
  is_primary_contact?: boolean
  phone?: string
  bio?: string
  avatar?: string
  created_at?: string
}

interface Role {
  value: string
  label: string
}

export default function Team() {
  const { user } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false)

  // Form states
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    role: '',
    roles: [] as string[],
    password: '',
    password_confirmation: '',
  })
  const [resetPasswordData, setResetPasswordData] = useState({
    new_password: '',
    new_password_confirmation: '',
  })

  // Fetch team members and available roles
  useEffect(() => {
    if (!user?.organizer_id) return
    fetchTeamData()
  }, [user?.organizer_id])

  const fetchTeamData = async () => {
    setLoading(true)
    try {
      // Fetch team members
      const membersRes = await api.get(`/organizers/${user?.organizer_id}/contacts`)
      setTeamMembers(membersRes.data)

      // Try to fetch available roles, but don't fail if it errors
      try {
        const rolesRes = await api.get('/users/available-roles')
        setAvailableRoles(rolesRes.data)
      } catch (roleError: any) {
        console.error('Failed to fetch available roles:', roleError)
        // Set default roles as fallback
        setAvailableRoles([
          { value: 'organizer', label: 'Organizer' },
          { value: 'event_manager', label: 'Event Manager' },
          { value: 'marketing_specialist', label: 'Marketing Specialist' },
          { value: 'finance_manager', label: 'Finance Manager' },
          { value: 'procurement_manager', label: 'Procurement Manager' },
          { value: 'operations_manager', label: 'Operations Manager' },
          { value: 'usher', label: 'Usher' },
        ])
        toast.warning('Using default role list')
      }
    } catch (error: any) {
      console.error('Failed to fetch team data:', error)
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to load team data'
      toast.error(errorMsg)
      // Set empty arrays on error
      setTeamMembers([])
      setAvailableRoles([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddMember = async () => {
    if (!formData.first_name || !formData.email || formData.roles.length === 0 || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/users', {
        ...formData,
        organizer_id: user?.organizer_id,
      })
      toast.success('Team member added successfully!')
      setAddDialogOpen(false)
      resetForm()
      fetchTeamData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add team member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditMember = async () => {
    if (!selectedMember) return

    setSubmitting(true)
    try {
      await api.put(`/users/${selectedMember.id}`, {
        name: formData.first_name + ' ' + (formData.last_name || ''),
        email: formData.email,
        phone: formData.phone,
        bio: formData.bio,
        role: formData.role,
        roles: formData.roles,
      })
      toast.success('Team member updated successfully!')
      setEditDialogOpen(false)
      setSelectedMember(null)
      resetForm()
      fetchTeamData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update team member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMember = async () => {
    if (!selectedMember) return

    setSubmitting(true)
    try {
      await api.delete(`/organizers/${user?.organizer_id}/contacts/${selectedMember.id}`)
      toast.success('Team member removed successfully!')
      setDeleteDialogOpen(false)
      setSelectedMember(null)
      fetchTeamData()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove team member')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedMember) return
    if (!resetPasswordData.new_password || !resetPasswordData.new_password_confirmation) {
      toast.error('Please fill in all password fields')
      return
    }

    if (resetPasswordData.new_password !== resetPasswordData.new_password_confirmation) {
      toast.error('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await api.post(`/users/${selectedMember.id}/reset-password`, {
        new_password: resetPasswordData.new_password,
        new_password_confirmation: resetPasswordData.new_password_confirmation,
      })
      toast.success('Password reset successfully')
      setResetPasswordDialogOpen(false)
      setResetPasswordData({ new_password: '', new_password_confirmation: '' })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reset password')
    } finally {
      setSubmitting(false)
    }
  }

  const openResetPasswordDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setResetPasswordData({ new_password: '', new_password_confirmation: '' })
    setResetPasswordDialogOpen(true)
  }

  const openEditDialog = (member: TeamMember) => {
    const nameParts = member.name.split(' ')
    setFormData({
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      email: member.email,
      phone: member.phone || '',
      bio: member.bio || '',
      role: member.role,
      roles: member.roles || (member.role ? [member.role] : []),
      password: '',
      password_confirmation: '',
    })
    setSelectedMember(member)
    setEditDialogOpen(true)
  }

  const openDeleteDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setDeleteDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      bio: '',
      role: '',
      roles: [],
      password: '',
      password_confirmation: '',
    })
  }

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      organizer_admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      event_manager: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      marketing_specialist: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
      finance_manager: 'bg-green-500/10 text-green-600 border-green-500/20',
      procurement_manager: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      operations_manager: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
      procurement_officer: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      purchase_officer: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
      inventory_manager: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      logistics_manager: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
      usher: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      organizer: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    }

    const roleLabel = availableRoles.find(r => r.value === role)?.label || role.replace(/_/g, ' ')
    const color = roleColors[role] || 'bg-muted text-muted-foreground border-border'

    return (
      <Badge variant="outline" className={cn("border-0 shadow-none font-semibold text-[10px] px-2 py-0.5", color)}>
        {roleLabel}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
      inactive: 'bg-gray-50 text-gray-500 border-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
      suspended: 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
    }
    return (
      <Badge variant="outline" className={cn("border px-2 py-0.5 capitalize font-semibold text-[11px]", statusColors[status as keyof typeof statusColors] || statusColors.inactive)}>
        <div className={cn("w-1 h-1 rounded-full mr-1.5",
          status === 'active' ? 'bg-emerald-500' : status === 'suspended' ? 'bg-rose-500' : 'bg-gray-400'
        )} />
        {status}
      </Badge>
    )
  }

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = filterRole === 'all' ||
      member.role === filterRole ||
      (member.roles && member.roles.includes(filterRole))
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter(m => m.status === 'active').length,
    roles: new Set(teamMembers.flatMap(m => m.roles || [m.role])).size,
  }

  return (
    <div className="min-h-screen bg-transparent pb-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
        {/* Minimalist Elegant Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Team Directory
            </h1>
            <p className="text-muted-foreground max-w-2xl font-medium">
              Oversee your organization's talent and specialized roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm px-6 h-11 rounded-full gap-2 font-semibold transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          </div>
        </div>

        {/* Subtle Analytics Row */}
        <div className="flex flex-wrap gap-4 md:gap-8 border-y border-border/10 py-6">
          {[
            { label: 'Total Members', value: stats.total, color: 'text-foreground' },
            { label: 'Active Talents', value: stats.active, color: 'text-emerald-600' },
            { label: 'Role Varieties', value: stats.roles, color: 'text-orange-600' },
          ].map((stat) => (
            <div key={stat.label} className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums tracking-tight">{stat.value}</span>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Clean Filter Interface */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 border-border/50 bg-muted/20 rounded-full focus-visible:ring-orange-500/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="h-11 px-4 min-w-[140px] rounded-full border-border/50 bg-transparent text-sm font-medium">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Every Role</SelectItem>
                {availableRoles.map(role => (
                  <SelectItem key={role.value} value={role.value}>{role.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-11 px-4 min-w-[140px] rounded-full border-border/50 bg-transparent text-sm font-medium">
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

        <AnimatePresence mode='wait'>
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-32 flex flex-col items-center justify-center space-y-6"
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-orange-100 dark:border-orange-900 rounded-full" />
                <div className="absolute inset-0 border-4 border-orange-600 rounded-full border-t-transparent animate-spin" />
                <Users2 className="absolute inset-0 m-auto w-8 h-8 text-orange-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Synchronizing Workforce</p>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">Assembling your talent pool...</p>
              </div>
            </motion.div>
          ) : filteredMembers.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-32 text-center bg-white dark:bg-gray-900 rounded-[3.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800"
            >
              <div className="max-w-md mx-auto space-y-8">
                <div className="w-32 h-32 bg-orange-50 dark:bg-orange-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto rotate-12">
                  <MailPlus className="w-16 h-16 text-orange-600 -rotate-12" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">No Talent Detected</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium leading-relaxed">
                    {searchQuery ? "We couldn't find any teammate matching your search criteria." : "Your organization is currently looking for talent. Start growing your elite team!"}
                  </p>
                </div>
                {!searchQuery && (
                  <Button onClick={() => setAddDialogOpen(true)} className="rounded-2xl px-12 py-8 h-auto font-bold text-lg bg-orange-600 hover:bg-orange-700 shadow-2xl shadow-orange-600/30">
                    <Plus className="w-6 h-6 mr-3" />
                    Invite First Member
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              <AnimatePresence>
                {filteredMembers.map((member, i) => (
                  <motion.div
                    key={member.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group"
                  >
                    <Card className="h-full border border-border/40 bg-card hover:border-orange-500/30 transition-all duration-300 rounded-2xl shadow-sm overflow-hidden">
                      <CardHeader className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-4">
                            <Avatar className="w-14 h-14 rounded-full border border-border/50">
                              <AvatarImage src={member.avatar || ""} />
                              <AvatarFallback className="bg-orange-100 text-orange-700 font-bold text-lg">
                                {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-bold text-foreground flex items-center gap-1.5">
                                {member.name}
                                {member.is_primary_contact && <Crown className="w-3.5 h-3.5 text-orange-500" />}
                              </h3>
                              <p className="text-xs font-medium text-muted-foreground">{member.email}</p>
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => openEditDialog(member)}>
                                <Pencil className="w-4 h-4 mr-2" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openResetPasswordDialog(member)}>
                                <Key className="w-4 h-4 mr-2" />
                                <span>Security</span>
                              </DropdownMenuItem>
                              {!member.is_primary_contact && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => openDeleteDialog(member)} className="text-destructive">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    <span>Remove</span>
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="px-6 pb-6 space-y-5">
                        <div className="flex flex-wrap gap-1.5">
                          {member.roles && member.roles.length > 0 ? (
                            member.roles.map((role) => (
                              <span key={role} className="inline-flex px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{role}</span>
                            ))
                          ) : (
                            <span className="inline-flex px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{member.role}</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground pt-4 border-t border-border/20">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", member.status === 'active' ? "bg-emerald-500" : "bg-gray-400")} />
                            <span className="capitalize">{member.status}</span>
                          </div>
                          {member.phone && <span>{member.phone}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add Member Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0">
            {/* Header Section with Gradient */}
            <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 p-8 text-white overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                  backgroundSize: '40px 40px'
                }}></div>
              </div>
              <DialogHeader className="relative z-10">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-lg">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black tracking-tight">
                      Invite Team Member
                    </DialogTitle>
                    <DialogDescription className="text-orange-50/90 text-sm font-medium mt-1">
                      Add a new talent to your organization
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Personal Information</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-1.5">
                      First Name
                      <span className="text-orange-600">*</span>
                    </label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      placeholder="e.g. John"
                      className="h-11 border-border/50 focus-visible:ring-orange-500/50 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Last Name</label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      placeholder="e.g. Doe"
                      className="h-11 border-border/50 focus-visible:ring-orange-500/50 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-1.5">
                      Email Address
                      <span className="text-orange-600">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="h-11 pl-10 border-border/50 focus-visible:ring-orange-500/50 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+251 912 345 678"
                        className="h-11 pl-10 border-border/50 focus-visible:ring-orange-500/50 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Roles Selection Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Assign Roles</h3>
                  </div>
                  {formData.roles.length > 0 && (
                    <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 font-semibold">
                      {formData.roles.length} {formData.roles.length === 1 ? 'Role' : 'Roles'} Selected
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-4 bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl border border-border/50 elegant-scrollbar">
                  {availableRoles.map((role) => {
                    const isSelected = formData.roles.includes(role.value);
                    return (
                      <motion.div
                        key={role.value}
                        onClick={() => {
                          if (isSelected) {
                            setFormData({ ...formData, roles: formData.roles.filter(r => r !== role.value) });
                          } else {
                            setFormData({ ...formData, roles: [...formData.roles, role.value] });
                          }
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "relative flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 group",
                          isSelected
                            ? "bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-300 dark:border-orange-700 shadow-md shadow-orange-500/10"
                            : "bg-background border-border/50 hover:border-orange-200 dark:hover:border-orange-800 hover:bg-muted/50"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
                          isSelected 
                            ? "bg-gradient-to-br from-orange-500 to-amber-500 border-orange-500 shadow-sm" 
                            : "border-muted-foreground/30 group-hover:border-orange-300"
                        )}>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <Check className="w-3 h-3 text-white font-bold" />
                            </motion.div>
                          )}
                        </div>
                        <span className={cn(
                          "text-sm font-semibold flex-1",
                          isSelected ? "text-orange-900 dark:text-orange-100" : "text-foreground"
                        )}>
                          {role.label}
                        </span>
                        {isSelected && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-white dark:border-gray-900"
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
                {formData.roles.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-2 italic">
                    Select at least one role to continue
                  </p>
                )}
              </div>

              {/* Security Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Security Credentials</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-1.5">
                      Password
                      <span className="text-orange-600">*</span>
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Minimum 8 characters"
                        className="h-11 pl-10 border-border/50 focus-visible:ring-orange-500/50 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-1.5">
                      Confirm Password
                      <span className="text-orange-600">*</span>
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        value={formData.password_confirmation}
                        onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                        placeholder="Re-enter password"
                        className="h-11 pl-10 border-border/50 focus-visible:ring-orange-500/50 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
                
                {formData.password && formData.password_confirmation && formData.password !== formData.password_confirmation && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-xl"
                  >
                    <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Passwords do not match
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <DialogFooter className="flex-col sm:flex-row gap-3 p-6 pt-4 border-t border-border/50 bg-muted/20">
              <Button 
                variant="outline" 
                onClick={() => { setAddDialogOpen(false); resetForm(); }} 
                disabled={submitting} 
                className="w-full sm:w-auto order-2 sm:order-1 h-11 rounded-xl font-semibold border-border/50 hover:bg-muted"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddMember} 
                disabled={submitting || formData.roles.length === 0 || (formData.password && formData.password_confirmation && formData.password !== formData.password_confirmation)} 
                className="w-full sm:w-auto order-1 sm:order-2 h-11 rounded-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" />
                    Adding Member...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Add Team Member
                  </span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Member Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader className="pb-4 border-b border-border/50">
              <DialogTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 rounded-xl flex items-center justify-center border-2 border-orange-200 dark:border-orange-800">
                  <Pencil className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                Edit Team Member
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-2">
                Update the information or roles for this teammate.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Phone Number</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Roles</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-4 bg-muted/30 rounded-xl border border-border/50">
                  {availableRoles.map((role) => (
                    <div
                      key={role.value}
                      onClick={() => {
                        if (formData.roles.includes(role.value)) {
                          setFormData({ ...formData, roles: formData.roles.filter(r => r !== role.value) });
                        } else {
                          setFormData({ ...formData, roles: [...formData.roles, role.value] });
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all border",
                        formData.roles.includes(role.value)
                          ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400"
                          : "bg-background border-border text-foreground hover:border-border/80"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center",
                        formData.roles.includes(role.value) ? "bg-orange-600 border-orange-600" : "border-muted-foreground/30"
                      )}>
                        {formData.roles.includes(role.value) && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-sm font-medium">{role.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
              <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedMember(null); resetForm(); }} disabled={submitting} className="w-full sm:w-auto order-2 sm:order-1">
                Cancel
              </Button>
              <Button onClick={handleEditMember} disabled={submitting} className="w-full sm:w-auto order-1 sm:order-2 bg-orange-600 hover:bg-orange-700 text-white">
                {submitting ? 'Updating...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="sm:max-w-md p-0 overflow-hidden border-0 shadow-2xl rounded-[2.5rem] bg-white dark:bg-[#0a0a0b]">
            <div className="bg-rose-500 p-8 text-white relative overflow-hidden">
              <div className="relative z-10 flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <Trash2 className="w-8 h-8 text-white" />
                </div>
                <DialogHeader className="p-0 text-left">
                  <DialogTitle className="text-2xl font-black uppercase tracking-tight">Terminate Access</DialogTitle>
                </DialogHeader>
              </div>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                You are about to revoke all access for <span className="text-gray-900 dark:text-white font-black">{selectedMember?.name}</span>.
                This action will immediately disable their system credentials and account access.
              </p>
              <div className="p-4 bg-rose-50 dark:bg-rose-500/10 rounded-2xl border border-rose-100 dark:border-rose-500/20">
                <p className="text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Irreversible operation
                </p>
              </div>
            </div>
            <DialogFooter className="p-8 bg-gray-50/50 dark:bg-gray-900/50 gap-3">
              <Button variant="ghost" onClick={() => { setDeleteDialogOpen(false); setSelectedMember(null); }} disabled={submitting} className="rounded-2xl h-12 font-bold px-6">
                Abort
              </Button>
              <Button variant="destructive" onClick={handleDeleteMember} disabled={submitting} className="bg-rose-600 hover:bg-rose-700 rounded-2xl h-12 px-8 font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-600/20 transition-all">
                {submitting ? 'Processing...' : 'Confirm Termination'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader className="pb-4 border-b border-border/50">
              <DialogTitle className="text-xl font-semibold flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 rounded-xl flex items-center justify-center border-2 border-orange-200 dark:border-orange-800">
                  <Key className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                Security Override
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-2">
                Re-issue access credentials for {selectedMember?.name}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-200 dark:border-orange-800">
                <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">
                  Establishing new credentials for <strong className="font-semibold">{selectedMember?.name}</strong>.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password *</label>
                  <Input
                    type="password"
                    value={resetPasswordData.new_password}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, new_password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password *</label>
                  <Input
                    type="password"
                    value={resetPasswordData.new_password_confirmation}
                    onChange={(e) => setResetPasswordData({ ...resetPasswordData, new_password_confirmation: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
              <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)} disabled={submitting} className="w-full sm:w-auto order-2 sm:order-1">
                Cancel
              </Button>
              <Button onClick={handleResetPassword} disabled={submitting} className="w-full sm:w-auto order-1 sm:order-2 bg-orange-600 hover:bg-orange-700 text-white">
                {submitting ? 'Updating...' : 'Reset Access'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
