import { useState, useEffect, useCallback } from 'react'
import {
  Save,
  Lock,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  FileText,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId?: number | null
  onSuccess?: () => void
}

export function UserFormDialog({
  open,
  onOpenChange,
  editId = null,
  onSuccess,
}: UserFormDialogProps) {
  const isEdit = Boolean(editId)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    role: '',
    password: '',
    password_confirmation: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingUser, setLoadingUser] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [createdUser, setCreatedUser] = useState<{ name: string; email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const setGeneratedPassword = useCallback(() => {
    const pwd = generateStrongPassword(16)
    setFormData((prev) => ({ ...prev, password: pwd, password_confirmation: pwd }))
  }, [])

  useEffect(() => {
    if (!open) {
      setCreatedUser(null)
      if (!isEdit) setFormData((prev) => ({ ...prev, name: '', email: '', phone_number: '', role: '', password: '', password_confirmation: '' }))
    }
    if (open && !isEdit) setGeneratedPassword()
  }, [open, isEdit, setGeneratedPassword])

  useEffect(() => {
    if (!open || !isEdit || !editId) return
    const fetchUser = async () => {
      try {
        setLoadingUser(true)
        const response = await api.get(`/users/${editId}`)
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
        onOpenChange(false)
      } finally {
        setLoadingUser(false)
      }
    }
    fetchUser()
  }, [open, editId, isEdit, onOpenChange])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleCopyPassword = useCallback(async (password: string) => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      toast.success('Password copied to clipboard.')
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
    return isEdit ? 'Failed to update user.' : 'Failed to create user.'
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
      if (isEdit && editId) {
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
        await api.put(`/users/${editId}`, payload)
        toast.success('User updated successfully!')
        onSuccess?.()
        onOpenChange(false)
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
        toast.success('User created. Copy the password and send it securely.')
      }
    } catch (error: any) {
      toast.error(getValidationErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && !isSubmitting) setCreatedUser(null)
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col border-border bg-card p-0 gap-0 overflow-hidden rounded-2xl [&>button]:right-4 [&>button]:top-4">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 border-b border-border/50">
          <DialogTitle className="text-xl font-semibold text-foreground pr-8" style={{ fontFamily: 'Mosk, sans-serif' }}>
            {createdUser ? 'User created' : isEdit ? 'Edit User' : 'Add New User'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {createdUser ? 'Copy the generated password and send it to the user.' : isEdit ? 'Update user account and permissions.' : 'Create a new user account. A strong password is generated by default.'}
          </DialogDescription>
        </DialogHeader>

        {loadingUser ? (
          <div className="flex items-center justify-center py-12 shrink-0">
            <Spinner text="Loading user..." />
          </div>
        ) : createdUser ? (
          <div className="px-6 py-6 space-y-4 overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              Copy the password below and send it to the user securely.
            </p>
            <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-4 flex gap-3">
              <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <p className="text-sm text-foreground">
                <strong>{createdUser.name}</strong> ({createdUser.email}) has been created.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Generated password</Label>
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
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            <DialogFooter className="pt-4 px-0 pb-0">
              <Button onClick={() => { setCreatedUser(null); onSuccess?.(); onOpenChange(false); }} className="bg-primary text-primary-foreground">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-foreground mb-3">User Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Full Name *</Label>
                      <Input
                        placeholder="Full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Email *</Label>
                      <Input
                        type="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        className="bg-background border-border"
                        disabled={isEdit}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Phone</Label>
                      <Input
                        type="tel"
                        placeholder="Phone"
                        value={formData.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        maxLength={20}
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Role *</Label>
                      <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select role" />
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
                <div>
                  <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0" /> Security
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Label className="text-foreground">
                          Password {isEdit ? '(leave blank to keep)' : '*'}
                        </Label>
                        {!isEdit && (
                          <Button type="button" variant="outline" size="sm" className="h-8 border-border shrink-0" onClick={setGeneratedPassword}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Regenerate
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder={isEdit ? 'Leave blank to keep' : 'Generated'}
                          value={formData.password}
                          onChange={(e) => handleInputChange('password', e.target.value)}
                          required={!isEdit}
                          className="bg-background border-border font-mono flex-1 min-w-0"
                        />
                        <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 border-border" onClick={() => setShowPassword((p) => !p)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Confirm Password {!isEdit && '*'}</Label>
                      <Input
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
              </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t border-border shrink-0 flex-row justify-end gap-2 sm:gap-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting} className="border-border">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground gap-2">
                {isEdit ? (
                  <Save className="w-4 h-4 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 shrink-0" />
                )}
                {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : isEdit ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
