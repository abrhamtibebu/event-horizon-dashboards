import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { UsageMeter } from '@/components/subscription/UsageMeter'
import { SubscriptionStatusBadge } from '@/components/subscription/SubscriptionStatusBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function UsageDashboard() {
  const { subscription, usage, isLoading } = useFeatureAccess()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="md" text="Loading usage statistics..." />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>Subscribe to a plan to view usage statistics</CardDescription>
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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Usage Dashboard</h1>
        <p className="text-muted-foreground">Monitor your subscription usage and limits</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>{subscription.plan?.name} Plan</CardDescription>
            </div>
            <SubscriptionStatusBadge subscription={subscription} />
          </div>
        </CardHeader>
      </Card>

      {usage && Object.keys(usage.usage).length > 0 && (
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
      )}

      {(!usage || Object.keys(usage.usage).length === 0) && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No usage data available</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

