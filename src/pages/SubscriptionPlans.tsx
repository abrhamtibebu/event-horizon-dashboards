import { useState } from 'react'
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans'
import { useSubscription } from '@/hooks/useSubscription'
import { SubscriptionTierCard } from '@/components/subscription/SubscriptionTierCard'
import { FeatureComparison } from '@/components/subscription/FeatureComparison'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { useNavigate } from 'react-router-dom'
import { type SubscriptionPlan } from '@/lib/api/subscriptions'

export default function SubscriptionPlans() {
  const { plans, isLoading } = useSubscriptionPlans()
  const { subscription, createSubscription, isCreating } = useSubscription()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const navigate = useNavigate()

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    try {
      await createSubscription({
        subscription_plan_id: plan.id,
        billing_cycle: billingCycle,
        trial_days: 14, // 14-day trial
      })
      navigate('/dashboard/subscription/payment')
    } catch (error) {
      console.error('Failed to create subscription:', error)
    }
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <SubscriptionTierCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={subscription?.subscription_plan_id === plan.id}
            onSelect={handleSelectPlan}
            billingCycle={billingCycle}
            isLoading={isCreating}
          />
        ))}
      </div>

      <FeatureComparison plans={plans} currentPlanId={subscription?.subscription_plan_id} />
    </div>
  )
}

