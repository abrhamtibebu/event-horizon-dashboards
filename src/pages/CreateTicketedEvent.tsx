import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Plus,
  Trash2,
  DollarSign,
  Package,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import api from '@/lib/api'
import { DateRange } from 'react-date-range'
import 'react-date-range/dist/styles.css'
import 'react-date-range/dist/theme/default.css'
import { useAuth } from '@/hooks/use-auth'
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

interface TicketType {
  name: string
  description: string
  price: number
  quantity: number | null
  sales_end_date: string | null
  benefits: string[]
}

export default function CreateTicketedEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const imageInputRef = useRef<HTMLInputElement>(null)
  
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

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState({
    eventTypes: true,
    eventCategories: true,
    organizers: true,
  })
  const [eventTypes, setEventTypes] = useState([])
  const [eventCategories, setEventCategories] = useState([])
  const [organizers, setOrganizers] = useState([])
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
        toast.error('Image size must be less than 2MB')
        return
      }
      setFormData(prev => ({ ...prev, event_image: file }))
    }
  }

  const addTicketType = () => {
    const newTicketType: TicketType = {
      name: '',
      description: '',
      price: 0,
      quantity: null,
      sales_end_date: null,
      benefits: [],
    }
    setTicketTypes(prev => [...prev, newTicketType])
  }

  const updateTicketType = (index: number, field: string, value: any) => {
    setTicketTypes(prev => prev.map((type, i) => 
      i === index ? { ...type, [field]: value } : type
    ))
  }

  const removeTicketType = (index: number) => {
    setTicketTypes(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (ticketTypes.length === 0) {
      toast.error('Please add at least one ticket type.')
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
        location: `${formData.city}, ${formData.venue}`,
        max_guests: parseInt(formData.max_guests, 10),
        ...(user?.role !== 'organizer' && { organizer_id: formData.organizer_id }),
        event_type: 'ticketed',
        ticket_types: ticketTypes,
      }

      let payload = processedFormData
      let headers = {}

      if (formData.event_image) {
        payload = new FormData()
        Object.entries(processedFormData).forEach(([key, value]) => {
          if (key === 'event_image' && value) {
            payload.append('event_image', value)
          } else if (key === 'ticket_types') {
            if (Array.isArray(value)) {
              value.forEach((ticketType: TicketType) =>
                payload.append('ticket_types[]', JSON.stringify(ticketType))
              )
            }
          } else {
            payload.append(key, value as any)
          }
        })
        headers = { 'Content-Type': 'multipart/form-data' }
      }

      await api.post('/events/ticketed', payload, { headers })
      toast.success('Ticketed event created successfully!')
      navigate('/dashboard/events')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create ticketed event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Ticketed Event</h1>
              <p className="text-gray-600 mt-2">
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Ticketed Event</h3>
                <p className="text-gray-500 text-sm">Paid tickets with multiple tiers</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="w-4 h-4 text-blue-500" /> Event Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter event name"
                  required
                  className="mt-2 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                />
              </div>
              
              <div>
                <Label htmlFor="organizer_id" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="w-4 h-4 text-green-500" /> Organizer
                </Label>
                {user?.role === 'organizer' ? (
                  <Input
                    value={user.organizer?.name || ''}
                    disabled
                    className="mt-2 h-12 border-gray-300 bg-gray-50 rounded-xl"
                  />
                ) : (
                  <Select
                    value={formData.organizer_id}
                    onValueChange={(value) => handleInputChange('organizer_id', value)}
                    disabled={loading.organizers}
                    required
                  >
                    <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl">
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
                <Label htmlFor="description" className="flex items-center gap-2 text-gray-700 font-medium">
                  <FileText className="w-4 h-4 text-purple-500" /> Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your ticketed event..."
                  rows={4}
                  className="mt-2 border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-xl resize-none"
                />
              </div>
              
              <div>
                <Label htmlFor="event_type_id" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="w-4 h-4 text-orange-500" /> Event Type
                </Label>
                <Select
                  value={formData.event_type_id}
                  onValueChange={(value) => handleInputChange('event_type_id', value)}
                  disabled={loading.eventTypes}
                  required
                >
                  <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-orange-500 focus:ring-orange-500 rounded-xl">
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
                <Label htmlFor="event_category_id" className="flex items-center gap-2 text-gray-700 font-medium">
                  <Tag className="w-4 h-4 text-indigo-500" /> Event Category
                </Label>
                <Select
                  value={formData.event_category_id}
                  onValueChange={(value) => handleInputChange('event_category_id', value)}
                  disabled={loading.eventCategories}
                  required
                >
                  <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl">
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
                <Label className="flex items-center gap-2 text-gray-700 font-medium">
                  <MapPin className="w-4 h-4 text-green-500" /> City
                </Label>
                <Select
                  value={formData.city}
                  onValueChange={(value) => handleInputChange('city', value)}
                >
                  <SelectTrigger className="mt-2 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {ETHIOPIAN_CITIES.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="venue" className="flex items-center gap-2 text-gray-700 font-medium">
                  <MapPin className="w-4 h-4 text-green-500" /> Venue
                </Label>
                <Input
                  id="venue"
                  value={formData.venue}
                  onChange={(e) => handleInputChange('venue', e.target.value)}
                  placeholder="e.g. Grand Convention Center"
                  className="mt-2 h-12 border-gray-300 focus:border-green-500 focus:ring-green-500 rounded-xl"
                />
              </div>
              
              <div>
                <Label htmlFor="max_guests" className="flex items-center gap-2 text-gray-700 font-medium">
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

          {/* Date & Time */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Date & Time</h3>
                <p className="text-gray-500 text-sm">Event schedule and registration period</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <Label className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <Calendar className="w-4 h-4 text-orange-500" /> Event Date Range
                </Label>
                <DateRange
                  ranges={eventRange}
                  onChange={(item) => setEventRange([item.selection])}
                  minDate={new Date()}
                  className="rounded-xl border border-gray-300"
                />
              </div>
              
              <div>
                <Label className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <Calendar className="w-4 h-4 text-green-500" /> Registration Period
                </Label>
                <DateRange
                  ranges={regRange}
                  onChange={(item) => setRegRange([item.selection])}
                  minDate={new Date()}
                  className="rounded-xl border border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Ticket Types */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Ticket Types</h3>
                  <p className="text-gray-500 text-sm">Configure different ticket tiers and pricing</p>
                </div>
              </div>
              <Button
                type="button"
                onClick={addTicketType}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Ticket Type
              </Button>
            </div>
            
            {ticketTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Ticket className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No ticket types added yet</p>
                <p className="text-sm">Click "Add Ticket Type" to get started</p>
              </div>
            ) : (
              <div className="space-y-6">
                {ticketTypes.map((ticketType, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Ticket Type {index + 1}
                      </h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTicketType(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Name</Label>
                        <Input
                          value={ticketType.name}
                          onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                          placeholder="e.g. VIP, Standard, Early Bird"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Price (ETB)</Label>
                        <Input
                          type="number"
                          value={ticketType.price}
                          onChange={(e) => updateTicketType(index, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Quantity</Label>
                        <Input
                          type="number"
                          value={ticketType.quantity || ''}
                          onChange={(e) => updateTicketType(index, 'quantity', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Unlimited"
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Sales End Date</Label>
                        <Input
                          type="date"
                          value={ticketType.sales_end_date || ''}
                          onChange={(e) => updateTicketType(index, 'sales_end_date', e.target.value || null)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Description</Label>
                        <Textarea
                          value={ticketType.description}
                          onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                          placeholder="Describe what's included with this ticket..."
                          rows={3}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              disabled={isSubmitting || ticketTypes.length === 0}
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
      </div>
    </div>
  )
} 