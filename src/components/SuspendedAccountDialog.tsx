import React, { useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useOrganizerStatus } from '@/hooks/use-organizer-status'
import { 
  AlertTriangle, 
  Shield, 
  AlertCircle, 
  Mail, 
  Phone, 
  X,
  LogOut,
  Clock,
  User,
  ExternalLink
} from 'lucide-react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'

export function SuspendedAccountDialog() {
  const { user, logout } = useAuth()
  const { isSuspended, organizerStatus } = useOrganizerStatus()
  const [isOpen, setIsOpen] = useState(true)

  // Only show for suspended organizers
  if (!user || user.role !== 'organizer' || !isSuspended) {
    return null
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleContactSupport = () => {
    window.location.href = 'mailto:support@validity.et?subject=Account Suspension Appeal'
  }

  const handleDismiss = () => {
    setIsOpen(false)
  }

  const suspendedDate = organizerStatus?.suspended_at 
    ? new Date(organizerStatus.suspended_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Account Suspended
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Your organizer account access has been restricted
                </DialogDescription>
              </div>
            </div>
            <Badge variant="destructive" className="px-2 py-1">
              Suspended
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Account Information */}
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">
                  {organizerStatus?.name || 'Your Organization'}
                </h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Account:</span>
                  <span className="font-medium">{user.name}</span>
                </div>
                
                {suspendedDate && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Suspended:</span>
                    <span className="font-medium">{suspendedDate}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Suspension Details */}
          {organizerStatus?.suspended_reason && (
            <Card className="border-gray-200">
              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  Reason for Suspension
                </h4>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {organizerStatus.suspended_reason}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Impact Summary */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-900">
                  Account Restrictions
                </h4>
              </div>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Cannot create or manage events</li>
                <li>• Limited access to organizer features</li>
                <li>• Cannot assign ushers or manage team</li>
                <li>• Event analytics temporarily unavailable</li>
              </ul>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">
                  How to Resolve This
                </h4>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed mb-4">
                Contact our support team to appeal this suspension and restore your account access. 
                We're here to help resolve any issues quickly.
              </p>
              
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleContactSupport}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Support
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('tel:+251911234567', '_self')}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Call Support: +251 911 234 567
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/settings'}
            className="flex-1"
          >
            <User className="h-4 w-4 mr-2" />
            View Profile
          </Button>
          
          <Button 
            variant="outline" 
            onClick={handleDismiss}
            className="flex-1"
          >
            Continue (Limited)
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

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-4 border-t">
          <p>
            For immediate assistance: 
            <a href="mailto:support@validity.et" className="text-blue-600 hover:underline ml-1">
              support@validity.et
            </a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
