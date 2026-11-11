import { useState, useEffect, useRef } from 'react'
import { Save, X, Upload } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
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
import { toast } from 'sonner'
import api from '@/lib/api'
import { getOrganizerBannerUrl, getOrganizerLogoUrl } from '@/lib/utils'
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
    description: '',
    tagline: '',
    website: '',
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: '',
    logo: null as File | null,
    banner: null as File | null,
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingOrganizer, setLoadingOrganizer] = useState(false)

  useEffect(() => {
    if (!open) {
      setFormData({ 
        name: '', 
        email: '', 
        location: '', 
        tin_number: '', 
        phone_number: '', 
        description: '',
        tagline: '',
        website: '',
        facebook: '',
        twitter: '',
        instagram: '',
        linkedin: '',
        logo: null, 
        banner: null 
      })
      setLogoPreview(null)
      setBannerPreview(null)
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
          description: org.description ?? '',
          tagline: org.tagline ?? '',
          website: org.website ?? '',
          facebook: org.facebook ?? '',
          twitter: org.twitter ?? '',
          instagram: org.instagram ?? '',
          linkedin: org.linkedin ?? '',
          logo: null,
          banner: null,
        })
        setLogoPreview(org.logo ? getOrganizerLogoUrl(org.logo) : null)
        setBannerPreview(org.banner ? getOrganizerBannerUrl(org.banner) : null)
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

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, banner: file }))
      const reader = new FileReader()
      reader.onloadend = () => setBannerPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveBanner = () => {
    setFormData((prev) => ({ ...prev, banner: null }))
    setBannerPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (isEdit && editId) {
        let payload: any
        let headers: Record<string, string> = {}

        if (formData.logo || formData.banner) {
          payload = new FormData()
          payload.append('_method', 'PUT')
          Object.entries(formData).forEach(([key, value]) => {
            if (key === 'logo' && value) payload.append('logo', value)
            else if (key === 'banner' && value) payload.append('banner', value)
            else if (value !== null && value !== '') payload.append(key, String(value))
          })
          headers = { 'Content-Type': 'multipart/form-data' }
          // Use POST for method spoofing because multipart PUT/PATCH is problematic in PHP
          await api.post(`/organizers/${editId}`, payload, { headers })
        } else {
          payload = { ...formData, logo: undefined, banner: undefined }
          await api.put(`/organizers/${editId}`, payload)
        }
        toast.success('Organizer updated successfully.')
        onSuccess?.()
        onOpenChange(false)
      } else {
        let payload: any
        let headers: Record<string, string> = {}
        if (formData.logo || formData.banner) {
          payload = new FormData()
          Object.entries(formData).forEach(([key, value]) => {
            if (key === 'logo' && value) payload.append('logo', value)
            else if (key === 'banner' && value) payload.append('banner', value)
            else if (value !== null && value !== '') payload.append(key, String(value))
          })
          headers = { 'Content-Type': 'multipart/form-data' }
        } else {
          payload = { ...formData, logo: undefined, banner: undefined }
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

  const fieldClass = 'bg-background'

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 pr-12">
          <DialogTitle className="text-base font-semibold">
            {isEdit ? 'Edit Organizer' : 'Add New Organizer'}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isEdit ? 'Update company details.' : 'Create an organizer profile.'}
          </DialogDescription>
        </DialogHeader>

        {loadingOrganizer ? (
          <div className="flex items-center justify-center py-12">
            <Spinner text="Loading organizer..." />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
            <div className="max-h-[min(70vh,640px)] space-y-5 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Company name</Label>
                  <Input value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} required className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} required className={fieldClass} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Business address</Label>
                  <Input value={formData.location} onChange={(e) => handleInputChange('location', e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <Label>TIN number</Label>
                  <Input value={formData.tin_number} onChange={(e) => handleInputChange('tin_number', e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={formData.phone_number} onChange={(e) => handleInputChange('phone_number', e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <Label>Logo</Label>
                  <input type="file" ref={logoInputRef} accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" /> Choose
                    </Button>
                    {logoPreview && (
                      <div className="relative">
                        <img src={logoPreview} alt="" className="h-10 rounded border border-border" />
                        <button type="button" className="absolute -right-1 -top-1 rounded-full border border-border bg-background p-0.5" onClick={handleRemoveLogo}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Banner</Label>
                  <input type="file" id="banner-upload" accept="image/*" onChange={handleBannerUpload} className="hidden" />
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('banner-upload')?.click()}>
                      <Upload className="mr-2 h-4 w-4" /> Choose
                    </Button>
                    {bannerPreview && (
                      <div className="relative">
                        <img src={bannerPreview} alt="" className="h-10 rounded border border-border" />
                        <button type="button" className="absolute -right-1 -top-1 rounded-full border border-border bg-background p-0.5" onClick={handleRemoveBanner}>
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <p className="text-sm font-medium">Details</p>
                <div className="space-y-1.5">
                  <Label>Tagline</Label>
                  <Input value={formData.tagline} onChange={(e) => handleInputChange('tagline', e.target.value)} className={fieldClass} />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} rows={3} className="resize-none bg-background" />
                </div>
                <div className="space-y-1.5">
                  <Label>Website</Label>
                  <Input value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)} placeholder="https://" className={fieldClass} />
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <p className="text-sm font-medium">Social links</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Facebook</Label>
                    <Input value={formData.facebook} onChange={(e) => handleInputChange('facebook', e.target.value)} className={fieldClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Twitter</Label>
                    <Input value={formData.twitter} onChange={(e) => handleInputChange('twitter', e.target.value)} className={fieldClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Instagram</Label>
                    <Input value={formData.instagram} onChange={(e) => handleInputChange('instagram', e.target.value)} className={fieldClass} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>LinkedIn</Label>
                    <Input value={formData.linkedin} onChange={(e) => handleInputChange('linkedin', e.target.value)} className={fieldClass} />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="shrink-0 border-t border-border px-5 py-3">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? (isEdit ? 'Updating...' : 'Creating...') : isEdit ? 'Update Organizer' : 'Add Organizer'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
