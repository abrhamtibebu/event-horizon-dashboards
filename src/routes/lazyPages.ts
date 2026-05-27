import { lazy as reactLazy } from 'react'
import type { ComponentType } from 'react'

function lazy<TModule extends Record<string, unknown>>(
  loader: () => Promise<TModule>,
) {
  return reactLazy(async () => {
    const mod = await loader()

    if ('default' in mod && mod.default) {
      return { default: mod.default as ComponentType<any> }
    }

    // Fallback for modules that only export named components.
    const fallback = Object.values(mod)[0]
    if (fallback) {
      return { default: fallback as ComponentType<any> }
    }

    throw new Error('Lazy-loaded page has no export to render.')
  })
}

// Public/auth pages
export const SignInPage = lazy(() => import('@/pages/SignInPage'))
export const RegisterPage = lazy(() => import('@/pages/Register'))
export const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'))
export const ResetPasswordPage = lazy(() => import('@/pages/ResetPassword'))
export const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicy'))
export const TermsOfServicePage = lazy(() => import('@/pages/TermsOfService'))
export const GoogleCallbackPage = lazy(() => import('@/pages/GoogleCallbackPage'))
export const TokenTransferPage = lazy(() => import('@/pages/TokenTransferPage'))
export const NotFoundPage = lazy(() => import('@/pages/NotFound'))

// Public event + forms
export const PublicEventRegisterPage = lazy(() => import('@/pages/PublicEventRegister'))
export const BadgeRetrievePage = lazy(() => import('@/pages/BadgeRetrieve'))
export const CustomEventRegistrationPage = lazy(
  () => import('@/pages/CustomEventRegistration'),
)
export const CustomRegistrationSuccessPage = lazy(
  () => import('@/pages/CustomRegistrationSuccess'),
)
export const TelebirrRegistrationPage = lazy(
  () => import('@/pages/telebirr-reg/TelebirrRegistrationPage'),
)
export const TelebirrRegistrationSuccessPage = lazy(
  () => import('@/pages/telebirr-reg/TelebirrRegistrationSuccessPage'),
)
export const PublicFormRegistrationPage = lazy(
  () => import('@/pages/PublicFormRegistration'),
)
export const RegistrationSuccessPage = lazy(() => import('@/pages/RegistrationSuccess'))
export const PublicEventSurveyPage = lazy(() => import('@/pages/PublicEventSurvey'))
export const OnsiteRegistrationPage = lazy(() => import('@/pages/OnsiteRegistration'))

// Ticket purchase (public)
export const TicketPurchasePage = lazy(() => import('@/pages/tickets/TicketPurchasePage'))
export const TicketPurchaseSuccessPage = lazy(
  () => import('@/pages/tickets/TicketPurchaseSuccess'),
)

// Usher registration + short links (public)
export const UsherRegisterPage = lazy(() => import('@/pages/UsherRegister'))
export const UsherRegistrationSuccessPage = lazy(
  () => import('@/pages/UsherRegistrationSuccess'),
)
export const SalespersonRegistrationPage = lazy(
  () => import('@/pages/SalespersonRegistration'),
)
export const ShortLinkResolverPage = lazy(() => import('@/pages/ShortLinkResolver'))

// Dashboard pages
export const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboard'))
export const OrganizerDashboardPage = lazy(() => import('@/pages/OrganizerDashboard'))
export const UsherDashboardPage = lazy(() => import('@/pages/UsherDashboard'))

export const EventsPage = lazy(() => import('@/pages/Events'))
export const EventDetailsPage = lazy(() => import('@/pages/EventDetails'))
export const EventTypeSelectionPage = lazy(() => import('@/pages/EventTypeSelection'))
export const CreateTicketedEventPage = lazy(() => import('@/pages/CreateTicketedEvent'))
export const CreateFreeEventPage = lazy(() => import('@/pages/CreateFreeEvent'))
export const CreateExternalEventPage = lazy(() => import('@/pages/CreateExternalEvent'))

export const UsersPage = lazy(() => import('@/pages/Users'))
export const OrganizersPage = lazy(() => import('@/pages/Organizers'))
export const OrganizerSuspendPage = lazy(() => import('@/pages/OrganizerSuspend'))
export const OrganizerContactsPage = lazy(() => import('@/pages/OrganizerContacts'))
export const OrganizerProfilePage = lazy(() => import('@/pages/OrganizerProfile'))
export const GuestsPage = lazy(() => import('@/pages/Guests'))

export const MessagesPage = lazy(() => import('@/pages/Messages'))
export const ReportsPage = lazy(() => import('@/pages/Reports'))
export const MarketingPage = lazy(() => import('@/pages/Marketing'))

export const TasksPage = lazy(() => import('@/pages/Tasks'))

export const VendorManagementPage = lazy(() => import('@/pages/VendorManagement'))
export const SalespersonManagementPage = lazy(() => import('@/pages/SalespersonManagement'))

// Tickets/analytics
export const OrganizerTicketsPage = lazy(
  () => import('@/pages/tickets/OrganizerTicketsPage'),
)
export const MyTicketsPage = lazy(() => import('@/pages/tickets/MyTicketsPage'))
export const AnalyticsDashboardPage = lazy(
  () => import('@/pages/tickets/AnalyticsDashboard'),
)

// Subscriptions
export const SubscriptionManagementPage = lazy(
  () => import('@/pages/SubscriptionManagement'),
)
export const SubscriptionPlansPage = lazy(() => import('@/pages/SubscriptionPlans'))
export const SubscriptionPaymentPage = lazy(() => import('@/pages/SubscriptionPayment'))
export const SubscriptionPaymentSuccessPage = lazy(
  () => import('@/pages/SubscriptionPaymentSuccess'),
)
export const UsageDashboardPage = lazy(() => import('@/pages/UsageDashboard'))
export const AdminSubscriptionManagementPage = lazy(
  () => import('@/pages/AdminSubscriptionManagement'),
)
export const PlanManagementPage = lazy(() => import('@/pages/PlanManagement'))

// Admin/system surfaces
export const SystemHealthPage = lazy(() => import('@/pages/SystemHealth'))
export const FinancialDashboardPage = lazy(() => import('@/pages/FinancialDashboard'))
export const ContentModerationPage = lazy(() => import('@/pages/ContentModeration'))
export const AdvancedAnalyticsPage = lazy(() => import('@/pages/AdvancedAnalytics'))
export const SystemSettingsPage = lazy(() => import('@/pages/SystemSettings'))
export const SecurityAuditPage = lazy(() => import('@/pages/SecurityAudit'))
export const DataManagementPage = lazy(() => import('@/pages/DataManagement'))
export const APIManagementPage = lazy(() => import('@/pages/APIManagement'))
export const IntegrationManagementPage = lazy(() => import('@/pages/IntegrationManagement'))
export const PerformanceOptimizationPage = lazy(
  () => import('@/pages/PerformanceOptimization'),
)
export const SystemLogsPage = lazy(() => import('@/pages/SystemLogs'))
export const AutomationWorkflowsPage = lazy(
  () => import('@/pages/AutomationWorkflows'),
)
export const AdvancedSecurityPage = lazy(() => import('@/pages/AdvancedSecurity'))
export const ComplianceAuditPage = lazy(() => import('@/pages/ComplianceAudit'))
export const NotificationTemplatesPage = lazy(
  () => import('@/pages/NotificationTemplates'),
)
export const RolePermissionsPage = lazy(() => import('@/pages/RolePermissions'))
export const AdminAdvertisingPage = lazy(() => import('@/pages/AdminAdvertising'))

// Operations
export const CheckInPage = lazy(() => import('@/pages/CheckIn'))
export const LocateBadgesPage = lazy(() => import('@/pages/LocateBadges'))
export const TicketRedemptionPage = lazy(() => import('@/pages/usher/TicketRedemption'))
export const UsherManagementPage = lazy(() => import('@/pages/UsherManagement'))
export const GenerateUsherRegistrationLinkPage = lazy(
  () => import('@/pages/GenerateUsherRegistrationLink'),
)
export const ShortLinkManagementPage = lazy(() => import('@/pages/ShortLinkManagement'))
export const UsherEventsPage = lazy(() => import('@/pages/UsherEvents'))
export const UsherEventManagementPage = lazy(() => import('@/pages/UsherEventManagement'))
export const UsherBadgeLocatorPage = lazy(() => import('@/pages/UsherBadgeLocator'))
export const UsherJobDetailsPage = lazy(() => import('@/pages/UsherJobDetails'))

// Common
export const ProfilePage = lazy(() => import('@/pages/Profile'))
export const SettingsPage = lazy(() => import('@/pages/Settings'))
export const TrashPage = lazy(() => import('@/pages/Trash'))
export const TeamPage = lazy(() => import('@/pages/Team'))

// Badges (standalone routes)
export const BadgePage = lazy(() => import('@/pages/BadgePage'))
export const BatchBadgePage = lazy(() => import('@/pages/BatchBadgePage'))
export const BadgeDesignPage = lazy(() => import('@/pages/BadgeDesignPage'))

// Audit/system
export const AuditLogsPage = lazy(() => import('@/pages/AuditLogs'))
