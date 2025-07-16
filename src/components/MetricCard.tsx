import { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

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
    <Card
      className={cn(
        'bg-white/80 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-200',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
              {title}
            </p>
            <p className="text-4xl font-extrabold text-gray-900 mb-1 leading-tight">
              {value}
            </p>
            {/* Show trend as string if provided, else fallback to old logic */}
            {typeof trend === 'string' && (
              <p className={cn('text-sm mt-1 font-medium', trend.startsWith('+') ? 'text-green-600' : 'text-red-600')}>
                {trend.startsWith('+') ? '↗' : '↘'} {trend.replace(/^\+|^-/, '')}
              </p>
            )}
            {typeof trend === 'object' && trend && (
              <p
                className={cn(
                  'text-sm mt-1 font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl shadow flex items-center justify-center">
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
