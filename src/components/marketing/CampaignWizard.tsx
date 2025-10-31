import { useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { TemplateSelector } from './WizardSteps/TemplateSelector'
import { AudienceSelector } from './WizardSteps/AudienceSelector'
import { MessageEditor } from './WizardSteps/MessageEditor'
import { ScheduleReview } from './WizardSteps/ScheduleReview'

interface CampaignWizardProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

const STEPS = [
  { id: 1, name: 'Choose Template', component: 'template' },
  { id: 2, name: 'Select Audience', component: 'audience' },
  { id: 3, name: 'Customize Message', component: 'message' },
  { id: 4, name: 'Review & Send', component: 'review' },
]

export function CampaignWizard({ open, onClose, onComplete }: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [progress, setProgress] = useState(25)

  // Wizard state
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [audienceType, setAudienceType] = useState<'all' | 'specific' | 'custom'>('all')
  const [selectedTicketTypes, setSelectedTicketTypes] = useState<string[]>([])
  const [onlyCheckedIn, setOnlyCheckedIn] = useState(false)
  const [recipientCount, setRecipientCount] = useState<number>(0)

  // Message content
  const [campaignType, setCampaignType] = useState<'email' | 'sms' | 'both'>('email')
  const [subject, setSubject] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [smsContent, setSmsContent] = useState('')

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1)
      setProgress(((currentStep + 1) / STEPS.length) * 100)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setProgress(((currentStep - 1) / STEPS.length) * 100)
    }
  }

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template)
    if (template) {
      setCampaignType(template.type || 'email')
      setSubject(template.subject || '')
      setEmailContent(template.email_body || '')
      setSmsContent(template.sms_body || '')
    }
  }

  const handleComplete = () => {
    onComplete()
    // Reset state
    setCurrentStep(1)
    setProgress(25)
    setSelectedTemplate(null)
    setSelectedEventId('')
    setAudienceType('all')
    setSelectedTicketTypes([])
    setOnlyCheckedIn(false)
    setRecipientCount(0)
    setSubject('')
    setEmailContent('')
    setSmsContent('')
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onSelectTemplate={handleTemplateSelect}
            onNext={handleNext}
          />
        )
      case 2:
        return (
          <AudienceSelector
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            audienceType={audienceType}
            onSelectAudienceType={setAudienceType}
            selectedTicketTypes={selectedTicketTypes}
            onSelectTicketTypes={setSelectedTicketTypes}
            onlyCheckedIn={onlyCheckedIn}
            onSetCheckedIn={setOnlyCheckedIn}
            onNext={handleNext}
          />
        )
      case 3:
        return (
          <MessageEditor
            campaignType={campaignType}
            subject={subject}
            onSubjectChange={setSubject}
            emailContent={emailContent}
            onEmailContentChange={setEmailContent}
            smsContent={smsContent}
            onSmsContentChange={setSmsContent}
            onNext={handleNext}
            onPrevious={handlePrevious}
            selectedTemplate={selectedTemplate}
          />
        )
      case 4:
        return (
          <ScheduleReview
            onSend={handleComplete}
            onPrevious={handlePrevious}
            selectedTemplate={selectedTemplate}
            selectedEventId={selectedEventId}
            audienceType={audienceType}
            recipientCount={recipientCount || 250}
            campaignType={campaignType}
            subject={subject}
            emailContent={emailContent}
            smsContent={smsContent}
          />
        )
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">Create New Campaign</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-4 py-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between items-center">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className="flex items-center"
              >
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    currentStep > index + 1
                      ? 'bg-green-500 border-green-500 text-white'
                      : currentStep === index + 1
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-gray-300 text-gray-500'
                  }`}
                >
                  {currentStep > index + 1 ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <span className="font-semibold">{step.id}</span>
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-16 mx-2 ${
                      currentStep > index + 1 ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Names */}
          <div className="flex justify-between text-xs text-gray-600 mt-2">
            {STEPS.map(step => (
              <div
                key={step.id}
                className={`w-[80px] text-center ${
                  currentStep === step.id ? 'font-semibold text-blue-600' : ''
                }`}
              >
                {step.name}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="mt-8">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
