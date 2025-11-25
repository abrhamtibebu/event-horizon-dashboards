import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check } from 'lucide-react'
import { type SubscriptionPlan } from '@/lib/api/subscriptions'
import { cn } from '@/lib/utils'

interface SubscriptionTierCardProps {
  plan: SubscriptionPlan
  isCurrentPlan?: boolean
  onSelect?: (plan: SubscriptionPlan) => void
  billingCycle?: 'monthly' | 'yearly'
  isLoading?: boolean
}

export function SubscriptionTierCard({
  plan,
  isCurrentPlan = false,
  onSelect,
  billingCycle = 'monthly',
  isLoading = false,
}: SubscriptionTierCardProps) {
  const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
  const isPopular = plan.slug === 'pro'
  const isEnterprise = plan.slug === 'enterprise'

  return (
    <Card
      className={cn(
        'relative flex flex-col',
        isPopular && 'border-primary shadow-lg scale-105',
        isEnterprise && 'border-purple-500'
      )}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <CardDescription>{plan.description}</CardDescription>
        <div className="mt-4">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold">{price.toLocaleString()}</span>
            <span className="text-muted-foreground ml-2">ETB</span>
            <span className="text-muted-foreground ml-2 text-sm">
              /{billingCycle === 'yearly' ? 'year' : 'month'}
            </span>
          </div>
          {billingCycle === 'yearly' && plan.price_yearly > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              Save {((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100).toFixed(0)}% annually
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features?.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </li>
          ))}
        </ul>

        {plan.limits && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="text-sm font-semibold mb-3">Limits</h4>
            <ul className="space-y-2 text-sm">
              {Object.entries(plan.limits).map(([key, value]) => (
                <li key={key} className="flex justify-between">
                  <span className="text-muted-foreground">{key.replace(/_/g, ' ')}</span>
                  <span className="font-medium">
                    {value === -1 ? 'Unlimited' : value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          variant={isCurrentPlan ? 'outline' : isPopular ? 'default' : 'secondary'}
          onClick={() => onSelect?.(plan)}
          disabled={isCurrentPlan || isLoading}
        >
          {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
        </Button>
      </CardFooter>
    </Card>
  )
}

