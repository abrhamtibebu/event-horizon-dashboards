import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
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

  const getDayNameShort = (day: number) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    return days[day];
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

  const getEventsForMonth = () => {
    return events.filter((event) => {
      const eventDate = new Date(event.start_date);
      return (
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      );
    });
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

  const handleDateSelect = (day: number, isCurrentMonth: boolean) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const newDate = new Date(year, isCurrentMonth ? month : month + (isCurrentMonth ? 0 : 1), day);
    setSelectedDate(newDate);
    onDateSelect?.(newDate);
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

  const monthEvents = getEventsForMonth();
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
  
  // Get previous and next months for display
  const prevMonth = new Date(currentDate);
  prevMonth.setMonth(prevMonth.getMonth() - 1);
  const nextMonth = new Date(currentDate);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  // Format selected date
  const formatDateOrdinal = (day: number) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = day % 100;
    return day + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-card rounded-2xl shadow-2xl overflow-hidden border border-border">
      <div className="flex flex-col lg:flex-row">
        {/* Left Panel - Dark Theme with Validity Yellow */}
        <div className="lg:w-2/5 bg-gradient-to-br from-yellow-500 via-yellow-600 to-yellow-700 dark:from-yellow-600 dark:via-yellow-700 dark:to-yellow-800 relative overflow-hidden p-8 lg:p-10">
          {/* Geometric Pattern Background */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30h30v30H30zM0 0h30v30H0z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          
          <div className="relative z-10 h-full flex flex-col">
            {/* Month Navigation - Vertical Stack */}
            <div className="mb-8">
              <div className="flex flex-col space-y-2 mb-6">
                {/* Previous Month */}
                <button
                  onClick={() => navigateMonth('prev')}
                  className="text-white/50 hover:text-white/70 transition-colors text-left"
                >
                  <span className="text-lg font-normal">{getMonthName(prevMonth, true)}</span>
                </button>
                {/* Current Month - Prominent */}
                <div className="text-5xl font-bold text-white leading-tight">
                  {getMonthName(currentDate, true)}
                </div>
                {/* Next Month */}
                <button
                  onClick={() => navigateMonth('next')}
                  className="text-white/50 hover:text-white/70 transition-colors text-left"
                >
                  <span className="text-lg font-normal">{getMonthName(nextMonth, true)}</span>
                </button>
              </div>
              {/* Year */}
              <div className="text-xl font-semibold text-white">{currentDate.getFullYear()}</div>
            </div>

            {/* Selected Date */}
            <div className="mb-8 flex items-center gap-3">
              <CalendarIcon className="w-6 h-6 text-white" />
              <div className="text-white">
                <div className="text-lg font-semibold">
                  {getDayName(selectedDate)}, {getMonthName(selectedDate)} {formatDateOrdinal(selectedDate.getDate())}
                </div>
              </div>
            </div>

            {/* Events Section */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-white text-sm font-bold mb-4 tracking-wider uppercase">EVENTS:</h3>
              {loading ? (
                <div className="text-white/70 text-sm">Loading events...</div>
              ) : monthEvents.length === 0 ? (
                <div className="text-white/70 text-sm">No events scheduled for this month</div>
              ) : (
                <div className="space-y-3">
                  {monthEvents
                    .sort((a, b) => {
                      const dateA = new Date(a.start_date + (a.start_time ? `T${a.start_time}` : ''));
                      const dateB = new Date(b.start_date + (b.start_time ? `T${b.start_time}` : ''));
                      return dateA.getTime() - dateB.getTime();
                    })
                    .map((event, index) => {
                      const eventDate = new Date(event.start_date + (event.start_time ? `T${event.start_time}` : ''));
                      const timeStr = event.start_time 
                        ? eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
                        : 'All Day';
                      
                      return (
                        <div
                          key={event.id}
                          onClick={() => onEventClick?.(event)}
                          className="flex items-start gap-3 cursor-pointer hover:opacity-80 transition-opacity text-white"
                        >
                          <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold mb-1.5">{event.name}</div>
                            <div className="text-sm opacity-90">{timeStr}</div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Light Theme */}
        <div className="lg:w-3/5 bg-white dark:bg-card p-8 lg:p-10">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => viewMode === 'month' ? navigateMonth('prev') : navigateYear('prev')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-accent rounded transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-foreground" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">
                {viewMode === 'month' 
                  ? `${getMonthName(currentDate)} ${currentDate.getFullYear()}`
                  : currentDate.getFullYear()
                }
              </h2>
              <button
                onClick={() => viewMode === 'month' ? navigateMonth('next') : navigateYear('next')}
                className="p-1 hover:bg-gray-100 dark:hover:bg-accent rounded transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-foreground" />
              </button>
            </div>
            
            {/* Month/Year Toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  viewMode === 'month'
                    ? "bg-gray-900 dark:bg-primary text-white dark:text-primary-foreground"
                    : "bg-gray-100 dark:bg-accent text-gray-700 dark:text-foreground hover:bg-gray-200 dark:hover:bg-accent/80"
                )}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                  viewMode === 'year'
                    ? "bg-gray-900 dark:bg-primary text-white dark:text-primary-foreground"
                    : "bg-gray-100 dark:bg-accent text-gray-700 dark:text-foreground hover:bg-gray-200 dark:hover:bg-accent/80"
                )}
              >
                Year
              </button>
            </div>
          </div>

          {/* Year View */}
          {viewMode === 'year' ? (
            <div className="grid grid-cols-3 gap-3">
              {getAllMonths().map((month, index) => {
                const isCurrentMonth = 
                  month.date.getMonth() === new Date().getMonth() &&
                  month.date.getFullYear() === new Date().getFullYear();
                const isSelectedMonth = 
                  month.date.getMonth() === currentDate.getMonth() &&
                  month.date.getFullYear() === currentDate.getFullYear();
                
                return (
                  <button
                    key={index}
                    onClick={() => handleMonthClick(month.date)}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all hover:shadow-md",
                      isSelectedMonth
                        ? "border-yellow-500 dark:border-primary bg-yellow-50 dark:bg-primary/20"
                        : isCurrentMonth
                        ? "border-yellow-300 dark:border-primary/50 bg-yellow-50/50 dark:bg-primary/10"
                        : "border-gray-200 dark:border-border bg-white dark:bg-card hover:border-gray-300 dark:hover:border-primary/50"
                    )}
                  >
                    <div className="text-sm font-semibold text-gray-900 dark:text-foreground mb-1">
                      {month.fullName}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-muted-foreground">
                      {month.eventsCount} {month.eventsCount === 1 ? 'event' : 'events'}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-2 mb-4">
                {[1, 2, 3, 4, 5, 6, 0].map((day) => (
                  <div
                    key={day}
                    className={cn(
                      "text-center text-xs font-semibold py-2",
                      day === selectedDate.getDay() && day !== 0 && day !== 6
                        ? "text-yellow-600 dark:text-primary"
                        : "text-gray-600 dark:text-muted-foreground"
                    )}
                  >
                    {getDayNameShort(day)}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Previous month days */}
            {calendarData.prev.map((day, idx) => {
              const date = new Date(calendarData.year, calendarData.month - 1, day);
              const dateEvents = getEventsForDate(date);
              
              return (
                <button
                  key={`prev-${day}`}
                  onClick={() => handleDateSelect(day, false)}
                  className={cn(
                    "aspect-square rounded-lg text-sm transition-colors text-gray-400 dark:text-muted-foreground/50 hover:bg-gray-50 dark:hover:bg-accent",
                    "flex flex-col items-center justify-center"
                  )}
                >
                  {day}
                  {dateEvents.length > 0 && (
                    <div className="w-1 h-1 bg-gray-300 dark:bg-muted-foreground/30 rounded-full mt-1" />
                  )}
                </button>
              );
            })}

            {/* Current month days */}
            {calendarData.current.map((day) => {
              const date = new Date(calendarData.year, calendarData.month, day);
              const isSelected = 
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === calendarData.month &&
                selectedDate.getFullYear() === calendarData.year;
              const isToday = 
                date.getDate() === new Date().getDate() &&
                date.getMonth() === new Date().getMonth() &&
                date.getFullYear() === new Date().getFullYear();
              const dateEvents = getEventsForDate(date);
              
              return (
                <button
                  key={`current-${day}`}
                  onClick={() => handleDateSelect(day, true)}
                  className={cn(
                    "aspect-square rounded-lg text-sm font-medium transition-all",
                    "flex flex-col items-center justify-center relative",
                    isSelected
                      ? "bg-yellow-500 dark:bg-primary text-white dark:text-primary-foreground ring-2 ring-yellow-300 dark:ring-primary/50"
                      : isToday
                      ? "bg-yellow-50 dark:bg-primary/20 text-yellow-600 dark:text-primary border-2 border-yellow-300 dark:border-primary/50"
                      : "text-gray-900 dark:text-foreground hover:bg-gray-100 dark:hover:bg-accent",
                    dateEvents.length > 0 && !isSelected && "bg-blue-50 dark:bg-primary/10"
                  )}
                >
                  <span className={cn(
                    isSelected ? "underline" : isToday ? "font-bold" : ""
                  )}>
                    {day}
                  </span>
                  {dateEvents.length > 0 && (
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full mt-1",
                      isSelected ? "bg-white dark:bg-primary-foreground" : "bg-blue-500 dark:bg-primary"
                    )} />
                  )}
                </button>
              );
            })}

            {/* Next month days */}
            {calendarData.next.map((day) => {
              const date = new Date(calendarData.year, calendarData.month + 1, day);
              const dateEvents = getEventsForDate(date);
              
              return (
                <button
                  key={`next-${day}`}
                  onClick={() => handleDateSelect(day, false)}
                  className={cn(
                    "aspect-square rounded-lg text-sm transition-colors text-gray-400 dark:text-muted-foreground/50 hover:bg-gray-50 dark:hover:bg-accent",
                    "flex flex-col items-center justify-center"
                  )}
                >
                  {day}
                  {dateEvents.length > 0 && (
                    <div className="w-1 h-1 bg-gray-300 dark:bg-muted-foreground/30 rounded-full mt-1" />
                  )}
                </button>
              );
            })}
          </div>
            </>
          )}

          {/* Weather Section (Optional) */}
          {showWeather && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">☁️</div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-muted-foreground">Clouds & Sunshine</div>
                    <div className="text-3xl font-light text-gray-400 dark:text-muted-foreground/70">26°C</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Rochester NY</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

