import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Monitor, 
  Smartphone, 
  AlertTriangle, 
  Shield, 
  Mail,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react'

// Import the two designs
import { SuspendedAccountPage } from './SuspendedAccountPage'
import { SuspendedAccountDialog } from './SuspendedAccountDialog'

export function SuspendedAccountDemo() {
  const [selectedDesign, setSelectedDesign] = useState<'page' | 'dialog'>('page')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Suspended Account Design Options
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Choose between a full-page experience or a modal dialog for suspended accounts. 
            Each approach has different UX implications for user engagement and attention.
          </p>
        </div>

        <Tabs value={selectedDesign} onValueChange={(value) => setSelectedDesign(value as 'page' | 'dialog')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="page" className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              Full Page Design
            </TabsTrigger>
            <TabsTrigger value="dialog" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Dialog/Modal Design
            </TabsTrigger>
          </TabsList>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className={`border-2 ${selectedDesign === 'page' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="h-5 w-5" />
                    Full Page Design
                  </CardTitle>
                  {selectedDesign === 'page' && (
                    <Badge className="bg-blue-600">Selected</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Advantages
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1 ml-6">
                    <li>• Complete user attention and focus</li>
                    <li>• Cannot be dismissed accidentally</li>
                    <li>• More space for detailed information</li>
                    <li>• Professional, serious appearance</li>
                    <li>• Better for critical blocking states</li>
                    <li>• Responsive design for all devices</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-700 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Considerations
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1 ml-6">
                    <li>• More intrusive user experience</li>
                    <li>• Completely blocks access to interface</li>
                    <li>• May feel overwhelming to some users</li>
                  </ul>
                </div>

                <Button 
                  onClick={() => setSelectedDesign('page')}
                  variant={selectedDesign === 'page' ? 'default' : 'outline'}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Full Page
                </Button>
              </CardContent>
            </Card>

            <Card className={`border-2 ${selectedDesign === 'dialog' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Dialog/Modal Design
                  </CardTitle>
                  {selectedDesign === 'dialog' && (
                    <Badge className="bg-blue-600">Selected</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-700 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Advantages
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1 ml-6">
                    <li>• Less intrusive user experience</li>
                    <li>• Can be dismissed for limited access</li>
                    <li>• Familiar modal interaction pattern</li>
                    <li>• Shows interface context behind</li>
                    <li>• Good for temporary restrictions</li>
                    <li>• Compact and focused message</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-700 flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Considerations
                  </h4>
                  <ul className="text-sm text-gray-700 space-y-1 ml-6">
                    <li>• Can be dismissed and ignored</li>
                    <li>• Less space for detailed explanations</li>
                    <li>• May not convey severity adequately</li>
                  </ul>
                </div>

                <Button 
                  onClick={() => setSelectedDesign('dialog')}
                  variant={selectedDesign === 'dialog' ? 'default' : 'outline'}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Dialog
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900">
                <AlertTriangle className="h-5 w-5" />
                UX Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-yellow-900">
                <p className="font-semibold">
                  For account suspension, I recommend the <strong>Full Page Design</strong> because:
                </p>
                <ul className="space-y-2 text-sm ml-4">
                  <li>• Account suspension is a <strong>critical blocking state</strong> that requires immediate attention</li>
                  <li>• Users need to understand the full impact and next steps clearly</li>
                  <li>• It prevents confusion about what features are available vs restricted</li>
                  <li>• Provides professional, serious treatment appropriate for policy violations</li>
                  <li>• Ensures users cannot accidentally ignore important compliance information</li>
                </ul>
                
                <div className="bg-yellow-100 rounded-lg p-3 mt-4">
                  <p className="text-xs text-yellow-800">
                    <strong>Best Practice:</strong> Use full page for permanent/serious restrictions (suspensions, bans) 
                    and dialogs for temporary warnings or minor restrictions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview Content */}
          <TabsContent value="page" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Full Page Design Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <p className="text-gray-600 mb-4">
                    The full page design would replace the entire application interface when a user is suspended.
                  </p>
                  <div className="bg-white rounded border-2 border-dashed border-gray-300 p-8">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-16 h-16 bg-red-100 rounded-full mx-auto flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-red-600" />
                      </div>
                      <h3 className="text-xl font-bold">Account Suspended</h3>
                      <p className="text-sm text-gray-600">
                        Professional, comprehensive suspension page with clear next steps...
                      </p>
                      <Button size="sm" className="mt-4">
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Support
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dialog" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Dialog/Modal Design Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-4 text-center">
                  <p className="text-gray-600 mb-4">
                    The dialog design appears as an overlay on top of the existing interface.
                  </p>
                  <div className="relative bg-white rounded border-2 border-dashed border-gray-300 p-8">
                    {/* Simulated background */}
                    <div className="absolute inset-0 bg-gray-200 opacity-50 rounded"></div>
                    
                    {/* Dialog preview */}
                    <div className="relative bg-white rounded-lg shadow-lg border-2 border-red-200 p-6 max-w-md mx-auto">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-bold text-sm">Account Suspended</h3>
                          <p className="text-xs text-gray-600">Restricted access</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 mb-4">
                        Compact suspension notice with essential information...
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="text-xs flex-1">Contact</Button>
                        <Button size="sm" variant="outline" className="text-xs flex-1">Dismiss</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Implementation Instructions */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Implementation Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-blue-900">
            <div className="space-y-2">
              <h4 className="font-semibold">To implement the Full Page Design:</h4>
              <div className="bg-blue-100 rounded p-3 text-sm font-mono">
                {`// Replace SuspendedOrganizerGuard with:
import { SuspendedAccountPage } from '@/components/SuspendedAccountPage'

// In your App.tsx or layout component:
<SuspendedAccountPage>
  <YourAppContent />
</SuspendedAccountPage>`}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">To implement the Dialog Design:</h4>
              <div className="bg-blue-100 rounded p-3 text-sm font-mono">
                {`// Add to your main layout:
import { SuspendedAccountDialog } from '@/components/SuspendedAccountDialog'

// In your App.tsx:
<YourAppContent />
<SuspendedAccountDialog />`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
