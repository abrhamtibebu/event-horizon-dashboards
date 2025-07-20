import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import Events from './pages/Events'
import EventDetails from './pages/EventDetails'
import CreateEvent from './pages/CreateEvent'
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
import { useAuth } from './hooks/use-auth.tsx'
import BadgePage from './pages/BadgePage'
import BatchBadgePage from './pages/BatchBadgePage'
import Guests from './pages/Guests'
import BadgeDesignerTab from './pages/BadgeDesignerTab'
import Team from '@/pages/Team'
import UsherManagement from '@/pages/UsherManagement'
import UsherEventManagement from '@/pages/UsherEventManagement'
import UsherEvents from '@/pages/UsherEvents'
import PublicEventRegister from './pages/PublicEventRegister'
import VendorDashboard from './pages/vendors/VendorDashboard';
import VendorProfile from './pages/vendors/VendorProfile';
import VendorForm from './pages/vendors/VendorForm';
import AssignVendor from './pages/vendors/AssignVendor';
import VendorTaskTracker from './pages/vendors/VendorTaskTracker';
import UsherJobDetails from './pages/UsherJobDetails';
import UsherDashboard from './pages/UsherDashboard';

const queryClient = new QueryClient()

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
  return children
}

const UnauthenticatedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
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
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RoleDashboard />} />
            <Route path="events" element={<Events />} />
            <Route path="events/create" element={<CreateEvent />} />
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
            <Route path="check-in" element={<CheckIn />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="guests" element={<Guests />} />
            <Route path="usher-management" element={<UsherManagement />} />
            <Route path="usher/events" element={<UsherEvents />} />
            <Route path="usher/events/:eventId" element={<UsherEventManagement />} />
            <Route path="usher/jobs" element={<UsherDashboard />} />
            <Route path="usher/jobs/:eventId" element={<UsherJobDetails />} />
            <Route path="vendors" >
              <Route index element={<VendorDashboard />} />
              <Route path="profile/:vendorId" element={<VendorProfile />} />
              <Route path="add" element={<VendorForm />} />
              <Route path="edit/:vendorId" element={<VendorForm />} />
              <Route path="assign" element={<AssignVendor />} />
              <Route path="tasks" element={<VendorTaskTracker />} />
            </Route>
          </Route>

          <Route path="/register/:eventUuid" element={<PublicEventRegister />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
