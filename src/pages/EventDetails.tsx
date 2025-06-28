import { useState, useEffect } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  Mail,
  Phone,
  MessageSquare,
  Download,
  Printer,
  QrCode,
  UserPlus,
  Plus,
  Edit,
  Settings,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  MoreHorizontal,
  Send,
  FileText,
  BarChart3,
  Upload,
  Star,
  Shield,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DashboardCard } from '@/components/DashboardCard'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import api from '@/lib/api'

export default function EventDetails() {
  const { eventId } = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [guestTypeFilter, setGuestTypeFilter] = useState('all')
  const [checkedInFilter, setCheckedInFilter] = useState('all')
  const [isAssignUsherDialogOpen, setIsAssignUsherDialogOpen] = useState(false)
  const [isNewConversationDialogOpen, setIsNewConversationDialogOpen] =
    useState(false)
  const [isCommunicationDialogOpen, setIsCommunicationDialogOpen] =
    useState(false)

  const [eventData, setEventData] = useState<any>(null)
  const [eventLoading, setEventLoading] = useState(true)
  const [eventError, setEventError] = useState<string | null>(null)
  const [attendees, setAttendees] = useState<any[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState(true)
  const [attendeesError, setAttendeesError] = useState<string | null>(null)

  // Fetch event details
  useEffect(() => {
    if (!eventId) return
    setEventLoading(true)
    setEventError(null)
    api
      .get(`/events/${eventId}`)
      .then((res) => setEventData(res.data))
      .catch((err) => setEventError('Failed to fetch event details.'))
      .finally(() => setEventLoading(false))
  }, [eventId])

  // Fetch attendees
  useEffect(() => {
    if (!eventId) return
    setAttendeesLoading(true)
    setAttendeesError(null)
    api
      .get(`/events/${eventId}/attendees`)
      .then((res) => setAttendees(res.data))
      .catch((err) => setAttendeesError('Failed to fetch attendees.'))
      .finally(() => setAttendeesLoading(false))
  }, [eventId])

  if (eventLoading) {
    return <div className="text-center py-12">Loading event details...</div>
  }
  if (eventError || !eventData) {
    return <Navigate to="/dashboard/events" replace />
  }

  const getGuestTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'speaker':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'vip':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'staff':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'visitor':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getGuestTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'speaker':
        return <Star className="w-3 h-3" />
      case 'vip':
        return <Award className="w-3 h-3" />
      case 'staff':
        return <Shield className="w-3 h-3" />
      default:
        return <Users className="w-3 h-3" />
    }
  }

  const filteredAttendees = attendees.filter((attendee) => {
    const matchesSearch =
      attendee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      attendee.company?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGuestType =
      guestTypeFilter === 'all' ||
      attendee.guestType?.toLowerCase() === guestTypeFilter
    const matchesCheckedIn =
      checkedInFilter === 'all' ||
      (checkedInFilter === 'checked-in' && attendee.checkedIn) ||
      (checkedInFilter === 'not-checked-in' && !attendee.checkedIn)
    return matchesSearch && matchesGuestType && matchesCheckedIn
  })

  const generateBadge = (attendee: (typeof attendees)[0]) => {
    toast.success(`Badge generated for ${attendee.name}`)
    // In a real application, this would generate a PDF badge
  }

  const exportCSV = () => {
    toast.success('Attendee data exported to CSV')
    // In a real application, this would generate and download a CSV file
  }

  const generateReport = () => {
    toast.success('Event summary report generated')
    // In a real application, this would generate a comprehensive report
  }

  const exportLogs = () => {
    toast.success('Event logs exported')
    // In a real application, this would export audit logs
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              to="/dashboard/events"
              className="text-yellow-500 hover:text-yellow-600 text-sm"
            >
              ← Back to Events
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{eventData.name}</h1>
          <p className="text-gray-600 mt-1">Event ID: {eventData.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={exportLogs}>
            <FileText className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
          <Button variant="outline" onClick={generateReport}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Generate Report
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <Edit className="w-4 h-4 mr-2" />
            Edit Event
          </Button>
        </div>
      </div>

      {/* Event Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DashboardCard title="Event Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-medium">
                      {eventData.startDate} - {eventData.endDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-medium">
                      {eventData.startTime} - {eventData.endTime}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{eventData.location}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {eventData.description}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Organizer</p>
                  <p className="font-medium">{eventData.organizer}</p>
                </div>
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  {eventData.status}
                </Badge>
              </div>
            </div>
          </DashboardCard>
        </div>

        <div className="space-y-4">
          <DashboardCard title="Quick Stats" className="text-center">
            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {eventData.registeredAttendees}
                </div>
                <div className="text-sm text-gray-600">Registered</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {eventData.checkedInAttendees}
                </div>
                <div className="text-sm text-gray-600">Checked In</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gray-600">
                  {eventData.maxGuests}
                </div>
                <div className="text-sm text-gray-600">Max Capacity</div>
              </div>
            </div>
          </DashboardCard>

          <DashboardCard title="Quick Actions">
            <div className="space-y-2">
              <Dialog
                open={isAssignUsherDialogOpen}
                onOpenChange={setIsAssignUsherDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Usher
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign Usher to Event</DialogTitle>
                    <DialogDescription>
                      Select an usher and assign tasks for this event.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Usher</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose an usher" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ush_1">David Wilson</SelectItem>
                          <SelectItem value="ush_2">Lisa Brown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Assign Tasks</Label>
                      <Textarea placeholder="Enter tasks separated by commas" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAssignUsherDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                      Assign Usher
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isNewConversationDialogOpen}
                onOpenChange={setIsNewConversationDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    New Conversation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Start New Conversation</DialogTitle>
                    <DialogDescription>
                      Send a message to attendees or ushers.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Recipients</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select recipients" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-attendees">
                            All Attendees
                          </SelectItem>
                          <SelectItem value="speakers">
                            Speakers Only
                          </SelectItem>
                          <SelectItem value="vips">VIP Guests</SelectItem>
                          <SelectItem value="ushers">Ushers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Subject</Label>
                      <Input placeholder="Message subject" />
                    </div>
                    <div>
                      <Label>Message</Label>
                      <Textarea placeholder="Type your message here..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsNewConversationDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isCommunicationDialogOpen}
                onOpenChange={setIsCommunicationDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    Broadcast
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Communication Broadcast</DialogTitle>
                    <DialogDescription>
                      Send email, SMS, or voice broadcast to attendees.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Communication Type</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="voice">Voice Broadcast</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Target Audience</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Attendees</SelectItem>
                          <SelectItem value="checked-in">
                            Checked-in Only
                          </SelectItem>
                          <SelectItem value="not-checked-in">
                            Not Checked-in
                          </SelectItem>
                          <SelectItem value="speakers">Speakers</SelectItem>
                          <SelectItem value="vips">VIPs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Message Content</Label>
                      <Textarea placeholder="Enter your message content..." />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCommunicationDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                      Send Broadcast
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* Attendee Management */}
      <DashboardCard title="Attendee Management">
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search attendees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={guestTypeFilter} onValueChange={setGuestTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="speaker">Speakers</SelectItem>
                <SelectItem value="vip">VIPs</SelectItem>
                <SelectItem value="visitor">Visitors</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
            <Select value={checkedInFilter} onValueChange={setCheckedInFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="checked-in">Checked In</SelectItem>
                <SelectItem value="not-checked-in">Not Checked In</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Attendees Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attendee</TableHead>
                <TableHead>Company & Title</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Guest Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendees.map((attendee) => (
                <TableRow key={attendee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={attendee.profileImage}
                        alt={attendee.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {attendee.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {attendee.country}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">
                        {attendee.company}
                      </div>
                      <div className="text-sm text-gray-500">
                        {attendee.jobTitle}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {attendee.email}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {attendee.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getGuestTypeColor(attendee.guestType)}>
                      <div className="flex items-center gap-1">
                        {getGuestTypeIcon(attendee.guestType)}
                        {attendee.guestType}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {attendee.checkedIn ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span
                        className={`text-sm ${
                          attendee.checkedIn ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {attendee.checkedIn ? 'Checked In' : 'Not Checked In'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateBadge(attendee)}
                        title="Print Badge"
                      >
                        <Printer className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        title="Generate QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" title="Send Message">
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DashboardCard>

      {/* Usher Management */}
      <DashboardCard title="Assigned Ushers">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              Manage ushering staff for this event
            </p>
            <Button
              variant="outline"
              onClick={() => setIsAssignUsherDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Usher
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ushers.map((usher) => (
              <div
                key={usher.id}
                className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{usher.name}</h4>
                    <p className="text-sm text-gray-600">{usher.email}</p>
                    <p className="text-sm text-gray-600">{usher.phone}</p>
                  </div>
                  <Badge
                    className={
                      usher.availability === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {usher.availability}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Assigned Tasks:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {usher.tasks.map((task, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {task}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" size="sm">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Message
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardCard>
    </div>
  )
}
