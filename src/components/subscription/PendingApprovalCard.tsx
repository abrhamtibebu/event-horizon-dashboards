import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { type Subscription } from '@/lib/api/subscriptions'
import { format } from 'date-fns'
import { ArrowUp, ArrowDown, CheckCircle2, XCircle, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PendingApprovalCardProps {
  subscription: Subscription
  onApprove: () => void
  onReject: () => void
  isApproving?: boolean
  isRejecting?: boolean
}

export function PendingApprovalCard({
  subscription,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: PendingApprovalCardProps) {
  const isUpgrade = subscription.status === 'pending_upgrade'
  const requestedPlan = subscription.requestedPlan || subscription.scheduledPlan
  const currentPlan = subscription.plan

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {isUpgrade ? (
                <ArrowUp className="w-5 h-5 text-purple-600" />
              ) : (
                <ArrowDown className="w-5 h-5 text-amber-600" />
              )}
              <CardTitle className="text-lg">
                {isUpgrade ? 'Upgrade Request' : 'Downgrade Request'}
              </CardTitle>
              <Badge
                variant="outline"
                className={cn(
                  isUpgrade
                    ? 'bg-purple-100 text-purple-800 border-purple-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                )}
              >
                {isUpgrade ? 'Upgrade' : 'Downgrade'}
              </Badge>
            </div>
            <CardDescription>
              <div className="flex items-center gap-2 mt-1">
                <User className="w-4 h-4" />
                <span>{subscription.organizer?.name || 'Organizer'}</span>
              </div>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Plan Comparison */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-muted/50">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current Plan</p>
            <p className="font-semibold">{currentPlan?.name || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">
              {subscription.billing_cycle === 'yearly'
                ? `${currentPlan?.price_yearly?.toLocaleString() || 0} ETB/year`
                : `${currentPlan?.price_monthly?.toLocaleString() || 0} ETB/month`}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">
              {isUpgrade ? 'Requested Plan' : 'Scheduled Plan'}
            </p>
            <p className="font-semibold">{requestedPlan?.name || 'N/A'}</p>
            <p className="text-sm text-muted-foreground">
              {subscription.billing_cycle === 'yearly'
                ? `${requestedPlan?.price_yearly?.toLocaleString() || 0} ETB/year`
                : `${requestedPlan?.price_monthly?.toLocaleString() || 0} ETB/month`}
            </p>
          </div>
        </div>

        {/* Request Info */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>
            Requested on {format(new Date(subscription.created_at), 'MMM d, yyyy HH:mm')}
          </span>
        </div>

        {isUpgrade && subscription.current_period_end && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Note:</strong> Upgrade will be applied immediately upon approval.
            </p>
          </div>
        )}

        {!isUpgrade && subscription.current_period_end && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>Note:</strong> Downgrade will be applied at the next billing cycle (
              {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}).
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            className="flex-1"
            onClick={onApprove}
            disabled={isApproving || isRejecting}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {isApproving ? 'Approving...' : 'Approve'}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={onReject}
            disabled={isApproving || isRejecting}
          >
            <XCircle className="w-4 h-4 mr-2" />
            {isRejecting ? 'Rejecting...' : 'Reject'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
