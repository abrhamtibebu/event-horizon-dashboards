import React from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useOrganizerStatus } from '@/hooks/use-organizer-status'
import { AlertTriangle, Shield, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface SuspendedOrganizerGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SuspendedOrganizerGuard({ children, fallback }: SuspendedOrganizerGuardProps) {
  const { user } = useAuth()
  const { isSuspended, organizerStatus, isLoading } = useOrganizerStatus()

  // If not an organizer or still loading, render children normally
  if (!user || user.role !== 'organizer' || isLoading) {
    return <>{children}</>
  }

  // If organizer is suspended, show blocking message
  if (isSuspended) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 py-8 px-2 sm:px-6 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-red-200">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Account Suspended
                  </CardTitle>
                  <p className="text-gray-600 mt-1">
                    Your organizer account has been suspended
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-800">
                    {organizerStatus?.name || 'Your Organization'} Account Suspended
                  </span>
                </div>
                <p className="text-red-700 text-sm">
                  Your organizer account has been suspended by the system administrator. 
                  All activities have been temporarily blocked.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-yellow-800">
                    What This Means
                  </span>
                </div>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• You cannot create or manage events</li>
                  <li>• You cannot assign ushers or manage contacts</li>
                  <li>• You cannot access organizer-specific features</li>
                  <li>• All existing events are temporarily inaccessible</li>
                </ul>
              </div>

              {organizerStatus?.suspended_reason && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="font-semibold text-gray-800 mb-2">
                    Reason for Suspension
                  </div>
                  <p className="text-gray-700 text-sm">
                    {organizerStatus.suspended_reason}
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="font-semibold text-blue-800 mb-2">
                  Next Steps
                </div>
                <p className="text-blue-700 text-sm">
                  Please contact the system administrator to resolve this issue. 
                  You may need to provide additional information or complete required actions.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/dashboard'}
                  className="flex-1"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/settings'}
                  className="flex-1"
                >
                  View Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // If organizer is not suspended, render children normally
  return <>{children}</>
} 