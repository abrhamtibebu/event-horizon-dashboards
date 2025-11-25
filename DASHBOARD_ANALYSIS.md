# Event Horizon Dashboards - Deep Dive Analysis

## Overview

The Event Horizon Dashboards is a comprehensive React-based dashboard system built for the VEMS (Validity Event Management System). It provides role-based dashboards for different user types: Admin, Organizer, Usher, and Attendee.

## Architecture

### Tech Stack
- **Framework**: React 18.3.1 with TypeScript
- **Routing**: React Router v6.26.2
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with custom theme support
- **Charts**: Recharts 2.12.7 for data visualization
- **State Management**: React hooks, Zustand 4.5.7
- **HTTP Client**: Axios with interceptors for JWT token management
- **Build Tool**: Vite 5.4.1

### Project Structure

```
event-horizon-dashboards/
├── src/
│   ├── App.tsx                 # Main app with routing
│   ├── main.tsx               # Entry point
│   ├── pages/                 # Dashboard pages
│   │   ├── RoleDashboard.tsx # Routes to role-specific dashboards
│   │   ├── AdminDashboard.tsx
│   │   ├── OrganizerDashboard.tsx
│   │   ├── UsherDashboard.tsx
│   │   └── AttendeeDashboard.tsx
│   ├── components/            # Reusable UI components
│   ├── lib/                   # API and utility functions
│   ├── hooks/                 # Custom React hooks
│   ├── contexts/              # React contexts
│   └── types/                # TypeScript type definitions
```

## Dashboard System Architecture

### 1. Role-Based Routing (`RoleDashboard.tsx`)

The main dashboard component acts as a router that renders different dashboards based on user role:

```typescript
- Superadmin/Admin → AdminDashboard
- Organizer → OrganizerDashboard  
- Usher → UsherDashboard
- Attendee → AttendeeDashboard
```

### 2. API Integration (`lib/api.ts`)

Centralized API client with:
- **Base URL**: Configurable via `VITE_API_URL` (defaults to `http://localhost:8000/api`)
- **Authentication**: JWT token-based with automatic refresh
- **Interceptors**: 
  - Request: Adds Authorization header
  - Response: Handles 401 errors and token refresh
- **Timeout**: 60 seconds for long-running operations

### 3. Layout System (`components/Layout.tsx`)

- Uses `SidebarProvider` for responsive sidebar
- `AppSidebar` for navigation
- `Header` with global search
- `Outlet` for nested routes with context (searchQuery)

## Dashboard Deep Dive

### Admin Dashboard (`AdminDashboard.tsx`)

**Key Features:**
1. **Key Metrics Cards**
   - Total Events
   - Total Users  
   - Active Organizers
   - Items in Trash

2. **Charts & Visualizations**
   - Event & User Growth (Line Chart)
   - Event Status Distribution (Pie Chart)
   - User Role Distribution (Progress bars)
   - Audit Logs (Bar Chart - Last 30 days)

3. **Management Sections**
   - **Organizers Pending Approval**: Donut chart + table with approval actions
   - **Audit Log Entries**: Recent system activity with trends
   - **Most Popular Event**: Top 5 events by attendance
   - **Peak Month**: Events per month analysis
   - **Pending Event Publications**: Events awaiting Evella platform approval

4. **Data Sources**
   - `/dashboard/admin` - Main dashboard data
   - `/organizers?status=pending` - Pending organizers
   - `/organizers?status=active` - Active organizers
   - `/audit-logs` - System audit logs
   - `/reports/summary` - Report summaries
   - `/events` - All events
   - `/trash` - Soft-deleted items count

### Organizer Dashboard (`OrganizerDashboard.tsx`)

**Key Features:**
1. **Key Metrics**
   - My Events count
   - Total Attendees
   - Total Revenue
   - Unread Messages

2. **Event Performance Chart**
   - Area chart showing registrations and attendance trends
   - Zoom controls (3 months, 6 months, 1 year)
   - Detailed view modal with comprehensive statistics
   - Monthly breakdown table with trends

3. **Event Management**
   - **Dual View System**:
     - Calendar View: Interactive calendar with event markers
     - List View: Table view with filters
   - Event filters by status (active, completed, draft, cancelled)
   - Quick actions: View details, Edit, Delete
   - Progress tracking for event registrations

4. **Additional Sections**
   - Guest Type Distribution (Pie Chart)
   - Event Popularity (Bar Chart - Top events by attendance)
   - Upcoming Tasks
   - My Ushers (team members)
   - Quick Actions (Locate Badges)
   - Recent Activity feed

5. **Real-time Features**
   - Calendar markers for events
   - Click-to-view event details with permission checks
   - Organizer-specific event filtering

6. **Data Sources**
   - `/dashboard/organizer` - Dashboard data
   - `/organizer/events` - Events for current organizer
   - `/events` - All events (filtered by organizer_id)
   - `/reports/summary` - Analytics data
   - Mock data support for development

### Usher Dashboard (`UsherDashboard.tsx`)

**Key Features:**
1. **Key Metrics**
   - Assigned Events
   - Active Events
   - Total Earnings (ETB)
   - Earnings per Event
   - Total Check-ins Today
   - Pending Issues

2. **Event Management**
   - **Assigned Events Card**: Shows all events assigned to usher
   - Task management with checkboxes
   - Check-in progress bars
   - Job acceptance/rejection workflow
   - Earnings calculation based on daily rate and days

3. **QR Code Check-in System**
   - Per-event QR scanner dialog
   - Real-time attendee check-in
   - Manual check-in fallback
   - Search functionality for attendees

4. **Communication Features**
   - Event Chat: Direct messaging for event teams
   - Message Organizer: Direct communication with event organizer
   - Integration with messaging system

5. **Additional Sections**
   - Quick Check-in panel
   - Recent Check-ins list with guest types
   - Pending Issues tracker
   - Recent Activity

6. **Data Sources**
   - `/dashboard/usher` - Dashboard data
   - `/events/{eventId}/attendees` - Event attendees
   - `/events/{eventId}/attendees/{attendeeId}/check-in` - Check-in API
   - `/events/{eventId}/usher/tasks/complete` - Task completion

### Attendee Dashboard (`AttendeeDashboard.tsx`)

**Key Features:**
1. **Key Metrics**
   - Events Attended
   - Upcoming Events
   - Network Connections
   - Favorite Events

2. **Event Discovery**
   - Search functionality
   - Category filtering
   - Event cards with images
   - Event details (date, time, location, price, rating)
   - Favorite/Share buttons

3. **Event Management**
   - My Registered Events list
   - Ticket viewing
   - Event details navigation
   - Status badges (confirmed, pending, cancelled)

4. **Networking**
   - Networking Opportunities section
   - Group recommendations
   - Conversation starters
   - Community features

5. **Recommendations**
   - Personalized event recommendations
   - Based on preferences and history

6. **Data Sources**
   - `/dashboard/attendee` - Dashboard data

## Shared Components

### 1. MetricCard (`components/MetricCard.tsx`)
- Displays key statistics with icons
- Supports trend indicators (positive/negative)
- Optional linking capability
- Gradient backgrounds

### 2. DashboardCard (`components/DashboardCard.tsx`)
- Container component for dashboard sections
- Standardized header and content layout
- Consistent styling

### 3. RecentActivity (`components/RecentActivity.tsx`)
- Displays recent system activities
- Configurable limit
- Placeholder implementation

### 4. ModernCalendarWidget (`components/ModernCalendarWidget.tsx`)
- Interactive calendar view
- Event markers on dates
- Date selection handling
- Event click handlers

## Authentication & Security

### Token Management
- JWT tokens stored in localStorage or sessionStorage
- Automatic token refresh on 401 errors
- Token expiration tracking
- Refresh token queue system

### Permission Checks
- Role-based route protection
- Organizer-specific data filtering
- Event access validation before navigation

## Data Flow

1. **Dashboard Load**:
   ```
   User Login → Role Detection → Dashboard Selection → API Call → State Update → Render
   ```

2. **API Calls**:
   - All dashboards fetch from `/dashboard/{role}` endpoint
   - Additional data fetched from specific endpoints
   - Mock data support for offline/development mode

3. **State Management**:
   - React useState for local component state
   - useEffect for data fetching and side effects
   - Context API for global search state

## Features & Capabilities

### Real-time Updates
- Dashboard refresh capabilities (currently disabled in OrganizerDashboard)
- Polling support (commented out)
- Real-time messaging integration

### Responsive Design
- Mobile-first approach
- Grid layouts with breakpoints
- Tablet and desktop optimizations

### Search Functionality
- Global search via Header component
- Filtered results per dashboard
- Search context passed via Outlet

### Mock Data Support
- Development mode with mock data
- `isMockMode()` check
- `getMockData()` function for testing

### Theme Support
- Light/Dark mode
- Theme provider integration
- System theme detection

## API Endpoints Used

### Dashboard Endpoints
- `GET /dashboard/admin`
- `GET /dashboard/organizer`
- `GET /dashboard/usher`
- `GET /dashboard/attendee`

### Common Endpoints
- `GET /events` - All events
- `GET /organizer/events` - Organizer's events
- `GET /reports/summary` - Report summaries
- `GET /audit-logs` - Audit logs
- `GET /organizers` - Organizers list
- `GET /trash` - Trash items
- `PUT /events/{id}/advertisement-status` - Update event publication status

### Event-Specific Endpoints
- `GET /events/{eventId}` - Event details
- `PUT /events/{eventId}` - Update event
- `DELETE /events/{eventId}` - Delete event
- `POST /events/{eventId}/ushers` - Assign ushers
- `GET /events/{eventId}/attendees` - Event attendees
- `POST /events/{eventId}/attendees/{attendeeId}/check-in` - Check-in attendee

## Performance Optimizations

1. **Lazy Loading**: Routes loaded on demand
2. **Caching**: API responses cached (in vendor API service)
3. **Debouncing**: Search queries debounced
4. **Pagination**: Large datasets paginated
5. **Memoization**: useMemo for computed values
6. **Conditional Rendering**: Components rendered based on data availability

## Known Issues & Limitations

1. **RecentActivity**: Currently a placeholder implementation
2. **Polling**: Dashboard auto-refresh disabled in OrganizerDashboard
3. **Mock Data**: Some dashboards have mock data fallbacks
4. **Error Handling**: Basic error handling, could be enhanced

## Future Enhancements

### Suggested Improvements
1. Implement full RecentActivity component with real data
2. Add WebSocket support for real-time updates
3. Enhanced error boundaries and error states
4. Loading skeletons improvements
5. Offline mode support
6. Dashboard customization (widget arrangement)
7. Export functionality for reports
8. Advanced filtering and sorting options

## Development Notes

### Environment Variables
- `VITE_API_URL`: Backend API base URL
- Default: `http://localhost:8000/api`

### Running the Application
```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

### Code Quality
- TypeScript for type safety
- ESLint for code quality
- Consistent component structure
- Modular architecture

## Conclusion

The Event Horizon Dashboards provide a comprehensive, role-based dashboard system with:
- ✅ Rich data visualizations
- ✅ Role-specific functionality
- ✅ Real-time check-in capabilities
- ✅ Event management tools
- ✅ Responsive design
- ✅ Secure authentication
- ✅ Extensible architecture

The system is well-structured, maintainable, and ready for production use with proper backend integration.

