import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getImageUrl } from '@/lib/utils'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  Users, 
  MapPin, 
  Clock, 
  Globe, 
  Mail, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  Filter, 
  Search,
  Settings,
  BarChart3,
  Zap,
  Star,
  ArrowUpRight,
  MoreHorizontal,
  Play,
  Pause,
  RefreshCw,
  ExternalLink,
  Bell,
  Share2,
  Target,
  Activity
} from 'lucide-react'
import { format } from 'date-fns'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import EvellaIntegrationTest from './EvellaIntegrationTest'
import VennuIntegrationTest from './VennuIntegrationTest'

interface Event {
  id: number
  uuid: string
  name: string
  description: string
  start_date: string
  end_date: string
  location: string
  advertisement_status: string
  organizer: {
    name: string
    email: string
  }
  attendees_count: number
  max_guests: number
  event_image?: string
}

interface AdvertisementLog {
  id: number
  type: string
  status: string
  recipients: string[]
  message: string
  error?: string
  created_at: string
}

export default function EventPublicationManager() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [advertisementLogs, setAdvertisementLogs] = useState<AdvertisementLog[]>([])
  const [emailCampaign, setEmailCampaign] = useState({
    message: '',
    recipients: [] as string[]
  })
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('date')
  const { toast } = useToast()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await api.get('/events')
      setEvents(response.data)
    } catch (error) {
      console.error('Failed to fetch events:', error)
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const updateAdvertisementStatus = async (eventId: number, status: string) => {
    try {
      await api.put(`/events/${eventId}/advertisement-status`, {
        advertisement_status: status
      })
      
      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, advertisement_status: status }
          : event
      ))
      
      // Show success message with specific info for approved events
      if (status === 'approved') {
        toast({
          title: '🎉 Event Published Successfully!',
          description: 'This event is now live on Evella and Vennu platforms and visible to the public.',
        })
      } else if (status === 'rejected') {
        toast({
          title: '❌ Event Rejected',
          description: 'This event has been rejected and will not appear on the public platforms.',
        })
      } else {
        toast({
          title: 'Status Updated',
          description: `Event publication status updated to ${status}`,
        })
      }
    } catch (error) {
      console.error('Failed to update advertisement status:', error)
      toast({
        title: 'Error',
        description: 'Failed to update publication status',
        variant: 'destructive',
      })
    }
  }

  const fetchAdvertisementLogs = async (eventId: number) => {
    try {
      const response = await api.get(`/events/${eventId}/advertisement-logs`)
      setAdvertisementLogs(response.data)
    } catch (error) {
      console.error('Failed to fetch advertisement logs:', error)
    }
  }

  const sendEmailCampaign = async (eventId: number) => {
    try {
      await api.post(`/events/${eventId}/send-email-campaign`, {
        message: emailCampaign.message
      })
      
      toast({
        title: 'Success',
        description: 'Email campaign sent successfully',
      })
      
      setShowEmailDialog(false)
      setEmailCampaign({ message: '', recipients: [] })
      fetchAdvertisementLogs(eventId)
    } catch (error) {
      console.error('Failed to send email campaign:', error)
      toast({
        title: 'Error',
        description: 'Failed to send email campaign',
        variant: 'destructive',
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { 
        color: 'bg-amber-50 text-amber-700 border-amber-200', 
        label: 'Pending Review',
        icon: AlertCircle,
        bg: 'bg-amber-500'
      },
      approved: { 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200', 
        label: 'Published Live',
        icon: CheckCircle,
        bg: 'bg-emerald-500'
      },
      rejected: { 
        color: 'bg-red-50 text-red-700 border-red-200', 
        label: 'Rejected',
        icon: XCircle,
        bg: 'bg-red-500'
      },
      sent: { 
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        label: 'Campaign Sent',
        icon: Mail,
        bg: 'bg-blue-500'
      },
      failed: { 
        color: 'bg-red-50 text-red-700 border-red-200', 
        label: 'Campaign Failed',
        icon: XCircle,
        bg: 'bg-red-500'
      }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon
    
    return (
      <Badge className={`${config.color} border flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium`}>
        <div className={`w-2 h-2 rounded-full ${config.bg}`}></div>
        {config.label}
      </Badge>
    )
  }

  const getStatusOptions = (currentStatus: string) => {
    const options = [
      { value: 'pending', label: 'Pending Review', icon: AlertCircle },
      { value: 'approved', label: 'Publish on Platforms', icon: CheckCircle },
      { value: 'rejected', label: 'Reject Event', icon: XCircle }
    ]
    
    return options.filter(option => option.value !== currentStatus)
  }

  const filteredEvents = events.filter(event => {
    const matchesTab = activeTab === 'all' || event.advertisement_status === activeTab
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.organizer.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      case 'name':
        return a.name.localeCompare(b.name)
      case 'organizer':
        return a.organizer.name.localeCompare(b.organizer.name)
      case 'status':
        return a.advertisement_status.localeCompare(b.advertisement_status)
      default:
        return 0
    }
  })

  const stats = {
    total: events.length,
    pending: events.filter(e => e.advertisement_status === 'pending').length,
    approved: events.filter(e => e.advertisement_status === 'approved').length,
    rejected: events.filter(e => e.advertisement_status === 'rejected').length
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
          <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6" />
                </div>
                <h1 className="text-4xl font-bold">Event Publication Hub</h1>
              </div>
              <p className="text-slate-300 text-lg max-w-2xl">
                Manage event visibility across Evella and Vennu platforms separately. Control publication methods for each platform independently.
            </p>
          </div>
          <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button size="sm" className="bg-white text-slate-900 hover:bg-slate-100">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          
          {/* Platform Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Evella Platform</h3>
                  <p className="text-slate-300 text-sm">Public Event Discovery</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-400 text-sm font-medium">Independent Publication</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Vennu Platform</h3>
                  <p className="text-slate-300 text-sm">Modern Event Discovery</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    <span className="text-blue-400 text-sm font-medium">Independent Publication</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">Total Events</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                <p className="text-xs text-blue-600 mt-1">All events in system</p>
              </div>
              <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-amber-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">Pending Review</p>
                <p className="text-3xl font-bold text-amber-900">{stats.pending}</p>
                <p className="text-xs text-amber-600 mt-1">Awaiting approval</p>
              </div>
              <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <AlertCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600 mb-1">Published Live</p>
                <p className="text-3xl font-bold text-emerald-900">{stats.approved}</p>
                <p className="text-xs text-emerald-600 mt-1">Live on platforms</p>
              </div>
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 mb-1">Rejected</p>
                <p className="text-3xl font-bold text-red-900">{stats.rejected}</p>
                <p className="text-xs text-red-600 mt-1">Not published</p>
              </div>
              <div className="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <XCircle className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Integration Tests */}
      <div className="space-y-6">
        <EvellaIntegrationTest />
        <VennuIntegrationTest />
      </div>

      {/* Enhanced Controls */}
      <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full lg:w-auto">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  All Events
                </TabsTrigger>
                <TabsTrigger value="pending" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="approved" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Published
                </TabsTrigger>
                <TabsTrigger value="rejected" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  Rejected
                </TabsTrigger>
                </TabsList>
              </Tabs>
            
            {/* Search and Controls */}
            <div className="flex items-center gap-4 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 lg:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                  placeholder="Search events or organizers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full lg:w-80 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 border-gray-200">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              
              {/* View Mode */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <div className="grid grid-cols-2 gap-0.5 w-4 h-4">
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                    <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                  </div>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <div className="flex flex-col gap-0.5 w-4 h-4">
                    <div className="w-full h-1 bg-current rounded-sm"></div>
                    <div className="w-full h-1 bg-current rounded-sm"></div>
                    <div className="w-full h-1 bg-current rounded-sm"></div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Display */}
      {viewMode === 'grid' ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedEvents.map((event) => (
            <Card key={event.id} className="group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-0 overflow-hidden bg-white relative">
              {/* Gradient Overlay on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            <div className="relative">
              {/* Event Image */}
              {event.event_image ? (
                  <div className="aspect-video bg-gray-100 overflow-hidden relative">
                  <img 
                    src={getImageUrl(event.event_image)} 
                    alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                    {/* Image Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10"></div>
                    <Calendar className="w-16 h-16 text-blue-500 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                </div>
              )}
              
              {/* Status Badge */}
                <div className="absolute top-4 right-4 z-10">
                {getStatusBadge(event.advertisement_status)}
              </div>
              
                {/* Live Platforms Indicator */}
              {event.advertisement_status === 'approved' && (
                  <div className="absolute top-4 left-4 flex gap-2 z-10">
                    <Badge className="bg-emerald-500 text-white border-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">Evella</span>
                  </Badge>
                    <Badge className="bg-blue-500 text-white border-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span className="text-xs font-medium">Vennu</span>
                  </Badge>
                </div>
              )}
                
                {/* Event Date Badge */}
                <div className="absolute bottom-4 left-4 z-10">
                  <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        {format(new Date(event.start_date), 'MMM')}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {format(new Date(event.start_date), 'dd')}
                      </div>
                    </div>
                  </div>
                </div>
            </div>
            
              <CardContent className="p-6 space-y-5">
              {/* Event Title and Organizer */}
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-tight">
                  {event.name}
                </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {event.organizer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-gray-700">{event.organizer.name}</span>
                  </div>
              </div>
              
              {/* Event Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-500" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">{format(new Date(event.start_date), 'EEEE, MMM dd')}</span>
                      <div className="text-xs text-gray-500">{format(new Date(event.start_date), 'h:mm a')}</div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="line-clamp-1 font-medium text-gray-700">{event.location}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">{event.attendees_count} / {event.max_guests}</span>
                      <div className="text-xs text-gray-500">attendees</div>
                    </div>
                  </div>
              </div>
              
              {/* Description */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                {event.description}
              </p>
                </div>
              
              {/* Action Buttons */}
                <div className="space-y-4 pt-2">
                <Select
                  value={event.advertisement_status}
                  onValueChange={(value) => updateAdvertisementStatus(event.id, value)}
                >
                    <SelectTrigger className="w-full border-gray-200 focus:border-blue-500 focus:ring-blue-500 bg-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatusOptions(event.advertisement_status).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <option.icon className="w-4 h-4" />
                        {option.label}
                          </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                          className="flex-1 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
                          onClick={() => {
                            setSelectedEvent(event)
                            fetchAdvertisementLogs(event.id)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Logs
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                            Platform Publication Logs - {event.name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="max-h-96 overflow-y-auto space-y-4">
                          {advertisementLogs.length === 0 ? (
                            <div className="text-center py-8">
                              <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <p className="text-gray-500">No advertisement logs found for this event.</p>
                            </div>
                          ) : (
                            advertisementLogs.map((log) => (
                              <div key={log.id} className="border rounded-xl p-4 bg-gray-50">
                                <div className="flex items-center justify-between mb-3">
                                  <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                                    {log.type} - {log.status}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">{log.message}</p>
                                {log.recipients && log.recipients.length > 0 && (
                                  <p className="text-xs text-gray-500">
                                    Recipients: {log.recipients.join(', ')}
                                  </p>
                                )}
                                {log.error && (
                                  <p className="text-xs text-red-500 mt-2">
                                    Error: {log.error}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            Send Email Campaign - {event.name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="email-message">Message</Label>
                            <Textarea
                              id="email-message"
                              placeholder="Enter your email message..."
                              value={emailCampaign.message}
                              onChange={(e) => setEmailCampaign(prev => ({
                                ...prev,
                                message: e.target.value
                              }))}
                              rows={4}
                              className="mt-2"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => sendEmailCampaign(event.id)}
                              disabled={!emailCampaign.message.trim()}
                        className="flex-1"
                            >
                              Send Campaign
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setShowEmailDialog(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // List View
        <div className="space-y-4">
          {sortedEvents.map((event) => (
            <Card key={event.id} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-6">
                  {/* Event Image */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {event.event_image ? (
                      <img 
                        src={getImageUrl(event.event_image)} 
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <Calendar className="w-8 h-8 text-blue-500" />
                      </div>
                    )}
                  </div>
                  
                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {event.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          by <span className="font-medium">{event.organizer.name}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getStatusBadge(event.advertisement_status)}
                        {event.advertisement_status === 'approved' && (
                          <div className="flex gap-1">
                            <Badge className="bg-emerald-500 text-white border-0 px-2 py-1 rounded-full text-xs">
                              Evella
                            </Badge>
                            <Badge className="bg-blue-500 text-white border-0 px-2 py-1 rounded-full text-xs">
                              Vennu
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{format(new Date(event.start_date), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{event.attendees_count} / {event.max_guests} attendees</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Select
                      value={event.advertisement_status}
                      onValueChange={(value) => updateAdvertisementStatus(event.id, value)}
                    >
                      <SelectTrigger className="w-48 border-gray-200">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {getStatusOptions(event.advertisement_status).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <option.icon className="w-4 h-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                        onClick={() => {
                          setSelectedEvent(event)
                          fetchAdvertisementLogs(event.id)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Logs
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5" />
                          Platform Publication Logs - {event.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="max-h-96 overflow-y-auto space-y-4">
                        {advertisementLogs.length === 0 ? (
                          <div className="text-center py-8">
                            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">No advertisement logs found for this event.</p>
                          </div>
                        ) : (
                          advertisementLogs.map((log) => (
                              <div key={log.id} className="border rounded-xl p-4 bg-gray-50">
                              <div className="flex items-center justify-between mb-3">
                                <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                                  {log.type} - {log.status}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-2">{log.message}</p>
                              {log.recipients && log.recipients.length > 0 && (
                                <p className="text-xs text-gray-500">
                                  Recipients: {log.recipients.join(', ')}
                                </p>
                              )}
                              {log.error && (
                                <p className="text-xs text-red-500 mt-2">
                                  Error: {log.error}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setSelectedEvent(event)}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <Mail className="w-5 h-5" />
                          Send Email Campaign - {event.name}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="email-message">Message</Label>
                          <Textarea
                            id="email-message"
                            placeholder="Enter your email message..."
                            value={emailCampaign.message}
                            onChange={(e) => setEmailCampaign(prev => ({
                              ...prev,
                              message: e.target.value
                            }))}
                            rows={4}
                            className="mt-2"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => sendEmailCampaign(event.id)}
                            disabled={!emailCampaign.message.trim()}
                            className="flex-1"
                          >
                            Send Campaign
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowEmailDialog(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
      
      {/* Enhanced Empty State */}
      {sortedEvents.length === 0 && (
        <Card className="border-0 shadow-sm bg-white/80 backdrop-blur-sm">
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Globe className="w-10 h-10 text-blue-500" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery || activeTab !== 'all' 
                ? 'No events match your current filters. Try adjusting your search or filters.'
                : 'There are no events available for publication management at the moment.'
              }
            </p>
            {(searchQuery || activeTab !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('')
                  setActiveTab('all')
                }}
                className="bg-white hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 