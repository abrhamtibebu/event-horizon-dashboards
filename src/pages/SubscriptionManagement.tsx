import { useQuery } from '@tanstack/react-query'
import { useSubscription } from '@/hooks/useSubscription'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { SubscriptionStatusBadge } from '@/components/subscription/SubscriptionStatusBadge'
import { SubscriptionHistoryTimeline } from '@/components/subscription/SubscriptionHistoryTimeline'
import { UsageMeter } from '@/components/subscription/UsageMeter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useNavigate } from 'react-router-dom'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Calendar, CreditCard, AlertCircle, CheckCircle2, TrendingUp, Zap, Shield, ArrowRight, Sparkles, Clock, History } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'framer-motion'
import { subscriptionsApi } from '@/lib/api/subscriptions'

export default function SubscriptionManagement() {
  const { subscription, isLoading, cancelSubscription, resumeSubscription, isCancelling, isResuming } = useSubscription()
  const { usage } = useFeatureAccess()
  const navigate = useNavigate()

  // Fetch subscription history
  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ['subscription-history'],
    queryFn: () => subscriptionsApi.getSubscriptionHistory(),
    enabled: !!subscription,
  })

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
        <Card className="lg:col-span-2 border-2 overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Sparkles className="w-24 h-24" />
          </div>
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
                    <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black tracking-tight uppercase">
                      {subscription.plan?.name || 'Current Plan'}
                    </h2>
                    <SubscriptionStatusBadge subscription={subscription} className="mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {subscription.plan && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 p-6 rounded-2xl bg-muted/30 border border-muted/50">
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Billing Cycle</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <p className="text-xl font-bold capitalize">{subscription.billing_cycle}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Commitment</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary" />
                      <p className="text-xl font-bold">
                        {subscription.billing_cycle === 'yearly'
                          ? subscription.plan.price_yearly.toLocaleString()
                          : subscription.plan.price_monthly.toLocaleString()}{' '}
                        <span className="text-sm font-medium text-muted-foreground text-opacity-70">
                          ETB / {subscription.billing_cycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status-specific banners */}
                {isOnTrial && trialEndsAt && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-1 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-transparent border border-primary/20 shadow-sm"
                  >
                    <div className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                        <History className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm">Experimental Access Active</p>
                        <p className="text-xs text-muted-foreground">
                          Trial ends <span className="text-foreground font-semibold">{trialEndsAt.toLocaleDateString()}</span>
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Next Billing */}
                {periodEndsAt && (
                  <div className="flex items-center justify-between p-4 rounded-xl border border-dashed border-muted-foreground/30">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">Upcoming Renewal</p>
                    </div>
                    <p className="font-bold text-sm">
                      {periodEndsAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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

      {/* Usage Statistics & History Tabs */}
      <Tabs defaultValue="usage" className="mt-6">
        <TabsList>
          <TabsTrigger value="usage">Usage Statistics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="usage">
          {usage && Object.keys(usage.usage).length > 0 && (
            <Card className="border-2">
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
        </TabsContent>

        <TabsContent value="history">
          {isHistoryLoading ? (
            <Card className="border-2">
              <CardContent className="py-8">
                <div className="flex items-center justify-center">
                  <Spinner size="md" text="Loading history..." />
                </div>
              </CardContent>
            </Card>
          ) : (
            <SubscriptionHistoryTimeline history={history} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
