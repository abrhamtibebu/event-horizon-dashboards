import { useState, useEffect } from 'react'
import { Camera, Mail, Phone, MapPin, Calendar, Briefcase, Save, Lock, Eye, EyeOff, Building2, FileText, User } from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { SpinnerInline } from '@/components/ui/spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/use-auth'
import { useModernAlerts } from '@/hooks/useModernAlerts'
import api from '@/lib/api'
import { cn, getOrganizerBannerUrl, getOrganizerLogoUrl } from '@/lib/utils'
import { ModernConfirmationDialog } from '@/components/ui/ModernConfirmationDialog'
import { UsherMobileLayout } from '@/components/UsherMobileLayout'

export default function Profile() {
  const { user, setUser, logout } = useAuth()
  const { showSuccess, showError } = useModernAlerts()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSettingUpOrg, setIsSettingUpOrg] = useState(false)

  const needsOrgSetup =
    user?.role === 'organizer_admin' && !user?.organizer_id

  const [orgForm, setOrgForm] = useState({
    name: '',
    location: '',
    tin_number: '',
    email: user?.email || '',
    phone_number: user?.phone || '',
  })

  const handleOrgChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrgForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleOrgSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSettingUpOrg(true)
    try {
      const res = await api.post('/organizer/setup', orgForm)
      const updatedUser = res.data?.user ?? res.data
      setUser({ ...user, ...updatedUser } as any)
      showSuccess('Organization created successfully! You can now start creating events.')
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        (error.response?.data && typeof error.response.data === 'object'
          ? Object.values(error.response.data).flat().join(', ')
          : null) ||
        'Failed to create organization'
      showError(msg)
    } finally {
      setIsSettingUpOrg(false)
    }
  }

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: user?.bio || '',
    organization: user?.organization || '',
  })
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Organization state & editing
  const [organizer, setOrganizer] = useState<any>(null)
  const [isEditingOrg, setIsEditingOrg] = useState(false)
  const [isSavingOrg, setIsSavingOrg] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [bannerPreview, setBannerPreview] = useState<string>('')

  const [orgData, setOrgData] = useState({
    name: '',
    location: '',
    tin_number: '',
    email: '',
    phone_number: '',
    description: '',
    website: '',
    tagline: '',
  })

  // Stats state
  const [stats, setStats] = useState({
    eventsManaged: 0,
    totalGuests: 0,
    loading: true
  })

  // Fetch organizer profile if user is associated with one
  useEffect(() => {
    const fetchOrganizerProfile = async () => {
      if (user?.organizer_id) {
        try {
          const res = await api.get('/organizer/profile')
          setOrganizer(res.data)
          setOrgData({
            name: res.data?.name || '',
            location: res.data?.location || '',
            tin_number: res.data?.tin_number || '',
            email: res.data?.email || '',
            phone_number: res.data?.phone_number || '',
            description: res.data?.description || '',
            website: res.data?.website || '',
            tagline: res.data?.tagline || '',
          })
        } catch (err) {
          console.error('Failed to load organizer profile:', err)
        }
      }
    }
    if (user) {
      fetchOrganizerProfile()
    }
  }, [user])

  // Fetch event and guest metrics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        let eventsCount = 0
        let guestsCount = 0

        // Fetch total guests from guests endpoint (which reflects organizer's entire managed guest list, active/inactive/deleted/trashed)
        try {
          const resGuests = await api.get('/guests?per_page=1')
          guestsCount = resGuests.data?.total || 0
        } catch (err) {
          console.error('Error fetching guest list count:', err)
        }

        if (user?.role === 'admin' || user?.role === 'superadmin') {
          const resEvents = await api.get('/events')
          const events = resEvents.data || []
          eventsCount = events.length
        } else if (user?.organizer_id) {
          const res = await api.get('/dashboard/organizer')
          const keyMetrics = res.data?.keyMetrics
          eventsCount = parseInt(keyMetrics?.myEvents?.value || '0', 10)
        }

        setStats({
          eventsManaged: eventsCount,
          totalGuests: guestsCount,
          loading: false
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
        setStats({
          eventsManaged: 0,
          totalGuests: 0,
          loading: false
        })
      }
    }
    if (user) {
      fetchStats()
    }
  }, [user])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      showError('Logo must be less than 2MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      showError('Logo must be an image')
      return
    }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      showError('Banner must be less than 4MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      showError('Banner must be an image')
      return
    }
    setBannerFile(file)
    setBannerPreview(URL.createObjectURL(file))
  }

  const handleOrgDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setOrgData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleOrgSave = async () => {
    setIsSavingOrg(true)
    try {
      const formData = new FormData()
      formData.append('_method', 'PUT') // Key for multipart PUT in Laravel
      formData.append('name', orgData.name)
      formData.append('location', orgData.location)
      formData.append('tin_number', orgData.tin_number)
      formData.append('email', orgData.email)
      formData.append('phone_number', orgData.phone_number)
      formData.append('description', orgData.description || '')
      formData.append('website', orgData.website || '')
      formData.append('tagline', orgData.tagline || '')

      if (logoFile) {
        formData.append('logo', logoFile)
      }
      if (bannerFile) {
        formData.append('banner', bannerFile)
      }

      const res = await api.post('/organizer/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      setOrganizer(res.data)
      showSuccess('Organization details updated successfully!')
      setLogoFile(null)
      setBannerFile(null)
      setLogoPreview('')
      setBannerPreview('')
      setIsEditingOrg(false)
    } catch (error: any) {
      showError(error.response?.data?.error || error.response?.data?.message || 'Failed to update organization details')
    } finally {
      setIsSavingOrg(false)
    }
  }

  const handleOrgCancel = () => {
    if (organizer) {
      setOrgData({
        name: organizer.name || '',
        location: organizer.location || '',
        tin_number: organizer.tin_number || '',
        email: organizer.email || '',
        phone_number: organizer.phone_number || '',
        description: organizer.description || '',
        website: organizer.website || '',
        tagline: organizer.tagline || '',
      })
    }
    setLogoFile(null)
    setBannerFile(null)
    setLogoPreview('')
    setBannerPreview('')
    setIsEditingOrg(false)
  }

  // Sync form when user loads or updates
  useEffect(() => {
    if (user) {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        location: user?.location || '',
        bio: user?.bio || '',
        organization: user?.organization || '',
      })
    }
  }, [user])

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    const parts = name.split(' ')
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Image must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please upload an image file')
      return
    }

    setIsUploadingImage(true)
    const formData = new FormData()
    formData.append('profile_image', file)

    try {
      const response = await api.post('/user/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      if (response.data.profile_image_url) {
        setUser({ ...user, profile_image: response.data.profile_image_url } as any)
        showSuccess('Profile image updated successfully!')
      }
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to upload image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = { ...formData, company: formData.organization }
      const response = await api.put('/user/profile', payload)
      const updated = response.data?.user ?? response.data
      setUser({ ...user, ...updated } as any)
      showSuccess('Profile updated successfully!')
      setIsEditing(false)
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      showError('New passwords do not match')
      return
    }
    setIsChangingPassword(true)
    try {
      const response = await api.put('/user/password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.new_password_confirmation,
      })
      showSuccess(response.data?.message ?? 'Password updated. Please log in again.')
      setPasswordData({ current_password: '', new_password: '', new_password_confirmation: '' })
      setTimeout(() => logout(), 1500)
    } catch (error: any) {
      showError(error.response?.data?.error ?? error.response?.data?.message ?? 'Failed to update password')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: user?.bio || '',
      organization: user?.organization || '',
    })
    setIsEditing(false)
  }

  const content = (
    <div className="container mx-auto p-4 md:p-6 pb-24 space-y-6">
      {/* Breadcrumbs - Hidden on mobile for ushers */}
      <div className={cn(user?.role === 'usher' && "hidden md:block")}>
        <Breadcrumbs 
          items={[
            { label: 'Profile', href: '/dashboard/profile' }
          ]}
          className="mb-4"
        />
      </div>
      
      {/* Header - Hidden on mobile for ushers as Layout provides it */}
      <div className={cn("mb-6", user?.role === 'usher' && "hidden md:block")}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Account Area</span>
        </div>
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">My Profile</h1>
        <p className="text-sm text-muted-foreground">Manage your personal identity, contact info, and preferences</p>
      </div>

      {/* Main Profile Header Card */}
      <Card className="border border-border rounded-2xl shadow-sm overflow-hidden bg-card">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar upload center */}
            <div className="relative group">
              <Avatar className="w-32 h-32 border-4 border-card shadow-lg relative transition-transform duration-300 group-hover:scale-105">
                <AvatarImage src={user?.profile_image} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-tr from-primary to-blue-600 text-primary-foreground text-3xl font-black">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-image-upload"
                className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-xs scale-105"
              >
                {isUploadingImage ? (
                  <SpinnerInline size="md" />
                ) : (
                  <Camera className="w-8 h-8 text-white animate-pulse" />
                )}
              </label>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
                style={{display: 'none'}}
              />
            </div>

            {/* Info details */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-foreground tracking-tight">{user?.name}</h2>
                <p className="text-muted-foreground text-sm font-medium">{user?.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge className="bg-primary/10 border-none text-primary rounded-full px-3 py-1 font-bold text-xs uppercase tracking-wider">
                  {user?.role}
                </Badge>
                {user?.organizer_id && (
                  <Badge className="bg-blue-500/10 border-none text-blue-500 rounded-full px-3 py-1 font-bold text-xs uppercase tracking-wider">
                    Organizer
                  </Badge>
                )}
              </div>
              <div className="pt-3">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)} className="rounded-2xl px-6 font-semibold shadow-lg shadow-primary/20">
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-3 justify-center md:justify-start">
                    <Button onClick={handleSave} disabled={isSaving} className="rounded-2xl px-6 font-semibold shadow-lg bg-green-600 hover:bg-green-700 text-white">
                      {isSaving ? (
                        <>
                          <SpinnerInline className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button onClick={handleCancel} variant="outline" disabled={isSaving} className="rounded-2xl px-6 font-semibold">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization Setup — visible only for organizer_admins with no org */}
      {needsOrgSetup && (
        <Card className="border border-border bg-card rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2.5 text-xl font-bold">
              <Building2 className="w-5 h-5 text-primary" />
              Set Up Your Organization
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Complete the details below to create your event organizer company. Once set up you can start creating and managing events.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form onSubmit={handleOrgSetup} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="org_name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Organization Name *</Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="org_name"
                      name="name"
                      value={orgForm.name}
                      onChange={handleOrgChange}
                      className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/20"
                      placeholder="Acme Events Ltd."
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org_location" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="org_location"
                      name="location"
                      value={orgForm.location}
                      onChange={handleOrgChange}
                      className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/20"
                      placeholder="Addis Ababa, Ethiopia"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org_tin" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">TIN Number</Label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="org_tin"
                      name="tin_number"
                      value={orgForm.tin_number}
                      onChange={handleOrgChange}
                      className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/20"
                      placeholder="0000000000"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="org_email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Business Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="org_email"
                      name="email"
                      type="email"
                      value={orgForm.email}
                      onChange={handleOrgChange}
                      className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/20"
                      placeholder="contact@acme-events.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="org_phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Business Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="org_phone"
                      name="phone_number"
                      value={orgForm.phone_number}
                      onChange={handleOrgChange}
                      className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/20"
                      placeholder="+251 911 000 000"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={isSettingUpOrg} className="rounded-2xl px-6 h-12 font-semibold shadow-lg mt-2">
                {isSettingUpOrg ? (
                  <>
                    <SpinnerInline className="mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Building2 className="mr-2 h-4 w-4" />
                    Create Organization
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Grid of Personal Info & Security */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Personal Details Panel */}
        <Card className="border border-border rounded-2xl shadow-sm overflow-hidden bg-card flex flex-col">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2.5">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription>Your personal details and contact card</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4 flex-1">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10"
                  placeholder="+251 9... or +1..."
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10"
                  placeholder="City, Country"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="organization" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Organization</Label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                <Input
                  id="organization"
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10"
                  placeholder="Company name"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Bio</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                rows={3}
                className="rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10 resize-none p-4"
                placeholder="Tell us about yourself..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Change Password Panel */}
        <Card className="border border-border rounded-2xl shadow-sm overflow-hidden bg-card flex flex-col">
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-xl font-bold flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-primary" />
              Security Settings
            </CardTitle>
            <CardDescription>Update your password credentials securely</CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-4 flex-1">
            <form onSubmit={handleChangePassword} className="space-y-4 h-full flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="current_password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current_password"
                      name="current_password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={(e) => setPasswordData((p) => ({ ...p, current_password: e.target.value }))}
                      className="pr-12 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new_password" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new_password"
                      name="new_password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => setPasswordData((p) => ({ ...p, new_password: e.target.value }))}
                      className="pr-12 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                      placeholder="Enter new password"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new_password_confirmation" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Confirm New Password</Label>
                  <Input
                    id="new_password_confirmation"
                    name="new_password_confirmation"
                    type="password"
                    value={passwordData.new_password_confirmation}
                    onChange={(e) => setPasswordData((p) => ({ ...p, new_password_confirmation: e.target.value }))}
                    className="h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25"
                    placeholder="Confirm new password"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button type="submit" disabled={isChangingPassword} className="w-full rounded-2xl h-12 font-semibold shadow-lg mt-2">
                  {isChangingPassword ? (
                    <>
                      <SpinnerInline className="mr-2" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
                <p className="text-[10px] text-muted-foreground text-center mt-3">
                  Note: You will be automatically logged out and must sign in again after updating.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Organization Details Panel — visible for users with organizer_id */}
      {user?.organizer_id && organizer && (
        <Card className="border border-border rounded-2xl shadow-sm overflow-hidden bg-card">
          <CardHeader className="p-6 pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2.5">
                  <Building2 className="w-5 h-5 text-primary" />
                  Organization Details
                </CardTitle>
                <CardDescription>Manage your business credentials, contact details, logo, banner, and profile</CardDescription>
              </div>
              <div>
                {!isEditingOrg ? (
                  <Button onClick={() => setIsEditingOrg(true)} className="rounded-2xl px-6 font-semibold shadow-lg">
                    Edit Organization
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button onClick={handleOrgSave} disabled={isSavingOrg} className="rounded-2xl px-6 font-semibold shadow-lg bg-green-600 hover:bg-green-700 text-white">
                      {isSavingOrg ? (
                        <>
                          <SpinnerInline className="mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Details
                        </>
                      )}
                    </Button>
                    <Button onClick={handleOrgCancel} variant="outline" disabled={isSavingOrg} className="rounded-2xl px-6 font-semibold">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0 space-y-6">
            {/* Organization Banner and Logo Section */}
            <div className="relative mb-16 rounded-2xl overflow-hidden border border-border bg-muted/20">
              {/* Banner Container */}
              <div className="relative h-40 md:h-56 w-full overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-blue-500/10">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Organization Banner Preview" className="w-full h-full object-cover" />
                ) : organizer?.banner ? (
                  <img src={getOrganizerBannerUrl(organizer.banner)} alt="Organization Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 font-medium text-sm">
                    No organization banner uploaded
                  </div>
                )}

                {isEditingOrg && (
                  <label
                    htmlFor="org-banner-upload"
                    className="absolute inset-0 bg-black/50 hover:bg-black/60 transition-all flex flex-col items-center justify-center cursor-pointer text-white gap-2"
                  >
                    <Camera className="w-8 h-8 text-white/80 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-white/90">Change Banner Image</span>
                    <input
                      id="org-banner-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              {/* Logo Overlap Container */}
              <div className="absolute -bottom-10 left-6 z-10">
                <div className="relative group w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-card bg-card shadow-md overflow-hidden flex items-center justify-center transition-transform duration-300 hover:scale-[1.02]">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Organization Logo Preview" className="w-full h-full object-cover" />
                  ) : organizer?.logo ? (
                    <img src={getOrganizerLogoUrl(organizer.logo)} alt="Organization Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-10 h-10 md:w-14 md:h-14 text-muted-foreground/60" />
                  )}

                  {isEditingOrg && (
                    <label
                      htmlFor="org-logo-upload"
                      className="absolute inset-0 bg-black/60 rounded-xl flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer text-white gap-1 backdrop-blur-xs"
                    >
                      <Camera className="w-6 h-6 text-white" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-white/90 text-center px-1">Logo</span>
                      <input
                        id="org-logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="org_name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Organization Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                    <Input
                      id="org_name"
                      name="name"
                      value={orgData.name}
                      onChange={handleOrgDataChange}
                      disabled={!isEditingOrg}
                      className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org_location" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                    <Input
                      id="org_location"
                      name="location"
                      value={orgData.location}
                      onChange={handleOrgDataChange}
                      disabled={!isEditingOrg}
                      className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org_tin" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">TIN Number</Label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                    <Input
                      id="org_tin"
                      name="tin_number"
                      value={orgData.tin_number}
                      onChange={handleOrgDataChange}
                      disabled={!isEditingOrg}
                      className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org_tagline" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Tagline</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                    <Input
                      id="org_tagline"
                      name="tagline"
                      value={orgData.tagline}
                      onChange={handleOrgDataChange}
                      disabled={!isEditingOrg}
                      className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10"
                      placeholder="Your organization's tagline"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="org_email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Business Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                    <Input
                      id="org_email"
                      name="email"
                      type="email"
                      value={orgData.email}
                      onChange={handleOrgDataChange}
                      disabled={!isEditingOrg}
                      className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org_phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Business Phone</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                    <Input
                      id="org_phone"
                      name="phone_number"
                      value={orgData.phone_number}
                      onChange={handleOrgDataChange}
                      disabled={!isEditingOrg}
                      className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org_website" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Website URL</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
                    <Input
                      id="org_website"
                      name="website"
                      type="url"
                      value={orgData.website}
                      onChange={handleOrgDataChange}
                      disabled={!isEditingOrg}
                      className="pl-11 h-12 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10"
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org_description" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Description</Label>
                  <Textarea
                    id="org_description"
                    name="description"
                    value={orgData.description}
                    onChange={handleOrgDataChange}
                    disabled={!isEditingOrg}
                    rows={3}
                    className="rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/25 transition-all disabled:opacity-75 disabled:bg-muted/10 resize-none p-4"
                    placeholder="Describe your organization..."
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Stats Widget Grid */}
      <Card className="border border-border rounded-2xl shadow-sm overflow-hidden bg-card">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-primary" />
            Account Overview
          </CardTitle>
          <CardDescription>Your activity metrics at a glance</CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/20 transition-all hover:scale-[1.01]">
              <div className="w-12 h-12 bg-muted border border-border text-foreground rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Events Managed</p>
                <div className="text-2xl font-black text-foreground">
                  {stats.loading ? <SpinnerInline size="sm" /> : stats.eventsManaged}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/20 transition-all hover:scale-[1.01]">
              <div className="w-12 h-12 bg-muted border border-border text-foreground rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Guests</p>
                <div className="text-2xl font-black text-foreground">
                  {stats.loading ? <SpinnerInline size="sm" /> : stats.totalGuests}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/20 transition-all hover:scale-[1.01]">
              <div className="w-12 h-12 bg-muted border border-border text-foreground rounded-xl flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Member Since</p>
                <p className="text-sm font-black text-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-red-500/25 bg-red-500/[0.01] rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-4">
          <CardTitle className="text-red-500 flex items-center gap-2.5 text-xl font-bold">
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-900/60 dark:text-red-300/40">
            Irreversible actions regarding your account existence.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="font-bold text-foreground">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account along with all your hosted events, ticket orders, and team members.
              </p>
            </div>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleting(true)}
              className="rounded-xl h-11 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-md shadow-red-500/10"
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <ModernConfirmationDialog
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={async () => {
          if (!user?.id) return;
          setIsSaving(true) // Reusing isSaving for loading state
          try {
            await api.delete(`/users/${user.id}`);
            showSuccess('Account successfully deleted. Goodbye!');
            logout();
          } catch (err: any) {
            showError(err.response?.data?.error || 'Failed to delete account');
            setIsDeleting(false)
          } finally {
            setIsSaving(false)
          }
        }}
        title="Delete Your Account Permanently?"
        description="This ABSOLUTELY IRREVERSIBLE action will permanently delete your account, all your events, and disconnect your entire team. You will lose access to all data immediately."
        confirmText="Yes, delete my account"
        cancelText="Keep my account"
        variant="danger"
        isLoading={isSaving}
      />
    </div>
  )

  if (user?.role === 'usher') {
    return <UsherMobileLayout title="My Profile">{content}</UsherMobileLayout>
  }

  return content
}
