import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface EventFilterChipsProps {
  selectedFilters: string[]
  onFilterChange: (filters: string[]) => void
}

const filterOptions = [
  { value: 'all', label: 'All Events', color: 'bg-muted text-foreground hover:bg-muted/80 border-border' },
  { value: 'active', label: 'Active', color: 'bg-success/10 text-success hover:bg-success/20 border-success/30' },
  { value: 'upcoming', label: 'Upcoming', color: 'bg-info/10 text-info hover:bg-info/20 border-info/30' },
  { value: 'completed', label: 'Completed', color: 'bg-info/10 text-info hover:bg-info/20 border-info/30' },
  { value: 'draft', label: 'Draft', color: 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/30' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-error/10 text-error hover:bg-error/20 border-error/30' },
]

export function EventFilterChips({ selectedFilters, onFilterChange }: EventFilterChipsProps) {
  const toggleFilter = (filterValue: string) => {
    if (filterValue === 'all') {
      onFilterChange([])
      return
    }

    if (selectedFilters.includes(filterValue)) {
      onFilterChange(selectedFilters.filter(f => f !== filterValue))
    } else {
      onFilterChange([...selectedFilters, filterValue])
    }
  }

  const clearAllFilters = () => {
    onFilterChange([])
  }

  const isActive = (filterValue: string) => {
    if (filterValue === 'all') {
      return selectedFilters.length === 0
    }
    return selectedFilters.includes(filterValue)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">Filter by:</span>
      {filterOptions.map(option => (
        <Badge
          key={option.value}
          className={`cursor-pointer transition-all duration-200 border ${
            isActive(option.value)
              ? option.color + ' ring-2 ring-offset-1 ring-primary/50'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted border-border'
          }`}
          onClick={() => toggleFilter(option.value)}
        >
          {option.label}
        </Badge>
      ))}
      {selectedFilters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}

