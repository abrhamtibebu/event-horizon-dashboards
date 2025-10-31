import { useState } from 'react'
import { Mail, MessageSquare, Type, Image, Link as LinkIcon, Bold, Italic, Send, Eye, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import api from '@/lib/api'

interface MessageEditorProps {
  campaignType: 'email' | 'sms' | 'both'
  subject: string
  onSubjectChange: (subject: string) => void
  emailContent: string
  onEmailContentChange: (content: string) => void
  smsContent: string
  onSmsContentChange: (content: string) => void
  onNext: () => void
  onPrevious: () => void
  selectedTemplate: any
}

const MERGE_TAGS = [
  { tag: '{{first_name}}', label: 'First Name', desc: "Recipient's first name" },
  { tag: '{{last_name}}', label: 'Last Name', desc: "Recipient's last name" },
  { tag: '{{event_name}}', label: 'Event Name', desc: "Name of the event" },
  { tag: '{{event_date}}', label: 'Event Date', desc: "Event date" },
  { tag: '{{event_location}}', label: 'Event Location', desc: "Event location" },
  { tag: '{{ticket_type}}', label: 'Ticket Type', desc: "Recipient's ticket type" },
]

export function MessageEditor({
  campaignType,
  subject,
  onSubjectChange,
  emailContent,
  onEmailContentChange,
  smsContent,
  onSmsContentChange,
  onNext,
  onPrevious,
  selectedTemplate,
}: MessageEditorProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email')
  const [previewMode, setPreviewMode] = useState(false)

  const handleInsertTag = (tag: string) => {
    if (activeTab === 'email') {
      onEmailContentChange(emailContent + tag)
    } else {
      onSmsContentChange(smsContent + tag)
    }
  }

  const formatContent = (content: string) => {
    return content
      .replace(/\{\{first_name\}\}/g, '<strong>John</strong>')
      .replace(/\{\{last_name\}\}/g, '<strong>Doe</strong>')
      .replace(/\{\{event_name\}\}/g, '<strong>Tech Conference 2025</strong>')
      .replace(/\{\{event_date\}\}/g, '<strong>March 15, 2025</strong>')
      .replace(/\{\{event_location\}\}/g, '<strong>San Francisco, CA</strong>')
      .replace(/\{\{ticket_type\}\}/g, '<strong>VIP</strong>')
      .replace(/\n/g, '<br />')
  }

  const validateAndContinue = () => {
    if (campaignType === 'email' || campaignType === 'both') {
      if (!subject || !emailContent) {
        alert('Please fill in the email subject and content')
        return
      }
    }
    if (campaignType === 'sms' || campaignType === 'both') {
      if (!smsContent) {
        alert('Please fill in the SMS content')
        return
      }
      if (smsContent.length > 320) {
        alert('SMS content cannot exceed 320 characters')
        return
      }
    }
    onNext()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-gray-900">Customize Your Message</h3>
        <p className="text-gray-600 mt-2">Personalize your message with templates and merge tags</p>
      </div>

      {/* Email Editor */}
      {(campaignType === 'email' || campaignType === 'both') && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Email Content
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant={previewMode ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {previewMode ? 'Edit' : 'Preview'}
                </Button>
                <Button variant="outline" size="sm">
                  <Send className="w-4 h-4 mr-2" />
                  Send Test
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {previewMode ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-100 rounded-lg">
                  <div className="text-sm font-semibold mb-2">{subject}</div>
                  <div 
                    className="text-sm text-gray-700 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: formatContent(emailContent) }}
                  />
                </div>
                <Alert variant="info">
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    This is how your email will look. Merge tags shown in bold are sample data.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Subject Line */}
                <div>
                  <Label htmlFor="subject">Subject Line *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => onSubjectChange(e.target.value)}
                    placeholder="Enter email subject..."
                    maxLength={255}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {subject.length}/255 characters
                  </p>
                </div>

                {/* Content Editor */}
                <div>
                  <Label htmlFor="emailContent">Email Content *</Label>
                  <Textarea
                    id="emailContent"
                    value={emailContent}
                    onChange={(e) => onEmailContentChange(e.target.value)}
                    placeholder="Enter your email message..."
                    rows={12}
                    className="mt-1 font-mono text-sm"
                  />
                </div>

                {/* Merge Tags */}
                <div>
                  <Label>Available Variables</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {MERGE_TAGS.map(tag => (
                      <Button
                        key={tag.tag}
                        variant="outline"
                        size="sm"
                        onClick={() => handleInsertTag(tag.tag)}
                        title={tag.desc}
                      >
                        {tag.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Click a variable to insert it into your message
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SMS Editor */}
      {(campaignType === 'sms' || campaignType === 'both') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-green-600" />
              SMS Content
            </CardTitle>
            <CardDescription>
              Character limit: {smsContent.length}/320
              {smsContent.length > 160 && (
                <Badge variant="warning" className="ml-2">
                  Multiple messages
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                value={smsContent}
                onChange={(e) => onSmsContentChange(e.target.value)}
                placeholder="Enter your SMS message..."
                rows={6}
                maxLength={320}
                className="font-mono text-sm"
              />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  {smsContent.length > 160 ? '2 messages' : '1 message'} • {smsContent.length} characters
                </span>
                <Badge variant="outline" className={smsContent.length > 280 ? 'text-red-600' : ''}>
                  {320 - smsContent.length} remaining
                </Badge>
              </div>

              {/* Quick Tags for SMS */}
              <div>
                <Label className="text-xs">Quick Variables</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {['{{first_name}}', '{{event_name}}', '{{event_date}}'].map(tag => (
                    <Button
                      key={tag}
                      variant="outline"
                      size="sm"
                      onClick={() => onSmsContentChange(smsContent + tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>

              {/* SMS Preview */}
              <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div className="text-xs text-gray-600 mb-2">Preview:</div>
                <div className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg max-w-xs">
                  {formatContent(smsContent) || 'Your message will appear here...'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button 
          onClick={validateAndContinue}
          size="lg"
          className="px-8"
        >
          Next Step
        </Button>
      </div>
    </div>
  )
}
