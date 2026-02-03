import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans'
import { useSubscription } from '@/hooks/useSubscription'
import { SubscriptionTierCard } from '@/components/subscription/SubscriptionTierCard'
import { FeatureComparison } from '@/components/subscription/FeatureComparison'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useNavigate } from 'react-router-dom'
import { type SubscriptionPlan } from '@/lib/api/subscriptions'
import { subscriptionsApi } from '@/lib/api/subscriptions'
import { ArrowUp, ArrowDown, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function SubscriptionPlans() {
  const { plans, isLoading } = useSubscriptionPlans()
  const { subscription, createSubscription, requestUpgrade, requestDowngrade, isCreating, isRequestingUpgrade, isRequestingDowngrade } = useSubscription()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const navigate = useNavigate()
  const { toast } = useToast()

  // Fetch organizer plans (with duration options)
  const { data: organizerPlans = [] } = useQuery({
    queryKey: ['organizer-plans'],
    queryFn: () => subscriptionsApi.getOrganizerPlans(),
  })

  const currentPlanId = subscription?.subscription_plan_id
  const isPendingRequest = subscription?.status === 'pending_upgrade' || subscription?.status === 'pending_downgrade'

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    // If no subscription, create new one
    if (!subscription) {
      try {
        await createSubscription({
          subscription_plan_id: plan.id,
          billing_cycle: billingCycle,
          trial_days: 30, // 30-day trial
        })
        navigate('/dashboard/subscription')
      } catch (error) {
        console.error('Failed to create subscription:', error)
      }
      return
    }

    // If has subscription, determine if upgrade or downgrade
    const currentPlanPrice = subscription.billing_cycle === 'yearly'
      ? subscription.plan?.price_yearly || 0
      : subscription.plan?.price_monthly || 0
    const newPlanPrice = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly

    const isUpgrade = newPlanPrice > currentPlanPrice
    const isDowngrade = newPlanPrice < currentPlanPrice

    if (isUpgrade) {
      try {
        await requestUpgrade(plan.id)
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to request upgrade',
          variant: 'destructive',
        })
      }
    } else if (isDowngrade) {
      try {
        await requestDowngrade(plan.id)
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to request downgrade',
          variant: 'destructive',
        })
      }
    } else {
      // Same price - just show message
      toast({
        title: 'Same Plan',
        description: 'You are already on this plan.',
      })
    }
  }

  const canRequestChange = (plan: SubscriptionPlan): boolean => {
    if (!subscription) return true
    if (subscription.status !== 'active' && subscription.status !== 'trial') return false
    if (isPendingRequest) return false
    return plan.id !== currentPlanId
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="md" text="Loading subscription plans..." />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Select the perfect plan for your event management needs
        </p>
      </div>

      <div className="mb-6 flex justify-center">
        <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')}>
          <TabsList>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isPendingRequest && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                  {subscription?.status === 'pending_upgrade' ? 'Upgrade Request Pending' : 'Downgrade Request Pending'}
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  You have a pending {subscription?.status === 'pending_upgrade' ? 'upgrade' : 'downgrade'} request.
                  Please wait for admin approval before making another request.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId
          const canChange = canRequestChange(plan)
          const currentPlanPrice = subscription?.billing_cycle === 'yearly'
            ? subscription?.plan?.price_yearly || 0
            : subscription?.plan?.price_monthly || 0
          const newPlanPrice = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
          const isUpgrade = newPlanPrice > currentPlanPrice
          const isDowngrade = newPlanPrice < currentPlanPrice

          return (
            <div key={plan.id} className="relative">
              <SubscriptionTierCard
                plan={plan}
                isCurrentPlan={isCurrent}
                onSelect={canChange ? handleSelectPlan : undefined}
                billingCycle={billingCycle}
                isLoading={isCreating || isRequestingUpgrade || isRequestingDowngrade}
              />
              {subscription && !isCurrent && canChange && (
                <div className="absolute top-4 right-4">
                  {isUpgrade && (
                    <Badge className="bg-purple-100 text-purple-800 border-purple-300">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      Upgrade
                    </Badge>
                  )}
                  {isDowngrade && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300">
                      <ArrowDown className="w-3 h-3 mr-1" />
                      Downgrade
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <FeatureComparison plans={plans} currentPlanId={subscription?.subscription_plan_id} />
    </div>
  )
}

