import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Save,
  X,
  Shield,
  AlertCircle,
  Clock,
} from 'lucide-react'
import Breadcrumbs from '@/components/Breadcrumbs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import api from '@/lib/api'
import { toast } from 'sonner'

interface Organizer {
  id: number
  name: string
  email: string
  status: string
  suspended_at?: string
  suspended_reason?: string
}

export default function OrganizerSuspend() {
  const { organizerId } = useParams<{ organizerId: string }>()
  const navigate = useNavigate()
  const [organizer, setOrganizer] = useState<Organizer | null>(null)
  const [loading, setLoading] = useState(true)
  const [suspending, setSuspending] = useState(false)
  const [formData, setFormData] = useState({
    reason: '',
    duration: 'permanent',
    custom_duration: '',
    notes: '',
  })

  // Mock organizer data - in production this would be fetched from API
  useState(() => {
    // Simulate fetching organizer data
    setTimeout(() => {
      setOrganizer({
        id: parseInt(organizerId!),
        name: 'TechHub Addis',
        email: 'contact@techhubaddis.et',
        status: 'active',
      })
      setLoading(false)
    }, 1000)
  })

  const handleSuspend = async () => {
    if (!formData.reason.trim()) {
      toast.error('Please provide a reason for suspension')
      return
    }

    if (formData.duration === 'custom' && !formData.custom_duration.trim()) {
      toast.error('Please specify the custom duration')
      return
    }

    try {
      setSuspending(true)

      const suspendData = {
        reason: formData.reason,
        duration: formData.duration === 'custom' ? formData.custom_duration : formData.duration,
        notes: formData.notes,
      }

      await api.post(`/organizers/${organizerId}/suspend`, suspendData)

      toast.success('Organizer suspended successfully!')
      navigate('/dashboard/organizers')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to suspend organizer')
    } finally {
      setSuspending(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent p-6">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!organizer) {
    return (
      <div className="min-h-screen bg-transparent p-6">
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h2 className="text-2xl font-bold mb-2">Organizer Not Found</h2>
          <p className="text-muted-foreground mb-6">The requested organizer could not be found.</p>
          <Button onClick={() => navigate('/dashboard/organizers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Organizers
          </Button>
        </div>
      </div>
    )
  }

  if (organizer.status === 'suspended') {
    return (
      <div className="min-h-screen bg-transparent p-6">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Organizers', href: '/dashboard/organizers' },
            { label: 'Suspend Operations' },
          ]}
        />

        <div className="max-w-2xl mx-auto">
          <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
              <CardTitle className="text-2xl">Already Suspended</CardTitle>
              <CardDescription>
                This organizer is already suspended and cannot be suspended again.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="space-y-2 mb-6">
                <p className="font-semibold">{organizer.name}</p>
                <p className="text-sm text-muted-foreground">{organizer.email}</p>
                {organizer.suspended_reason && (
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium">Suspension Reason:</p>
                    <p className="text-sm text-muted-foreground mt-1">{organizer.suspended_reason}</p>
                  </div>
                )}
              </div>
              <Button onClick={() => navigate('/dashboard/organizers')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Organizers
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent p-6">
      <Breadcrumbs
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Organizers', href: '/dashboard/organizers' },
          { label: 'Suspend Operations' },
        ]}
      />

      <div className="max-w-2xl mx-auto space-y-8">
        {/* Warning Alert */}
        <Alert className="border-orange-500/50 bg-orange-500/10">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-orange-700 dark:text-orange-300">
            <strong>Warning:</strong> Suspending an organizer will prevent them from creating new events,
            managing existing events, and accessing their dashboard. This action should only be taken
            for serious compliance violations or security concerns.
          </AlertDescription>
        </Alert>

        {/* Organizer Info */}
        <Card className="bg-card/40 backdrop-blur-xl border-white/10 shadow-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Suspend Organizer Operations
            </CardTitle>
            <CardDescription>
              Temporarily or permanently suspend all operations for this organizer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted/50 rounded-lg mb-6">
              <h4 className="font-semibold mb-2">Organizer Details</h4>
              <div className="space-y-1">
                <p className="text-sm"><span className="font-medium">Name:</span> {organizer.name}</p>
                <p className="text-sm"><span className="font-medium">Email:</span> {organizer.email}</p>
                <p className="text-sm"><span className="font-medium">Status:</span>
                  <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-600 rounded text-xs">
                    Active
                  </span>
                </p>
              </div>
            </div>

            <form className="space-y-6">
              {/* Suspension Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-sm font-semibold">
                  Reason for Suspension *
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a detailed reason for suspending this organizer..."
                  value={formData.reason}
                  onChange={(e) => handleInputChange('reason', e.target.value)}
                  rows={4}
                  required
                />
              </div>

              {/* Suspension Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-semibold">
                  Suspension Duration
                </Label>
                <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select suspension duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temporary">Temporary (7 days)</SelectItem>
                    <SelectItem value="extended">Extended (30 days)</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="custom">Custom Duration</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Duration */}
              {formData.duration === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="custom_duration" className="text-sm font-semibold">
                    Custom Duration *
                  </Label>
                  <Input
                    id="custom_duration"
                    placeholder="e.g., 14 days, 3 months, until further notice"
                    value={formData.custom_duration}
                    onChange={(e) => handleInputChange('custom_duration', e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-semibold">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional information or instructions..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-white/10">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/organizers')}
                  disabled={suspending}
                  className="border-red-500/50 text-red-600 hover:bg-red-500/10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSuspend}
                  disabled={suspending || !formData.reason.trim()}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {suspending ? 'Suspending...' : 'Suspend Operations'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Consequences Alert */}
        <Alert className="border-red-500/50 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-700 dark:text-red-300">
            <strong>Consequences of Suspension:</strong>
            <ul className="mt-2 ml-4 list-disc space-y-1">
              <li>All events will be temporarily hidden from public view</li>
              <li>Organizer cannot create new events or edit existing ones</li>
              <li>Access to organizer dashboard will be restricted</li>
              <li>All pending event approvals will be put on hold</li>
              <li>Existing ticket sales will continue but new sales will be blocked</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
