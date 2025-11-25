import { cn } from '@/lib/utils'
import { Button } from '../ui/button'

export interface ConversationFilter {
  id: string
  label: string
  count?: number
  icon?: React.ReactNode
}

interface ConversationFiltersProps {
  filters: ConversationFilter[]
  activeFilter: string
  onFilterChange: (value: string) => void
}

export const ConversationFilters = ({
  filters,
  activeFilter,
  onFilterChange,
}: ConversationFiltersProps) => {
  return (
    <div className="flex w-full gap-2 overflow-x-auto py-1">
      {filters.map(filter => (
        <Button
          key={filter.id}
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            'group relative flex min-w-[110px] items-center justify-between rounded-2xl border px-3 py-2 text-sm font-medium transition-all',
            activeFilter === filter.id
              ? 'border-primary/60 bg-primary/10 text-primary'
              : 'border-transparent bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted/60'
          )}
        >
          <div className="flex items-center gap-2">
            {filter.icon}
            <span>{filter.label}</span>
          </div>
          {typeof filter.count === 'number' && (
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-semibold',
                activeFilter === filter.id
                  ? 'bg-primary/20 text-primary-foreground'
                  : 'bg-background/60 text-muted-foreground'
              )}
            >
              {filter.count}
            </span>
          )}
        </Button>
      ))}
    </div>
  )
}

