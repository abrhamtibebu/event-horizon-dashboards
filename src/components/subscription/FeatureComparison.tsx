import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X } from 'lucide-react'
import { type SubscriptionPlan } from '@/lib/api/subscriptions'
import { cn } from '@/lib/utils'

interface FeatureComparisonProps {
  plans: SubscriptionPlan[]
  currentPlanId?: number
}

export function FeatureComparison({ plans, currentPlanId }: FeatureComparisonProps) {
  // Get all unique features from all plans
  const allFeatures = new Set<string>()
  plans.forEach((plan) => {
    plan.features?.forEach((feature) => allFeatures.add(feature))
  })

  const features = Array.from(allFeatures).sort()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Comparison</CardTitle>
        <CardDescription>Compare features across all subscription plans</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left p-2 border-b">Feature</th>
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    className={cn(
                      'text-center p-2 border-b',
                      currentPlanId === plan.id && 'bg-primary/10'
                    )}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature}>
                  <td className="p-2 border-b text-sm">
                    {feature.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </td>
                  {plans.map((plan) => (
                    <td
                      key={plan.id}
                      className={cn(
                        'text-center p-2 border-b',
                        currentPlanId === plan.id && 'bg-primary/5'
                      )}
                    >
                      {plan.features?.includes(feature) ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

