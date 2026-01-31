import { Badge } from '@/components/ui/badge'
import { type Subscription } from '@/lib/api/subscriptions'
import { cn } from '@/lib/utils'

interface SubscriptionStatusBadgeProps {
  subscription: Subscription | null
  className?: string
}

export function SubscriptionStatusBadge({ subscription, className }: SubscriptionStatusBadgeProps) {
  if (!subscription) {
    return (
      <Badge variant="outline" className={cn('bg-yellow-100 text-yellow-800 border-yellow-300', className)}>
        No Subscription
      </Badge>
    )
  }

  const statusConfig = {
    active: {
      label: 'Active',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    trial: {
      label: 'Trial',
      className: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    pending_upgrade: {
      label: 'Upgrade Pending',
      className: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    pending_downgrade: {
      label: 'Downgrade Pending',
      className: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-800 border-gray-300',
    },
    expired: {
      label: 'Expired',
      className: 'bg-red-100 text-red-800 border-red-300',
    },
    grace_period: {
      label: 'Grace Period',
      className: 'bg-orange-100 text-orange-800 border-orange-300',
    },
    past_due: {
      label: 'Past Due',
      className: 'bg-orange-100 text-orange-800 border-orange-300',
    },
  }

  const config = statusConfig[subscription.status] || statusConfig.pending
  const isOnTrial = subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date()

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={cn(config.className, className)}>
        {config.label}
      </Badge>
      {isOnTrial && (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
          Trial
        </Badge>
      )}
      {subscription.plan && (
        <Badge variant="secondary" className="ml-1">
          {subscription.plan.name}
        </Badge>
      )}
    </div>
  )
}

