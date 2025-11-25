import { useState } from 'react'
import { Send, Clock, Calendar, Users, Mail, MessageSquare, CheckCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import api from '@/lib/api'

interface ScheduleReviewProps {
  onSend: (data: any) => void
  onPrevious: () => void
  selectedTemplate: any
  selectedEventId: string
  audienceType: string
  recipientCount: number
  campaignType: 'email' | 'sms' | 'both'
  subject: string
  emailContent: string
  smsContent: string
  selectedTicketTypes?: string[]
  onlyCheckedIn?: boolean
}

export function ScheduleReview({
  onSend,
  onPrevious,
  selectedTemplate,
  selectedEventId,
  audienceType,
  recipientCount,
  campaignType,
  subject,
  emailContent,
  smsContent,
  selectedTicketTypes = [],
  onlyCheckedIn = false,
}: ScheduleReviewProps) {
  const [sendOption, setSendOption] = useState<'now' | 'later'>('now')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleFinalSend = async () => {
    setIsSending(true)
    try {
      const campaignData: any = {
        name: `Campaign - ${selectedTemplate?.name || 'Custom'}`,
        type: campaignType,
        template_id: selectedTemplate?.id || null,
        event_id: selectedEventId,
        segment_id: null, // Will be created from audience type
        audience_type: audienceType,
        selected_ticket_types: selectedTicketTypes,
        only_checked_in: onlyCheckedIn,
        scheduled_at: sendOption === 'later' && scheduledDate && scheduledTime 
          ? `${scheduledDate}T${scheduledTime}:00`
          : null,
        status: sendOption === 'now' ? 'draft' : 'scheduled',
        total_recipients: recipientCount,
      }

      // Only include content fields that are relevant to the campaign type
      if (campaignType !== 'sms') {
        campaignData.subject = subject
        campaignData.email_content = emailContent
      }
      if (campaignType !== 'email') {
        campaignData.sms_content = smsContent
      }

      const response = await api.post('/marketing/campaigns', campaignData)
      
      if (sendOption === 'now') {
        // Send immediately - handle timeout gracefully
        try {
          await api.post(`/marketing/campaigns/${response.data.campaign.id}/send`, {}, {
            timeout: 60000 // 60 seconds for email sending
          })
          toast.success('Campaign Sent!', {
            description: `Your campaign has been sent to ${recipientCount} recipients`,
          })
        } catch (sendError: any) {
          // If send fails, campaign is still created - just inform user
          console.warn('Campaign created but sending may be in progress:', sendError)
          toast.warning('Campaign Created', {
            description: `Campaign created successfully. Sending emails in the background. You can check the status in the campaigns list.`,
          })
        }
      } else {
        toast.success('Campaign Scheduled', {
          description: `Your campaign is scheduled to send to ${recipientCount} recipients`,
        })
      }

      onSend(response.data.campaign)
    } catch (error: any) {
      console.error('Error creating campaign:', error)
      // Log detailed error information
      if (error.response) {
        console.error('Error response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        })
      } else if (error.request) {
        console.error('Error request:', error.request)
      } else {
        console.error('Error message:', error.message)
      }
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Please try again.'
      toast.error('Failed to create campaign', {
        description: errorMessage,
      })
    } finally {
      setIsSending(false)
    }
  }

  const getCampaignTypeIcon = () => {
    if (campaignType === 'email') return <Mail className="w-4 h-4" />
    if (campaignType === 'sms') return <MessageSquare className="w-4 h-4" />
    return <Mail className="w-4 h-4" /> // Both
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900">Review & Send</h3>
        <p className="text-gray-600 mt-2">Review your campaign and choose when to send it</p>
      </div>

      {/* Review Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            Campaign Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Recipient Count */}
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Recipients</span>
            </div>
            <Badge variant="outline" className="text-lg font-bold">
              {recipientCount} people
            </Badge>
          </div>

          {/* Campaign Type */}
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-2">
              {getCampaignTypeIcon()}
              <span className="font-medium">Type</span>
            </div>
            <Badge variant="outline" className="capitalize">
              {campaignType === 'both' ? 'Email & SMS' : campaignType}
            </Badge>
          </div>

          {/* Template */}
          {selectedTemplate && (
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-2">
                <span className="font-medium">Template</span>
              </div>
              <span className="text-sm text-gray-600">{selectedTemplate.name}</span>
            </div>
          )}

          {/* Subject Preview */}
          {campaignType !== 'sms' && subject && (
            <div className="py-3">
              <div className="font-medium mb-2">Email Subject:</div>
              <div className="text-sm text-gray-700 font-semibold">"{subject}"</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            When should this campaign send?
          </CardTitle>
          <CardDescription>Choose to send immediately or schedule for later</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup value={sendOption} onValueChange={(v) => setSendOption(v as 'now' | 'later')}>
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
              <RadioGroupItem value="now" id="now" className="mt-1" />
              <Label htmlFor="now" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-green-600" />
                  <span className="font-semibold">Send Now</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Send this campaign immediately to all recipients
                </div>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer mt-2">
              <RadioGroupItem value="later" id="later" className="mt-1" />
              <Label htmlFor="later" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold">Schedule for Later</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Choose a specific date and time to send this campaign
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Schedule Date/Time Picker */}
          {sendOption === 'later' && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled-date">Date</Label>
                  <Input
                    id="scheduled-date"
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="scheduled-time">Time</Label>
                  <Input
                    id="scheduled-time"
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-600">
                Campaign will be sent to {recipientCount} recipients at the scheduled time
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Important Notice */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <div className="text-yellow-600">⚠️</div>
          <div className="text-sm">
            <strong>Before sending:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-700">
              <li>Make sure your message content is correct</li>
              <li>Verify the recipient count</li>
              <li>Consider sending a test message first</li>
              {sendOption === 'now' && <li className="text-yellow-800">Campaign will send immediately to {recipientCount} people</li>}
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onPrevious} disabled={isSending}>
          Previous
        </Button>
        <Button 
          onClick={handleFinalSend}
          size="lg"
          className="px-8"
          disabled={isSending || (sendOption === 'later' && (!scheduledDate || !scheduledTime))}
        >
          {isSending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              {sendOption === 'now' ? 'Send to 250 People' : 'Schedule Campaign'}
              <Send className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
