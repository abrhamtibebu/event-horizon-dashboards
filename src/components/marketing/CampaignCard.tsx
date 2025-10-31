import { useState } from 'react'
import { 
  Mail, 
  MessageSquare, 
  Users, 
  Eye, 
  MousePointer, 
  Calendar,
  Pause,
  Play,
  XCircle,
  CheckCircle2,
  Edit,
  Trash2,
  MoreVertical
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import api from '@/lib/api'
import { toast } from 'sonner'

interface CampaignCardProps {
  campaign: {
    id: number
    name: string
    description?: string
    type: 'email' | 'sms' | 'both'
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled'
    total_recipients: number
    sent_count: number
    opened_count: number
    clicked_count: number
    scheduled_at: string | null
    created_at: string
    event?: { title: string }
  }
  onUpdate?: () => void
}

export function CampaignCard({ campaign, onUpdate }: CampaignCardProps) {
  const [loading, setLoading] = useState(false)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 border-gray-300',
      scheduled: 'bg-blue-100 text-blue-800 border-blue-300',
      sending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      sent: 'bg-green-100 text-green-800 border-green-300',
      paused: 'bg-orange-100 text-orange-800 border-orange-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Calendar className="w-3 h-3" />
      case 'sending':
        return <Mail className="w-3 h-3" />
      case 'sent':
        return <CheckCircle2 className="w-3 h-3" />
      case 'paused':
        return <Pause className="w-3 h-3" />
      case 'cancelled':
        return <XCircle className="w-3 h-3" />
      default:
        return <Edit className="w-3 h-3" />
    }
  }

  const handleAction = async (action: string) => {
    if (action === 'delete') {
      if (!confirm('Are you sure you want to delete this campaign?')) return
    }

    setLoading(true)
    try {
      await api.post(`/marketing/campaigns/${campaign.id}/${action}`)
      toast.success(`Campaign ${action}ed successfully`)
      onUpdate?.()
    } catch (error) {
      console.error(`Error ${action}ing campaign:`, error)
      toast.error(`Failed to ${action} campaign`)
    } finally {
      setLoading(false)
    }
  }

  const openRate = campaign.sent_count > 0 
    ? ((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)
    : '0'
  
  const clickRate = campaign.sent_count > 0
    ? ((campaign.clicked_count / campaign.sent_count) * 100).toFixed(1)
    : '0'

  const progressPercentage = campaign.total_recipients > 0
    ? ((campaign.sent_count / campaign.total_recipients) * 100)
    : 0

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {campaign.type === 'email' && <Mail className="w-4 h-4 text-blue-600" />}
              {campaign.type === 'sms' && <MessageSquare className="w-4 h-4 text-green-600" />}
              {campaign.type === 'both' && (
                <div className="flex">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <MessageSquare className="w-4 h-4 text-green-600 -ml-2" />
                </div>
              )}
              <CardTitle className="text-lg">{campaign.name}</CardTitle>
            </div>
            {campaign.description && (
              <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
            )}
            {campaign.event && (
              <div className="text-sm text-gray-600 mt-1">{campaign.event.title}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(campaign.status)} border`}>
              <span className="mr-1">{getStatusIcon(campaign.status)}</span>
              {campaign.status}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {/* Edit */}}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                {campaign.status === 'sending' && (
                  <DropdownMenuItem onClick={() => handleAction('pause')}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </DropdownMenuItem>
                )}
                {campaign.status === 'paused' && (
                  <DropdownMenuItem onClick={() => handleAction('send')}>
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </DropdownMenuItem>
                )}
                {campaign.status === 'draft' && (
                  <DropdownMenuItem onClick={() => handleAction('send')}>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Now
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => handleAction('cancel')}
                  className="text-red-600"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleAction('delete')}
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        {campaign.status === 'sending' && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">Sending progress</span>
              <span className="font-semibold">
                {campaign.sent_count} / {campaign.total_recipients}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">
                {campaign.total_recipients}
              </span>
            </div>
            <p className="text-xs text-gray-600">Recipients</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                {openRate}%
              </span>
            </div>
            <p className="text-xs text-gray-600">Open Rate</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <MousePointer className="w-4 h-4 text-purple-600" />
              <span className="text-2xl font-bold text-purple-600">
                {clickRate}%
              </span>
            </div>
            <p className="text-xs text-gray-600">Click Rate</p>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="flex justify-between text-sm text-gray-600 pt-3 border-t">
          <div>
            <span className="font-medium">Opened:</span> {campaign.opened_count}
          </div>
          <div>
            <span className="font-medium">Clicked:</span> {campaign.clicked_count}
          </div>
          {campaign.scheduled_at && (
            <div>
              <span className="font-medium">Scheduled:</span>{' '}
              {new Date(campaign.scheduled_at).toLocaleDateString()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
