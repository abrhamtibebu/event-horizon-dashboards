import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white p-8 shadow-lg rounded-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Terms of Service
        </h1>
        <p className="text-gray-600 mb-4">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose max-w-none">
          <p>
            This is a placeholder for the Terms of Service. In a real
            application, this page would outline the rules and regulations for
            the use of the company's services.
          </p>
          <h2 className="text-2xl font-semibold mt-6">1. Introduction</h2>
          <p>
            These Website Standard Terms and Conditions written on this webpage
            shall manage your use of our website, VEMS accessible at
            [Website.com].
          </p>
          <h2 className="text-2xl font-semibold mt-6">
            2. Intellectual Property Rights
          </h2>
          <p>
            Other than the content you own, under these Terms, VEMS and/or its
            licensors own all the intellectual property rights and materials
            contained in this Website.
          </p>
          <h2 className="text-2xl font-semibold mt-6">3. Restrictions</h2>
          <p>
            You are specifically restricted from all of the following:
            publishing any Website material in any other media; selling,
            sublicensing and/or otherwise commercializing any Website material;
            publicly performing and/or showing any Website material; using this
            Website in any way that is or may be damaging to this Website.
          </p>
          <h2 className="text-2xl font-semibold mt-6">4. Your Content</h2>
          <p>
            In these Website Standard Terms and Conditions, "Your Content" shall
            mean any audio, video text, images or other material you choose to
            display on this Website. By displaying Your Content, you grant VEMS
            a non-exclusive, worldwide irrevocable, sub-licensable license to
            use, reproduce, adapt, publish, translate and distribute it in any
            and all media.
          </p>
          <h2 className="text-2xl font-semibold mt-6">5. No warranties</h2>
          <p>
            This Website is provided "as is," with all faults, and VEMS express
            no representations or warranties, of any kind related to this
            Website or the materials contained on this Website.
          </p>
          <h2 className="text-2xl font-semibold mt-6">
            6. Limitation of liability
          </h2>
          <p>
            In no event shall VEMS, nor any of its officers, directors and
            employees, be held liable for anything arising out of or in any way
            connected with your use of this Website whether such liability is
            under contract.
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
