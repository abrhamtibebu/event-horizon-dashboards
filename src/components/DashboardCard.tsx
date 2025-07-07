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
        'bg-white border border-gray-200 rounded-lg p-0',
        className
      )}
    >
      <CardHeader
        className={cn('pb-2 border-b border-gray-100 bg-white', headerClassName)}
      >
        <CardTitle className="text-lg font-semibold text-gray-900 tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 pb-6 px-6">{children}</CardContent>
    </Card>
  )
}
