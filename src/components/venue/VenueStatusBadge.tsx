import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const statusClass: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
  confirmed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  cancelled: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  completed: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
}

export function VenueStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn('capitalize', statusClass[status])}>
      {status}
    </Badge>
  )
}
