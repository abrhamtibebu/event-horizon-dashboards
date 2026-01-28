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
import { Calendar, CreditCard, AlertCircle, CheckCircle2, TrendingUp, Zap, Shield, ArrowRight, Sparkles } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

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
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card className="border-2 border-dashed">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <CreditCard className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">No Active Subscription</CardTitle>
            <CardDescription className="text-base mt-2">
              You don't have an active subscription. Select a plan to unlock all features.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button onClick={() => navigate('/dashboard/subscription/plans')} size="lg" className="gap-2">
              <Sparkles className="w-4 h-4" />
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
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Subscription
        </h1>
        <p className="text-muted-foreground">Manage your subscription and track usage</p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Card - Takes 2 columns */}
        <Card className="lg:col-span-2 border-2">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {subscription.plan?.name || 'Current Plan'}
                    </CardTitle>
                    <SubscriptionStatusBadge subscription={subscription} />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {subscription.plan && (
              <>
                {/* Plan Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Billing Cycle</p>
                    <p className="text-lg font-semibold capitalize">{subscription.billing_cycle}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Price</p>
                    <p className="text-lg font-semibold">
                      {subscription.billing_cycle === 'yearly'
                        ? subscription.plan.price_yearly.toLocaleString()
                        : subscription.plan.price_monthly.toLocaleString()}{' '}
                      <span className="text-sm font-normal text-muted-foreground">
                        ETB / {subscription.billing_cycle === 'yearly' ? 'year' : 'month'}
                      </span>
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Trial Info */}
                {isOnTrial && trialEndsAt && (
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-sm mb-1">Trial Period Active</p>
                        <p className="text-sm text-muted-foreground">
                          Your trial ends on <span className="font-semibold text-foreground">{trialEndsAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Next Billing */}
                {periodEndsAt && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>Next billing date</span>
                    </div>
                    <p className="text-lg font-semibold">
                      {periodEndsAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between group"
              onClick={() => navigate('/dashboard/subscription/plans')}
            >
              <span>Change Plan</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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

      {/* Usage Statistics */}
      {usage && Object.keys(usage.usage).length > 0 && (
        <Card className="mt-6 border-2">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-primary" />
              <CardTitle>Usage Statistics</CardTitle>
            </div>
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
