import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumbs from '@/components/Breadcrumbs'
import {
  Calendar,
  MapPin,
  Users,
  Upload,
  X,
  Tag,
  FileText,
  Image,
  Ticket,
} from 'lucide-react'
import { CustomFieldsManager } from '@/components/event-creation/CustomFieldsManager'
import type { CustomField } from '@/types/customFields'
import { createCustomField } from '@/lib/customFieldsApi'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { showSuccessToast, showErrorToast } from '@/components/ui/ModernToast'
import api from '@/lib/api'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { useAuth } from '@/hooks/use-auth'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { UpgradePrompt } from '@/components/subscription/UpgradePrompt'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'

// Ethiopian major cities
const ETHIOPIAN_CITIES = [
  'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Adama',
  'Hawassa', 'Bahir Dar', 'Jimma', 'Dessie', 'Jijiga'
]

export default function CreateTicketedEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { canUseTicketing, canCreateEvent } = useFeatureAccess()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [upgradeMessage, setUpgradeMessage] = useState('')
  const [upgradeTitle, setUpgradeTitle] = useState('')
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    city: '',
    venue: '',
    max_guests: '',
    event_type_id: '',
    event_category_id: '',
    organizer_id: '',
    requirements: '',
    agenda: '',
    event_image: null as File | null,
  })

  const [eventRange, setEventRange] = useState([{
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  }])

  const [regRange, setRegRange] = useState([{
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  }])
  const [loading, setLoading] = useState({
    eventTypes: true,
    eventCategories: true,
    organizers: true,
  })
  const [eventTypes, setEventTypes] = useState([])
  const [eventCategories, setEventCategories] = useState([])
  const [organizers, setOrganizers] = useState([])
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async (endpoint: string, setData: Function, loaderKey: string) => {
      try {
        setLoading(prev => ({ ...prev, [loaderKey]: true }))
        const response = await api.get(endpoint)
        setData(response.data)
      } catch (err: any) {
        console.error(`Error fetching ${endpoint}:`, err)
      } finally {
        setLoading(prev => ({ ...prev, [loaderKey]: false }))
      }
    }

    fetchData('/event-types', setEventTypes, 'eventTypes')
    fetchData('/event-categories', setEventCategories, 'eventCategories')
    
    if (user?.role !== 'organizer') {
      fetchData('/organizers', setOrganizers, 'organizers')
    }
  }, [user?.role])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }



  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showErrorToast('Image size must be less than 2MB')
        return
      }
      setFormData(prev => ({ ...prev, event_image: file }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate location data
    if (!formData.city || !formData.venue) {
      showErrorToast('Please fill in both city and venue.')
      return
    }

    // Check subscription access for ticketing
    if (!canUseTicketing()) {
      setUpgradeTitle('Ticketing Not Available')
      setUpgradeMessage('Ticketing is available in Pro and Enterprise plans. Please upgrade to create ticketed events.')
      setShowUpgradePrompt(true)
      return
    }

    // Check event creation limit
    const eventAccess = canCreateEvent()
    if (!eventAccess.allowed) {
      setUpgradeTitle('Event Limit Reached')
      setUpgradeMessage(
        eventAccess.limit !== null
          ? `You have reached your monthly event limit of ${eventAccess.limit}. Please upgrade to create more events.`
          : 'You have reached your event creation limit. Please upgrade to create more events.'
      )
      setShowUpgradePrompt(true)
      return
    }

    setIsSubmitting(true)
    
    try {
      const processedFormData = {
        ...formData,
        start_date: eventRange[0].startDate.toISOString(),
        end_date: eventRange[0].endDate.toISOString(),
        registration_start_date: regRange[0].startDate.toISOString(),
        registration_end_date: regRange[0].endDate.toISOString(),
        location: formData.city && formData.venue ? `${formData.city}, ${formData.venue}` : formData.venue || formData.city || '',
        max_guests: parseInt(formData.max_guests, 10),
        ...(user?.role !== 'organizer' && { organizer_id: formData.organizer_id }),
        event_type: 'ticketed',
      }

      let payload: any
      let headers = {}

      if (formData.event_image) {
        payload = new FormData()
        Object.entries(processedFormData).forEach(([key, value]) => {
          if (key === 'event_image' && value) {
            payload.append('event_image', value)
          } else {
            payload.append(key, value as any)
          }
        })
        headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        // If no image is uploaded, add the default banner path
        payload = {
          ...processedFormData,
          event_image: '/banner.png'
        }
      }

      const response = await api.post('/events/ticketed/add', payload, { headers })
      const eventId = response.data?.id || response.data?.data?.id
      
      // Save custom fields if any
      if (eventId && customFields.length > 0) {
        try {
          for (const field of customFields) {
            await createCustomField(eventId, {
              ...field,
              event_id: eventId,
            })
          }
        } catch (error: any) {
          console.error('Error saving custom fields:', error)
          // Don't fail the entire creation if custom fields fail
          showErrorToast('Event created but some custom fields could not be saved.')
        }
      }
      
      showSuccessToast('Ticketed event created successfully!')
      navigate('/dashboard/events')
    } catch (error: any) {
      showErrorToast(error.response?.data?.message || 'Failed to create ticketed event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs 
          items={[
            { label: 'Events', href: '/dashboard/events' },
            { label: 'Create Ticketed Event' }
          ]}
          className="mb-4"
        />
        
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Create Ticketed Event</h1>
              <p className="text-muted-foreground mt-2">
                Set up a paid event with multiple ticket tiers and revenue tracking
              </p>
            </div>
            <Button
              onClick={() => navigate('/dashboard/events')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Event Information */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-card-foreground">Ticketed Event</h3>
                <p className="text-muted-foreground text-sm">Paid tickets with multiple tiers</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 text-foreground font-medium">
                  <Tag className="w-4 h-4 text-blue-500" /> Event Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter event name"
                  required
                  className="mt-2 h-12 border-border focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              
              <div>
                <Label htmlFor="organizer_id" className="flex items-center gap-2 text-foreground font-medium">
                  <Tag className="w-4 h-4 text-green-500" /> Organizer
                </Label>
                {user?.role === 'organizer' ? (
                  <Input
                    value={user.organizer?.name || ''}
                    disabled
                    className="mt-2 h-12 border-border bg-muted rounded-xl"
                  />
                ) : (
                  <Select
                    value={formData.organizer_id}
                    onValueChange={(value) => handleInputChange('organizer_id', value)}
                    disabled={loading.organizers}
                    required
                  >
                    <SelectTrigger className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl">
                      <SelectValue placeholder="Select an organizer" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizers.map((org: any) => (
                        <SelectItem key={org.id} value={String(org.id)}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div className="lg:col-span-2">
                <Label htmlFor="description" className="flex items-center gap-2 text-foreground font-medium">
                  <FileText className="w-4 h-4 text-purple-500" /> Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your ticketed event..."
                  rows={4}
                  className="mt-2 border-border focus:border-purple-500 focus:ring-purple-500 rounded-xl resize-none"
                />
              </div>
              
              <div>
                <Label htmlFor="event_type_id" className="flex items-center gap-2 text-foreground font-medium">
                  <Tag className="w-4 h-4 text-orange-500" /> Event Type
                </Label>
                <Select
                  value={formData.event_type_id}
                  onValueChange={(value) => handleInputChange('event_type_id', value)}
                  disabled={loading.eventTypes}
                  required
                >
                  <SelectTrigger className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type: any) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="event_category_id" className="flex items-center gap-2 text-foreground font-medium">
                  <Tag className="w-4 h-4 text-indigo-500" /> Event Category
                </Label>
                <Select
                  value={formData.event_category_id}
                  onValueChange={(value) => handleInputChange('event_category_id', value)}
                  disabled={loading.eventCategories}
                  required
                >
                  <SelectTrigger className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl">
                    <SelectValue placeholder="Select event category" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventCategories.map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="city" className="flex items-center gap-2 text-foreground font-medium">
                  <MapPin className="w-4 h-4 text-blue-500" /> City
                </Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => handleInputChange('city', value)}
                  required
                >
                  <SelectTrigger className="mt-2 h-12 border-border focus:border-primary focus:ring-primary/20 rounded-xl">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {ETHIOPIAN_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="venue" className="flex items-center gap-2 text-foreground font-medium">
                  <MapPin className="w-4 h-4 text-green-500" /> Venue
                </Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  placeholder="Enter venue name"
                  required
                  className="mt-2 h-12 border-border focus:border-green-500 focus:ring-green-500 rounded-xl"
                />
              </div>
              
              <div>
                <Label htmlFor="max_guests" className="flex items-center gap-2 text-foreground font-medium">
                  <Users className="w-4 h-4 text-teal-500" /> Max Guests
                </Label>
                <Input
                  id="max_guests"
                  type="number"
                  value={formData.max_guests}
                  onChange={(e) => handleInputChange('max_guests', e.target.value)}
                  placeholder="e.g. 500"
                  className="mt-2 h-12 border-gray-300 focus:border-teal-500 focus:ring-teal-500 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Event Image Upload */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Image className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-card-foreground">Event Image</h3>
                <p className="text-muted-foreground text-sm">Upload an image for your event (optional)</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="event_image" className="flex items-center gap-2 text-foreground font-medium">
                    <Upload className="w-4 h-4 text-purple-500" /> Event Image
                  </Label>
                  <div className="mt-2">
                    <input
                      ref={imageInputRef}
                      type="file"
                      id="event_image"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                        className="flex items-center gap-2 border-2 border-dashed border-border hover:border-purple-500 hover:bg-purple-500/10 dark:hover:bg-purple-900/20 transition-all duration-200"
                      >
                        <Upload className="w-4 h-4" />
                        Choose Image
                      </Button>
                      {formData.event_image && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, event_image: null }))
                            if (imageInputRef.current) {
                              imageInputRef.current.value = ''
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Maximum file size: 2MB. Supported formats: JPG, PNG, GIF
                    </p>
                  </div>
                </div>
                
                {/* Image Preview */}
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center">
                  {formData.event_image ? (
                    <img
                      src={URL.createObjectURL(formData.event_image)}
                      alt="Event preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Image className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-xs">No image</p>
                    </div>
                  )}
                </div>
              </div>
              
              {!formData.event_image && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Image className="w-3 h-3 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Default Image</p>
                      <p className="text-sm text-blue-700 mt-1">
                        If no image is uploaded, the default banner image will be used for your event.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-brand-gradient rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">Date & Time</h3>
                <p className="text-muted-foreground text-sm">Event schedule and registration period</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label className="flex items-center gap-2 text-foreground font-medium mb-4">
                  <Calendar className="w-4 h-4 text-warning" /> Event Date Range
                </Label>
                <DateRange
                  ranges={eventRange}
                  onChange={(item) => setEventRange([item.selection])}
                  minDate={new Date()}
                  className="rounded-xl border border-border"
                />
              </div>
              
              <div>
                <Label className="flex items-center gap-2 text-foreground font-medium mb-4">
                  <Calendar className="w-4 h-4 text-success" /> Registration Period
                </Label>
                <DateRange
                  ranges={regRange}
                  onChange={(item) => setRegRange([item.selection])}
                  minDate={new Date()}
                  className="rounded-xl border border-border"
                />
              </div>
            </div>
          </div>

          {/* Info Message */}
          <div className="bg-info/10 border border-info/30 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="text-info text-2xl dark:text-info">ℹ️</div>
              <div>
                <h3 className="text-lg font-semibold text-info dark:text-info mb-2">
                  Ticket Types Configuration
                </h3>
                <p className="text-info/90 dark:text-info/80">
                  After creating your event, you can add ticket types through the <strong>Ticket Management</strong> dashboard. 
                  This allows you to configure pricing, quantities, and benefits for each ticket tier.
                </p>
                <p className="text-info/80 dark:text-info/70 text-sm mt-2">
                  Navigate to: Dashboard → Ticket Management → Select Your Event → Create Ticket Type
                </p>
              </div>
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <CustomFieldsManager
              fields={customFields}
              onChange={setCustomFields}
              guestTypes={[]} // Ticketed events don't use guest types, but custom fields can still be added
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/events')}
              className="px-6 py-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Creating...
                </span>
              ) : (
                'Create Ticketed Event'
              )}
            </Button>
          </div>
        </form>

        <UpgradePrompt
          open={showUpgradePrompt}
          onOpenChange={setShowUpgradePrompt}
          title={upgradeTitle}
          message={upgradeMessage}
        />
      </div>
    </div>
  )
} 