import { useState } from 'react'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
  { id: 1, name: 'Template', shortName: 'Template' },
  { id: 2, name: 'Audience', shortName: 'Audience' },
  { id: 3, name: 'Message', shortName: 'Message' },
  { id: 4, name: 'Review', shortName: 'Review' },
]

export function CampaignWizard({ open, onClose, onComplete }: CampaignWizardProps) {
  const [currentStep, setCurrentStep] = useState(1)

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
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
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
            onPrevious={handlePrevious}
            onRecipientCountChange={setRecipientCount}
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
            recipientCount={recipientCount}
            campaignType={campaignType}
            subject={subject}
            emailContent={emailContent}
            smsContent={smsContent}
            selectedTicketTypes={selectedTicketTypes}
            onlyCheckedIn={onlyCheckedIn}
          />
        )
      default:
        return null
    }
  }

  const progressPercentage = (currentStep / STEPS.length) * 100

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b z-10">
          <div className="px-6 py-5">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Create New Campaign
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-1">
                  Step {currentStep} of {STEPS.length}
                </DialogDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Simplified Step Indicator */}
          <div className="px-6 pb-5">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                        currentStep > index + 1
                          ? 'bg-blue-600 text-white'
                          : currentStep === index + 1
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {currentStep > index + 1 ? '✓' : step.id}
                    </div>
                    <div className="ml-2 hidden sm:block">
                      <div
                        className={`text-sm font-medium ${
                          currentStep >= index + 1 ? 'text-gray-900' : 'text-gray-500'
                        }`}
                      >
                        {step.shortName}
                      </div>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-all ${
                        currentStep > index + 1 ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {renderStepContent()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
