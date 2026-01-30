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
import AddUser from './pages/AddUser'
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
import OrganizerSuspend from './pages/OrganizerSuspend'
import OrganizerContacts from './pages/OrganizerContacts'
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
import Marketing from './pages/Marketing'
import { SuspendedOrganizerBanner } from './components/SuspendedOrganizerBanner'
import { RoleProtectedRoute } from './components/RoleProtectedRoute'
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
import Tasks from './pages/Tasks'
import SystemHealth from './pages/SystemHealth'
import FinancialDashboard from './pages/FinancialDashboard'
import ContentModeration from './pages/ContentModeration'
import AdvancedAnalytics from './pages/AdvancedAnalytics'
import SystemSettings from './pages/SystemSettings'
import SecurityAudit from './pages/SecurityAudit'
import DataManagement from './pages/DataManagement'
import APIManagement from './pages/APIManagement'
import IntegrationManagement from './pages/IntegrationManagement'
import PerformanceOptimization from './pages/PerformanceOptimization'
import SystemLogs from './pages/SystemLogs'
import AutomationWorkflows from './pages/AutomationWorkflows'
import AdvancedSecurity from './pages/AdvancedSecurity'
import ComplianceAudit from './pages/ComplianceAudit'
import NotificationTemplates from './pages/NotificationTemplates'
import RolePermissions from './pages/RolePermissions'

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

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="md" text="Loading..." />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

const UnauthenticatedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="md" text="Loading..." />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

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
            {/* Dashboard - accessible to all authenticated users */}
            <Route index element={<DashboardRouter />} />
            
            {/* Events & Tickets - based on sidebar roles */}
            <Route 
              path="events" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin', 'event_manager']}>
                  <Events />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="events/create" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'organizer', 'organizer_admin', 'event_manager']}>
                  <EventTypeSelection />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="events/create/ticketed" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'organizer', 'organizer_admin', 'event_manager']}>
                  <CreateTicketedEvent />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="events/create/free" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'organizer', 'organizer_admin', 'event_manager']}>
                  <CreateFreeEvent />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="events/:eventId" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin', 'usher', 'event_manager']}>
                  <EventDetails />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="ticket-management" 
              element={
                <RoleProtectedRoute allowedRoles={['organizer', 'organizer_admin', 'admin', 'superadmin']}>
                  <OrganizerTicketsPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="tickets" 
              element={
                <RoleProtectedRoute allowedRoles={['attendee']}>
                  <MyTicketsPage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="tickets/purchase/:eventId" 
              element={
                <RoleProtectedRoute allowedRoles={['attendee', 'organizer', 'organizer_admin', 'admin', 'superadmin']}>
                  <TicketPurchasePage />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="ticket-analytics/:eventId" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin']}>
                  <AnalyticsDashboard />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Management - based on sidebar roles */}
            <Route 
              path="tasks" 
              element={
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="users" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Users />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="users/add" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <AddUser />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="users/edit/:id" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <AddUser />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="organizers" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Organizers />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="organizers/add" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <AddOrganizer />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="organizers/:organizerId/suspend" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <OrganizerSuspend />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="organizers/:organizerId/contacts" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <OrganizerContacts />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="organizers/:organizerId/edit" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <OrganizerProfile />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="organizers/:organizerId" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <OrganizerProfile />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="guests" 
              element={
                <RoleProtectedRoute allowedRoles={['organizer', 'organizer_admin']}>
                  <Guests />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="usher-management" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin', 'user']}>
                  <UsherManagement />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="usher-management/register" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin', 'user']}>
                  <GenerateUsherRegistrationLink />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="usher-management/links" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin', 'user']}>
                  <ShortLinkManagement />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="vendor-management" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin', 'finance_manager', 'procurement_manager', 'operations_manager', 'purchase_requester', 'purchase_approver', 'proforma_manager', 'proforma_approver', 'purchase_order_issuer', 'payment_requester', 'payment_approver']}>
                  <VendorManagement />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="salesperson-management" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <SalespersonManagement />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/subscriptions" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <AdminSubscriptionManagement />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/system-health" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <SystemHealth />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/financials" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <FinancialDashboard />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/moderation" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <ContentModeration />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/analytics" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <AdvancedAnalytics />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/settings" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <SystemSettings />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/security" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <SecurityAudit />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/data" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <DataManagement />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/api" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <APIManagement />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/integrations" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <IntegrationManagement />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/performance" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <PerformanceOptimization />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/logs" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <SystemLogs />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/automation" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <AutomationWorkflows />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/advanced-security" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <AdvancedSecurity />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/compliance" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <ComplianceAudit />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/notification-templates" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <NotificationTemplates />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="admin/roles" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <RolePermissions />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="subscription" 
              element={
                <RoleProtectedRoute allowedRoles={['organizer', 'organizer_admin']}>
                  <SubscriptionManagement />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="subscription/plans" 
              element={
                <RoleProtectedRoute allowedRoles={['organizer', 'organizer_admin']}>
                  <SubscriptionPlans />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="subscription/payment" 
              element={
                <RoleProtectedRoute allowedRoles={['organizer', 'organizer_admin']}>
                  <SubscriptionPayment />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="subscription/usage" 
              element={
                <RoleProtectedRoute allowedRoles={['organizer', 'organizer_admin']}>
                  <UsageDashboard />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="team" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'organizer', 'organizer_admin']}>
                  <Team />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Operations - based on sidebar roles */}
            <Route 
              path="check-in" 
              element={
                <RoleProtectedRoute allowedRoles={['usher']}>
                  <CheckIn />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="ticket-validator" 
              element={
                <RoleProtectedRoute allowedRoles={['usher', 'organizer', 'organizer_admin', 'admin', 'superadmin']}>
                  <TicketValidator />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="locate-badges" 
              element={
                <RoleProtectedRoute allowedRoles={['admin', 'organizer', 'organizer_admin', 'event_manager', 'usher']}>
                  <LocateBadges />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="usher/events" 
              element={
                <RoleProtectedRoute allowedRoles={['usher']}>
                  <UsherEvents />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="usher/events/:eventId" 
              element={
                <RoleProtectedRoute allowedRoles={['usher']}>
                  <UsherEventManagement />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="usher/badge-locator" 
              element={
                <RoleProtectedRoute allowedRoles={['usher']}>
                  <UsherBadgeLocator />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="usher/jobs" 
              element={
                <RoleProtectedRoute allowedRoles={['usher']}>
                  <UsherDashboard />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="usher/jobs/:eventId" 
              element={
                <RoleProtectedRoute allowedRoles={['usher']}>
                  <UsherJobDetails />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Insights - based on sidebar roles */}
            <Route 
              path="reports" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'organizer', 'organizer_admin']}>
                  <Reports />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Connect - based on sidebar roles */}
            <Route 
              path="messages" 
              element={
                <ProtectedRoute>
                  <Messages />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="marketing" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin', 'marketing_specialist']}>
                  <Marketing />
                </RoleProtectedRoute>
              } 
            />
            
            {/* System - based on sidebar roles */}
            <Route 
              path="audit-logs" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <AuditLogs />
                </RoleProtectedRoute>
              } 
            />
            <Route 
              path="trash" 
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Trash />
                </RoleProtectedRoute>
              } 
            />
            
            {/* Common routes - accessible to all authenticated users */}
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Standalone protected routes (without layout) */}
          <Route
            path="/events/:eventId/attendees/:attendeeId/badge"
            element={
              <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin', 'event_manager']}>
                <BadgePage />
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId/badges/batch"
            element={
              <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin', 'event_manager']}>
                <BatchBadgePage />
              </RoleProtectedRoute>
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