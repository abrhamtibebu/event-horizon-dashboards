import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface Event {
  id: number;
  name: string;
  start_date: string;
  start_time?: string;
  location?: string;
  event_type?: string;
}

interface ModernCalendarWidgetProps {
  events?: Event[];
  onDateSelect?: (date: Date) => void;
  onEventClick?: (event: Event) => void;
  showWeather?: boolean;
}

export function ModernCalendarWidget({
  events: externalEvents,
  onDateSelect,
  onEventClick,
  showWeather = false,
}: ModernCalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');
  const [events, setEvents] = useState<Event[]>(externalEvents || []);
  const [loading, setLoading] = useState(false);

  // Fetch events for the current month
  useEffect(() => {
    if (externalEvents) {
      setEvents(externalEvents);
      return;
    }

    const fetchEvents = async () => {
      setLoading(true);
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);

        const response = await api.get('/events', {
          params: {
            start_date: firstDay.toISOString().split('T')[0],
            end_date: lastDay.toISOString().split('T')[0],
          },
        });

        setEvents(response.data?.data || response.data || []);
      } catch (error) {
        console.error('Failed to fetch events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [currentDate, externalEvents]);

  const getMonthName = (date: Date, short = false) => {
    const months = short
      ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
  };

  const getDayName = (date: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get the day of week for the first day (0 = Sunday, convert to Monday = 0)
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek < 0) startingDayOfWeek = 6; // Sunday becomes 6
    
    // Get days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays: number[] = [];
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      prevMonthDays.push(prevMonthLastDay - i);
    }
    
    // Get current month days
    const currentMonthDays: number[] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push(i);
    }
    
    // Get days from next month to fill the grid (6 weeks × 7 days = 42 cells)
    const totalCells = 42;
    const filledCells = prevMonthDays.length + currentMonthDays.length;
    const nextMonthDays: number[] = [];
    for (let i = 1; i <= totalCells - filledCells; i++) {
      nextMonthDays.push(i);
    }
    
    return {
      prev: prevMonthDays,
      current: currentMonthDays,
      next: nextMonthDays,
      year,
      month,
    };
  };

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_date);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const selectDate = (date: Date) => {
    setSelectedDate(date);
    if (date.getMonth() !== currentDate.getMonth() || date.getFullYear() !== currentDate.getFullYear()) {
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
    onDateSelect?.(date);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const selectedDateEvents = getEventsForDate(selectedDate);
  const calendarData = getDaysInMonth(currentDate);

  // Get all months for year view
  const getAllMonths = () => {
    const year = currentDate.getFullYear();
    const months = [];
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(year, i, 1);
      const monthEventsCount = events.filter(event => {
        const eventDate = new Date(event.start_date);
        return eventDate.getMonth() === i && eventDate.getFullYear() === year;
      }).length;
      months.push({
        date: monthDate,
        name: getMonthName(monthDate, true),
        fullName: getMonthName(monthDate, false),
        eventsCount: monthEventsCount,
      });
    }
    return months;
  };

  const navigateYear = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    } else {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleMonthClick = (monthDate: Date) => {
    setCurrentDate(monthDate);
    setViewMode('month');
    setSelectedDate(monthDate);
  };
  
  // Format selected date
  const formatDateOrdinal = (day: number) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = day % 100;
    return day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  const dayButton = (
    day: number,
    date: Date,
    muted: boolean,
  ) => {
    const isSelected =
      selectedDate.getDate() === date.getDate() &&
      selectedDate.getMonth() === date.getMonth() &&
      selectedDate.getFullYear() === date.getFullYear();
    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    const dateEvents = getEventsForDate(date);

    return (
      <button
        key={`${date.getMonth()}-${day}`}
        type="button"
        onClick={() => selectDate(date)}
        className={cn(
          'flex h-10 flex-col items-center justify-center rounded-md text-sm',
          muted && 'text-muted-foreground/50',
          isSelected && 'bg-foreground text-background',
          !isSelected && isToday && 'ring-1 ring-foreground',
          !isSelected && !isToday && 'hover:bg-muted',
        )}
      >
        <span>{day}</span>
        {dateEvents.length > 0 && (
          <span className={cn('mt-0.5 h-1 w-1 rounded-full', isSelected ? 'bg-background' : 'bg-foreground')} />
        )}
      </button>
    );
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => (viewMode === 'month' ? navigateMonth('prev') : navigateYear('prev'))}
            className="rounded-md p-1.5 hover:bg-muted"
            aria-label="Previous"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-[9rem] text-center text-sm font-semibold">
            {viewMode === 'month'
              ? `${getMonthName(currentDate)} ${currentDate.getFullYear()}`
              : currentDate.getFullYear()}
          </h2>
          <button
            type="button"
            onClick={() => (viewMode === 'month' ? navigateMonth('next') : navigateYear('next'))}
            className="rounded-md p-1.5 hover:bg-muted"
            aria-label="Next"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex rounded-md border border-border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={cn('rounded px-2.5 py-1', viewMode === 'month' ? 'bg-foreground text-background' : 'text-muted-foreground')}
          >
            Month
          </button>
          <button
            type="button"
            onClick={() => setViewMode('year')}
            className={cn('rounded px-2.5 py-1', viewMode === 'year' ? 'bg-foreground text-background' : 'text-muted-foreground')}
          >
            Year
          </button>
        </div>
      </div>

      {viewMode === 'year' ? (
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 md:grid-cols-4">
          {getAllMonths().map((month) => (
            <button
              key={month.fullName}
              type="button"
              onClick={() => handleMonthClick(month.date)}
              className="rounded-md border border-border px-3 py-3 text-left hover:bg-muted"
            >
              <div className="text-sm font-medium">{month.fullName}</div>
              <div className="text-xs text-muted-foreground">
                {month.eventsCount} {month.eventsCount === 1 ? 'event' : 'events'}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_16rem]">
          <div className="p-4">
            <div className="mb-2 grid grid-cols-7">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="py-1 text-center text-[11px] font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarData.prev.map((day) =>
                dayButton(day, new Date(calendarData.year, calendarData.month - 1, day), true),
              )}
              {calendarData.current.map((day) =>
                dayButton(day, new Date(calendarData.year, calendarData.month, day), false),
              )}
              {calendarData.next.map((day) =>
                dayButton(day, new Date(calendarData.year, calendarData.month + 1, day), true),
              )}
            </div>
          </div>
          <div className="border-t border-border p-4 lg:border-l lg:border-t-0">
            <p className="text-sm font-medium">
              {getDayName(selectedDate)}, {getMonthName(selectedDate)} {formatDateOrdinal(selectedDate.getDate())}
            </p>
            <div className="mt-3 space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading events...</p>
              ) : selectedDateEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events on this day.</p>
              ) : (
                selectedDateEvents.map((event) => {
                  const eventDate = new Date(event.start_date + (event.start_time ? `T${event.start_time}` : ''));
                  const timeStr = event.start_time
                    ? eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                    : 'All day';
                  return (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onEventClick?.(event)}
                      className="block w-full rounded-md border border-border px-3 py-2 text-left hover:bg-muted"
                    >
                      <div className="text-sm font-medium">{event.name}</div>
                      <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {timeStr}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
