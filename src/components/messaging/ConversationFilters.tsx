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
    <div className="flex w-full gap-2 overflow-x-auto scrollbar-none py-1">
      {filters.map(filter => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap border',
            activeFilter === filter.id
              ? 'bg-primary text-white border-primary shadow-sm shadow-primary/20'
              : 'bg-white dark:bg-gray-900 text-gray-500 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
          )}
        >
          {filter.icon && <span className={cn(
            "w-3.5 h-3.5",
            activeFilter === filter.id ? "text-white" : "text-gray-400"
          )}>{filter.icon}</span>}
          <span>{filter.label}</span>
          {typeof filter.count === 'number' && filter.count > 0 && (
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-[10px] font-black min-w-[18px] text-center',
                activeFilter === filter.id
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              )}
            >
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

