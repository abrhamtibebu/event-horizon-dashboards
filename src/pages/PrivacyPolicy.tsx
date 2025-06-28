import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white p-8 shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Privacy Policy
        </h1>
        <p className="text-gray-600 mb-4">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose max-w-none">
          <p>
            This is a placeholder for the Privacy Policy. In a real application,
            this page would detail how user data is collected, used, and
            protected.
          </p>
          <h2 className="text-2xl font-semibold mt-6">
            Information We Collect
          </h2>
          <p>
            We would list the types of information collected, such as personal
            identification information (name, email address, etc.), non-personal
            identification information (browser name, type of computer, etc.),
            and web browser cookies.
          </p>
          <h2 className="text-2xl font-semibold mt-6">
            How We Use Collected Information
          </h2>
          <p>
            We would explain the purposes for which we collect and use personal
            information, for example, to improve customer service, personalize
            user experience, and to send periodic emails.
          </p>
          <h2 className="text-2xl font-semibold mt-6">
            How We Protect Your Information
          </h2>
          <p>
            We would describe the security measures in place to protect against
            unauthorized access, alteration, disclosure, or destruction of
            personal information.
          </p>
          <h2 className="text-2xl font-semibold mt-6">
            Sharing Your Personal Information
          </h2>
          <p>
            We would clarify our policy on selling, trading, or renting users'
            personal identification information to others.
          </p>
          <h2 className="text-2xl font-semibold mt-6">
            Changes to This Privacy Policy
          </h2>
          <p>
            We have the discretion to update this privacy policy at any time.
            When we do, we will revise the updated date at the top of this page.
          </p>
          <h2 className="text-2xl font-semibold mt-6">
            Your Acceptance of These Terms
          </h2>
          <p>
            By using this Site, you signify your acceptance of this policy. If
            you do not agree to this policy, please do not use our Site.
          </p>
        </div>

        <div className="mt-8">
          <Button asChild>
            <Link to="/" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
