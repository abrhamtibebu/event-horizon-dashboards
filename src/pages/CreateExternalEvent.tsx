import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe,
  MapPin,
  Calendar,
  Image as ImageIcon,
  Building2,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Info,
  X,
  Upload,
  CheckCircle2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Breadcrumbs from '@/components/Breadcrumbs'
import GoogleVenueAutocompleteInput from '@/components/GoogleVenueAutocompleteInput'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { showSuccessToast, showErrorToast } from '@/components/ui/ModernToast'
import api from '@/lib/api'
import { cn } from '@/lib/utils'

// Ethiopian major cities
const ETHIOPIAN_CITIES = [
  'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Adama',
  'Hawassa', 'Bahir Dar', 'Jimma', 'Dessie', 'Jijiga'
]

export default function CreateExternalEvent() {
  const navigate = useNavigate()
  const [activeStep, setActiveStep] = useState(1)
  const totalSteps = 3
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    external_registration_url: '',
    event_category_id: '',
    city: '',
    venue_name: '',
    start_date: '',
    end_date: '',
    organizer_name: '',
  })

  const [locationMeta, setLocationMeta] = useState<{
    latitude: number | null
    longitude: number | null
    formattedAddress: string
  }>({
    latitude: null,
    longitude: null,
    formattedAddress: '',
  })

  const [eventImage, setEventImage] = useState<File | null>(null)
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null)
  const [orgLogo, setOrgLogo] = useState<File | null>(null)
  const [orgLogoPreview, setOrgLogoPreview] = useState<string | null>(null)
  const [orgBanner, setOrgBanner] = useState<File | null>(null)
  const [orgBannerPreview, setOrgBannerPreview] = useState<string | null>(null)

  const [categories, setCategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await api.get('/event-categories')
      setCategories(response.data?.data || response.data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'event' | 'logo' | 'banner') => {
    const file = e.target.files?.[0]
    if (file) {
      if (type === 'event') {
        setEventImage(file)
        setEventImagePreview(URL.createObjectURL(file))
      } else if (type === 'logo') {
        setOrgLogo(file)
        setOrgLogoPreview(URL.createObjectURL(file))
      } else {
        setOrgBanner(file)
        setOrgBannerPreview(URL.createObjectURL(file))
      }
    }
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.external_registration_url) {
      showErrorToast('Event name and registration URL are required')
      return
    }

    setIsSubmitting(true)
    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => data.append(key, value))
      
      if (locationMeta.latitude !== null) data.append('latitude', String(locationMeta.latitude))
      if (locationMeta.longitude !== null) data.append('longitude', String(locationMeta.longitude))
      if (locationMeta.formattedAddress) data.append('formatted_address', locationMeta.formattedAddress)
      
      if (eventImage) data.append('event_image', eventImage)
      if (orgLogo) data.append('organizer_logo', orgLogo)
      if (orgBanner) data.append('organizer_banner', orgBanner)
      
      // Mark as external event
      data.append('event_type', 'external')

      await api.post('/events/external/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      showSuccessToast('External event published successfully!')
      navigate('/dashboard/events')
    } catch (err: any) {
      showErrorToast(err.response?.data?.message || 'Failed to publish event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextStep = () => setActiveStep(prev => Math.min(prev + 1, totalSteps))
  const prevStep = () => setActiveStep(prev => Math.max(prev - 1, 1))

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: 'Events', href: '/dashboard/events' },
            { label: 'External Event' }
          ]}
          className="mb-8"
        />

        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-blue-500/80">
                Premium Publishing
              </span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Publish External Event
            </h1>
            <p className="text-muted-foreground mt-1">Showcase experiences hosted outside Evella.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard/events')}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
        </div>

        {/* custom Progress Tracker */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            {['Basic Info', 'Media & Organizer', 'Link & Finalize'].map((label, idx) => (
              <div key={label} className="flex flex-col items-center flex-1">
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg",
                  activeStep > idx + 1 ? "bg-green-500 text-white" :
                  activeStep === idx + 1 ? "bg-blue-600 text-white scale-110 shadow-blue-500/20" :
                  "bg-muted text-muted-foreground"
                )}>
                  {activeStep > idx + 1 ? <CheckCircle2 className="w-6 h-6" /> : (idx + 1)}
                </div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-widest mt-3 transition-colors duration-300",
                  activeStep === idx + 1 ? "text-blue-500" : "text-muted-foreground/60"
                )}>{label}</span>
              </div>
            ))}
          </div>
          <Progress value={(activeStep / totalSteps) * 100} className="h-1 bg-muted/30" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-none shadow-2xl shadow-black/5 bg-card/40 backdrop-blur-xl rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 sm:p-12">
                {activeStep === 1 && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="name" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Event Name</Label>
                        <Input
                          id="name"
                          placeholder="e.g. World Marathon 2024"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-blue-500/50 text-lg transition-all"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="event_category_id" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Category</Label>
                        <Select
                          value={formData.event_category_id}
                          onValueChange={(val) => setFormData(prev => ({ ...prev, event_category_id: val }))}
                        >
                          <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-blue-500/50 text-lg">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={String(cat.id)} className="rounded-xl">
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Deep dive into the experience..."
                        rows={5}
                        value={formData.description}
                        onChange={handleInputChange}
                        className="rounded-3xl bg-muted/30 border-none focus:ring-2 focus:ring-blue-500/50 text-lg transition-all p-6"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="city" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">City</Label>
                        <Select
                          value={formData.city}
                          onValueChange={(val) => setFormData(prev => ({ ...prev, city: val }))}
                        >
                          <SelectTrigger className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-blue-500/50 text-lg">
                            <SelectValue placeholder="Addis Ababa" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            {ETHIOPIAN_CITIES.map((city) => (
                              <SelectItem key={city} value={city} className="rounded-xl">
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="venue_name" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Venue</Label>
                        <GoogleVenueAutocompleteInput
                          value={formData.venue_name}
                          onChange={(val) => setFormData(prev => ({ ...prev, venue_name: val }))}
                          onPlaceSelected={(selection) => {
                            setFormData(prev => ({ ...prev, venue_name: selection.venueName }))
                            if (selection.city && ETHIOPIAN_CITIES.includes(selection.city)) {
                              setFormData(prev => ({ ...prev, city: selection.city }))
                            }
                            setLocationMeta({
                              latitude: selection.latitude,
                              longitude: selection.longitude,
                              formattedAddress: selection.formattedAddress,
                            })
                          }}
                          placeholder="Millennium Hall"
                          className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-blue-500/50 text-lg"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Header Imagery
                      </Label>
                      <div
                        className="relative h-64 rounded-[2rem] bg-muted/30 border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/40 hover:border-blue-500/50 transition-all overflow-hidden"
                        onClick={() => document.getElementById('event_file')?.click()}
                      >
                        {eventImagePreview ? (
                          <img src={eventImagePreview} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <div className="text-center">
                            <Upload className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                            <p className="text-sm font-bold text-muted-foreground">Click to upload Event Banner</p>
                          </div>
                        )}
                        <input id="event_file" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'event')} />
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-muted/50">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-500" /> External Organizer
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <Label htmlFor="organizer_name" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Name</Label>
                          <Input
                            id="organizer_name"
                            placeholder="Org Name"
                            value={formData.organizer_name}
                            onChange={handleInputChange}
                            className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-blue-500/50"
                          />
                        </div>
                        <div className="flex gap-4">
                          <div
                            className="w-24 h-24 rounded-2xl bg-muted/30 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center cursor-pointer hover:border-blue-500/50 overflow-hidden shrink-0"
                            onClick={() => document.getElementById('logo_file')?.click()}
                          >
                            {orgLogoPreview ? (
                              <img src={orgLogoPreview} className="w-full h-full object-cover" alt="Logo" />
                            ) : (
                              <p className="text-[10px] font-black uppercase text-muted-foreground/50">Logo</p>
                            )}
                            <input id="logo_file" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'logo')} />
                          </div>
                          <div
                             className="flex-1 h-24 rounded-2xl bg-muted/30 border-2 border-dashed border-muted-foreground/20 flex items-center justify-center cursor-pointer hover:border-blue-500/50 overflow-hidden"
                             onClick={() => document.getElementById('banner_file')?.click()}
                          >
                            {orgBannerPreview ? (
                              <img src={orgBannerPreview} className="w-full h-full object-cover" alt="Banner" />
                            ) : (
                              <p className="text-[10px] font-black uppercase text-muted-foreground/50">Org Banner</p>
                            )}
                            <input id="banner_file" type="file" className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-8">
                    <div className="p-8 rounded-[2rem] bg-blue-500/5 border border-blue-500/20">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg">
                          <Globe className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold">External Registration</h4>
                          <p className="text-sm text-muted-foreground">Where will users secure their spots?</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="external_registration_url" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Registration Link (URL)</Label>
                        <div className="relative">
                          <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <Input
                            id="external_registration_url"
                            placeholder="https://example.com/register"
                            value={formData.external_registration_url}
                            onChange={handleInputChange}
                            className="h-16 pl-12 rounded-2xl bg-background border-none shadow-inner text-lg text-blue-500 font-bold"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mt-2 px-2">
                          <Info className="w-3 h-3 italic" />
                          Make sure the link starts with https://
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="start_date" className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Event Schedule</Label>
                        <Input
                          id="start_date"
                          type="datetime-local"
                          value={formData.start_date}
                          onChange={handleInputChange}
                          className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                      <div className="space-y-3">
                         <Label htmlFor="end_date" className="text-sm font-bold uppercase tracking-widest text-muted-foreground opacity-0 invisible">End Date</Label>
                         <Input
                          id="end_date"
                          type="datetime-local"
                          value={formData.end_date}
                          onChange={handleInputChange}
                          className="h-14 rounded-2xl bg-muted/30 border-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>

                    <div className="bg-muted/30 p-8 rounded-[2rem] border border-muted/50">
                      <h4 className="font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-xs text-muted-foreground">
                        <Sparkles className="w-3 h-3 text-blue-500" /> Summary Preview
                      </h4>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                           <Globe className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-black text-xl truncate max-w-sm">{formData.name || 'Untitled Event'}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                             {formData.organizer_name || 'Individual Organizer'} • <span className="text-blue-500 font-bold">External</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="p-8 sm:p-12 pt-0 bg-muted/10 border-t border-muted/30 flex items-center justify-between">
                <Button
                  variant="ghost"
                  onClick={prevStep}
                  disabled={activeStep === 1}
                  className="rounded-2xl h-14 px-8 text-lg font-bold disabled:opacity-30"
                >
                  <ArrowLeft className="w-5 h-5 mr-3" /> Previous
                </Button>

                {activeStep < totalSteps ? (
                  <Button
                    onClick={nextStep}
                    className="rounded-2xl h-14 px-10 text-lg font-black bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                  >
                    Continue <ChevronRight className="w-5 h-5 ml-3" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    className="rounded-2xl h-14 px-12 text-lg font-black bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 transition-all shadow-2xl shadow-blue-500/30"
                  >
                    Publish Experience <Sparkles className="w-5 h-5 ml-3" />
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
