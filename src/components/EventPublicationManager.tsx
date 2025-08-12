import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Users, MapPin, Clock, Globe, Mail, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, TrendingUp, Filter } from 'lucide-react'
import { format } from 'date-fns'
import api from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import PlatformIntegrationTest from './PlatformIntegrationTest'

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
          title: '✅ Event Published Successfully!',
          description: 'This event is now live on both Evella and Digis platforms and visible to the public.',
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
        color: 'bg-yellow-50 text-yellow-700 border-yellow-200', 
        label: 'Pending Review',
        icon: AlertCircle
      },
      approved: { 
        color: 'bg-green-50 text-green-700 border-green-200', 
        label: 'Published Live',
        icon: CheckCircle
      },
      rejected: { 
        color: 'bg-red-50 text-red-700 border-red-200', 
        label: 'Rejected',
        icon: XCircle
      },
      sent: { 
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        label: 'Campaign Sent',
        icon: Mail
      },
      failed: { 
        color: 'bg-red-50 text-red-700 border-red-200', 
        label: 'Campaign Failed',
        icon: XCircle
      }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const IconComponent = config.icon
    
    return (
      <Badge className={`${config.color} border flex items-center gap-1 px-3 py-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    )
  }

  const getStatusOptions = (currentStatus: string) => {
    const options = [
      { value: 'pending', label: 'Pending Review' },
      { value: 'approved', label: 'Publish on Evella' },
      { value: 'rejected', label: 'Reject' }
    ]
    
    return options.filter(option => option.value !== currentStatus)
  }

  const filteredEvents = events.filter(event => {
    const matchesTab = activeTab === 'all' || event.advertisement_status === activeTab
    const matchesSearch = event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.organizer.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch
  })

  const stats = {
    total: events.length,
    pending: events.filter(e => e.advertisement_status === 'pending').length,
    approved: events.filter(e => e.advertisement_status === 'approved').length,
    rejected: events.filter(e => e.advertisement_status === 'rejected').length
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Event Publication Manager</h1>
            <p className="text-blue-100 text-lg">
              Manage which events are published on the Evella platform
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <Globe className="w-8 h-8" />
            <div>
              <p className="text-sm text-blue-100">Evella Platform</p>
              <p className="text-xs text-blue-200">Public Event Discovery</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Events</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Published</p>
                <p className="text-2xl font-bold text-green-900">{stats.approved}</p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
              </div>
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integration Test */}
      <PlatformIntegrationTest />

      {/* Filters and Search */}
      <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">All Events</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="approved">Published</TabsTrigger>
                  <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="relative">
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="group hover:shadow-xl transition-all duration-300 border-gray-200 overflow-hidden">
            <div className="relative">
              {/* Event Image */}
              {event.event_image ? (
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  <img 
                    src={event.event_image} 
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-blue-500" />
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {getStatusBadge(event.advertisement_status)}
              </div>
              
              {/* Live on Evella indicator */}
              {event.advertisement_status === 'approved' && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-green-500 text-white border-green-600 flex items-center gap-1 px-3 py-1">
                    <Globe className="w-3 h-3" />
                    Live on Evella
                  </Badge>
                </div>
              )}
            </div>
            
            <CardContent className="p-6 space-y-4">
              {/* Event Title and Organizer */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                  {event.name}
                </h3>
                <p className="text-sm text-gray-600">
                  by <span className="font-medium">{event.organizer.name}</span>
                </p>
              </div>
              
              {/* Event Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{format(new Date(event.start_date), 'MMM dd, yyyy')}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="line-clamp-1">{event.location}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{event.attendees_count} / {event.max_guests} attendees</span>
                </div>
              </div>
              
              {/* Description */}
              <p className="text-sm text-gray-600 line-clamp-3">
                {event.description}
              </p>
              
              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <Select
                  value={event.advertisement_status}
                  onValueChange={(value) => updateAdvertisementStatus(event.id, value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {getStatusOptions(event.advertisement_status).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
                        className="flex-1"
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
                          <Globe className="w-5 h-5" />
                          Advertisement Logs - {event.name}
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
                            <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
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
                        className="flex-1"
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
      
      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <Card className="bg-white/80 backdrop-blur-sm border-gray-200">
          <CardContent className="p-12 text-center">
            <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || activeTab !== 'all' 
                ? 'No events match your current filters.'
                : 'There are no events available for publication management.'
              }
            </p>
            {(searchQuery || activeTab !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('')
                  setActiveTab('all')
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
} 