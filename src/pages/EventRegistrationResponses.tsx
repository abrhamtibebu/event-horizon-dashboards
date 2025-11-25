import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, FileText, Search, Filter, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import Breadcrumbs from '@/components/Breadcrumbs'
import { getCustomFieldResponses, exportCustomResponses, getEventCustomFields } from '@/lib/customFieldsApi'
import type { AttendeeCustomFieldResponses, CustomField } from '@/types/customFields'
import { useModernAlerts } from '@/hooks/useModernAlerts'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getCustomFieldFileUrl } from '@/lib/customFieldsApi'

export default function EventRegistrationResponses() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { showError, showSuccess } = useModernAlerts()
  
  const [responses, setResponses] = useState<AttendeeCustomFieldResponses[]>([])
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFieldFilter, setSelectedFieldFilter] = useState<string>('all')

  useEffect(() => {
    if (eventId) {
      fetchData()
    }
  }, [eventId])

  const fetchData = async () => {
    if (!eventId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const [responsesData, fieldsData] = await Promise.all([
        getCustomFieldResponses(Number(eventId)),
        getEventCustomFields(Number(eventId)),
      ])
      
      setResponses(Array.isArray(responsesData) ? responsesData : [])
      setCustomFields(fieldsData)
    } catch (err: any) {
      setError(err.message || 'Failed to load responses')
      showError('Error', 'Failed to load registration responses')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: 'csv' | 'excel' = 'csv') => {
    if (!eventId) return
    
    try {
      const blob = await exportCustomResponses(Number(eventId), format)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `custom-field-responses-${eventId}-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      showSuccess('Export Successful', 'Responses exported successfully')
    } catch (err: any) {
      showError('Export Failed', err.message || 'Failed to export responses')
    }
  }

  const handleDownloadFile = async (fileId: string) => {
    try {
      const url = await getCustomFieldFileUrl(fileId)
      window.open(url, '_blank')
    } catch (err: any) {
      showError('Download Failed', err.message || 'Failed to download file')
    }
  }

  const filteredResponses = responses.filter((response) => {
    const matchesSearch =
      response.guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.guest.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (selectedFieldFilter === 'all') {
      return matchesSearch
    }
    
    // Filter by field value
    const fieldId = Number(selectedFieldFilter)
    const hasResponse = response.responses.some(r => r.custom_field_id === fieldId)
    return matchesSearch && hasResponse
  })

  const getResponseValue = (response: AttendeeCustomFieldResponses, fieldId: number) => {
    const fieldResponse = response.responses.find(r => r.custom_field_id === fieldId)
    if (!fieldResponse) return '-'
    
    if (fieldResponse.custom_field?.field_type === 'file') {
      return fieldResponse.response_file ? 'File uploaded' : '-'
    }
    
    return fieldResponse.response_value || '-'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" text="Loading responses..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => fetchData()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Events', href: '/dashboard/events' },
          { label: 'Event Details', href: `/dashboard/events/${eventId}` },
          { label: 'Registration Responses' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Registration Responses</h1>
          <p className="text-muted-foreground">
            View and export custom field responses for this event
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/dashboard/events/${eventId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Event
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={responses.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedFieldFilter} onValueChange={setSelectedFieldFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by field" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fields</SelectItem>
            {customFields.map((field) => (
              <SelectItem key={field.id} value={String(field.id)}>
                {field.field_label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Responses Table */}
      {filteredResponses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No responses found</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Attendee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Guest Type</TableHead>
                  {customFields.map((field) => (
                    <TableHead key={field.id}>{field.field_label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResponses.map((response) => (
                  <TableRow key={response.attendee_id}>
                    <TableCell className="font-medium">
                      {response.guest.name}
                    </TableCell>
                    <TableCell>{response.guest.email}</TableCell>
                    <TableCell>{response.guest.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{response.guest_type || '-'}</Badge>
                    </TableCell>
                    {customFields.map((field) => {
                      const value = getResponseValue(response, field.id!)
                      const fieldResponse = response.responses.find(r => r.custom_field_id === field.id)
                      
                      return (
                        <TableCell key={field.id}>
                          {field.field_type === 'file' && fieldResponse?.response_file ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadFile(fieldResponse.response_file!)}
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          ) : (
                            <span className="text-sm">{value}</span>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Statistics */}
      {customFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Total Responses</div>
            <div className="text-2xl font-bold">{filteredResponses.length}</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Custom Fields</div>
            <div className="text-2xl font-bold">{customFields.length}</div>
          </div>
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Completion Rate</div>
            <div className="text-2xl font-bold">
              {responses.length > 0
                ? Math.round(
                    (filteredResponses.reduce(
                      (sum, r) => sum + r.responses.length,
                      0
                    ) /
                      (responses.length * customFields.length)) *
                      100
                  )
                : 0}
              %
            </div>
          </div>
        </div>
      )}
    </div>
  )
}




