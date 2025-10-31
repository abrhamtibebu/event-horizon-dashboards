import { useState, useEffect } from 'react'
import { X, CheckCircle, ChevronRight, ChevronLeft, Sparkles, Mail, BarChart3, BookOpen } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface MarketingOnboardingProps {
  onClose: () => void
  onSkip: () => void
}

const TOUR_STEPS = [
  {
    id: 1,
    title: 'Create Your First Campaign',
    description: 'Start with our 4-step wizard. It\'s quick and guided!',
    icon: Mail,
    highlight: 'campaign-wizard-button',
  },
  {
    id: 2,
    title: 'Choose a Template',
    description: 'Pick a pre-made template to save time. We have Welcome, Reminder, Promo, and more!',
    icon: Sparkles,
    highlight: 'library-view',
  },
  {
    id: 3,
    title: 'Track Performance',
    description: 'See how your campaigns perform with visual charts and insights.',
    icon: BarChart3,
    highlight: 'analytics-tab',
  },
  {
    id: 4,
    title: 'You\'re All Set!',
    description: 'Ready to create amazing campaigns for your events. Let\'s get started!',
    icon: CheckCircle,
    highlight: null,
  },
]

export function MarketingOnboarding({ onClose, onSkip }: MarketingOnboardingProps) {
  const [showWelcome, setShowWelcome] = useState(true)
  const [showTour, setShowTour] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Check if user has seen onboarding before
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('marketing_onboarding_seen')
    if (hasSeenOnboarding === 'true') {
      onClose()
    }
  }, [])

  const handleStartTour = () => {
    setShowWelcome(false)
    setShowTour(true)
  }

  const handleSkip = () => {
    if (dontShowAgain) {
      localStorage.setItem('marketing_onboarding_seen', 'true')
    }
    onSkip()
    onClose()
  }

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = () => {
    if (dontShowAgain) {
      localStorage.setItem('marketing_onboarding_seen', 'true')
    }
    onClose()
  }

  if (showWelcome) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center flex items-center justify-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              Welcome to Marketing Center!
            </DialogTitle>
            <DialogDescription className="text-center text-lg mt-4">
              Create powerful email and SMS campaigns for your events with our simple, guided tools.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-6 my-8">
            <Card className="text-center border-blue-200">
              <CardHeader>
                <div className="mx-auto p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Create</CardTitle>
                <CardDescription className="text-sm">
                  Step-by-step wizard makes it easy
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-green-200">
              <CardHeader>
                <div className="mx-auto p-3 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-lg">Send</CardTitle>
                <CardDescription className="text-sm">
                  Instant or scheduled delivery
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center border-purple-200">
              <CardHeader>
                <div className="mx-auto p-3 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Analyze</CardTitle>
                <CardDescription className="text-sm">
                  Track performance with insights
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <Button onClick={handleStartTour} size="lg" className="w-full">
              <Sparkles className="w-4 h-4 mr-2" />
              Take 2-Minute Tour
            </Button>
            <Button onClick={handleSkip} variant="outline" size="lg" className="w-full">
              Skip to Dashboard
            </Button>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Checkbox
                id="dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              />
              <Label htmlFor="dont-show" className="text-sm text-gray-600 cursor-pointer">
                Don't show this again
              </Label>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (showTour) {
    const currentTourStep = TOUR_STEPS[currentStep]
    const Icon = currentTourStep.icon

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Step {currentStep + 1} of {TOUR_STEPS.length}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex justify-center mb-6">
              <div className="flex gap-2">
                {TOUR_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1 w-16 rounded-full transition-all ${
                      index === currentStep
                        ? 'bg-blue-600'
                        : index < currentStep
                        ? 'bg-green-600'
                        : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </DialogHeader>

          <Card className="border-2 border-blue-200">
            <CardHeader className="text-center">
              <div className="mx-auto p-4 bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                <Icon className="w-10 h-10 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">{currentTourStep.title}</CardTitle>
              <CardDescription className="text-base">
                {currentTourStep.description}
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              <Button onClick={handleNext}>
                {currentStep === TOUR_STEPS.length - 1 ? 'Get Started!' : 'Next'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return null
}

interface ContextualHelpProps {
  term: string
  explanation: string
  helpLink?: string
}

export function ContextualHelp({ term, explanation, helpLink }: ContextualHelpProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label={`Help for ${term}`}
      >
        <span className="text-xs font-bold">?</span>
      </button>

      {showTooltip && (
        <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg left-0 top-8">
          <div className="mb-2">
            <span className="font-semibold">{term}:</span>
          </div>
          <div className="text-gray-200 mb-2">{explanation}</div>
          {helpLink && (
            <a
              href={helpLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:text-blue-200 text-xs underline"
            >
              Learn more →
            </a>
          )}
          <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-900" />
        </div>
      )}
    </div>
  )
}

// Pre-defined help tooltips for common terms
export const MARKETING_HELP_TOOLTIPS = {
  segment: {
    term: 'Segment',
    explanation: 'A group of attendees you want to message, like "VIP ticket holders" or "people who haven\'t checked in yet".',
    helpLink: '/help/segments',
  },
  template: {
    term: 'Template',
    explanation: 'Pre-written email or SMS messages you can customize. Start with a template to save time!',
    helpLink: '/help/templates',
  },
  campaign: {
    term: 'Campaign',
    explanation: 'A marketing message you send to attendees. Track opens, clicks, and engagement to see how it performs.',
    helpLink: '/help/campaigns',
  },
  openRate: {
    term: 'Open Rate',
    explanation: 'The percentage of people who opened your email. Industry average is 21.5%.',
    helpLink: '/help/analytics',
  },
  clickRate: {
    term: 'Click Rate',
    explanation: 'The percentage of people who clicked a link in your email. Industry average is 2.6%.',
    helpLink: '/help/analytics',
  },
}
