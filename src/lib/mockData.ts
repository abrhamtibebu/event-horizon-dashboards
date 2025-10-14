// Mock data service for development when backend is not available
export const mockData = {
  // Mock organizer profile
  organizerProfile: {
    id: 1,
    name: 'Test Organizer',
    email: 'test@organizer.com',
    phone: '+251-911-234-567',
    address: 'Addis Ababa, Ethiopia',
    status: 'active',
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  },

  // Mock dashboard data
  dashboardData: {
    total_events: 5,
    active_events: 3,
    total_attendees: 150,
    total_revenue: 25000,
    upcoming_events: 2,
    recent_registrations: 12,
    keyMetrics: {
      total_events: 5,
      active_events: 3,
      total_attendees: 150,
      total_revenue: 25000
    },
    eventPerformance: [
      { month: 'Jan', registrations: 25, attendance: 20 },
      { month: 'Feb', registrations: 30, attendance: 28 },
      { month: 'Mar', registrations: 35, attendance: 32 },
      { month: 'Apr', registrations: 40, attendance: 38 },
      { month: 'May', registrations: 45, attendance: 42 },
      { month: 'Jun', registrations: 50, attendance: 48 }
    ],
    myEvents: [],
    recentMessages: [],
    upcomingTasks: [],
    events: [],
    ushers: []
  },

  // Mock events data
  events: [
    {
      id: 1,
      name: 'Tech Conference 2024',
      description: 'Annual technology conference with workshops and networking',
      start_date: '2024-12-15T09:00:00.000Z',
      end_date: '2024-12-15T17:00:00.000Z',
      location: 'Addis Ababa, Ethiopia',
      status: 'active',
      total_attendees: 50,
      created_at: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 2,
      name: 'Business Networking Event',
      description: 'Networking event for business professionals',
      start_date: '2024-12-20T18:00:00.000Z',
      end_date: '2024-12-20T22:00:00.000Z',
      location: 'Addis Ababa, Ethiopia',
      status: 'active',
      total_attendees: 30,
      created_at: '2024-01-01T00:00:00.000Z'
    }
  ],

  // Mock analytics data
  analytics: {
    total_events: 5,
    total_attendees: 150,
    total_revenue: 25000,
    conversion_rate: 75.5,
    top_events: [
      { name: 'Tech Conference 2024', attendees: 50, revenue: 10000 },
      { name: 'Business Networking Event', attendees: 30, revenue: 6000 }
    ]
  },

  // Mock reports summary
  reportsSummary: {
    total_events: 5,
    total_attendees: 150,
    total_revenue: 25000,
    average_attendance: 30,
    top_performing_event: 'Tech Conference 2024'
  }
}

// Utility function to check if we're in mock mode
export const isMockMode = (): boolean => {
  return localStorage.getItem('mock_auth') === 'true'
}

// Utility function to get mock data with delay to simulate API calls
export const getMockData = async <T>(data: T, delay: number = 500): Promise<T> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data)
    }, delay)
  })
}
