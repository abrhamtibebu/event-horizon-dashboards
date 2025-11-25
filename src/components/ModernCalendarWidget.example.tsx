/**
 * Example usage of ModernCalendarWidget
 * 
 * This component displays events in a modern calendar widget matching the provided design.
 * Replace the EnhancedEventCalendar in OrganizerDashboard with this component.
 */

import { ModernCalendarWidget } from './ModernCalendarWidget';
import { useState } from 'react';

export function CalendarWidgetExample() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Option 1: Use external events (recommended for dashboard)
  const events = [
    {
      id: 1,
      name: 'Tech Conference 2024',
      start_date: '2024-03-10',
      start_time: '09:00:00',
      location: 'Convention Center',
    },
    {
      id: 2,
      name: 'Team Meeting',
      start_date: '2024-03-15',
      start_time: '14:30:00',
      location: 'Office',
    },
  ];

  // Option 2: Let the component fetch events automatically
  // Just don't pass the events prop

  return (
    <div className="p-6">
      <ModernCalendarWidget
        events={events} // Optional: pass events or let component fetch them
        onDateSelect={(date) => {
          setSelectedDate(date);
          console.log('Selected date:', date);
        }}
        onEventClick={(event) => {
          console.log('Clicked event:', event);
          // Navigate to event details or open modal
        }}
        showWeather={false} // Set to true to show weather section
      />
    </div>
  );
}

// To use in OrganizerDashboard, replace:
// <EnhancedEventCalendar ... />
// with:
// <ModernCalendarWidget
//   events={allEvents.map(e => ({
//     id: e.id,
//     name: e.name,
//     start_date: e.start_date || e.date,
//     start_time: e.start_time,
//     location: e.location,
//   }))}
//   onDateSelect={(date) => setSelectedDate(date)}
//   onEventClick={handleCalendarEventClick}
// />

