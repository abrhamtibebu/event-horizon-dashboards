import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
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

export function EnhancedEventCalendar({ 
  events, 
  onEventClick,
  selectedFilters 
}: EnhancedEventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    // Get Monday as the first day (0 = Sunday, adjust to Monday = 0)
    let startingDayOfWeek = firstDay.getDay() - 1
    if (startingDayOfWeek < 0) startingDayOfWeek = 6 // Sunday becomes 6 (last position)

    return { daysInMonth, startingDayOfWeek, year, month, firstDay, lastDay }
  }

  const { daysInMonth, startingDayOfWeek, year, month, firstDay, lastDay } = getDaysInMonth(currentMonth)

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const getEventsForDay = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    
    return events.filter(event => {
      const eventDate = event.date
      const matchesDate = eventDate === dateStr
      const matchesFilter = selectedFilters.length === 0 || selectedFilters.includes(event.status)
      return matchesDate && matchesFilter
    })
  }

  const isSelectedDate = (date: Date) => {
    if (!selectedDate) return false
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    )
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month && date.getFullYear() === year
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

  // Build calendar grid including previous and next month dates
  const calendarDays = []
  
  // Previous month dates
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = 0; i < startingDayOfWeek; i++) {
    const day = prevMonthLastDay - (startingDayOfWeek - 1 - i)
    const date = new Date(year, month - 1, day)
    const dayEvents = getEventsForDay(date)
    
    calendarDays.push({
      date,
      day,
      isCurrentMonth: false,
      events: dayEvents
    })
  }

  // Current month dates
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dayEvents = getEventsForDay(date)
    
    calendarDays.push({
      date,
      day,
      isCurrentMonth: true,
      events: dayEvents
    })
  }

  // Next month dates to fill the grid (42 cells total = 6 rows × 7 days)
  const remainingCells = 42 - calendarDays.length
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(year, month + 1, day)
    const dayEvents = getEventsForDay(date)
    
    calendarDays.push({
      date,
      day,
      isCurrentMonth: false,
      events: dayEvents
    })
  }

  // Ensure we always have exactly 42 cells (6 weeks)
  while (calendarDays.length < 42) {
    const lastDate = calendarDays[calendarDays.length - 1]?.date
    if (lastDate) {
      const nextDate = new Date(lastDate)
      nextDate.setDate(nextDate.getDate() + 1)
      const dayEvents = getEventsForDay(nextDate)
      calendarDays.push({
        date: nextDate,
        day: nextDate.getDate(),
        isCurrentMonth: false,
        events: dayEvents
      })
    } else {
      break
    }
  }
  
  // Trim to exactly 42 if we have more
  calendarDays.splice(42)

  const formatSelectedDate = (date: Date | null) => {
    if (!date) return ''
    return `${date.getDate()} ${monthNames[date.getMonth()]}, ${date.getFullYear()}`
  }

  const getSelectedDateMessage = () => {
    if (!selectedDate) return "Today is a good day, like every other day! Enjoy your time."
    const selectedEvents = getEventsForDay(selectedDate)
    if (selectedEvents.length > 0) {
      return `You have ${selectedEvents.length} event${selectedEvents.length !== 1 ? 's' : ''} scheduled for this day.`
    }
    return "Today is a good day, like every other day! Enjoy your time."
  }

  return (
    <div className="space-y-4">
      {/* Calendar Widget */}
      <div className="bg-[#1E1E1E] rounded-lg p-4 shadow-lg">
        {/* Header with month/year and navigation */}
        <div className="flex items-center justify-center gap-4 mb-4 relative">
          <button
            onClick={previousMonth}
            className="text-white hover:text-green-400 transition-colors p-1"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <h2 className="text-white text-lg font-medium">
            {monthNames[month]}, {year}
          </h2>
          
          <button
            onClick={nextMonth}
            className="text-white hover:text-green-400 transition-colors p-1"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day of week headers */}
        <div className="grid grid-cols-7 gap-0 mb-2">
          {dayNames.map(day => (
            <div
              key={day}
              className="text-center text-xs font-normal text-gray-400 uppercase py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0">
          {calendarDays.map(({ date, day, isCurrentMonth, events: dayEvents }, idx) => {
            const selected = isSelectedDate(date)
            const hasEvents = dayEvents.length > 0

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  'relative h-12 flex items-center justify-center text-sm transition-colors',
                  'hover:bg-gray-800/50',
                  isCurrentMonth ? 'text-white' : 'text-gray-500',
                  selected && 'text-white'
                )}
              >
                {/* Date number with selection highlight */}
                <span
                  className={cn(
                    'relative z-10 w-8 h-8 flex items-center justify-center rounded-full transition-all',
                    selected && 'bg-green-500 text-white font-medium',
                    !selected && isCurrentMonth && 'hover:bg-gray-700'
                  )}
                >
                  {day}
                </span>
                
                {/* Event indicator (green asterisk/dot) */}
                {hasEvents && (
                  <span className="absolute top-1 right-1 text-green-500 text-[10px] leading-none">
                    *
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Information Box */}
      <div className="bg-[#1E1E1E] rounded-lg p-4 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="w-5 h-5 text-green-500" />
          <h3 className="text-green-500 font-medium">
            {formatSelectedDate(selectedDate)}
          </h3>
        </div>
        <p className="text-white text-sm">
          {getSelectedDateMessage()}
        </p>
      </div>
    </div>
  )
}