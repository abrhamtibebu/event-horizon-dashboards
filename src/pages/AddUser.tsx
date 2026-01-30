import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  User,
  Save,
  X,
  Lock,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'

function generateStrongPassword(length = 16): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'
  const numbers = '23456789'
  const symbols = '!@#$%&*'
  const all = uppercase + lowercase + numbers + symbols
  const getRandom = (str: string) => str[Math.floor(Math.random() * str.length)]
  const password = [
    getRandom(uppercase),
    getRandom(lowercase),
    getRandom(numbers),
    getRandom(symbols),
    ...Array.from({ length: length - 4 }, () => getRandom(all)),
  ]
  return password.sort(() => Math.random() - 0.5).join('')
}

export default function AddUser() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    role: '',
    password: '',
    password_confirmation: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingUser, setLoadingUser] = useState(isEdit)
  const [showPassword, setShowPassword] = useState(false)
  const [createdUser, setCreatedUser] = useState<{ name: string; email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const setGeneratedPassword = useCallback(() => {
    const pwd = generateStrongPassword(16)
    setFormData((prev) => ({ ...prev, password: pwd, password_confirmation: pwd }))
  }, [])

  useEffect(() => {
    if (!isEdit) {
      setGeneratedPassword()
    }
  }, [isEdit, setGeneratedPassword])

  useEffect(() => {
    if (!isEdit) return
    const fetchUser = async () => {
      try {
        setLoadingUser(true)
        const response = await api.get(`/users/${id}`)
        const u = response.data.data || response.data
        const fullName = (u.name ?? [u.first_name, u.last_name].filter(Boolean).join(' ')) || ''
        setFormData({
          name: fullName,
          email: u.email ?? '',
          phone_number: u.phone_number ?? u.phone ?? '',
          role: u.role ?? '',
          password: '',
          password_confirmation: '',
        })
      } catch (err: any) {
        toast.error(err.response?.data?.message ?? 'Failed to load user.')
        navigate('/dashboard/users')
      } finally {
        setLoadingUser(false)
      }
    }
    fetchUser()
  }, [id, isEdit, navigate])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCopyPassword = useCallback(async (password: string) => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      toast.success('Password copied to clipboard. Send it to the user securely.')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy to clipboard.')
    }
  }, [])

  const getValidationErrorMessage = (error: any): string => {
    const data = error?.response?.data
    if (!data) return error?.message ?? 'Request failed.'
    if (typeof data === 'string') return data
    if (data.message) return data.message
    if (typeof data === 'object' && !Array.isArray(data)) {
      const firstKey = Object.keys(data)[0]
      const firstVal = data[firstKey]
      if (Array.isArray(firstVal) && firstVal[0]) return firstVal[0]
      if (typeof firstVal === 'string') return firstVal
    }
    return (isEdit ? 'Failed to update user.' : 'Failed to create user.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit && formData.password && formData.password !== formData.password_confirmation) {
      toast.error('Passwords do not match.')
      return
    }
    if (!isEdit && (!formData.password || formData.password !== formData.password_confirmation)) {
      toast.error('Passwords do not match.')
      return
    }
    setIsSubmitting(true)
    setCreatedUser(null)

    try {
      if (isEdit) {
        const payload: Record<string, string> = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone_number,
          role: formData.role,
        }
        if (formData.password) {
          payload.password = formData.password
          payload.password_confirmation = formData.password_confirmation
        }
        await api.put(`/users/${id}`, payload)
        toast.success('User updated successfully!')
        navigate('/dashboard/users')
      } else {
        const trimmedName = formData.name.trim()
        const spaceIndex = trimmedName.indexOf(' ')
        const first_name = spaceIndex > 0 ? trimmedName.slice(0, spaceIndex) : trimmedName || 'User'
        const last_name = spaceIndex > 0 ? trimmedName.slice(spaceIndex + 1) : trimmedName || 'User'
        const payload = {
          first_name,
          last_name,
          email: formData.email,
          phone: (formData.phone_number || '').trim().slice(0, 20) || 'N/A',
          password: formData.password,
          password_confirmation: formData.password_confirmation,
          role: formData.role,
        }
        await api.post('/users', payload)
        setCreatedUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        })
        toast.success('User created successfully. Copy the password and send it to the user securely.')
      }
    } catch (error: any) {
      toast.error(getValidationErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-transparent p-6 flex items-center justify-center">
        <Spinner text="Loading user..." />
      </div>
    )
  }

  // Post-create success: show password for copying
  if (createdUser) {
    return (
      <div className="min-h-screen bg-transparent p-6 space-y-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Users', href: '/dashboard/users' },
            { label: 'User created' },
          ]}
        />
        <div className="max-w-2xl mx-auto">
          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-5 h-5 text-primary" />
                <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Mosk, sans-serif' }}>
                  User created
                </h1>
              </div>
              <p className="text-muted-foreground">
                Copy the password below and send it to the user securely. They will need it to sign in.
              </p>
            </div>
            <div className="px-8 py-6 space-y-6">
              <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 flex gap-3">
                <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <p className="text-sm text-foreground">
                  <strong>{createdUser.name}</strong> ({createdUser.email}) has been created. Share the password only via a secure channel.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Generated password (copy and send to user)</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={createdUser.password}
                    className="font-mono bg-muted/50 border-border"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0 border-border gap-2"
                    onClick={() => handleCopyPassword(createdUser.password)}
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied' : 'Copy password'}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => navigate('/dashboard/users')}
                >
                  Back to Users
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-6 space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Users', href: '/dashboard/users' },
          { label: isEdit ? 'Edit User' : 'Add User' },
        ]}
      />

      <div className="max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-border">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Mosk, sans-serif' }}>
                {isEdit ? 'Edit User' : 'Add New User'}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {isEdit
                ? 'Update user account and permissions.'
                : 'A strong password is generated by default. Copy it and send it to the user securely.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
            {/* User Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg text-foreground">User Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">Full Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="bg-background border-border"
                    disabled={isEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="text-foreground">Phone Number {!isEdit && '*'}</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    placeholder="Enter phone number"
                    value={formData.phone_number}
                    onChange={(e) => handleInputChange('phone_number', e.target.value)}
                    required={!isEdit}
                    maxLength={20}
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-foreground">Role *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger className="bg-background border-border">
                      <SelectValue placeholder="Select user role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="attendee">Attendee</SelectItem>
                      <SelectItem value="organizer">Organizer</SelectItem>
                      <SelectItem value="organizer_admin">Organizer Admin</SelectItem>
                      <SelectItem value="usher">Usher</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Security */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg text-foreground">Security</h3>
                {!isEdit && (
                  <span className="text-xs text-muted-foreground font-normal">(strong password generated by default)</span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="password" className="text-foreground">
                      Password {isEdit ? '(leave blank to keep current)' : '*'}
                    </Label>
                    {!isEdit && (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-border gap-1.5"
                          onClick={setGeneratedPassword}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regenerate
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 border-border gap-1.5"
                          onClick={() => handleCopyPassword(formData.password)}
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isEdit ? 'Leave blank to keep current' : 'Generated password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required={!isEdit}
                      className="bg-background border-border font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0 border-border"
                      onClick={() => setShowPassword((p) => !p)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="password_confirmation" className="text-foreground">
                    Confirm Password {isEdit ? '' : '*'}
                  </Label>
                  <Input
                    id="password_confirmation"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={formData.password_confirmation}
                    onChange={(e) => handleInputChange('password_confirmation', e.target.value)}
                    required={!isEdit}
                    className="bg-background border-border font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard/users')}
                disabled={isSubmitting}
                className="border-border"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : isEdit ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
