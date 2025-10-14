import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, Instagram, Linkedin, Globe, Twitter } from 'lucide-react'

export default function UsherRegistrationSuccess() {
  const [searchParams] = useSearchParams()
  const name = searchParams.get('name') || 'Usher'
  const eventId = searchParams.get('eventId')

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0E1B2B] via-[#14243A] to-[#1C2E4A] flex items-center justify-center p-4 sm:p-6">
      <Card className="max-w-xl w-full p-6 sm:p-8 text-center bg-white rounded-2xl border border-[#0E1B2B]/10 shadow-md">
        {/* Logo */}
        <div className="mb-4 sm:mb-6">
          <img
            src="/Validity-Event & Marketing.png"
            alt="Validity"
            className="h-10 sm:h-12 w-auto mx-auto"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold mt-4">Registration Complete</h1>
        <p className="text-gray-700 mt-2 text-sm sm:text-base">Thank you, {name}! Your usher registration has been received.</p>
        <p className="text-gray-600 mt-1 text-sm sm:text-base">We will contact you with next steps and assignment details.</p>

        {/* Socials */}
        <div className="mt-6">
          <div className="text-sm font-medium text-gray-900 mb-3">Stay connected</div>
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-3 sm:gap-4">
            <a
              href="https://www.instagram.com/validity_event_marketing"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition min-h-[44px]"
            >
              <Instagram className="w-4 h-4" />
              <span className="text-sm">Instagram</span>
            </a>
            <a
              href="https://www.linkedin.com/company/107664913"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition min-h-[44px]"
            >
              <Linkedin className="w-4 h-4" />
              <span className="text-sm">LinkedIn</span>
            </a>
            <a
              href="https://validity.et/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition min-h-[44px]"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm">Website</span>
            </a>
            <a
              href="https://x.com/validity_events"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition min-h-[44px]"
            >
              <Twitter className="w-4 h-4" />
              <span className="text-sm">X (Twitter)</span>
            </a>
          </div>
        </div>
      </Card>
    </div>
  )
}


