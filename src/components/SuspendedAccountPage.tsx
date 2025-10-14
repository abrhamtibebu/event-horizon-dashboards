import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useOrganizerStatus } from '@/hooks/use-organizer-status'
import { 
  AlertTriangle, 
  Shield, 
  AlertCircle, 
  Mail, 
  Phone, 
  Calendar,
  LogOut,
  ExternalLink,
  Clock,
  User
} from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface SuspendedAccountPageProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SuspendedAccountPage({ children, fallback }: SuspendedAccountPageProps) {
  const { user, logout } = useAuth()
  const { isSuspended, organizerStatus, isLoading } = useOrganizerStatus()

  // If not an organizer or still loading, render children normally
  if (!user || user.role !== 'organizer' || isLoading) {
    return <>{children}</>
  }

  // If organizer is suspended, show blocking page
  if (isSuspended) {
    if (fallback) {
      return <>{fallback}</>
    }

    const handleLogout = async () => {
      try {
        await logout()
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    const handleContactSupport = () => {
      // You can customize this with your support email
      window.location.href = 'mailto:support@validity.et?subject=Account Suspension Appeal'
    }

    const suspendedDate = organizerStatus?.suspended_at 
      ? new Date(organizerStatus.suspended_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : null

    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        {/* Header with Logo */}
        <div className="bg-white border-b border-red-100 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <span className="font-semibold text-gray-900">VEMS - Event Management</span>
            </div>
            <Badge variant="destructive" className="px-3 py-1">
              Account Suspended
            </Badge>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Account Suspended
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Your organizer account has been temporarily suspended. 
              Access to event management features is currently restricted.
            </p>
          </div>

          {/* Main Info Card */}
          <Card className="mb-6 border-red-200 shadow-lg">
            <CardHeader className="bg-red-50 border-b border-red-100">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-red-600" />
                <div>
                  <h2 className="text-xl font-semibold text-red-900">
                    {organizerStatus?.name || 'Your Organization'}
                  </h2>
                  <p className="text-red-700 text-sm">
                    Organizer Account - Status: Suspended
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Account Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Account Holder:</span>
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                  
                  {suspendedDate && (
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Suspended On:</span>
                      <span className="font-medium text-gray-900">{suspendedDate}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Account Type:</span>
                    <Badge variant="outline">Event Organizer</Badge>
                  </div>
                </div>

                {/* Suspension Reason */}
                {organizerStatus?.suspended_reason && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Reason for Suspension
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {organizerStatus.suspended_reason}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Impact Information */}
          <Card className="mb-6 border-yellow-200">
            <CardHeader className="bg-yellow-50 border-b border-yellow-100">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
                <h2 className="text-lg font-semibold text-yellow-900">
                  Impact on Your Account
                </h2>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 mb-2">Restricted Features:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      Create or edit events
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      Manage attendees and registrations
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      Assign ushers and team members
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      Access event analytics
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900 mb-2">Available Features:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      View account information
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Contact support
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Update profile settings
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      Download account data
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Steps */}
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-blue-900">
                  Next Steps
                </h2>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <p className="text-gray-700 leading-relaxed">
                  To resolve this suspension and restore full access to your account, 
                  please contact our support team. We're here to help you get back to 
                  organizing amazing events.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button 
                    onClick={handleContactSupport}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.open('tel:+251911234567', '_self')}
                    className="flex-1"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Support
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = '/settings'}
                    className="flex-1"
                  >
                    <User className="h-4 w-4 mr-2" />
                    View Profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="flex-1 text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-8">
            <p>Need immediate assistance? Email us at 
              <a href="mailto:support@validity.et" className="text-blue-600 hover:underline ml-1">
                support@validity.et
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If organizer is not suspended, render children normally
  return <>{children}</>
}
