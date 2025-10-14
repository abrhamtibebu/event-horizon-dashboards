import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Events from './pages/Events'
import EventDetails from './pages/EventDetails'
import CreateEvent from './pages/CreateEvent'
import CreateTicketedEvent from './pages/CreateTicketedEvent'
import CreateFreeEvent from './pages/CreateFreeEvent'
import EventTypeSelection from './pages/EventTypeSelection'
import Users from './pages/Users'
import Organizers from './pages/Organizers'
import AddOrganizer from './pages/AddOrganizer'
import Messages from './pages/Messages'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import AuditLogs from './pages/AuditLogs'
import Trash from './pages/Trash'
import SignIn from './pages/SignIn'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import NotFound from './pages/NotFound'
import RoleDashboard from './pages/RoleDashboard'
import LocateBadges from './pages/LocateBadges'
import CheckIn from './pages/CheckIn'
import Tickets from './pages/Tickets'
import OrganizerProfile from './pages/OrganizerProfile'
import { useAuth } from './hooks/use-auth'
import BadgePage from './pages/BadgePage'
import BatchBadgePage from './pages/BatchBadgePage'
import Guests from './pages/Guests'
import BadgeDesignerTab from './pages/BadgeDesignerTab'
import BadgeDesignPage from './pages/BadgeDesignPage'
import Team from '@/pages/Team'
import UsherManagement from '@/pages/UsherManagement'
import UsherEventManagement from '@/pages/UsherEventManagement'
import UsherEvents from '@/pages/UsherEvents'
import UsherBadgeLocator from '@/pages/UsherBadgeLocator'
import PublicEventRegister from './pages/PublicEventRegister'

import UsherJobDetails from './pages/UsherJobDetails';
import UsherDashboard from './pages/UsherDashboard';
import EventPublication from './pages/EventPublication';
import EvellaAnalytics from './pages/EvellaAnalytics';
import VendorManagement from './pages/VendorManagement';
import VendorManagementRevamped from './pages/VendorManagementRevamped';
import Tasks from './pages/Tasks';
import Marketing from './pages/Marketing';
import { SuspendedOrganizerBanner } from './components/SuspendedOrganizerBanner';
import GenerateUsherRegistrationLink from './pages/GenerateUsherRegistrationLink';
import UsherRegister from './pages/UsherRegister';
import UsherRegistrationSuccess from './pages/UsherRegistrationSuccess';
import ShortLinkResolver from './pages/ShortLinkResolver';
import ShortLinkManagement from './pages/ShortLinkManagement';
import RegistrationSuccess from './pages/RegistrationSuccess';

// Import API test utility for development
if (import.meta.env.DEV) {
  import('./utils/apiTest');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  console.log('[ProtectedRoute] isAuthenticated:', isAuthenticated, 'isLoading:', isLoading)
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log('[ProtectedRoute] Showing loading spinner')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    )
  }
  
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to /')
    return <Navigate to="/" replace />
  }
  
  console.log('[ProtectedRoute] Authenticated, showing children')
  return children
}

const UnauthenticatedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth()
  
  console.log('[UnauthenticatedRoute] isAuthenticated:', isAuthenticated, 'isLoading:', isLoading)
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log('[UnauthenticatedRoute] Showing loading spinner')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    )
  }
  
  if (isAuthenticated) {
    console.log('[UnauthenticatedRoute] Authenticated, redirecting to /dashboard')
    return <Navigate to="/dashboard" replace />
  }
  
  console.log('[UnauthenticatedRoute] Not authenticated, showing children')
  return children
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <SuspendedOrganizerBanner />
        <Routes>
          <Route
            path="/"
            element={
              <UnauthenticatedRoute>
                <SignIn />
              </UnauthenticatedRoute>
            }
          />
          <Route
            path="/signin"
            element={
              <UnauthenticatedRoute>
                <SignIn />
              </UnauthenticatedRoute>
            }
          />
          <Route
            path="/register"
            element={
              <UnauthenticatedRoute>
                <Register />
              </UnauthenticatedRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <UnauthenticatedRoute>
                <ForgotPassword />
              </UnauthenticatedRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <UnauthenticatedRoute>
                <ResetPassword />
              </UnauthenticatedRoute>
            }
          />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          <Route
            path="/events/:eventId/attendees/:attendeeId/badge"
            element={
              <ProtectedRoute>
                <BadgePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:eventId/badges/batch"
            element={
              <ProtectedRoute>
                <BatchBadgePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/apps/badge-designer"
            element={
              <ProtectedRoute>
                <BadgeDesignerTab eventId={1} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/events/:eventId/badge-design"
            element={
              <ProtectedRoute>
                <BadgeDesignPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleDashboard />} />
            <Route path="events" element={<Events />} />
            <Route path="events/create" element={<EventTypeSelection />} />
            <Route path="events/create/ticketed" element={<CreateTicketedEvent />} />
            <Route path="events/create/free" element={<CreateFreeEvent />} />
            <Route path="events/:eventId" element={<EventDetails />} />
            <Route path="team" element={<Team />} />
            <Route path="users" element={<Users />} />
            <Route path="organizers" element={<Organizers />} />
            <Route path="organizers/add" element={<AddOrganizer />} />
            <Route
              path="organizers/:organizerId"
              element={<OrganizerProfile />}
            />
            <Route path="locate-badges" element={<LocateBadges />} />
            <Route path="messages" element={<Messages />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="trash" element={<Trash />} />
            <Route path="event-publication" element={<EventPublication />} />
            <Route path="evella-analytics" element={<EvellaAnalytics />} />
            <Route path="check-in" element={<CheckIn />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="guests" element={<Guests />} />
            <Route path="usher-management" element={<UsherManagement />} />
            <Route path="usher-management/register" element={<GenerateUsherRegistrationLink />} />
            <Route path="usher-management/links" element={<ShortLinkManagement />} />
            <Route path="usher/events" element={<UsherEvents />} />
            <Route path="usher/events/:eventId" element={<UsherEventManagement />} />
            <Route path="usher/badge-locator" element={<UsherBadgeLocator />} />
            <Route path="usher/jobs" element={<UsherDashboard />} />
            <Route path="usher/jobs/:eventId" element={<UsherJobDetails />} />
            <Route path="vendor-management" element={<VendorManagementRevamped />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="marketing" element={<Marketing />} />

          </Route>

          <Route path="/register/:eventUuid" element={<PublicEventRegister />} />
          <Route path="/registration/success" element={<RegistrationSuccess />} />
          <Route path="/usher/register" element={<UsherRegister />} />
          <Route path="/usher/register/success" element={<UsherRegistrationSuccess />} />
          <Route path="/r/:shortCode" element={<ShortLinkResolver />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
