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
        {/* Modern Premium Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-6">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-orange-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-orange-600/20 shrink-0">
              <Users2 className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Team Command
              </h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl font-medium">
                Manage your organization's talent and define their access levels with precision.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-600/30 px-8 h-14 rounded-2xl gap-3 font-bold text-base transition-all"
              >
                <Plus className="w-5 h-5" />
                Recruit Talent
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Status Grid - Modern Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total Members', value: stats.total, icon: Users2, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-100 dark:border-orange-800' },
            { label: 'Active Talents', value: stats.active, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-800' },
            { label: 'Role Varieties', value: stats.roles, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-800' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-2xl shadow-black/[0.02]",
                "hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              )}
            >
              <div>
                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                <p className="text-4xl font-black text-gray-900 dark:text-white">
                  {stat.value.toString().padStart(2, '0')}
                </p>
              </div>
              <div className={cn("p-5 rounded-3xl", stat.bg, stat.color)}>
                <stat.icon className="w-8 h-8" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Workspace Controller */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search teammates by name, email or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 h-16 border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-[1.5rem] focus-visible:ring-orange-500 text-lg font-medium placeholder:text-gray-400"
              />
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="h-16 px-6 w-full md:w-[220px] rounded-[1.5rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 font-bold text-gray-600">
                  <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-orange-600" />
                    <SelectValue placeholder="All Roles" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-gray-100 dark:border-gray-800">
                  <SelectItem value="all" className="font-bold py-3">Every Role</SelectItem>
                  {availableRoles.map(role => (
                    <SelectItem key={role.value} value={role.value} className="font-medium py-3">{role.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-16 px-6 w-full md:w-[200px] rounded-[1.5rem] border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 font-bold text-gray-600">
                  <div className="flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4 text-orange-600" />
                    <SelectValue placeholder="Status" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-2xl shadow-2xl border-gray-100 dark:border-gray-800">
                  <SelectItem value="all" className="font-bold py-3">All Status</SelectItem>
                  <SelectItem value="active" className="font-bold py-3 text-emerald-600">Active Only</SelectItem>
                  <SelectItem value="inactive" className="font-bold py-3 text-gray-400">Inactive</SelectItem>
                  <SelectItem value="suspended" className="font-bold py-3 text-rose-600">Suspended</SelectItem>
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
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05, type: 'spring', damping: 20 }}
                      className="group"
                    >
                      <Card className="relative h-full border-0 shadow-2xl shadow-black/5 bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden hover:shadow-orange-600/10 transition-all duration-500 group-hover:-translate-y-2">
                        {/* Status Bar */}
                        <div className={cn(
                          "absolute top-0 left-0 w-full h-1.5",
                          member.status === 'active' ? "bg-emerald-500" :
                            member.status === 'suspended' ? "bg-rose-500" : "bg-gray-300"
                        )} />

                        <CardHeader className="p-8 pb-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-5">
                              <div className="relative">
                                <Avatar className="w-20 h-20 rounded-[1.5rem] border-2 border-gray-50 dark:border-gray-800 shadow-sm ring-4 ring-white dark:ring-gray-900 transition-transform group-hover:scale-110 duration-500">
                                  <AvatarImage src={member.avatar || ""} />
                                  <AvatarFallback className="bg-orange-600 text-white font-black text-2xl">
                                    {member.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {member.status === 'active' && (
                                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-gray-900 rounded-full" />
                                )}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-gray-400 hover:text-orange-600">
                                  <MoreHorizontal className="w-6 h-6" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56 p-2 rounded-[1.5rem] shadow-2xl border-gray-100 dark:border-gray-800">
                                <DropdownMenuItem onClick={() => openEditDialog(member)} className="rounded-xl py-3 font-bold cursor-pointer transition-all">
                                  <Pencil className="w-4 h-4 mr-3" />
                                  <span>Edit Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openResetPasswordDialog(member)} className="rounded-xl py-3 font-bold cursor-pointer transition-all">
                                  <Key className="w-4 h-4 mr-3" />
                                  <span>Reset Password</span>
                                </DropdownMenuItem>
                                {!member.is_primary_contact && (
                                  <>
                                    <DropdownMenuSeparator className="my-2" />
                                    <DropdownMenuItem
                                      onClick={() => openDeleteDialog(member)}
                                      className="rounded-xl py-3 font-bold cursor-pointer text-rose-500 focus:text-white focus:bg-rose-500 transition-all"
                                    >
                                      <Trash2 className="w-4 h-4 mr-3" />
                                      <span>Remove Member</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="mt-6 space-y-1">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                              {member.name}
                              {member.is_primary_contact && (
                                <Crown className="w-5 h-5 text-orange-500" />
                              )}
                            </h3>
                            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 flex items-center gap-2">
                              <Mail className="w-4 h-4 text-orange-600" />
                              {member.email}
                            </p>
                          </div>
                        </CardHeader>

                        <CardContent className="p-8 pt-4 space-y-8">
                          <div className="space-y-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Assignment Matrix</p>
                            <div className="flex flex-wrap gap-2">
                              {member.roles && member.roles.length > 0 ? (
                                member.roles.map((role) => (
                                  <div key={role}>{getRoleBadge(role)}</div>
                                ))
                              ) : (
                                getRoleBadge(member.role)
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pb-8 border-b border-gray-50 dark:border-gray-800">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Phase</p>
                              {getStatusBadge(member.status)}
                            </div>
                            {member.phone && (
                              <div className="space-y-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Connect</p>
                                <p className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 text-orange-600" />
                                  {member.phone}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between group/link">
                            <div className="flex -space-x-3">
                              {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                                  <div className="w-full h-full rounded-full bg-orange-600/10 flex items-center justify-center text-[8px] font-black text-orange-600">OP</div>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-2 cursor-pointer group-hover/link:text-orange-600 transition-colors">
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover/link:text-orange-600">Internal Profile</span>
                              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-all group-hover/link:text-orange-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="pb-4 border-b border-border/50">
            <DialogTitle className="text-xl font-semibold flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/20 rounded-xl flex items-center justify-center border-2 border-orange-200 dark:border-orange-800">
                <Plus className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              Add Team Member
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              Fill in the details to invite a new talent to your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name *</label>
                <Input
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="e.g. John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="e.g. Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+251 ..."
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Roles *</label>
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Password *</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password *</label>
                <Input
                  type="password"
                  value={formData.password_confirmation}
                  onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-border/50">
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }} disabled={submitting} className="w-full sm:w-auto order-2 sm:order-1">
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={submitting} className="w-full sm:w-auto order-1 sm:order-2 bg-orange-600 hover:bg-orange-700 text-white">
              {submitting ? 'Adding...' : 'Add Member'}
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
  )
}
