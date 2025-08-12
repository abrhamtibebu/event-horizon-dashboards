import React from 'react'
import { AlertTriangle, X, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useState, useEffect } from 'react'
import api from '@/lib/api'

interface OrganizerStatus {
  id: number
  name: string
  status: string
  suspended_at?: string
  suspended_reason?: string
}

export function SuspendedOrganizerBanner() {
  const { user, logout } = useAuth()
  const [organizerStatus, setOrganizerStatus] = useState<OrganizerStatus | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkOrganizerStatus = async () => {
      if (!user || user.role !== 'organizer') {
        setIsLoading(false)
        return
      }

      try {
        const response = await api.get('/organizer/profile')
        const organizer = response.data
        
        if (organizer && organizer.status === 'suspended') {
          setOrganizerStatus(organizer)
          setIsVisible(true)
        }
      } catch (error: any) {
        if (error.response?.status === 403 && error.response?.data?.error === 'Organizer is suspended') {
          // Organizer is suspended, show banner
          setOrganizerStatus({
            id: user.organizer_id || 0,
            name: user.organizer?.name || 'Your Organization',
            status: 'suspended'
          })
          setIsVisible(true)
        }
      } finally {
        setIsLoading(false)
      }
    }

    checkOrganizerStatus()
  }, [user])

  const handleLogout = async () => {
    await logout()
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (isLoading || !isVisible || !organizerStatus) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl border-red-200">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Account Suspended
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-800">
                      {organizerStatus.name} Account Suspended
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

                {organizerStatus.suspended_reason && (
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
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex-1"
                >
                  Sign Out
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDismiss}
                  className="flex-1"
                >
                  Continue (Limited Access)
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 