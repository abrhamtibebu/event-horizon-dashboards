import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { NotificationProvider } from './contexts/NotificationContext'
import { Layout } from './components/Layout'
import { Spinner } from './components/ui/spinner'
import { ThemeTransition } from './components/ThemeTransition'
import { useEffect } from 'react'
import Events from './pages/Events'
import EventDetails from './pages/EventDetails'
import CreateEvent from './pages/CreateEvent'
import CreateTicketedEvent from './pages/CreateTicketedEvent'
import CreateFreeEvent from './pages/CreateFreeEvent'
import EventTypeSelection from './pages/EventTypeSelection'
import Users from './pages/Users'
import Organizers from './pages/Organizers'
import AddOrganizer from './pages/AddOrganizer'
import Messages from './pages/MessagesSimple'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import AuditLogs from './pages/AuditLogs'
import Trash from './pages/Trash'
import SignIn from './pages/SignInPage'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import NotFound from './pages/NotFound'
import AdminDashboard from './pages/AdminDashboard'
import OrganizerDashboard from './pages/OrganizerDashboard'
import LocateBadges from './pages/LocateBadges'
import CheckIn from './pages/CheckIn'
import Tickets from './pages/Tickets'
import MyTicketsPage from './pages/tickets/MyTicketsPage'
import OrganizerTicketsPage from './pages/tickets/OrganizerTicketsPage'
import TicketPurchasePage from './pages/tickets/TicketPurchasePage'
import TicketPurchaseSuccess from './pages/tickets/TicketPurchaseSuccess'
import TicketValidator from './pages/checkin/TicketValidator'
import AnalyticsDashboard from './pages/tickets/AnalyticsDashboard'
import OrganizerProfile from './pages/OrganizerProfile'
import { useAuth } from './hooks/use-auth'
import { useRealtimeMessages } from './hooks/use-realtime-messages'
import BadgePage from './pages/BadgePage'
import BatchBadgePage from './pages/BatchBadgePage'
import Guests from './pages/Guests'

import Team from '@/pages/Team'
import UsherManagement from '@/pages/UsherManagement'
import UsherEventManagement from '@/pages/UsherEventManagement'
import UsherEvents from '@/pages/UsherEvents'
import UsherBadgeLocator from '@/pages/UsherBadgeLocator'
import PublicEventRegister from './pages/PublicEventRegister'
import CustomEventRegistration from './pages/CustomEventRegistration'
import CustomRegistrationSuccess from './pages/CustomRegistrationSuccess'
import PublicFormRegistration from './pages/PublicFormRegistration'

import UsherJobDetails from './pages/UsherJobDetails'
import UsherDashboard from './pages/UsherDashboard'
import VendorManagement from './pages/VendorManagement'
import SalespersonManagement from './pages/SalespersonManagement'
import SalespersonRegistration from './pages/SalespersonRegistration'
import Tasks from './pages/Tasks'
import Marketing from './pages/Marketing'
import { SuspendedOrganizerBanner } from './components/SuspendedOrganizerBanner'
import GenerateUsherRegistrationLink from './pages/GenerateUsherRegistrationLink'
import UsherRegister from './pages/UsherRegister'
import UsherRegistrationSuccess from './pages/UsherRegistrationSuccess'
import ShortLinkResolver from './pages/ShortLinkResolver'
import ShortLinkManagement from './pages/ShortLinkManagement'
import RegistrationSuccess from './pages/RegistrationSuccess'
import SubscriptionPlans from './pages/SubscriptionPlans'
import SubscriptionManagement from './pages/SubscriptionManagement'
import SubscriptionPayment from './pages/SubscriptionPayment'
import UsageDashboard from './pages/UsageDashboard'
import AdminSubscriptionManagement from './pages/AdminSubscriptionManagement'

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
        <Spinner size="md" text="Loading..." />
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
        <Spinner size="md" text="Loading..." />
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

// Public route - accessible to both authenticated and unauthenticated users
const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isLoading } = useAuth()

  // Show loading spinner while checking authentication (but don't redirect)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="md" text="Loading..." />
      </div>
    )
  }

  return children
}

// Dashboard router based on user role
const DashboardRouter = () => {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="md" text="Loading dashboard..." />
      </div>
    )
  }

  // Route to appropriate dashboard based on user role
  if (user.role === 'admin' || user.role === 'superadmin') {
    return <AdminDashboard />
  } else if (user.role === 'organizer' || user.role === 'organizer_admin') {
    return <OrganizerDashboard />
  } else {
    // Default to organizer dashboard for other roles
    return <OrganizerDashboard />
  }
}

// Component to initialize real-time messaging inside QueryClientProvider
const AppContent = () => {
  return (
    <TooltipProvider>
      <NotificationProvider>
        <AppWithRealtime />
      </NotificationProvider>
    </TooltipProvider>
  )
}

// Component that uses real-time messaging inside NotificationProvider
const AppWithRealtime = () => {
  // Initialize real-time messaging for notifications
  useRealtimeMessages()

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered successfully:', registration.scope)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return (
    <>
      <ThemeTransition />
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
          {/* Public routes - accessible without authentication */}
          <Route path="/" element={<PublicRoute><SignIn /></PublicRoute>} />
          <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route path="/privacy" element={<PublicRoute><PrivacyPolicy /></PublicRoute>} />
          <Route path="/terms" element={<PublicRoute><TermsOfService /></PublicRoute>} />

          {/* Event public registration routes */}
          <Route path="/event/register/:eventUuid" element={<PublicRoute><PublicEventRegister /></PublicRoute>} />
          <Route path="/event/custom-register/:eventId" element={<PublicRoute><CustomEventRegistration /></PublicRoute>} />
          <Route path="/event/custom-register/:eventId/success" element={<PublicRoute><CustomRegistrationSuccess /></PublicRoute>} />
          <Route path="/form/register/:formId" element={<PublicRoute><PublicFormRegistration /></PublicRoute>} />
          <Route path="/form/register/:formId/success" element={<PublicRoute><RegistrationSuccess /></PublicRoute>} />
          <Route path="/registration/success" element={<PublicRoute><RegistrationSuccess /></PublicRoute>} />
          <Route path="/usher/register" element={<PublicRoute><UsherRegister /></PublicRoute>} />
          <Route path="/usher/register/success" element={<PublicRoute><UsherRegistrationSuccess /></PublicRoute>} />
          <Route path="/salesperson/register/:code" element={<PublicRoute><SalespersonRegistration /></PublicRoute>} />
          <Route path="/r/:shortCode" element={<PublicRoute><ShortLinkResolver /></PublicRoute>} />

          {/* Public ticket purchase routes - no login required */}
          <Route path="/tickets/purchase/:eventId" element={<PublicRoute><TicketPurchasePage /></PublicRoute>} />
          <Route path="/tickets/purchase/success" element={<PublicRoute><TicketPurchaseSuccess /></PublicRoute>} />

          {/* Unauthenticated-only routes */}
          <Route
            path="/unauth-only"
            element={
              <UnauthenticatedRoute>
                <SignIn />
              </UnauthenticatedRoute>
            }
          />

          {/* Protected routes with layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardRouter />} />
            <Route path="events" element={<Events />} />
            <Route path="events/create" element={<EventTypeSelection />} />
            <Route path="events/create/ticketed" element={<CreateTicketedEvent />} />
            <Route path="events/create/free" element={<CreateFreeEvent />} />
            <Route path="events/:eventId" element={<EventDetails />} />
            <Route path="team" element={<Team />} />
            <Route path="users" element={<Users />} />
            <Route path="organizers" element={<Organizers />} />
            <Route path="organizers/add" element={<AddOrganizer />} />
            <Route path="organizers/:organizerId" element={<OrganizerProfile />} />
            <Route path="locate-badges" element={<LocateBadges />} />
            <Route path="messages" element={<Messages />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="trash" element={<Trash />} />
            <Route path="check-in" element={<CheckIn />} />
            <Route path="tickets" element={<MyTicketsPage />} />
            <Route path="tickets/purchase/:eventId" element={<TicketPurchasePage />} />
            <Route path="ticket-management" element={<OrganizerTicketsPage />} />
            <Route path="ticket-analytics/:eventId" element={<AnalyticsDashboard />} />
            <Route path="ticket-validator" element={<TicketValidator />} />
            <Route path="guests" element={<Guests />} />
            <Route path="usher-management" element={<UsherManagement />} />
            <Route path="usher-management/register" element={<GenerateUsherRegistrationLink />} />
            <Route path="usher-management/links" element={<ShortLinkManagement />} />
            <Route path="usher/events" element={<UsherEvents />} />
            <Route path="usher/events/:eventId" element={<UsherEventManagement />} />
            <Route path="usher/badge-locator" element={<UsherBadgeLocator />} />
            <Route path="usher/jobs" element={<UsherDashboard />} />
            <Route path="usher/jobs/:eventId" element={<UsherJobDetails />} />
            <Route path="vendor-management" element={<VendorManagement />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="marketing" element={<Marketing />} />
            <Route path="salesperson-management" element={<SalespersonManagement />} />
            <Route path="subscription" element={<SubscriptionManagement />} />
            <Route path="subscription/plans" element={<SubscriptionPlans />} />
            <Route path="subscription/payment" element={<SubscriptionPayment />} />
            <Route path="subscription/usage" element={<UsageDashboard />} />
            <Route path="admin/subscriptions" element={<AdminSubscriptionManagement />} />
          </Route>

          {/* Standalone protected routes (without layout) */}
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


          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

export default App