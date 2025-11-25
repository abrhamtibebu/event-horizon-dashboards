import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface UsageMeterProps {
  label: string
  current: number
  limit: number | null
  unlimited?: boolean
  className?: string
}

export function UsageMeter({ label, current, limit, unlimited = false, className }: UsageMeterProps) {
  const percentage = unlimited || limit === null ? 0 : limit > 0 ? Math.min((current / limit) * 100, 100) : 0
  const isNearLimit = !unlimited && limit !== null && percentage >= 80
  const isAtLimit = !unlimited && limit !== null && current >= limit

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          <span className="text-sm text-muted-foreground">
            {unlimited || limit === null ? (
              'Unlimited'
            ) : (
              <>
                {current} / {limit}
              </>
            )}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {!unlimited && limit !== null && (
          <Progress
            value={percentage}
            className={cn(
              'h-2',
              isAtLimit && 'bg-red-500',
              isNearLimit && !isAtLimit && 'bg-yellow-500'
            )}
          />
        )}
        {isAtLimit && (
          <p className="text-xs text-red-600 mt-2">You have reached your limit. Please upgrade to continue.</p>
        )}
        {isNearLimit && !isAtLimit && (
          <p className="text-xs text-yellow-600 mt-2">You are near your limit. Consider upgrading.</p>
        )}
      </CardContent>
    </Card>
  )
}

