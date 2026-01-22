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
    <Card
      className={cn(
        'bg-card/40 backdrop-blur-xl border border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-[1.5rem] hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:bg-card/60 transition-all duration-300 group',
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2 leading-none">
              {title}
            </p>
            <p className="text-3xl font-black text-foreground mb-1 tabular-nums tracking-tight">
              {value}
            </p>
            {/* Show trend as string if provided */}
            {typeof trend === 'string' && (
              <p className={cn('text-[13px] mt-2 font-bold flex items-center gap-1', trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500')}>
                <span className="p-0.5 rounded-full bg-current/10">
                  {trend.startsWith('+') ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                </span>
                {trend.replace(/^\+|^-/, '')}
              </p>
            )}
            {/* Show trend as object if provided */}
            {typeof trend === 'object' && trend && (
              <p className={cn('text-[13px] mt-2 font-bold flex items-center gap-1', trend.isPositive ? 'text-emerald-500' : 'text-rose-500')}>
                <span className="p-0.5 rounded-full bg-current/10">
                  {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                </span>
                {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className="p-4 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-inner flex items-center justify-center text-primary">
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
