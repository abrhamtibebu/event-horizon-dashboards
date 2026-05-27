import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  icon: ReactNode
  trend?: { value: number; isPositive: boolean } | string
  className?: string
  link?: string
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  className,
  link,
}: MetricCardProps) {
  const cardContent = (
    <Card className={cn('border border-border bg-card shadow-sm', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
            {typeof trend === 'string' && trend && (
              <p
                className={cn(
                  'text-sm mt-1 flex items-center gap-1',
                  trend.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {trend.startsWith('+') ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {trend.replace(/^\+|^-/, '')}
              </p>
            )}
            {typeof trend === 'object' && trend && (
              <p
                className={cn(
                  'text-sm mt-1 flex items-center gap-1',
                  trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (link) {
    return (
      <Link to={link} className="block">
        {cardContent}
      </Link>
    )
  }

  return cardContent
}