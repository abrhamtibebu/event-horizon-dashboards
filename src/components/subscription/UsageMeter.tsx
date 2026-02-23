import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { AlertCircle, Infinity } from 'lucide-react'

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
    <Card className={cn("overflow-hidden border-2", className)}>
      <CardHeader className="pb-3 px-4 pt-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</CardTitle>
          <div className="flex items-center gap-1.5 min-h-[20px]">
            {unlimited || limit === null ? (
              <Badge variant="secondary" className="gap-1 font-mono">
                <Infinity className="w-3 h-3" />
                Unlimited
              </Badge>
            ) : (
              <span className="text-sm font-bold flex items-baseline gap-1">
                <span className={cn(isAtLimit ? "text-red-500" : isNearLimit ? "text-amber-500" : "text-primary")}>
                  {current.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground font-normal">/ {limit.toLocaleString()}</span>
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4 px-4">
        {!unlimited && limit !== null ? (
          <div className="space-y-3">
            <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "absolute top-0 left-0 h-full rounded-full transition-colors",
                  isAtLimit ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" :
                    isNearLimit ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" :
                      "bg-primary shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5"
            >
              {(isAtLimit || isNearLimit) && (
                <AlertCircle className={cn("w-3.5 h-3.5", isAtLimit ? "text-red-500" : "text-amber-500")} />
              )}
              <p className={cn(
                "text-[10px] font-medium leading-none",
                isAtLimit ? "text-red-600 dark:text-red-400" :
                  isNearLimit ? "text-amber-600 dark:text-amber-400" :
                    "text-muted-foreground"
              )}>
                {isAtLimit ? "Limit reached. Upgrade to increase capacity." :
                  isNearLimit ? "Nearly at capacity. Consider upgrading soon." :
                    `${Math.round(percentage)}% of limit used`}
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="h-2.5 w-full bg-primary/10 rounded-full relative">
            <motion.div
              className="absolute inset-0 bg-primary/20"
              animate={{
                opacity: [0.3, 0.6, 0.3],
                scaleX: [1, 1.02, 1]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <p className="text-[10px] text-muted-foreground font-medium mt-3">Full access enabled</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { Badge } from '@/components/ui/badge'
