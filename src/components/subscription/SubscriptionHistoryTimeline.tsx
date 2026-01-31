import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { type SubscriptionHistory } from '@/lib/api/subscriptions'
import { format } from 'date-fns'
import { Clock, User, Shield, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SubscriptionHistoryTimelineProps {
  history: SubscriptionHistory[]
  className?: string
}

export function SubscriptionHistoryTimeline({ history, className }: SubscriptionHistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Subscription History</CardTitle>
          <CardDescription>No history available</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      subscription_created: 'Subscription Created',
      trial_created: 'Trial Started',
      trial_extended: 'Trial Extended',
      trial_modified: 'Trial Modified',
      trial_reactivated: 'Trial Reactivated',
      upgrade_requested: 'Upgrade Requested',
      upgrade_approved: 'Upgrade Approved',
      upgrade_rejected: 'Upgrade Rejected',
      downgrade_requested: 'Downgrade Requested',
      downgrade_approved: 'Downgrade Approved',
      downgrade_rejected: 'Downgrade Rejected',
      downgrade_scheduled: 'Downgrade Scheduled',
      downgrade_applied: 'Downgrade Applied',
      subscription_extended: 'Subscription Extended',
      subscription_expired: 'Subscription Expired',
      subscription_cancelled: 'Subscription Cancelled',
      grace_period_entered: 'Grace Period Started',
      grace_period_ended: 'Grace Period Ended',
      plan_assigned: 'Plan Assigned',
    }
    return labels[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getActionIcon = (action: string) => {
    if (action.includes('upgrade')) return <Zap className="w-4 h-4" />
    if (action.includes('trial')) return <Clock className="w-4 h-4" />
    if (action.includes('admin') || action.includes('approved')) return <Shield className="w-4 h-4" />
    return <User className="w-4 h-4" />
  }

  const getPerformerBadge = (performedBy: string) => {
    const config = {
      admin: { label: 'Admin', className: 'bg-purple-100 text-purple-800' },
      organizer: { label: 'You', className: 'bg-blue-100 text-blue-800' },
      system: { label: 'System', className: 'bg-gray-100 text-gray-800' },
    }
    const cfg = config[performedBy as keyof typeof config] || config.system
    return (
      <Badge variant="outline" className={cn('text-xs', cfg.className)}>
        {cfg.label}
      </Badge>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Subscription History</CardTitle>
        <CardDescription>Track all changes to your subscription</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((item, index) => (
            <div key={item.id} className="relative flex gap-4 pb-4 last:pb-0">
              {/* Timeline line */}
              {index < history.length - 1 && (
                <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-border" />
              )}
              
              {/* Icon */}
              <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                {getActionIcon(item.action)}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{getActionLabel(item.action)}</p>
                    {getPerformerBadge(item.performed_by)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
                
                {item.oldPlan && item.newPlan && (
                  <p className="text-sm text-muted-foreground">
                    Changed from <span className="font-medium">{item.oldPlan.name}</span> to{' '}
                    <span className="font-medium">{item.newPlan.name}</span>
                  </p>
                )}
                
                {item.metadata && Object.keys(item.metadata).length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    {item.metadata.days && <span>Trial days: {item.metadata.days}</span>}
                    {item.metadata.scheduled_for && (
                      <span>Scheduled for: {format(new Date(item.metadata.scheduled_for), 'MMM d, yyyy')}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
