import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface Event {
  id: number
  name: string
  date: string
  time: string
  status: string
  location?: string
  attendee_count?: number
  max_guests?: number
}

interface EnhancedEventCalendarProps {
  events: Event[]
  onEventClick?: (event: Event) => void
  selectedFilters: string[]
}

const eventStatusColors = {
  active: { bg: 'bg-green-500', text: 'text-green-700', dot: '#10b981', border: 'border-green-300' },
  upcoming: { bg: 'bg-blue-500', text: 'text-blue-700', dot: '#3b82f6', border: 'border-blue-300' },
  completed: { bg: 'bg-gray-500', text: 'text-gray-700', dot: '#6b7280', border: 'border-gray-300' },
  cancelled: { bg: 'bg-red-500', text: 'text-red-700', dot: '#ef4444', border: 'border-red-300' },
  draft: { bg: 'bg-yellow-500', text: 'text-yellow-700', dot: '#f59e0b', border: 'border-yellow-300' },
}

export function EnhancedEventCalendar({ 
  events, 
  onEventClick,
  selectedFilters 
}: EnhancedEventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState<string | null>(null)

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    
    return events.filter(event => {
      const eventDate = event.date
      const matchesDate = eventDate === dateStr
      const matchesFilter = selectedFilters.length === 0 || selectedFilters.includes(event.status)
      return matchesDate && matchesFilter
    })
  }

    const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const calendarDays = []
  
  // Empty cells before first day
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100" />)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = getEventsForDay(day)
    const dateKey = `${year}-${month}-${day}`
    const isHovered = hoveredDate === dateKey

    calendarDays.push(
      <div
        key={day}
        className={cn(
          'h-24 border border-gray-200 p-2 transition-all duration-200 relative',
          isToday(day) && 'bg-blue-50 ring-2 ring-blue-400 ring-inset'
        )}
        onMouseEnter={() => setHoveredDate(dateKey)}
        onMouseLeave={() => setHoveredDate(null)}
      >
        <div className="flex flex-col h-full">
          <div className={cn(
            'text-sm font-semibold mb-1',
            isToday(day) ? 'text-blue-700' : 'text-gray-700'
          )}>
            {day}
          </div>
          
          {/* Event indicators */}
          <div className="flex-1 overflow-hidden">
            {dayEvents.slice(0, 3).map((event, idx) => {
              const statusColor = eventStatusColors[event.status as keyof typeof eventStatusColors] || eventStatusColors.draft
              
              return (
                <TooltipProvider key={event.id} delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'text-[10px] px-1 py-0.5 mb-0.5 rounded truncate cursor-pointer',
                          'hover:opacity-80 transition-opacity border',
                          statusColor.bg.replace('500', '100'),
                          statusColor.text,
                          statusColor.border
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onEventClick) {
                            onEventClick(event)
                          }
                        }}
                      >
                        {event.name}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1">
                        <div className="font-semibold">{event.name}</div>
                        <div className="text-xs">
                          <div>Time: {event.time}</div>
                          {event.location && <div>Location: {event.location}</div>}
                          {event.attendee_count !== undefined && (
                            <div>
                              Attendees: {event.attendee_count}/{event.max_guests || 'Unlimited'}
                            </div>
                          )}
                          <div className="capitalize">Status: {event.status}</div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
            
            {/* More events indicator */}
            {dayEvents.length > 3 && (
              <div className="text-[10px] text-gray-500 font-medium px-1">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>

          {/* Colored dots at bottom */}
          {dayEvents.length > 0 && (
            <div className="flex gap-0.5 justify-center pt-1 border-t border-gray-100">
              {[...new Set(dayEvents.slice(0, 5).map(e => e.status))].map((status, idx) => {
                const color = eventStatusColors[status as keyof typeof eventStatusColors]?.dot || '#6b7280'
                return (
                  <div
                    key={idx}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {monthNames[month]} {year}
            </h3>
            <p className="text-sm text-gray-600">View your events by month</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="bg-white"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={previousMonth}
            className="bg-white h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="bg-white h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map(day => (
          <div
            key={day}
            className="text-center text-sm font-semibold text-gray-700 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
        {calendarDays}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-gray-700">Status:</span>
          {Object.entries(eventStatusColors).map(([status, colors]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors.dot }}
              />
              <span className="text-gray-600 capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

