import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  Hash,
  Upload,
  Save,
  X,
  User,
  Users,
  Globe,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Type,
  AlignLeft,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import api from '@/lib/api'

export default function AddOrganizer() {
  const navigate = useNavigate()
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
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
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
      let payload
      let headers = {}
      if (formData.logo || formData.banner) {
        payload = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
          if (key === 'logo' && value) payload.append('logo', value)
          else if (key === 'banner' && value) payload.append('banner', value)
          else if (value !== null && value !== '') payload.append(key, value as any)
        })
        headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        payload = { ...formData }
      }
      await api.post('/organizers', payload, { headers })
      toast.success('Organizer created successfully!')
      navigate('/dashboard/organizers')
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || 'Failed to create organizer.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto p-0 animate-fade-in relative">
        {/* Breadcrumbs */}
        <div className="px-8 pt-6 pb-2">
          <Breadcrumbs
            items={[
              { label: 'Organizers', href: '/dashboard/organizers' },
              { label: 'Add Organizer' }
            ]}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-2 pb-2 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-brand-gradient p-2 rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Add New Organizer
              </h2>
              <p className="text-gray-500 text-sm">
                Create a new event organizer profile
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-gray-700 p-2 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
          {/* Vendor Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg text-gray-900">
                Vendor Information
              </h3>
              <span className="text-gray-400 text-sm ml-2">
                Company details and business information
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 text-gray-700">
                  <Building2 className="w-4 h-4" /> Company Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter company name"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4" /> Company Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="company@example.com"
                  required
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="location" className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4" /> Business Address
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter complete business address"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tin_number" className="flex items-center gap-2 text-gray-700">
                  <Hash className="w-4 h-4" /> TIN Number
                </Label>
                <Input
                  id="tin_number"
                  value={formData.tin_number}
                  onChange={(e) => handleInputChange('tin_number', e.target.value)}
                  placeholder="Enter TIN number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="phone_number" className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4" /> Company Phone
                </Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>
              
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-dashed">
                <div className="space-y-2">
                  <Label htmlFor="logo" className="flex items-center gap-2 text-gray-700 text-sm font-semibold">
                    <Upload className="w-4 h-4" /> Company Logo
                  </Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="file"
                      id="logo"
                      ref={logoInputRef}
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <label htmlFor="logo" className="inline-block">
                      <span className="inline-block px-4 py-2 bg-primary/10 text-primary font-medium rounded cursor-pointer border border-primary/20 hover:bg-primary/20 transition text-xs">
                        Choose Logo
                      </span>
                    </label>
                  </div>
                  {logoPreview && (
                    <div className="mt-2 relative inline-block">
                      <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-cover rounded shadow border" />
                      <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 rounded-full h-6 w-6" onClick={handleRemoveLogo}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="banner" className="flex items-center gap-2 text-gray-700 text-sm font-semibold">
                    <Upload className="w-4 h-4" /> Company Banner
                  </Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="file"
                      id="banner"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                    <label htmlFor="banner" className="inline-block">
                      <span className="inline-block px-4 py-2 bg-primary/10 text-primary font-medium rounded cursor-pointer border border-primary/20 hover:bg-primary/20 transition text-xs">
                        Choose Banner
                      </span>
                    </label>
                  </div>
                  {bannerPreview && (
                    <div className="mt-2 relative inline-block">
                      <img src={bannerPreview} alt="Banner preview" className="h-16 w-28 object-cover rounded shadow border" />
                      <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 rounded-full h-6 w-6" onClick={handleRemoveBanner}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <AlignLeft className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg text-gray-900">Profiling</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="tagline" className="text-gray-700">Tagline</Label>
                  <Input id="tagline" value={formData.tagline} onChange={(e) => handleInputChange('tagline', e.target.value)} placeholder="Company tagline" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="description" className="text-gray-700">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} placeholder="Tell us about the company..." className="mt-1 resize-none" rows={4} />
                </div>
                <div>
                  <Label htmlFor="website" className="flex items-center gap-2 text-gray-700">
                    <Globe className="w-4 h-4" /> Website URL
                  </Label>
                  <Input id="website" value={formData.website} onChange={(e) => handleInputChange('website', e.target.value)} placeholder="https://example.com" className="mt-1" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-lg text-gray-900">Social Media</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="flex items-center gap-2 text-gray-700"><Facebook className="w-4 h-4" /> Facebook</Label>
                  <Input value={formData.facebook} onChange={(e) => handleInputChange('facebook', e.target.value)} placeholder="Facebook URL" className="mt-1" />
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-gray-700"><Twitter className="w-4 h-4" /> Twitter</Label>
                  <Input value={formData.twitter} onChange={(e) => handleInputChange('twitter', e.target.value)} placeholder="Twitter URL" className="mt-1" />
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-gray-700"><Instagram className="w-4 h-4" /> Instagram</Label>
                  <Input value={formData.instagram} onChange={(e) => handleInputChange('instagram', e.target.value)} placeholder="Instagram URL" className="mt-1" />
                </div>
                <div>
                  <Label className="flex items-center gap-2 text-gray-700"><Linkedin className="w-4 h-4" /> LinkedIn</Label>
                  <Input value={formData.linkedin} onChange={(e) => handleInputChange('linkedin', e.target.value)} placeholder="LinkedIn URL" className="mt-1" />
                </div>
              </div>
            </div>
          </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-gradient bg-brand-gradient-hover text-white font-semibold px-6 py-2 rounded-lg shadow"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Adding...
                </span>
              ) : (
                'Add Organizer'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
