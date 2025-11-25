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
} from 'lucide-react'
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
    logo: null as File | null,
  })
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      let payload
      let headers = {}
      if (formData.logo) {
        payload = new FormData()
        Object.entries(formData).forEach(([key, value]) => {
          if (key === 'logo' && value) payload.append('logo', value)
          else payload.append(key, value as any)
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
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl">
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
              <Building2 className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-lg text-gray-900">
                Vendor Information
              </h3>
              <span className="text-gray-400 text-sm ml-2">
                Company details and business information
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="name"
                  className="flex items-center gap-2 text-gray-700"
                >
                  <Building2 className="w-4 h-4" /> Company Name
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
                <Label
                  htmlFor="email"
                  className="flex items-center gap-2 text-gray-700"
                >
                  <Mail className="w-4 h-4" /> Company Email
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
                <Label
                  htmlFor="location"
                  className="flex items-center gap-2 text-gray-700"
                >
                  <MapPin className="w-4 h-4" /> Business Address
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange('location', e.target.value)
                  }
                  placeholder="Enter complete business address"
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="tin_number"
                  className="flex items-center gap-2 text-gray-700"
                >
                  <Hash className="w-4 h-4" /> TIN Number
                </Label>
                <Input
                  id="tin_number"
                  value={formData.tin_number}
                  onChange={(e) =>
                    handleInputChange('tin_number', e.target.value)
                  }
                  placeholder="Enter TIN number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="phone_number"
                  className="flex items-center gap-2 text-gray-700"
                >
                  <Phone className="w-4 h-4" /> Company Phone
                </Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) =>
                    handleInputChange('phone_number', e.target.value)
                  }
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label
                  htmlFor="logo"
                  className="flex items-center gap-2 text-gray-700"
                >
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
                    <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded cursor-pointer border border-blue-200 hover:bg-blue-100 transition">
                      Choose File
                    </span>
                  </label>
                  <span className="text-gray-600 text-sm">
                    {formData.logo ? formData.logo.name : 'No file chosen'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Upload your company logo (PNG, JPG, SVG)
                </p>
                {logoPreview && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 rounded shadow border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 rounded-full h-6 w-6"
                      onClick={handleRemoveLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
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
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-2 rounded-lg shadow"
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
