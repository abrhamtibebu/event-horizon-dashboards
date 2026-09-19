import { Link } from 'react-router-dom'
import { Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { VenueDashboardSpaceLoad } from '@/lib/api/venues'

export function VenueSpaceLoadCard({
  spaces = [],
  className,
}: {
  spaces?: VenueDashboardSpaceLoad[]
  className?: string
}) {
  return (
    <Card className={cn('rounded-2xl border-border shadow-sm dark:ring-0', className)}>
      <CardHeader>
        <CardTitle>Space load</CardTitle>
        <CardDescription>Open bookings per hall or room</CardDescription>
      </CardHeader>
      <CardContent>
        {spaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
              <Store className="size-6 text-muted-foreground" />
            </div>
            <p className="font-semibold">No spaces yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">Add halls and rooms so organizers can book them.</p>
            <Link to="/dashboard/venue/spaces" className="mt-1 text-sm font-semibold text-primary hover:underline">
              Manage spaces
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {spaces.map((space) => (
              <li key={space.id} className="flex items-center gap-3">
                <Avatar className="size-9 rounded-xl">
                  <AvatarFallback className="rounded-xl bg-primary/10 text-xs font-semibold text-primary">
                    {space.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{space.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {space.open} open · {space.capacity ? `${space.capacity} capacity` : 'No capacity set'}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    'shrink-0 rounded-full',
                    space.status === 'Busy'
                      ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      : 'border-primary/30 bg-primary/10 text-primary'
                  )}
                >
                  {space.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
