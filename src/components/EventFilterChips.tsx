import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

interface EventFilterChipsProps {
  selectedFilters: string[]
  onFilterChange: (filters: string[]) => void
}

const filterOptions = [
  { value: 'all', label: 'All Events', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { value: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
  { value: 'completed', label: 'Completed', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
  { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
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
      <span className="text-sm font-medium text-gray-600">Filter by:</span>
      {filterOptions.map(option => (
        <Badge
          key={option.value}
          className={`cursor-pointer transition-all duration-200 ${
            isActive(option.value)
              ? option.color + ' ring-2 ring-offset-1 ring-gray-400'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
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
          className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
        >
          <X className="w-3 h-3 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}

