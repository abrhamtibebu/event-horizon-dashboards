import { Suspense, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Spinner } from '@/components/ui/spinner'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { ThemeTransition } from '@/components/ThemeTransition'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { Layout } from '@/components/Layout'
import { SuspendedOrganizerBanner } from '@/components/SuspendedOrganizerBanner'
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute'
import { useAuth } from '@/hooks/use-auth'
import { useRealtimeMessages } from '@/hooks/use-realtime-messages'
import * as P from './lazyPages'

const PageFallback = ({ text = 'Loading…' }: { text?: string }) => (
  <div className="flex items-center justify-center min-h-screen">
    <Spinner size="md" text={text} />
  </div>
)

const Lazy = ({ children }: { children: JSX.Element }) => (
  <Suspense fallback={<PageFallback />}>{children}</Suspense>
)

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <PageFallback />
  if (!isAuthenticated) return <Navigate to="/" replace />
  return children
}

const UnauthenticatedRoute = ({ children }: { children: JSX.Element }) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return <PageFallback />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const { isLoading } = useAuth()
  if (isLoading) return <PageFallback />
  return children
}

const DashboardRouter = () => {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="md" text="Loading dashboard..." />
      </div>
    )
  }

  if (user.role === 'admin' || user.role === 'superadmin') {
    return (
      <Lazy>
        <P.AdminDashboardPage />
      </Lazy>
    )
  }
  if (user.role === 'organizer' || user.role === 'organizer_admin') {
    return (
      <Lazy>
        <P.OrganizerDashboardPage />
      </Lazy>
    )
  }
  if (user.role === 'usher') {
    return (
      <Lazy>
        <P.UsherDashboardPage />
      </Lazy>
    )
  }

  return (
    <Lazy>
      <P.OrganizerDashboardPage />
    </Lazy>
  )
}

const AppWithRealtime = () => {
  useRealtimeMessages()

  useEffect(() => {
    // Avoid service worker caching during local development.
    if (import.meta.env.PROD && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log(
            'Service Worker registered successfully:',
            registration.scope,
          )
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
          {/* Public routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Lazy>
                  <P.SignInPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/signin"
            element={
              <PublicRoute>
                <Lazy>
                  <P.SignInPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Lazy>
                  <P.RegisterPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/auth/google/callback"
            element={
              <PublicRoute>
                <Lazy>
                  <P.GoogleCallbackPage />
                </Lazy>
              </PublicRoute>
            }
          />
          {/* Cross-app token transfer: organizers arriving from evella.et */}
          <Route
            path="/auth/google/transfer"
            element={
              <PublicRoute>
                <Lazy>
                  <P.TokenTransferPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <Lazy>
                  <P.ForgotPasswordPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <Lazy>
                  <P.ResetPasswordPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/privacy"
            element={
              <PublicRoute>
                <Lazy>
                  <P.PrivacyPolicyPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/terms"
            element={
              <PublicRoute>
                <Lazy>
                  <P.TermsOfServicePage />
                </Lazy>
              </PublicRoute>
            }
          />

          {/* Public registration + forms */}
          <Route
            path="/event/register/:eventUuid"
            element={
              <PublicRoute>
                <Lazy>
                  <P.PublicEventRegisterPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/event/:eventUuid/badge-retrieve"
            element={
              <PublicRoute>
                <Lazy>
                  <P.BadgeRetrievePage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/event/custom-register/:eventId"
            element={
              <PublicRoute>
                <Lazy>
                  <P.CustomEventRegistrationPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/event/custom-register/:eventId/success"
            element={
              <PublicRoute>
                <Lazy>
                  <P.CustomRegistrationSuccessPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/event/telebirr-register"
            element={<Navigate to="/event/telebirr-register/4" replace />}
          />
          <Route
            path="/event/telebirr-register/:eventId"
            element={
              <PublicRoute>
                <Lazy>
                  <P.TelebirrRegistrationPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/event/telebirr-register/:eventId/success"
            element={
              <PublicRoute>
                <Lazy>
                  <P.TelebirrRegistrationSuccessPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/form/register/:formId"
            element={
              <PublicRoute>
                <Lazy>
                  <P.PublicFormRegistrationPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/form/register/:formId/success"
            element={
              <PublicRoute>
                <Lazy>
                  <P.RegistrationSuccessPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/registration/success"
            element={
              <PublicRoute>
                <Lazy>
                  <P.RegistrationSuccessPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/events/:eventId/survey"
            element={
              <PublicRoute>
                <Lazy>
                  <P.PublicEventSurveyPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/reg"
            element={
              <PublicRoute>
                <Lazy>
                  <P.OnsiteRegistrationPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/reg/:accessId"
            element={
              <PublicRoute>
                <Lazy>
                  <P.OnsiteRegistrationPage />
                </Lazy>
              </PublicRoute>
            }
          />

          {/* Usher + salesperson public registration */}
          <Route
            path="/usher/register"
            element={
              <PublicRoute>
                <Lazy>
                  <P.UsherRegisterPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/usher/register/success"
            element={
              <PublicRoute>
                <Lazy>
                  <P.UsherRegistrationSuccessPage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/salesperson/register/:code"
            element={
              <PublicRoute>
                <Lazy>
                  <P.SalespersonRegistrationPage />
                </Lazy>
              </PublicRoute>
            }
          />

          {/* Short links */}
          <Route
            path="/r/:shortCode"
            element={
              <PublicRoute>
                <Lazy>
                  <P.ShortLinkResolverPage />
                </Lazy>
              </PublicRoute>
            }
          />

          {/* Public ticket purchase */}
          <Route
            path="/tickets/purchase/:eventId"
            element={
              <PublicRoute>
                <Lazy>
                  <P.TicketPurchasePage />
                </Lazy>
              </PublicRoute>
            }
          />
          <Route
            path="/tickets/purchase/success"
            element={
              <PublicRoute>
                <Lazy>
                  <P.TicketPurchaseSuccessPage />
                </Lazy>
              </PublicRoute>
            }
          />

          {/* Unauthenticated-only (legacy) */}
          <Route
            path="/unauth-only"
            element={
              <UnauthenticatedRoute>
                <Lazy>
                  <P.SignInPage />
                </Lazy>
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

            <Route
              path="events"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'superadmin',
                    'admin',
                    'organizer',
                    'organizer_admin',
                    'event_manager',
                  ]}
                >
                  <Lazy>
                    <P.EventsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="events/create"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'superadmin',
                    'admin',
                    'organizer',
                    'organizer_admin',
                    'event_manager',
                  ]}
                >
                  <Lazy>
                    <P.EventTypeSelectionPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="events/create/ticketed"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'superadmin',
                    'admin',
                    'organizer',
                    'organizer_admin',
                    'event_manager',
                  ]}
                >
                  <Lazy>
                    <P.CreateTicketedEventPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="events/create/free"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'superadmin',
                    'admin',
                    'organizer',
                    'organizer_admin',
                    'event_manager',
                  ]}
                >
                  <Lazy>
                    <P.CreateFreeEventPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="events/create/external"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.CreateExternalEventPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="events/:eventId"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'superadmin',
                    'admin',
                    'organizer',
                    'organizer_admin',
                    'usher',
                    'event_manager',
                  ]}
                >
                  <Lazy>
                    <P.EventDetailsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            <Route
              path="ticket-management"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'organizer',
                    'organizer_admin',
                    'event_manager',
                    'admin',
                    'superadmin',
                  ]}
                >
                  <Lazy>
                    <P.OrganizerTicketsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="tickets"
              element={
                <RoleProtectedRoute allowedRoles={['attendee']}>
                  <Lazy>
                    <P.MyTicketsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="tickets/purchase/:eventId"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'attendee',
                    'organizer',
                    'organizer_admin',
                    'admin',
                    'superadmin',
                  ]}
                >
                  <Lazy>
                    <P.TicketPurchasePage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="ticket-analytics/:eventId"
              element={
                <RoleProtectedRoute
                  allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin', 'event_manager']}
                >
                  <Lazy>
                    <P.AnalyticsDashboardPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            <Route
              path="tasks"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'superadmin',
                    'admin',
                    'organizer',
                    'organizer_admin',
                    'event_manager',
                    'marketing_specialist',
                    'finance_manager',
                    'procurement_manager',
                    'operations_manager',
                    'purchase_requester',
                    'purchase_approver',
                    'proforma_manager',
                    'proforma_approver',
                    'purchase_order_issuer',
                    'payment_requester',
                    'payment_approver',
                    'sales',
                  ]}
                >
                  <Lazy>
                    <P.TasksPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.UsersPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route path="users/add" element={<Navigate to="/dashboard/users" replace />} />
            <Route
              path="users/edit/:id"
              element={<Navigate to="/dashboard/users" replace />}
            />

            <Route
              path="organizers"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.OrganizersPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="organizers/:organizerId/suspend"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.OrganizerSuspendPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="organizers/:organizerId/contacts"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.OrganizerContactsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="organizers/:organizerId"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.OrganizerProfilePage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            <Route
              path="guests"
              element={
                <RoleProtectedRoute
                  allowedRoles={['organizer', 'organizer_admin', 'event_manager']}
                >
                  <Lazy>
                    <P.GuestsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            <Route
              path="usher-management"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'superadmin',
                    'admin',
                    'organizer',
                    'organizer_admin',
                    'event_manager',
                    'user',
                  ]}
                >
                  <Lazy>
                    <P.UsherManagementPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="usher-management/register"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'superadmin',
                    'admin',
                    'organizer',
                    'organizer_admin',
                    'event_manager',
                    'user',
                  ]}
                >
                  <Lazy>
                    <P.GenerateUsherRegistrationLinkPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="usher-management/links"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'superadmin',
                    'admin',
                    'organizer',
                    'organizer_admin',
                    'event_manager',
                    'user',
                  ]}
                >
                  <Lazy>
                    <P.ShortLinkManagementPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            <Route
              path="vendor-management"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'superadmin',
                    'admin',
                    'organizer',
                    'organizer_admin',
                    'finance_manager',
                    'procurement_manager',
                    'operations_manager',
                    'purchase_requester',
                    'purchase_approver',
                    'proforma_manager',
                    'proforma_approver',
                    'purchase_order_issuer',
                    'payment_requester',
                    'payment_approver',
                  ]}
                >
                  <Lazy>
                    <P.VendorManagementPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="salesperson-management"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.SalespersonManagementPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            <Route
              path="admin/subscriptions"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.AdminSubscriptionManagementPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/plans"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.PlanManagementPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/system-health"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.SystemHealthPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/financials"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.FinancialDashboardPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/moderation"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.ContentModerationPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/analytics"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.AdvancedAnalyticsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/settings"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.SystemSettingsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/security"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.SecurityAuditPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/data"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.DataManagementPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/api"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.APIManagementPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/integrations"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.IntegrationManagementPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/performance"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.PerformanceOptimizationPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/logs"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.SystemLogsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/automation"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.AutomationWorkflowsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/advanced-security"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.AdvancedSecurityPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/compliance"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.ComplianceAuditPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/notification-templates"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.NotificationTemplatesPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/roles"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.RolePermissionsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="admin/advertising"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.AdminAdvertisingPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            <Route
              path="subscription"
              element={
                <RoleProtectedRoute allowedRoles={['organizer', 'organizer_admin']}>
                  <Lazy>
                    <P.SubscriptionManagementPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="subscription/plans"
              element={
                <RoleProtectedRoute allowedRoles={['organizer', 'organizer_admin']}>
                  <Lazy>
                    <P.SubscriptionPlansPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="subscription/payment"
              element={
                <RoleProtectedRoute allowedRoles={['organizer', 'organizer_admin']}>
                  <Lazy>
                    <P.SubscriptionPaymentPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="subscription/payment/success"
              element={
                <RoleProtectedRoute allowedRoles={['organizer', 'organizer_admin']}>
                  <Lazy>
                    <P.SubscriptionPaymentSuccessPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="subscription/usage"
              element={
                <RoleProtectedRoute allowedRoles={['organizer', 'organizer_admin']}>
                  <Lazy>
                    <P.UsageDashboardPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            <Route
              path="team"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'organizer', 'organizer_admin']}>
                  <Lazy>
                    <P.TeamPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            {/* Operations */}
            <Route
              path="check-in"
              element={
                <RoleProtectedRoute allowedRoles={['usher']}>
                  <Lazy>
                    <P.CheckInPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="ticket-validator"
              element={
                <RoleProtectedRoute
                  allowedRoles={['usher', 'organizer', 'organizer_admin', 'admin', 'superadmin']}
                >
                  <Lazy>
                    <P.TicketRedemptionPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="usher"
              element={<Navigate to="/dashboard" replace />}
            />
            <Route
              path="usher/redemption"
              element={
                <RoleProtectedRoute
                  allowedRoles={['usher', 'organizer', 'organizer_admin', 'admin', 'superadmin']}
                >
                  <Lazy>
                    <P.TicketRedemptionPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="locate-badges"
              element={
                <RoleProtectedRoute
                  allowedRoles={['admin', 'organizer', 'organizer_admin', 'event_manager', 'usher']}
                >
                  <Lazy>
                    <P.LocateBadgesPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="usher/events"
              element={
                <RoleProtectedRoute allowedRoles={['usher']}>
                  <Lazy>
                    <P.UsherEventsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="usher/events/:eventId"
              element={
                <RoleProtectedRoute allowedRoles={['usher']}>
                  <Lazy>
                    <P.UsherEventManagementPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="usher/badge-locator"
              element={
                <RoleProtectedRoute allowedRoles={['usher']}>
                  <Lazy>
                    <P.UsherBadgeLocatorPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="usher/jobs"
              element={
                <RoleProtectedRoute allowedRoles={['usher']}>
                  <Lazy>
                    <P.UsherDashboardPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="usher/jobs/:eventId"
              element={
                <RoleProtectedRoute allowedRoles={['usher']}>
                  <Lazy>
                    <P.UsherJobDetailsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            {/* Insights */}
            <Route
              path="reports"
              element={
                <RoleProtectedRoute
                  allowedRoles={['superadmin', 'organizer', 'organizer_admin', 'event_manager']}
                >
                  <Lazy>
                    <P.ReportsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            {/* Connect */}
            <Route
              path="messages"
              element={
                <ProtectedRoute>
                  <Lazy>
                    <P.MessagesPage />
                  </Lazy>
                </ProtectedRoute>
              }
            />
            <Route
              path="marketing"
              element={
                <RoleProtectedRoute
                  allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin', 'marketing_specialist']}
                >
                  <Lazy>
                    <P.MarketingPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            {/* System */}
            <Route
              path="audit-logs"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin']}>
                  <Lazy>
                    <P.AuditLogsPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
            <Route
              path="trash"
              element={
                <RoleProtectedRoute allowedRoles={['superadmin', 'admin', 'organizer', 'organizer_admin']}>
                  <Lazy>
                    <P.TrashPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />

            {/* Common */}
            <Route
              path="profile"
              element={
                <Lazy>
                  <P.ProfilePage />
                </Lazy>
              }
            />
            <Route
              path="settings"
              element={
                <Lazy>
                  <P.SettingsPage />
                </Lazy>
              }
            />
            <Route
              path="badge-designer"
              element={
                <RoleProtectedRoute
                  allowedRoles={[
                    'superadmin',
                    'admin',
                    'organizer',
                    'organizer_admin',
                    'event_manager',
                  ]}
                >
                  <Lazy>
                    <P.BadgeDesignPage />
                  </Lazy>
                </RoleProtectedRoute>
              }
            />
          </Route>

          {/* Standalone protected routes (without layout) */}
          <Route
            path="/events/:eventId/attendees/:attendeeId/badge"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  'superadmin',
                  'admin',
                  'organizer',
                  'organizer_admin',
                  'event_manager',
                ]}
              >
                <Lazy>
                  <P.BadgePage />
                </Lazy>
              </RoleProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId/badges/batch"
            element={
              <RoleProtectedRoute
                allowedRoles={[
                  'superadmin',
                  'admin',
                  'organizer',
                  'organizer_admin',
                  'event_manager',
                ]}
              >
                <Lazy>
                  <P.BatchBadgePage />
                </Lazy>
              </RoleProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <Lazy>
                <P.NotFoundPage />
              </Lazy>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default function AppRoutes() {
  return (
    <TooltipProvider>
      <NotificationProvider>
        <AppWithRealtime />
      </NotificationProvider>
    </TooltipProvider>
  )
}

