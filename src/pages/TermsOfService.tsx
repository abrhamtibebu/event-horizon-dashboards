import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, Shield, AlertTriangle, CheckCircle, Scale } from 'lucide-react'

export default function TermsOfService() {
  const [searchParams] = useSearchParams()
  const returnUrl = searchParams.get('returnUrl') || '/'
  return (
    <div className="min-h-screen bg-background dark:bg-background">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-card-foreground">Terms of Service</h1>
                <p className="text-sm text-muted-foreground">Rules and regulations for using our platform</p>
              </div>
        </div>
            <Button asChild variant="outline">
            <Link to={returnUrl} className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Registration
            </Link>
          </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card/90 backdrop-blur-sm rounded-2xl shadow-xl border border-border/50 p-8">
          {/* Last Updated */}
          <div className="flex items-center gap-2 mb-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <FileText className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-900">Last Updated</p>
              <p className="text-sm text-purple-700">{new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              Welcome to VEMS (Validity Event Management System). These Terms of Service govern your use of our event management platform and services. By accessing or using our services, you agree to be bound by these terms.
            </p>

            {/* Introduction */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-info rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-card-foreground">1. Introduction</h2>
              </div>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <p className="text-blue-800">
                  These Terms of Service ("Terms") govern your use of VEMS (Validity Event Management System) ("Service"), operated by Validity Inc. ("Company", "we", "us", or "our"). By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy.
                </p>
              </div>
            </div>

            {/* Service Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">2. Service Description</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">What We Provide</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Event management platform</li>
                    <li>• User registration system</li>
                    <li>• Badge design tools</li>
                    <li>• Analytics and reporting</li>
                    <li>• Customer support</li>
                  </ul>
                </div>
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">Your Responsibilities</h3>
                  <ul className="space-y-2 text-purple-800">
                    <li>• Provide accurate information</li>
                    <li>• Maintain account security</li>
                    <li>• Comply with applicable laws</li>
                    <li>• Respect other users</li>
                    <li>• Report violations</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* User Accounts */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-success rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-card-foreground">3. User Accounts</h2>
              </div>
              <div className="bg-muted/50 rounded-lg p-6 border border-border">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-3">Account Creation</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• You must be 18+ years old</li>
                      <li>• Provide accurate information</li>
                      <li>• Maintain account security</li>
                      <li>• Notify us of security issues</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-3">Account Termination</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• You may cancel anytime</li>
                      <li>• We may suspend for violations</li>
                      <li>• Data retention policies apply</li>
                      <li>• Outstanding obligations remain</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Acceptable Use */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[hsl(var(--color-warning))] rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-card-foreground">4. Acceptable Use</h2>
              </div>
              <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3">Prohibited Activities</h3>
                <ul className="space-y-2 text-yellow-800">
                  <li>• Violating any applicable laws or regulations</li>
                  <li>• Infringing on intellectual property rights</li>
                  <li>• Harassing or harming other users</li>
                  <li>• Attempting to gain unauthorized access</li>
                  <li>• Interfering with service operation</li>
                  <li>• Sharing malicious content or code</li>
                </ul>
              </div>
            </div>

            {/* Intellectual Property */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">5. Intellectual Property</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                  <h3 className="text-lg font-semibold text-indigo-900 mb-3">Our Rights</h3>
                  <ul className="space-y-2 text-indigo-800">
                    <li>• Platform and software ownership</li>
                    <li>• Trademarks and branding</li>
                    <li>• Service content and design</li>
                    <li>• Analytics and aggregated data</li>
                  </ul>
                </div>
                <div className="bg-pink-50 rounded-lg p-6 border border-pink-200">
                  <h3 className="text-lg font-semibold text-pink-900 mb-3">Your Content</h3>
                  <ul className="space-y-2 text-pink-800">
                    <li>• You retain ownership</li>
                    <li>• Grant us license to use</li>
                    <li>• Ensure you have rights</li>
                    <li>• We may remove content</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Privacy & Data */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">6. Privacy & Data Protection</h2>
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <p className="text-green-800 mb-4">
                  Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference.
                </p>
                <ul className="space-y-2 text-green-800">
                  <li>• We collect data to provide services</li>
                  <li>• We protect your information</li>
                  <li>• We don't sell your data</li>
                  <li>• You control your information</li>
                </ul>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-error rounded-lg flex items-center justify-center">
                  <Scale className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-card-foreground">7. Limitation of Liability</h2>
              </div>
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <p className="text-red-800 mb-4">
                  To the maximum extent permitted by law, Validity Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or use.
                </p>
                <ul className="space-y-2 text-red-800">
                  <li>• Service provided "as is"</li>
                  <li>• No warranty of any kind</li>
                  <li>• Limited liability for damages</li>
                  <li>• Force majeure events excluded</li>
                </ul>
              </div>
            </div>

            {/* Termination */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">8. Termination</h2>
              <div className="bg-muted/50 rounded-lg p-6 border border-border">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-3">By You</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Cancel account anytime</li>
                      <li>• Stop using the service</li>
                      <li>• Contact support for deletion</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-card-foreground mb-3">By Us</h3>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Violation of terms</li>
                      <li>• Extended inactivity</li>
                      <li>• Legal requirements</li>
                      <li>• Service discontinuation</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Changes to Terms */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">9. Changes to Terms</h2>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <p className="text-blue-800">
                  We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the service. Your continued use of the service after changes constitutes acceptance of the new terms.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">10. Contact Information</h2>
              <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                <p className="text-purple-800 mb-4">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-purple-800">
                  <p><strong>Email:</strong> info@validity.et</p>
                  <p><strong>Phone:</strong> +251 96 577 3898</p>
                  <p><strong>Alternative:</strong> +251 97 387 4352</p>
                  <p><strong>Address:</strong> 22 Mazoria, Rewina Building, Office No. 206, Addis Ababa, Ethiopia</p>
                </div>
              </div>
            </div>

            {/* Governing Law */}
            <div className="bg-muted/50 rounded-lg p-6 border border-border">
              <h2 className="text-2xl font-bold text-card-foreground mb-4">11. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed by and construed in accordance with the laws of the Federal Democratic Republic of Ethiopia, without regard to its conflict of law provisions. Any disputes arising from these Terms or your use of the service shall be resolved in the courts of Addis Ababa, Ethiopia.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
