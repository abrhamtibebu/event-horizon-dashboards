import { useSubscription } from '@/hooks/useSubscription'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { SubscriptionStatusBadge } from '@/components/subscription/SubscriptionStatusBadge'
import { UsageMeter } from '@/components/subscription/UsageMeter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useNavigate } from 'react-router-dom'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Calendar, CreditCard, AlertCircle } from 'lucide-react'

export default function SubscriptionManagement() {
  const { subscription, isLoading, cancelSubscription, resumeSubscription, isCancelling, isResuming } = useSubscription()
  const { usage } = useFeatureAccess()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="md" text="Loading subscription..." />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>You don't have an active subscription. Please select a plan to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard/subscription/plans')}>
              View Plans
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOnTrial = subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date()
  const trialEndsAt = subscription.trial_ends_at ? new Date(subscription.trial_ends_at) : null
  const periodEndsAt = subscription.current_period_end ? new Date(subscription.current_period_end) : null

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Subscription Management</h1>
        <p className="text-muted-foreground">Manage your subscription and view usage statistics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Current Plan</CardTitle>
              <SubscriptionStatusBadge subscription={subscription} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription.plan && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="text-lg font-semibold">{subscription.plan.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing Cycle</p>
                  <p className="text-lg font-semibold capitalize">{subscription.billing_cycle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <p className="text-lg font-semibold">
                    {subscription.billing_cycle === 'yearly'
                      ? subscription.plan.price_yearly.toLocaleString()
                      : subscription.plan.price_monthly.toLocaleString()}{' '}
                    ETB / {subscription.billing_cycle === 'yearly' ? 'year' : 'month'}
                  </p>
                </div>
                {isOnTrial && trialEndsAt && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <p className="text-sm text-blue-900">
                        Trial ends on {trialEndsAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
                {periodEndsAt && (
                  <div>
                    <p className="text-sm text-muted-foreground">Next billing date</p>
                    <p className="text-lg font-semibold">{periodEndsAt.toLocaleDateString()}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/dashboard/subscription/plans')}
            >
              Change Plan
            </Button>
            {subscription.status === 'active' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={isCancelling}>
                    Cancel Subscription
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your subscription? Your subscription will remain active until the end of the current billing period.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => cancelSubscription({ id: subscription.id, immediate: false })}
                      className="bg-destructive text-destructive-foreground"
                    >
                      Cancel Subscription
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {subscription.status === 'cancelled' && (
              <Button
                variant="default"
                className="w-full"
                onClick={() => resumeSubscription(subscription.id)}
                disabled={isResuming}
              >
                Resume Subscription
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {usage && Object.keys(usage.usage).length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Usage Statistics</CardTitle>
            <CardDescription>Track your usage across different features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {usage.usage.events && (
                <UsageMeter
                  label="Events This Month"
                  current={usage.usage.events.current}
                  limit={usage.usage.events.limit}
                  unlimited={usage.usage.events.unlimited}
                />
              )}
              {usage.usage.vendors && (
                <UsageMeter
                  label="Vendors"
                  current={usage.usage.vendors.current}
                  limit={usage.usage.vendors.limit}
                  unlimited={usage.usage.vendors.unlimited}
                />
              )}
              {usage.usage.marketing_campaigns && (
                <UsageMeter
                  label="Marketing Campaigns"
                  current={usage.usage.marketing_campaigns.current}
                  limit={usage.usage.marketing_campaigns.limit}
                  unlimited={usage.usage.marketing_campaigns.unlimited}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

