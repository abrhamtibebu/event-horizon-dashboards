import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Breadcrumbs from '@/components/Breadcrumbs'
import {
  Calendar,
  MapPin,
  Users,
  X,
  Tag,
  FileText,
  Gift,
  Plus,
  Trash2,
  UserCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Info,
  Eye,
  Lock,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { showSuccessToast, showErrorToast } from '@/components/ui/ModernToast'
import api from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'

// Ethiopian major cities
const ETHIOPIAN_CITIES = [
  'Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Adama',
  'Hawassa', 'Bahir Dar', 'Jimma', 'Dessie', 'Jijiga'
]

// Predefined guest types with descriptions and default prices
const PREDEFINED_GUEST_TYPES = [
  { name: 'VIP', description: 'Very Important Person with premium access', price: 0 },
  { name: 'Speaker', description: 'Event speakers and presenters', price: 0 },
  { name: 'Staff', description: 'Event staff and organizers', price: 0 },
  { name: 'Exhibitor', description: 'Trade show exhibitors and vendors', price: 0 },
  { name: 'Media', description: 'Press and media representatives', price: 0 },
  { name: 'Regular', description: 'Standard event attendees', price: 0 },
  { name: 'Visitor', description: 'General visitors and guests', price: 0 },
  { name: 'Sponsor', description: 'Event sponsors and partners', price: 0 },
  { name: 'Organizer', description: 'Event organizers and coordinators', price: 0 },
  { name: 'Volunteer', description: 'Event volunteers and helpers', price: 0 },
  { name: 'Partner', description: 'Business partners and collaborators', price: 0 },
  { name: 'Vendor', description: 'Service providers and vendors', price: 0 },
  { name: 'Press', description: 'Journalists and press members', price: 0 },
  { name: 'Student', description: 'Student attendees with special access', price: 0 },
  { name: 'Other', description: 'Other guest categories', price: 0 }
]

interface GuestType {
  name: string
  description: string
  price: number
}

export default function CreateFreeEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()

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
    event_type: 'free',
    visibility: 'public' as 'public' | 'private',
  })

  const [eventRange, setEventRange] = useState<any[]>([{
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  }])
  const [eventStartTime, setEventStartTime] = useState('09:00')
  const [eventEndTime, setEventEndTime] = useState('17:00')

  const [regRange, setRegRange] = useState<any[]>([{
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  }])
  const [regStartTime, setRegStartTime] = useState('09:00')
  const [regEndTime, setRegEndTime] = useState('17:00')

  // Single day event state
  const [isSingleDayEvent, setIsSingleDayEvent] = useState(false)
  const [selectedEventDate, setSelectedEventDate] = useState<Date | null>(null)

  const [selectedGuestTypes, setSelectedGuestTypes] = useState<string[]>([])
  const [customGuestTypes, setCustomGuestTypes] = useState<GuestType[]>([])
  const [loading, setLoading] = useState({
    eventTypes: true,
    eventCategories: true,
    organizers: true,
  })
  const [eventTypes, setEventTypes] = useState([])
  const [eventCategories, setEventCategories] = useState([])
  const [organizers, setOrganizers] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeStep, setActiveStep] = useState(1)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    const fetchData = async (endpoint: string, setData: Function, loaderKey: string) => {
      try {
        setLoading(prev => ({ ...prev, [loaderKey]: true }))
        const response = await api.get(endpoint)
        const data = Array.isArray(response.data) ? response.data : (response.data?.data || [])
        setData(data)
      } catch (err: any) {
        console.error(`Error fetching ${endpoint}:`, err)
        setData([])
      } finally {
        setLoading(prev => ({ ...prev, [loaderKey]: false }))
      }
    }

    fetchData('/event-types', setEventTypes, 'eventTypes')
    fetchData('/event-categories', setEventCategories, 'eventCategories')

    // Pre-select organizer for organizers and organizer_admins
    if (user && (user.role === 'organizer' || user.role === 'organizer_admin') && user.organizer_id) {
      setFormData(prev => ({ ...prev, organizer_id: String(user.organizer_id) }))
    }

    if (user?.role !== 'organizer' && user?.role !== 'organizer_admin') {
      fetchData('/organizers', setOrganizers, 'organizers')
    } else {
      setLoading(prev => ({ ...prev, organizers: false }))
    }
  }, [user?.role, user?.organizer_id])


  const toggleGuestType = (guestTypeName: string) => {
    setSelectedGuestTypes(prev =>
      prev.includes(guestTypeName)
        ? prev.filter(name => name !== guestTypeName)
        : [...prev, guestTypeName]
    )
  }

  const addCustomGuestType = () => {
    const newGuestType: GuestType = {
      name: '',
      description: '',
      price: 0,
    }
    setCustomGuestTypes(prev => [...prev, newGuestType])
  }

  const updateCustomGuestType = (index: number, field: string, value: any) => {
    setCustomGuestTypes(prev => prev.map((type, i) =>
      i === index ? { ...type, [field]: value } : type
    ))
  }

  const removeCustomGuestType = (index: number) => {
    setCustomGuestTypes(prev => prev.filter((_, i) => i !== index))
  }

  // Calculate form completion progress
  const calculateProgress = () => {
    let completed = 0
    const total = 7

    if (formData.name) completed++
    if (formData.event_type_id) completed++
    if (formData.event_category_id) completed++
    if (formData.city && formData.venue) completed++
    if (formData.max_guests) completed++
    if (selectedGuestTypes.length > 0 || customGuestTypes.filter(gt => gt.name.trim()).length > 0) completed++
    if (eventRange[0].startDate && regRange[0].startDate) completed++

    return Math.round((completed / total) * 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validCustomGuestTypes = customGuestTypes.filter(gt => gt.name.trim())
    const allGuestTypes = [
      ...selectedGuestTypes.map(name => {
        const predefined = PREDEFINED_GUEST_TYPES.find(gt => gt.name === name)
        return {
          name: predefined?.name || name,
          description: predefined?.description || '',
          price: predefined?.price || 0
        }
      }),
      ...validCustomGuestTypes
    ]

    if (allGuestTypes.length === 0) {
      showErrorToast('Please select at least one guest type.')
      return
    }

    if (!formData.name || !formData.event_type_id || !formData.event_category_id || !formData.max_guests) {
      showErrorToast('Please fill in all required fields.')
      return
    }

    if (!formData.city || !formData.venue) {
      showErrorToast('Please fill in both city and venue.')
      return
    }

    if (!eventTypes.some(et => String(et.id) === formData.event_type_id)) {
      showErrorToast('Please select a valid event type.')
      return
    }

    if (!eventCategories.some(ec => String(ec.id) === formData.event_category_id)) {
      showErrorToast('Please select a valid event category.')
      return
    }

    const maxGuests = parseInt(formData.max_guests, 10)
    if (isNaN(maxGuests) || maxGuests <= 0) {
      showErrorToast('Please enter a valid number of maximum guests.')
      return
    }

    if (user?.role !== 'organizer' && user?.role !== 'organizer_admin' && !formData.organizer_id) {
      showErrorToast('Please select an organizer.')
      return
    }

    // For single day events, end date is automatically set, so only check for multi-day events
    if (!isSingleDayEvent && !eventRange[0].endDate) {
      showErrorToast('Please select an event end date.')
      return
    }

    if (!regRange[0].endDate) {
      showErrorToast('Please select a registration end date.')
      return
    }

    // For multi-day events, end date must be after start date
    // For single day events, start and end dates can be the same
    if (!isSingleDayEvent && eventRange[0].startDate >= eventRange[0].endDate) {
      showErrorToast('Event end date must be after start date.')
      return
    }

    if (regRange[0].startDate >= regRange[0].endDate) {
      showErrorToast('Registration end date must be after start date.')
      return
    }

    if (regRange[0].endDate > eventRange[0].endDate) {
      showErrorToast('Registration must end before or on the event end date.')
      return
    }

    setIsSubmitting(true)

    try {
      // Combine Date and Time
      const formatDateTime = (date: Date, time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        const newDate = new Date(date)
        newDate.setHours(hours, minutes, 0, 0)
        return newDate.toISOString()
      }

      const processedFormData = {
        ...formData,
        start_date: formatDateTime(eventRange[0].startDate, eventStartTime),
        end_date: eventRange[0].endDate
          ? formatDateTime(eventRange[0].endDate, eventEndTime)
          : formatDateTime(eventRange[0].startDate, eventEndTime),
        registration_start_date: formatDateTime(regRange[0].startDate, regStartTime),
        registration_end_date: regRange[0].endDate
          ? formatDateTime(regRange[0].endDate, regEndTime)
          : formatDateTime(regRange[0].startDate, regEndTime),
        location: formData.city && formData.venue ? `${formData.city}, ${formData.venue}` : formData.venue || formData.city || '',
        max_guests: maxGuests,
        // Only include organizer_id if not an organizer or organizer_admin (backend sets it for them)
        ...(user?.role !== 'organizer' && user?.role !== 'organizer_admin' && { organizer_id: formData.organizer_id }),
        guest_types: allGuestTypes,
      }

      // Handle FormData for guest_types array
      let payload: any
      let headers = {}

      if (allGuestTypes.length > 0) {
        payload = new FormData()
        Object.entries(processedFormData).forEach(([key, value]) => {
          if (key === 'guest_types') {
            if (Array.isArray(value)) {
              payload.append('guest_types', JSON.stringify(value))
            }
          } else if (value !== null && value !== undefined && value !== '') {
            if (key === 'organizer_id' && (user?.role === 'organizer' || user?.role === 'organizer_admin')) {
              // Skip organizer_id for organizers
            } else {
              payload.append(key, value as any)
            }
          }
        })
        headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        payload = Object.fromEntries(
          Object.entries(processedFormData).filter(([key, value]) => {
            if (key === 'organizer_id' && (user?.role === 'organizer' || user?.role === 'organizer_admin')) {
              return false
            }
            return value !== null && value !== undefined && value !== ''
          })
        )
      }

      const response = await api.post('/events/free/add', payload, { headers })

      showSuccessToast('Free event created successfully!')
      navigate('/dashboard/events')
    } catch (error: any) {
      console.error('Error creating event:', error)
      showErrorToast(error.response?.data?.message || error.response?.data?.error || 'Failed to create free event.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = calculateProgress()
  const totalSelectedGuestTypes = selectedGuestTypes.length + customGuestTypes.filter(gt => gt.name.trim()).length

  // Modern elegant date picker styles
  const modernDatePickerStyles = `
    /* Modern Date Picker Styles */
    :root {
      --dropdown-arrow: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='hsl(215.4%2016.3%2046.9%)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    }

    .dark {
      --dropdown-arrow: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='hsl(217.2%2032.6%2017.5%)' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e");
    }

    .modern-date-picker {
      font-family: system-ui, -apple-system, sans-serif;
    }

    .date-picker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem;
      background: linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.05));
      border-bottom: 1px solid hsl(var(--border));
    }

    .date-picker-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: hsl(var(--foreground));
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-picker-nav {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .nav-btn {
      width: 2.5rem;
      height: 2.5rem;
      border: none;
      border-radius: 0.75rem;
      background: hsl(var(--muted));
      color: hsl(var(--foreground));
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px hsl(var(--foreground) / 0.1);
    }

    .nav-btn:hover {
      background: hsl(var(--accent));
      transform: translateY(-1px);
      box-shadow: 0 4px 12px hsl(var(--foreground) / 0.15);
    }

    .nav-btn:active {
      transform: translateY(0);
    }

    .month-year-selector {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: hsl(var(--card));
      border-bottom: 1px solid hsl(var(--border));
    }

    .month-selector,
    .year-selector {
      padding: 0.625rem 0.875rem;
      border: 1.5px solid hsl(var(--border));
      border-radius: 0.625rem;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 2px 0 hsl(var(--muted-foreground) / 0.05);
      min-width: 120px;
      appearance: none;
      background-image: var(--dropdown-arrow);
      background-position: right 0.5rem center;
      background-repeat: no-repeat;
      background-size: 1.5em 1.5em;
      padding-right: 2.5rem;
    }

    .month-selector:focus,
    .year-selector:focus {
      outline: none;
      border-color: hsl(var(--primary));
      box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1);
      background-color: hsl(var(--background));
    }

    .month-selector:hover,
    .year-selector:hover {
      border-color: hsl(var(--primary));
      background-color: hsl(var(--accent));
      box-shadow: 0 2px 4px 0 hsl(var(--muted-foreground) / 0.1);
    }

    .month-selector option,
    .year-selector option {
      background-color: hsl(var(--popover));
      color: hsl(var(--popover-foreground));
      padding: 0.5rem;
    }

    .weekdays-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      padding: 1rem 1.5rem 0.5rem;
      gap: 0.25rem;
    }

    .weekday {
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: hsl(var(--muted-foreground));
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .days-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      padding: 0.5rem 1.5rem 1.5rem;
      gap: 0.25rem;
    }

    .day-cell {
      position: relative;
      width: 2.75rem;
      height: 2.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.875rem;
      font-weight: 500;
      color: hsl(var(--foreground));
      user-select: none;
    }

    .day-cell:hover {
      background: hsl(var(--accent));
      transform: scale(1.05);
    }

    .day-cell.today {
      background: hsl(var(--primary) / 0.1);
      color: hsl(var(--primary));
      font-weight: 600;
    }

    .day-cell.today::after {
      content: '';
      position: absolute;
      bottom: 0.25rem;
      left: 50%;
      transform: translateX(-50%);
      width: 0.25rem;
      height: 0.25rem;
      border-radius: 50%;
      background: hsl(var(--primary));
    }

    .day-cell.selected {
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      font-weight: 600;
      box-shadow: 0 2px 8px hsl(var(--primary) / 0.3);
    }

    .day-cell.in-range {
      background: hsl(var(--primary) / 0.1);
      color: hsl(var(--primary));
    }

    .day-cell.range-start,
    .day-cell.range-end {
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
      position: relative;
    }

    .day-cell.range-start::before,
    .day-cell.range-end::before {
      content: '';
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 0.25rem;
      height: 0.25rem;
      border-radius: 50%;
      background: hsl(var(--primary-foreground));
    }

    .day-cell.range-start::before {
      left: 0.5rem;
    }

    .day-cell.range-end::before {
      right: 0.5rem;
    }

    .day-cell.disabled {
      color: hsl(var(--muted-foreground));
      opacity: 0.4;
      cursor: not-allowed;
    }

    .day-cell.disabled:hover {
      background: transparent;
      transform: none;
    }

    .day-cell.other-month {
      color: hsl(var(--muted-foreground));
      opacity: 0.6;
    }

    /* Quick actions */
    .date-picker-actions {
      padding: 1rem 1.5rem;
      border-top: 1px solid hsl(var(--border));
      background: hsl(var(--muted) / 0.3);
      display: flex;
      gap: 0.5rem;
      justify-content: center;
    }

    .action-btn {
      padding: 0.5rem 1rem;
      border: 1px solid hsl(var(--border));
      border-radius: 0.5rem;
      background: hsl(var(--background));
      color: hsl(var(--foreground));
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      border-color: hsl(var(--primary));
      background: hsl(var(--primary) / 0.05);
      color: hsl(var(--primary));
    }

    .action-btn.today {
      border-color: hsl(var(--primary));
      background: hsl(var(--primary));
      color: hsl(var(--primary-foreground));
    }

    /* Responsive design */
    @media (max-width: 640px) {
      .date-picker-header,
      .month-year-selector,
      .weekdays-grid,
      .days-grid,
      .date-picker-actions {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .day-cell {
        width: 2.5rem;
        height: 2.5rem;
        font-size: 0.8125rem;
      }
    }

    /* Animation for range selection */
    .range-transition {
      animation: rangeSelect 0.3s ease-out;
    }

    @keyframes rangeSelect {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
      }
    }
  `

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <style>{modernDatePickerStyles}</style>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header Section */}
        <div className="mb-8">
          <Breadcrumbs
            items={[
              { label: 'Events', href: '/dashboard/events' },
              { label: 'Create Free Event' }
            ]}
            className="mb-6"
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Create Free Event
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base mt-1">
                    Set up your event and start welcoming guests
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate('/dashboard/events')}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>

          {/* Progress Indicator */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Form Completion</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                Complete all required fields to create your event
              </p>
            </CardContent>
          </Card>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-md">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Basic Information</CardTitle>
                  <CardDescription>Tell us about your event</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">
                    Event Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Annual Tech Conference 2024"
                    required
                    className="h-11 border-border focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizer_id" className="text-sm font-semibold">
                    Organizer <span className="text-destructive">*</span>
                  </Label>
                  {(user?.role === 'organizer' || user?.role === 'organizer_admin') ? (
                    <Input
                      value={user.organizer?.name || 'Loading organizer...'}
                      disabled
                      className="h-11 bg-muted/50 cursor-not-allowed"
                      placeholder="Your organization"
                    />
                  ) : (
                    <Select
                      value={formData.organizer_id}
                      onValueChange={(value) => handleInputChange('organizer_id', value)}
                      disabled={loading.organizers}
                      required
                    >
                      <SelectTrigger className="h-11 border-border focus:border-blue-500 focus:ring-blue-500/20">
                        <SelectValue placeholder="Select organizer" />
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your event, what attendees can expect, and any important details..."
                  rows={4}
                  className="border-border focus:border-blue-500 focus:ring-blue-500/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="event_type_id" className="text-sm font-semibold">
                    Event Type <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.event_type_id}
                    onValueChange={(value) => handleInputChange('event_type_id', value)}
                    disabled={loading.eventTypes}
                    required
                  >
                    <SelectTrigger className="h-11 border-border focus:border-blue-500 focus:ring-blue-500/20">
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

                <div className="space-y-2">
                  <Label htmlFor="event_category_id" className="text-sm font-semibold">
                    Event Category <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.event_category_id}
                    onValueChange={(value) => handleInputChange('event_category_id', value)}
                    disabled={loading.eventCategories}
                    required
                  >
                    <SelectTrigger className="h-11 border-border focus:border-blue-500 focus:ring-blue-500/20">
                      <SelectValue placeholder="Select category" />
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
              </div>
            </CardContent>
          </Card>

          {/* Event Visibility */}
          <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">Event Visibility</CardTitle>
                  <CardDescription>Control who can discover and register for your event</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Public Event Option */}
                <label className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === 'public'}
                    onChange={(e) => handleInputChange('visibility', e.target.value)}
                    className="peer sr-only"
                  />
                  <div className="relative p-5 border-2 border-border rounded-2xl transition-all duration-300 group-hover:border-primary/50 peer-checked:border-primary peer-checked:bg-primary/5 dark:peer-checked:bg-primary/10">
                    {/* Selected indicator */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity duration-300 shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>

                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-foreground mb-1">Public Event</h4>
                        <p className="text-muted-foreground text-sm">Discoverable by everyone</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Visible on Evella platform</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Open registration</span>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Private Event Option */}
                <label className="relative cursor-pointer group">
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === 'private'}
                    onChange={(e) => handleInputChange('visibility', e.target.value)}
                    className="peer sr-only"
                  />
                  <div className="relative p-5 border-2 border-border rounded-2xl transition-all duration-300 group-hover:border-muted-foreground/50 peer-checked:border-muted-foreground peer-checked:bg-muted/5 dark:peer-checked:bg-muted/10">
                    {/* Selected indicator */}
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-muted-foreground rounded-full flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity duration-300 shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>

                    <div className="flex items-start gap-4 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                        <Lock className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-foreground mb-1">Private Event</h4>
                        <p className="text-muted-foreground text-sm">Invite-only access</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Hidden from public</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                        <span className="text-muted-foreground">Internal access only</span>
                      </div>
                    </div>
                  </div>
                </label>
              </div>

              {/* Additional Info */}
              <div className="mt-6 p-4 bg-muted/30 rounded-xl border border-border">
                <div className="flex items-start gap-3">
                  <div className="text-info mt-0.5">ℹ️</div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-1">Visibility Settings</p>
                    <p className="text-sm text-muted-foreground">
                      Public events appear in search results and can be discovered by users.
                      Private events require direct invitations and are not listed publicly.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location & Capacity Card */}
          <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Location & Capacity</CardTitle>
                  <CardDescription>Where and how many guests</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-semibold">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.city}
                    onValueChange={(value) => handleInputChange('city', value)}
                    required
                  >
                    <SelectTrigger className="h-11 border-border focus:border-purple-500 focus:ring-purple-500/20">
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

                <div className="space-y-2">
                  <Label htmlFor="venue" className="text-sm font-semibold">
                    Venue <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="venue"
                    value={formData.venue}
                    onChange={(e) => handleInputChange('venue', e.target.value)}
                    placeholder="e.g., Millennium Hall"
                    required
                    className="h-11 border-border focus:border-purple-500 focus:ring-purple-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_guests" className="text-sm font-semibold">
                  Maximum Guests <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="max_guests"
                  type="number"
                  value={formData.max_guests}
                  onChange={(e) => handleInputChange('max_guests', e.target.value)}
                  placeholder="e.g., 500"
                  className="h-11 border-border focus:border-purple-500 focus:ring-purple-500/20"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Set the maximum number of attendees for your event
                </p>
              </div>
            </CardContent>
          </Card>


          {/* Date & Time Card */}
          <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-md">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Date & Time</CardTitle>
                  <CardDescription>Event schedule and registration period</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    Event Date Range
                  </Label>

                  {/* Single Day Toggle */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="single-day-event-free"
                      checked={isSingleDayEvent}
                      onChange={(e) => {
                        setIsSingleDayEvent(e.target.checked)
                        if (e.target.checked && selectedEventDate) {
                          // For single day events, set both start and end to same date
                          setEventRange([{
                            ...eventRange[0],
                            startDate: selectedEventDate,
                            endDate: selectedEventDate
                          }])
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <label htmlFor="single-day-event-free" className="text-sm text-muted-foreground">
                      Single day event
                    </label>
                  </div>

                  <div className="modern-date-picker border border-border rounded-2xl overflow-hidden shadow-lg bg-card">
                    <div className="date-picker-header">
                      <div className="date-picker-title">
                        <Calendar className="w-5 h-5" />
                        Select Event Dates
                      </div>
                      <div className="date-picker-nav">
                        <button type="button" className="nav-btn" onClick={() => {
                          const newDate = new Date(eventRange[0].startDate);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setEventRange([{
                            ...eventRange[0],
                            startDate: newDate
                          }]);
                        }}>
                          ←
                        </button>
                        <button type="button" className="nav-btn" onClick={() => {
                          const newDate = new Date(eventRange[0].startDate);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setEventRange([{
                            ...eventRange[0],
                            startDate: newDate
                          }]);
                        }}>
                          →
                        </button>
                      </div>
                    </div>
                    <div className="month-year-selector">
                      <select
                        className="month-selector"
                        value={eventRange[0].startDate.getMonth()}
                        onChange={(e) => {
                          const newDate = new Date(eventRange[0].startDate);
                          newDate.setMonth(parseInt(e.target.value));
                          setEventRange([{
                            ...eventRange[0],
                            startDate: newDate
                          }]);
                        }}
                      >
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <option key={month} value={index}>{month}</option>
                        ))}
                      </select>
                      <select
                        className="year-selector"
                        value={eventRange[0].startDate.getFullYear()}
                        onChange={(e) => {
                          const newDate = new Date(eventRange[0].startDate);
                          newDate.setFullYear(parseInt(e.target.value));
                          setEventRange([{
                            ...eventRange[0],
                            startDate: newDate
                          }]);
                        }}
                      >
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="weekdays-grid">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="weekday">{day}</div>
                      ))}
                    </div>
                    <div className="days-grid">
                      {Array.from({ length: 42 }, (_, index) => {
                        const monthStart = new Date(eventRange[0].startDate.getFullYear(), eventRange[0].startDate.getMonth(), 1);
                        const firstDay = monthStart.getDay();
                        const day = index - firstDay + 1;
                        const currentDate = new Date(eventRange[0].startDate.getFullYear(), eventRange[0].startDate.getMonth(), day);

                        // Normalize dates to midnight for comparison
                        const normalizeDate = (date: Date) => {
                          const normalized = new Date(date);
                          normalized.setHours(0, 0, 0, 0);
                          return normalized;
                        };

                        const normalizedCurrent = normalizeDate(currentDate);
                        const normalizedStart = eventRange[0].startDate ? normalizeDate(eventRange[0].startDate) : null;
                        const normalizedEnd = eventRange[0].endDate ? normalizeDate(eventRange[0].endDate) : null;
                        const normalizedToday = normalizeDate(new Date());

                        const isCurrentMonth = currentDate.getMonth() === eventRange[0].startDate.getMonth();
                        const isToday = normalizedCurrent.getTime() === normalizedToday.getTime();
                        const isSelected = (normalizedStart && normalizedStart.getTime() === normalizedCurrent.getTime()) ||
                          (normalizedEnd && normalizedEnd.getTime() === normalizedCurrent.getTime());
                        const isInRange = normalizedStart && normalizedEnd &&
                          normalizedCurrent >= normalizedStart && normalizedCurrent <= normalizedEnd;
                        const isDisabled = normalizedCurrent < normalizedToday;

                        return (
                          <div
                            key={index}
                            className={`day-cell ${!isCurrentMonth ? 'other-month' :
                              isDisabled ? 'disabled' :
                                isSelected ? 'selected' :
                                  isInRange ? 'in-range' :
                                    isToday ? 'today' : ''
                              }`}
                            onClick={() => {
                              if (isDisabled) return;
                              const newRange = { ...eventRange[0] };
                              // If both dates are set or neither is set, start a new selection
                              if ((newRange.startDate && newRange.endDate) || (!newRange.startDate && !newRange.endDate)) {
                                newRange.startDate = normalizeDate(currentDate);
                                newRange.endDate = undefined;
                              } else if (newRange.startDate && normalizedCurrent < normalizeDate(newRange.startDate)) {
                                // If clicking before start date, make it the new start
                                newRange.startDate = normalizeDate(currentDate);
                                newRange.endDate = undefined;
                              } else if (newRange.startDate) {
                                // Set end date
                                newRange.endDate = normalizeDate(currentDate);
                              }
                              setEventRange([newRange]);
                            }}
                          >
                            {isCurrentMonth && day > 0 && day <= new Date(eventRange[0].startDate.getFullYear(), eventRange[0].startDate.getMonth() + 1, 0).getDate() ? day : ''}
                          </div>
                        );
                      })}
                    </div>
                    <div className="date-picker-actions">
                      <button
                        type="button"
                        className="action-btn today"
                        onClick={() => {
                          const today = new Date();
                          setEventRange([{
                            startDate: today,
                            endDate: today,
                            key: 'selection'
                          }]);
                        }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => {
                          setEventRange([{
                            startDate: new Date(),
                            endDate: undefined,
                            key: 'selection'
                          }]);
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Event Time Selectors */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Start Time</Label>
                      <Input
                        type="time"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        className="rounded-xl border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">End Time</Label>
                      <Input
                        type="time"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        className="rounded-xl border-gray-300"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    Registration Period
                  </Label>
                  <div className="modern-date-picker border border-border rounded-2xl overflow-hidden shadow-lg bg-card">
                    <div className="date-picker-header">
                      <div className="date-picker-title">
                        <Calendar className="w-5 h-5" />
                        Select Registration Dates
                      </div>
                      <div className="date-picker-nav">
                        <button type="button" className="nav-btn" onClick={() => {
                          const newDate = new Date(regRange[0].startDate);
                          newDate.setMonth(newDate.getMonth() - 1);
                          setRegRange([{
                            ...regRange[0],
                            startDate: newDate
                          }]);
                        }}>
                          ←
                        </button>
                        <button type="button" className="nav-btn" onClick={() => {
                          const newDate = new Date(regRange[0].startDate);
                          newDate.setMonth(newDate.getMonth() + 1);
                          setRegRange([{
                            ...regRange[0],
                            startDate: newDate
                          }]);
                        }}>
                          →
                        </button>
                      </div>
                    </div>
                    <div className="month-year-selector">
                      <select
                        className="month-selector"
                        value={regRange[0].startDate.getMonth()}
                        onChange={(e) => {
                          const newDate = new Date(regRange[0].startDate);
                          newDate.setMonth(parseInt(e.target.value));
                          setRegRange([{
                            ...regRange[0],
                            startDate: newDate
                          }]);
                        }}
                      >
                        {[
                          'January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((month, index) => (
                          <option key={month} value={index}>{month}</option>
                        ))}
                      </select>
                      <select
                        className="year-selector"
                        value={regRange[0].startDate.getFullYear()}
                        onChange={(e) => {
                          const newDate = new Date(regRange[0].startDate);
                          newDate.setFullYear(parseInt(e.target.value));
                          setRegRange([{
                            ...regRange[0],
                            startDate: newDate
                          }]);
                        }}
                      >
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div className="weekdays-grid">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="weekday">{day}</div>
                      ))}
                    </div>
                    <div className="days-grid">
                      {Array.from({ length: 42 }, (_, index) => {
                        const monthStart = new Date(regRange[0].startDate.getFullYear(), regRange[0].startDate.getMonth(), 1);
                        const firstDay = monthStart.getDay();
                        const day = index - firstDay + 1;
                        const currentDate = new Date(regRange[0].startDate.getFullYear(), regRange[0].startDate.getMonth(), day);

                        // Normalize dates to midnight for comparison
                        const normalizeDate = (date: Date) => {
                          const normalized = new Date(date);
                          normalized.setHours(0, 0, 0, 0);
                          return normalized;
                        };

                        const normalizedCurrent = normalizeDate(currentDate);
                        const normalizedStart = regRange[0].startDate ? normalizeDate(regRange[0].startDate) : null;
                        const normalizedEnd = regRange[0].endDate ? normalizeDate(regRange[0].endDate) : null;
                        const normalizedToday = normalizeDate(new Date());

                        const isCurrentMonth = currentDate.getMonth() === regRange[0].startDate.getMonth();
                        const isToday = normalizedCurrent.getTime() === normalizedToday.getTime();
                        const isSelected = (normalizedStart && normalizedStart.getTime() === normalizedCurrent.getTime()) ||
                          (normalizedEnd && normalizedEnd.getTime() === normalizedCurrent.getTime());
                        const isInRange = normalizedStart && normalizedEnd &&
                          normalizedCurrent >= normalizedStart && normalizedCurrent <= normalizedEnd;
                        const isDisabled = normalizedCurrent < normalizedToday;

                        return (
                          <div
                            key={index}
                            className={`day-cell ${!isCurrentMonth ? 'other-month' :
                              isDisabled ? 'disabled' :
                                isSelected ? 'selected' :
                                  isInRange ? 'in-range' :
                                    isToday ? 'today' : ''
                              }`}
                            onClick={() => {
                              if (isDisabled) return;
                              const newRange = { ...regRange[0] };
                              // If both dates are set or neither is set, start a new selection
                              if ((newRange.startDate && newRange.endDate) || (!newRange.startDate && !newRange.endDate)) {
                                newRange.startDate = normalizeDate(currentDate);
                                newRange.endDate = undefined;
                              } else if (newRange.startDate && normalizedCurrent < normalizeDate(newRange.startDate)) {
                                // If clicking before start date, make it the new start
                                newRange.startDate = normalizeDate(currentDate);
                                newRange.endDate = undefined;
                              } else if (newRange.startDate) {
                                // Set end date
                                newRange.endDate = normalizeDate(currentDate);
                              }
                              setRegRange([newRange]);
                            }}
                          >
                            {isCurrentMonth && day > 0 && day <= new Date(regRange[0].startDate.getFullYear(), regRange[0].startDate.getMonth() + 1, 0).getDate() ? day : ''}
                          </div>
                        );
                      })}
                    </div>
                    <div className="date-picker-actions">
                      <button
                        type="button"
                        className="action-btn today"
                        onClick={() => {
                          const today = new Date();
                          setRegRange([{
                            startDate: today,
                            endDate: today,
                            key: 'selection'
                          }]);
                        }}
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => {
                          setRegRange([{
                            startDate: new Date(),
                            endDate: undefined,
                            key: 'selection'
                          }]);
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Registration Time Selectors */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Start Time</Label>
                      <Input
                        type="time"
                        value={regStartTime}
                        onChange={(e) => setRegStartTime(e.target.value)}
                        className="rounded-xl border-gray-300"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium mb-2 block">End Time</Label>
                      <Input
                        type="time"
                        value={regEndTime}
                        onChange={(e) => setRegEndTime(e.target.value)}
                        className="rounded-xl border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Guest Types Card */}
          <Card className="border-border/50 shadow-lg shadow-black/5 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md">
                    <UserCheck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Guest Types</CardTitle>
                    <CardDescription>
                      {totalSelectedGuestTypes > 0
                        ? `${totalSelectedGuestTypes} type${totalSelectedGuestTypes > 1 ? 's' : ''} selected`
                        : 'Choose guest types for your event'
                      }
                    </CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addCustomGuestType}
                  variant="outline"
                  size="sm"
                  className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Custom Type
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-semibold mb-3 block">Common Guest Types</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {PREDEFINED_GUEST_TYPES.map((guestType) => {
                    const isSelected = selectedGuestTypes.includes(guestType.name)
                    return (
                      <Button
                        key={guestType.name}
                        type="button"
                        variant={isSelected ? 'default' : 'outline'}
                        size="sm"
                        className={`h-auto py-2.5 px-3 transition-all ${isSelected
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/30'
                          : 'hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10'
                          }`}
                        onClick={() => toggleGuestType(guestType.name)}
                      >
                        {isSelected && <CheckCircle2 className="w-4 h-4 mr-1.5" />}
                        {guestType.name}
                      </Button>
                    )
                  })}
                </div>
              </div>

              {customGuestTypes.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Custom Guest Types</Label>
                    <div className="space-y-3">
                      {customGuestTypes.map((guestType, index) => (
                        <Card key={index} className="border-border/50 bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm font-medium">Custom Type {index + 1}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCustomGuestType(index)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Name</Label>
                                <Input
                                  value={guestType.name}
                                  onChange={(e) => updateCustomGuestType(index, 'name', e.target.value)}
                                  placeholder="e.g., VIP, Corporate"
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Price (ETB)</Label>
                                <Input
                                  type="number"
                                  value={guestType.price}
                                  onChange={(e) => updateCustomGuestType(index, 'price', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="h-9 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs text-muted-foreground">Description</Label>
                                <Input
                                  value={guestType.description}
                                  onChange={(e) => updateCustomGuestType(index, 'description', e.target.value)}
                                  placeholder="Brief description..."
                                  className="h-9 text-sm"
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {totalSelectedGuestTypes === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-muted/20">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm font-medium text-foreground mb-1">No guest types selected</p>
                  <p className="text-xs text-muted-foreground">Select from common types above or add custom ones</p>
                </div>
              )}

              {totalSelectedGuestTypes > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedGuestTypes.map((name) => (
                    <Badge key={name} variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800">
                      {name}
                    </Badge>
                  ))}
                  {customGuestTypes.filter(gt => gt.name.trim()).map((gt, index) => (
                    <Badge key={`custom-${index}`} variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border-teal-300 dark:border-teal-800">
                      {gt.name}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/events')}
              className="h-11 px-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || totalSelectedGuestTypes === 0}
              className="h-11 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></span>
                  Creating Event...
                </span>
              ) : (
                <span className="flex items-center">
                  Create Free Event
                  <ArrowRight className="w-4 h-4 ml-2" />
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
