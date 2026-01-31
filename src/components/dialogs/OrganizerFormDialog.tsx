import { useState, useEffect, useRef } from 'react'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Save,
  X,
  Upload,
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import api from '@/lib/api'
import { Spinner } from '@/components/ui/spinner'

interface OrganizerFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editId?: number | null
  onSuccess?: () => void
}

export function OrganizerFormDialog({
  open,
  onOpenChange,
  editId = null,
  onSuccess,
}: OrganizerFormDialogProps) {
  const isEdit = Boolean(editId)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    tin_number: '',
    phone_number: '',
    logo: null as File | null,
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingOrganizer, setLoadingOrganizer] = useState(false)

  useEffect(() => {
    if (!open) {
      setFormData({ name: '', email: '', location: '', tin_number: '', phone_number: '', logo: null })
      setLogoPreview(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || !isEdit || !editId) return
    const fetchOrganizer = async () => {
      try {
        setLoadingOrganizer(true)
        const response = await api.get('/admin/organizers', { params: { per_page: 1000 } })
        const list = response.data.data ?? response.data
        const arr = Array.isArray(list) ? list : list?.data ?? []
        const org = arr.find((o: any) => o.id === Number(editId))
        if (!org) {
          toast.error('Organizer not found.')
          onOpenChange(false)
          return
        }
        setFormData({
          name: org.name ?? '',
          email: org.email ?? '',
          location: org.location ?? '',
          tin_number: org.tin_number ?? '',
          phone_number: org.phone_number ?? '',
          logo: null,
        })
      } catch (err: any) {
        toast.error(err.response?.data?.message ?? 'Failed to load organizer.')
        onOpenChange(false)
      } finally {
        setLoadingOrganizer(false)
      }
    }
    fetchOrganizer()
  }, [open, editId, isEdit, onOpenChange])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }))
      const reader = new FileReader()
      reader.onloadend = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setFormData((prev) => ({ ...prev, logo: null }))
    setLogoPreview(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (isEdit && editId) {
        const payload: Record<string, string> = {
          name: formData.name,
          email: formData.email,
          location: formData.location,
          tin_number: formData.tin_number,
          phone_number: formData.phone_number,
        }
        await api.put(`/organizers/${editId}`, payload)
        toast.success('Organizer updated successfully.')
        onSuccess?.()
        onOpenChange(false)
      } else {
        let payload: any
        let headers: Record<string, string> = {}
        if (formData.logo) {
          payload = new FormData()
          Object.entries(formData).forEach(([key, value]) => {
            if (key === 'logo' && value) payload.append('logo', value)
            else if (value !== null && value !== '') payload.append(key, String(value))
          })
          headers = { 'Content-Type': 'multipart/form-data' }
        } else {
          payload = { ...formData, logo: undefined }
        }
        await api.post('/organizers', payload, { headers })
        toast.success('Organizer created successfully.')
        onSuccess?.()
        onOpenChange(false)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? (isEdit ? 'Failed to update organizer.' : 'Failed to create organizer.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next && !isSubmitting) onOpenChange(false)
    else onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col border-border bg-card p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="text-xl font-semibold text-foreground" style={{ fontFamily: 'Mosk, sans-serif' }}>
            {isEdit ? 'Edit Organizer' : 'Add New Organizer'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? 'Update organizer company information.' : 'Create a new organizer profile.'}
          </DialogDescription>
        </DialogHeader>

        {loadingOrganizer ? (
          <div className="flex items-center justify-center py-12">
            <Spinner text="Loading organizer..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
            <ScrollArea className="flex-1 max-h-[60vh] px-6">
              <div className="space-y-6 py-2">
                <div>
                  <h3 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Company Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-foreground">Company Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Company name"
                        required
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Email *</Label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="company@example.com"
                        required
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-2">
                      <Label className="text-foreground">Business Address</Label>
                      <Input
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Business address"
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">TIN Number</Label>
                      <Input
                        value={formData.tin_number}
                        onChange={(e) => handleInputChange('tin_number', e.target.value)}
                        placeholder="TIN number"
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Phone</Label>
                      <Input
                        value={formData.phone_number}
                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="bg-background border-border"
                      />
                    </div>
                    {!isEdit && (
                      <div className="sm:col-span-2 space-y-2">
                        <Label className="text-foreground">Logo (optional)</Label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            ref={logoInputRef}
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <Button type="button" variant="outline" size="sm" className="border-border" onClick={() => logoInputRef.current?.click()}>
                            <Upload className="w-4 h-4 mr-2" /> Choose file
                          </Button>
                          {formData.logo && <span className="text-sm text-muted-foreground">{formData.logo.name}</span>}
                          {logoPreview && (
                            <div className="relative inline-block">
                              <img src={logoPreview} alt="Preview" className="h-12 rounded border border-border" />
                              <Button type="button" variant="ghost" size="icon" className="absolute -top-1 -right-1 h-5 w-5 rounded-full" onClick={handleRemoveLogo}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting} className="border-border">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground">
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : isEdit ? 'Update Organizer' : 'Add Organizer'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
