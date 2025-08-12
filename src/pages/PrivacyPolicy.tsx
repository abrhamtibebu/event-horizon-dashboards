import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Shield, Lock, Eye, Users, FileText } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Privacy Policy</h1>
                <p className="text-sm text-gray-600">Your data protection and privacy rights</p>
              </div>
        </div>
            <Button asChild variant="outline">
            <Link to="/" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-8">
          {/* Last Updated */}
          <div className="flex items-center gap-2 mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Last Updated</p>
              <p className="text-sm text-blue-700">{new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          </div>

          <div className="prose prose-gray max-w-none">
            <p className="text-lg text-gray-700 leading-relaxed mb-8">
              At VEMS (Validity Event Management System), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our event management platform.
            </p>

            {/* Information We Collect */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Information We Collect</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Name, email address, and contact information</li>
                  <li>• Event registration and attendance data</li>
                  <li>• User preferences and settings</li>
                  <li>• Communication history and support interactions</li>
                </ul>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">Technical Information</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• IP address and device information</li>
                  <li>• Browser type and version</li>
                  <li>• Usage analytics and performance data</li>
                  <li>• Cookies and session information</li>
                </ul>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">How We Use Your Information</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">Service Delivery</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Process event registrations</li>
                    <li>• Manage user accounts</li>
                    <li>• Provide customer support</li>
                    <li>• Send important notifications</li>
                  </ul>
                </div>
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">Improvement</h3>
                  <ul className="space-y-2 text-purple-800">
                    <li>• Analyze usage patterns</li>
                    <li>• Enhance user experience</li>
                    <li>• Develop new features</li>
                    <li>• Optimize performance</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Protection */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Data Protection & Security</h2>
              </div>
              <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 mb-3">Security Measures</h3>
                    <ul className="space-y-2 text-red-800">
                      <li>• End-to-end encryption</li>
                      <li>• Secure data centers</li>
                      <li>• Regular security audits</li>
                      <li>• Access controls</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 mb-3">Your Rights</h3>
                    <ul className="space-y-2 text-red-800">
                      <li>• Access your data</li>
                      <li>• Request corrections</li>
                      <li>• Delete your account</li>
                      <li>• Export your data</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Data Sharing */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Sharing & Third Parties</h2>
              <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <p className="text-yellow-800 mb-4">
                  We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                </p>
                <ul className="space-y-2 text-yellow-800">
                  <li>• With your explicit consent</li>
                  <li>• To comply with legal obligations</li>
                  <li>• To protect our rights and safety</li>
                  <li>• With trusted service providers (under strict agreements)</li>
                </ul>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <p className="text-blue-800 mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2 text-blue-800">
                  <p><strong>Email:</strong> info@validity.et</p>
                  <p><strong>Phone:</strong> +251 96 577 3898</p>
                  <p><strong>Alternative:</strong> +251 97 387 4352</p>
                  <p><strong>Address:</strong> 22 Mazoria, Rewina Building, Office No. 206, Addis Ababa, Ethiopia</p>
                </div>
              </div>
            </div>

            {/* Policy Updates */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to This Policy</h2>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-gray-700">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
                </p>
              </div>
            </div>

            {/* Acceptance */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h2 className="text-2xl font-bold text-green-900 mb-4">Your Acceptance</h2>
              <p className="text-green-800">
                By using VEMS (Validity Event Management System), you acknowledge that you have read and understood this Privacy Policy and agree to the collection, use, and disclosure of your information as described herein.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
