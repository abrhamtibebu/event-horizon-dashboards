import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DashboardCardProps {
  title: string
  children: ReactNode
  className?: string
  headerClassName?: string
}

export function DashboardCard({
  title,
  children,
  className,
  headerClassName,
}: DashboardCardProps) {
  return (
    <Card
      className={cn(
        'bg-white/70 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl transition-shadow duration-200 hover:shadow-2xl',
        className
      )}
    >
      <CardHeader
        className={cn('pb-2 border-b border-gray-100', headerClassName)}
      >
        <CardTitle className="text-xl font-bold text-gray-900 tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 pb-6 px-6">{children}</CardContent>
    </Card>
  )
}
