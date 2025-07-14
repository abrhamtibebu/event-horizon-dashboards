import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Users,
  Upload,
  Save,
  X,
  Tag,
  FileText,
  Image,
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
import '@/index.css'
import { useAuth } from '@/hooks/use-auth'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'

// Utility to filter valid select options
function filterValidOptions<T extends { id?: any }>(arr: T[]) {
  return arr.filter(
    (item) => item.id !== undefined && item.id !== null && item.id !== ''
  )
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: null as Date | null,
    end_date: null as Date | null,
    location: '',
    max_guests: '',
    registration_start_date: null as Date | null,
    registration_end_date: null as Date | null,
    event_type_id: '', // Remove default '1'
    event_category_id: '', // Remove default '1'
    organizer_id: '', // Remove default '1'
    status: 'draft',
    event_image: null as File | null,
    requirements: '',
    agenda: '',
    guest_types: '',
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEventRange, setShowEventRange] = useState(false)
  const [showRegRange, setShowRegRange] = useState(false)
  const [eventTypes, setEventTypes] = useState<any[]>([])
  const [eventCategories, setEventCategories] = useState<any[]>([])
  const [eventRange, setEventRange] = useState([
    {
      startDate: formData.start_date || new Date(),
      endDate: formData.end_date || new Date(),
      key: 'selection',
    },
  ])
  const [regRange, setRegRange] = useState([
    {
      startDate: formData.registration_start_date || new Date(),
      endDate: formData.registration_end_date || new Date(),
      key: 'selection',
    },
  ])

  const [organizers, setOrganizers] = useState<any[]>([])
  const [loading, setLoading] = useState({
    organizers: true,
    eventTypes: true,
    eventCategories: true,
  })
  const [error, setError] = useState({
    organizers: null,
    eventTypes: null,
    eventCategories: null,
  })

  // Add predefined guest types
  const PREDEFINED_GUEST_TYPES = [
    'VIP', 'Speaker', 'Staff', 'Exhibitor', 'Media', 'Regular', 'Visitor', 'Sponsor', 'Organizer', 'Volunteer', 'Partner', 'Vendor', 'Press', 'Student', 'Other'
  ];
  const [selectedGuestTypes, setSelectedGuestTypes] = useState<string[]>([]);

  useEffect(() => {
    if (user && user.role === 'organizer' && user.organizer_id) {
      handleInputChange('organizer_id', String(user.organizer_id))
    }

    const fetchData = async (
      endpoint: string,
      setData: Function,
      loaderKey: keyof typeof loading,
      errorKey: keyof typeof error
    ) => {
      try {
        setLoading((prev) => ({ ...prev, [loaderKey]: true }))
        setError((prev) => ({ ...prev, [errorKey]: null }))
        const res = await api.get(endpoint)
        setData(res.data)
      } catch (err: any) {
        setError((prev) => ({
          ...prev,
          [errorKey]: `Failed to fetch ${errorKey}`,
        }))
      } finally {
        setLoading((prev) => ({ ...prev, [loaderKey]: false }))
      }
    }

    if (user?.role !== 'organizer') {
      fetchData('/organizers', setOrganizers, 'organizers', 'organizers')
    } else {
      setLoading((prev) => ({ ...prev, organizers: false }))
    }

    fetchData('/event-types', setEventTypes, 'eventTypes', 'eventTypes')
    fetchData(
      '/event-categories',
      setEventCategories,
      'eventCategories',
      'eventCategories'
    )
  }, [user])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData((prev) => ({ ...prev, event_image: file }))
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, event_image: null }))
    setImagePreview(null)
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // Frontend validation for required fields
    const requiredFields = [
      'name', 'start_date', 'end_date', 'location', 'max_guests',
      'registration_start_date', 'registration_end_date', 'event_type_id', 'event_category_id'
    ];
    for (const field of requiredFields) {
      if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
        toast.error(`Please fill in the required field: ${field.replace(/_/g, ' ')}`);
        return;
      }
    }
    // Validate max_guests is a positive integer
    if (isNaN(Number(formData.max_guests)) || parseInt(formData.max_guests, 10) < 1) {
      toast.error('Max Guests must be a positive integer.');
      return;
    }
    if (selectedGuestTypes.length === 0) {
      toast.error('Please select at least one guest type.');
      return;
    }
    setIsSubmitting(true)
    try {
      let payload
      let headers = {}
      // Convert date objects to ISO strings for API
      const processedFormData = {
        ...formData,
        start_date: eventRange[0].startDate.toISOString(),
        end_date: eventRange[0].endDate.toISOString(),
        registration_start_date: regRange[0].startDate.toISOString(),
        registration_end_date: regRange[0].endDate.toISOString(),
        // Ensure max_guests is sent as an integer
        max_guests: parseInt(formData.max_guests, 10),
        // Only include organizer_id if not an organizer (backend sets it for organizers)
        ...(user?.role !== 'organizer' && { organizer_id: formData.organizer_id }),
        guest_types: selectedGuestTypes,
      }
      if (formData.event_image) {
        payload = new FormData()
        Object.entries(processedFormData).forEach(([key, value]) => {
          if (key === 'event_image' && value) {
            payload.append('event_image', value)
          } else if (key === 'guest_types') {
            (Array.isArray(value) ? value : [value]).forEach((type: string) =>
              payload.append('guest_types[]', type)
            )
          } else {
            payload.append(key, value as any)
          }
        })
        headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        payload = processedFormData
      }
      await api.post('/events', payload, { headers })
      toast.success('Event created successfully!')
      navigate('/events')
    } catch (error: any) {
      if (error.response?.status === 422 && error.response?.data) {
        // Show the first validation error
        const firstKey = Object.keys(error.response.data)[0]
        const firstError = Array.isArray(error.response.data[firstKey]) ? error.response.data[firstKey][0] : error.response.data[firstKey]
        toast.error(firstError || 'Validation error')
      } else {
        toast.error(error.response?.data?.message || 'Failed to create event.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Custom purple theme for react-date-range
  const customRangeStyles = `
    .rdrCalendarWrapper, .rdrDateDisplayWrapper, .rdrMonthAndYearWrapper, .rdrMonthPicker, .rdrYearPicker {
      background: white;
    }
    .rdrDayNumber span {
      color: #6d28d9;
      font-weight: 500;
    }
    .rdrDay.rdrDaySelected, .rdrDay.rdrDayInRange, .rdrDay.rdrDayStartPreview, .rdrDay.rdrDayEndPreview {
      background: #a21caf !important;
      color: white !important;
      border-radius: 9999px !important;
    }
    .rdrDay.rdrDayStartOfMonth, .rdrDay.rdrDayEndOfMonth {
      border-radius: 9999px !important;
    }
    .rdrDay.rdrDayToday .rdrDayNumber span {
      border: 1.5px solid #a21caf;
      border-radius: 9999px;
    }
    .rdrMonthAndYearPickers select {
      color: #a21caf;
      font-weight: 600;
    }
    .rdrDefinedRangesWrapper { display: none; }
    .rdrDateRangePickerWrapper { box-shadow: 0 8px 32px rgba(80,0,80,0.12); border-radius: 1.5rem; }
  `

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <style>{customRangeStyles}</style>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-auto p-0 animate-fade-in relative h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-8 pt-6 md:pt-8 pb-2 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Create New Event
              </h2>
              <p className="text-gray-500 text-sm">
                Set up a new event in the system
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

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-8"
        >
          {/* Event Information */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-lg text-gray-900">
                Event Information
              </h3>
              <span className="text-gray-400 text-sm ml-2">
                Event details and logistics
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label
                  htmlFor="name"
                  className="flex items-center gap-2 text-gray-700"
                >
                  {' '}
                  <Tag className="w-4 h-4" /> Event Name{' '}
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter event name"
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="organizer_id"
                  className="flex items-center gap-2 text-gray-700"
                >
                  {' '}
                  <Tag className="w-4 h-4" /> Organizer{' '}
                </Label>
                {user?.role === 'organizer' ? (
                  <Input
                    value={user.organizer?.name || ''}
                    disabled
                    className="mt-1"
                  />
                ) : (
                  <Select
                    value={formData.organizer_id}
                    onValueChange={(value) =>
                      handleInputChange('organizer_id', value)
                    }
                    disabled={loading.organizers}
                    required
                  >
                    <SelectTrigger className="mt-1 w-full" id="organizer_id">
                      <SelectValue placeholder="Select an organizer" />
                    </SelectTrigger>
                    <SelectContent>
                      {loading.organizers && (
                        <SelectItem value="__loading" disabled>
                          Loading...
                        </SelectItem>
                      )}
                      {error.organizers && (
                        <SelectItem value="__error" disabled>
                          Error loading organizers
                        </SelectItem>
                      )}
                      {!loading.organizers &&
                        !error.organizers &&
                        filterValidOptions(organizers).map((org) => (
                          <SelectItem key={org.id} value={String(org.id)}>
                            {org.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="md:col-span-2">
                <Label
                  htmlFor="description"
                  className="flex items-center gap-2 text-gray-700"
                >
                  {' '}
                  <FileText className="w-4 h-4" /> Description{' '}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange('description', e.target.value)
                  }
                  placeholder="Describe your event..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="event_type_id"
                  className="flex items-center gap-2 text-gray-700"
                >
                  {' '}
                  <Tag className="w-4 h-4" /> Event Type{' '}
                </Label>
                <Select
                  value={formData.event_type_id}
                  onValueChange={(value) =>
                    handleInputChange('event_type_id', value)
                  }
                  disabled={loading.eventTypes}
                  required
                >
                  <SelectTrigger className="mt-1 w-full" id="event_type_id">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterValidOptions(eventTypes).map((type: any) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error.eventTypes && (
                  <div className="text-xs text-red-500 mt-1">
                    {error.eventTypes}
                  </div>
                )}
              </div>
              <div>
                <Label
                  htmlFor="event_category_id"
                  className="flex items-center gap-2 text-gray-700"
                >
                  {' '}
                  <Tag className="w-4 h-4" /> Event Category{' '}
                </Label>
                <Select
                  value={formData.event_category_id}
                  onValueChange={(value) =>
                    handleInputChange('event_category_id', value)
                  }
                  disabled={loading.eventCategories}
                  required
                >
                  <SelectTrigger className="mt-1 w-full" id="event_category_id">
                    <SelectValue placeholder="Select event category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filterValidOptions(eventCategories).map((cat: any) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {error.eventCategories && (
                  <div className="text-xs text-red-500 mt-1">
                    {error.eventCategories}
                  </div>
                )}
              </div>
              <div>
                <Label
                  htmlFor="location"
                  className="flex items-center gap-2 text-gray-700"
                >
                  {' '}
                  <MapPin className="w-4 h-4" /> Location{' '}
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange('location', e.target.value)
                  }
                  placeholder="e.g. Grand Convention Center"
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="max_guests"
                  className="flex items-center gap-2 text-gray-700"
                >
                  {' '}
                  <Users className="w-4 h-4" /> Max Guests{' '}
                </Label>
                <Input
                  id="max_guests"
                  type="number"
                  value={formData.max_guests}
                  onChange={(e) =>
                    handleInputChange('max_guests', e.target.value)
                  }
                  placeholder="e.g. 500"
                  className="mt-1"
                />
              </div>
              <div>
                <Label
                  htmlFor="guest_types"
                  className="flex items-center gap-2 text-gray-700"
                >
                  {' '}
                  <Users className="w-4 h-4" /> Guest Types{' '}
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PREDEFINED_GUEST_TYPES.map(type => (
                    <Button
                      key={type}
                      type="button"
                      variant={selectedGuestTypes.includes(type) ? 'default' : 'outline'}
                      className={selectedGuestTypes.includes(type) ? 'bg-blue-600 text-white' : ''}
                      onClick={() => {
                        setSelectedGuestTypes(prev => prev.includes(type)
                          ? prev.filter(t => t !== type)
                          : [...prev, type]);
                      }}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
                {selectedGuestTypes.length === 0 && <div className="text-xs text-red-500 mb-2">Select at least one guest type.</div>}
              </div>
              <div className="md:col-span-2">
                <Label
                  htmlFor="event_image"
                  className="flex items-center gap-2 text-gray-700"
                >
                  {' '}
                  <Image className="w-4 h-4" /> Event Image{' '}
                </Label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="file"
                    id="event_image"
                    ref={imageInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label htmlFor="event_image" className="inline-block">
                    <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded cursor-pointer border border-blue-200 hover:bg-blue-100 transition">
                      Choose File
                    </span>
                  </label>
                  <span className="text-gray-600 text-sm">
                    {formData.event_image
                      ? formData.event_image.name
                      : 'No file chosen'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Upload your event banner (PNG, JPG, SVG)
                </p>
                {imagePreview && (
                  <div className="mt-2 relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Event image preview"
                      className="h-24 rounded shadow border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 rounded-full h-6 w-6"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Date Ranges */}
          <div>
            <div className="flex items-center gap-2 mb-4 mt-6">
              <Calendar className="w-5 h-5 text-purple-500" />
              <h3 className="font-semibold text-lg text-gray-900">
                Event & Registration Dates
              </h3>
              <span className="text-gray-400 text-sm ml-2">
                Set event and registration periods
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 text-gray-700">
                  {' '}
                  <Calendar className="w-4 h-4" /> Event Date Range{' '}
                </Label>
                <Button
                  type="button"
                  className="w-full mt-1 mb-2 bg-purple-100 text-purple-700 hover:bg-purple-200"
                  onClick={() => setShowEventRange(true)}
                >
                  {formData.start_date && formData.end_date
                    ? `${eventRange[0].startDate.toLocaleDateString()} - ${eventRange[0].endDate.toLocaleDateString()}`
                    : 'Select event date range'}
                </Button>
                {showEventRange && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-purple-700 text-lg">
                          Event Date Range
                        </span>
                        <button
                          onClick={() => setShowEventRange(false)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded-full"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <DateRange
                        ranges={eventRange}
                        onChange={(item) => setEventRange([item.selection])}
                        showDateDisplay={false}
                        rangeColors={['#a21caf']}
                        showMonthAndYearPickers={true}
                        moveRangeOnFirstSelection={false}
                        months={1}
                        direction="vertical"
                        className="rounded-xl"
                      />
                      <div className="flex justify-end gap-3 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowEventRange(false)}
                          className="rounded-full px-6"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          className="bg-purple-700 text-white rounded-full px-6"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              start_date: eventRange[0].startDate,
                              end_date: eventRange[0].endDate,
                            }))
                            setShowEventRange(false)
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label className="flex items-center gap-2 text-gray-700">
                  {' '}
                  <Calendar className="w-4 h-4" /> Registration Date Range{' '}
                </Label>
                <Button
                  type="button"
                  className="w-full mt-1 mb-2 bg-purple-100 text-purple-700 hover:bg-purple-200"
                  onClick={() => setShowRegRange(true)}
                >
                  {formData.registration_start_date &&
                  formData.registration_end_date
                    ? `${regRange[0].startDate.toLocaleDateString()} - ${regRange[0].endDate.toLocaleDateString()}`
                    : 'Select registration date range'}
                </Button>
                {showRegRange && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto flex flex-col">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-purple-700 text-lg">
                          Registration Date Range
                        </span>
                        <button
                          onClick={() => setShowRegRange(false)}
                          className="text-gray-400 hover:text-gray-700 p-1 rounded-full"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <DateRange
                        ranges={regRange}
                        onChange={(item) => setRegRange([item.selection])}
                        showDateDisplay={false}
                        rangeColors={['#a21caf']}
                        showMonthAndYearPickers={true}
                        moveRangeOnFirstSelection={false}
                        months={1}
                        direction="vertical"
                        className="rounded-xl"
                      />
                      <div className="flex justify-end gap-3 mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowRegRange(false)}
                          className="rounded-full px-6"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          className="bg-purple-700 text-white rounded-full px-6"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              registration_start_date: regRange[0].startDate,
                              registration_end_date: regRange[0].endDate,
                            }))
                            setShowRegRange(false)
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <div className="flex items-center gap-2 mb-4 mt-6">
              <FileText className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-lg text-gray-900">
                Additional Information
              </h3>
              <span className="text-gray-400 text-sm ml-2">
                Requirements and agenda
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label
                  htmlFor="requirements"
                  className="flex items-center gap-2 text-gray-700"
                >
                  {' '}
                  <FileText className="w-4 h-4" /> Requirements & Prerequisites{' '}
                </Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) =>
                    handleInputChange('requirements', e.target.value)
                  }
                  placeholder="Any requirements or prerequisites for attendees..."
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <Label
                  htmlFor="agenda"
                  className="flex items-center gap-2 text-gray-700"
                >
                  {' '}
                  <FileText className="w-4 h-4" /> Event Agenda{' '}
                </Label>
                <Textarea
                  id="agenda"
                  value={formData.agenda}
                  onChange={(e) => handleInputChange('agenda', e.target.value)}
                  placeholder="Detailed event schedule and agenda..."
                  rows={3}
                  className="mt-1"
                />
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
              disabled={
                isSubmitting ||
                loading.eventTypes ||
                loading.eventCategories ||
                (user?.role !== 'organizer' && loading.organizers) ||
                !formData.name.trim() ||
                !formData.location.trim() ||
                !formData.max_guests.trim() ||
                !formData.event_type_id ||
                !formData.event_category_id ||
                (user?.role !== 'organizer' && !formData.organizer_id) ||
                !filterValidOptions(eventTypes).some(et => String(et.id) === formData.event_type_id) ||
                !filterValidOptions(eventCategories).some(ec => String(ec.id) === formData.event_category_id) ||
                (user?.role !== 'organizer' && !filterValidOptions(organizers).some(org => String(org.id) === formData.organizer_id))
              }
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-2 rounded-lg shadow"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Creating...
                </span>
              ) : (
                'Create Event'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
