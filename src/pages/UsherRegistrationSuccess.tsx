import React, { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, Instagram, Linkedin, Globe } from 'lucide-react'

export default function UsherRegistrationSuccess() {
  const [searchParams] = useSearchParams()
  const name = searchParams.get('name') || 'Usher'
  const eventId = searchParams.get('eventId')

  // Force light mode for this page
  useEffect(() => {
    const htmlElement = document.documentElement
    const originalTheme = htmlElement.classList.contains('dark') ? 'dark' : null
    
    // Force light mode
    htmlElement.classList.remove('dark')
    htmlElement.classList.add('light')
    
    // Restore original theme when component unmounts
    return () => {
      htmlElement.classList.remove('light')
      if (originalTheme) {
        htmlElement.classList.add(originalTheme)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6">
      <Card className="max-w-xl w-full p-6 sm:p-8 lg:p-10 text-center bg-card rounded-2xl border border-border shadow-lg">
        {/* Logo */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <img
            src="/Validity-Event & Marketing.png"
            alt="Validity"
            className="h-16 sm:h-20 lg:h-24 w-auto mx-auto"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-4 sm:mt-6 text-card-foreground">Registration Complete</h1>
        <p className="text-card-foreground/95 mt-2 sm:mt-3 text-sm sm:text-base lg:text-lg font-medium">Thank you, {name}! Your usher registration has been received.</p>
        <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">We will contact you with next steps and assignment details.</p>

        {/* Socials */}
        <div className="mt-6 sm:mt-8 lg:mt-10">
          <div className="h-px bg-border mb-4 sm:mb-5 lg:mb-6"></div>
          <div className="text-sm sm:text-base lg:text-lg font-semibold text-card-foreground mb-3 sm:mb-4">Stay connected</div>
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-center gap-3 sm:gap-4">
            <a
              href="https://www.instagram.com/validity_event_marketing"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-border hover:border-[hsl(var(--color-primary))] hover:bg-muted/50 transition-all min-h-[44px] bg-background"
            >
              <Instagram className="w-5 h-5 text-card-foreground" />
              <span className="text-sm font-medium text-card-foreground">Instagram</span>
            </a>
            <a
              href="https://www.linkedin.com/company/107664913"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-border hover:border-[hsl(var(--color-primary))] hover:bg-muted/50 transition-all min-h-[44px] bg-background"
            >
              <Linkedin className="w-5 h-5 text-card-foreground" />
              <span className="text-sm font-medium text-card-foreground">LinkedIn</span>
            </a>
            <a
              href="https://validity.et/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-border hover:border-[hsl(var(--color-primary))] hover:bg-muted/50 transition-all min-h-[44px] bg-background"
            >
              <Globe className="w-5 h-5 text-card-foreground" />
              <span className="text-sm font-medium text-card-foreground">Website</span>
            </a>
          </div>
        </div>
      </Card>
    </div>
  )
}


