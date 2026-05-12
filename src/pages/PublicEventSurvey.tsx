import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { SpinnerInline } from '@/components/ui/spinner'
import axios from 'axios'
import { fetchPublicSurvey, submitPublicSurvey } from '@/lib/api/surveys'
import type { PublicSurveyPayload, SurveyQuestion } from '@/types/survey'
import { toast } from 'sonner'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'

export default function PublicEventSurveyPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const [searchParams] = useSearchParams()
  const numericEventId = useMemo(() => parseInt(eventId ?? '', 10), [eventId])
  const attendeeIdParam = searchParams.get('attendeeId')
  const attendeeId = attendeeIdParam ? parseInt(attendeeIdParam, 10) : undefined
  const eligible =
    searchParams.get('eligible') === '1' ||
    searchParams.get('eligible') === 'true' ||
    undefined

  const [step, setStep] = useState(0)
  const [values, setValues] = useState<Record<number, unknown>>({})
  const [lottoNumber, setLottoNumber] = useState<string | null>(null)
  const [respondentName, setRespondentName] = useState('')
  const [respondentPhone, setRespondentPhone] = useState('')
  const [showLottoDetails, setShowLottoDetails] = useState(false)

  // Use a separate state to track if we've moved past the lotto info step
  const [hasLottoDetails, setHasLottoDetails] = useState(false)
  const [contactErrors, setContactErrors] = useState<{ name?: string; phone?: string }>({})

  const {
    data: survey,
    isLoading,
    error,
    isError,
  } = useQuery({
    queryKey: ['public-survey', numericEventId, attendeeId, eligible],
    queryFn: () =>
      fetchPublicSurvey(numericEventId, {
        attendee_id: Number.isFinite(attendeeId) ? attendeeId : undefined,
        eligible: !!eligible,
      }),
    enabled: Number.isFinite(numericEventId),
  })

  // Determine if we need to show the Lotto info step first
  const needsLottoDetails = !!survey?.is_lotto_enabled && !hasLottoDetails

  const questions = survey?.questions ?? []
  const current = questions[step]
  const progress = questions.length ? ((step + 1) / questions.length) * 100 : 0

  const submitMut = useMutation({
    mutationFn: async () => {
      if (!survey) throw new Error('No survey')
      const answers = questions.map((q) => ({
        question_id: q.id,
        value: Object.prototype.hasOwnProperty.call(values, q.id) ? values[q.id] : null,
      }))
      return submitPublicSurvey(
        survey.id,
        {
          attendee_id: Number.isFinite(attendeeId) ? attendeeId : null,
          respondent_name: respondentName || null,
          respondent_phone: respondentPhone || null,
          answers,
        },
        { eligible: !!eligible },
      )
    },
    onSuccess: (data) => {
      toast.success('Thank you — your responses were submitted.')
      if (data.lotto_number) {
        setLottoNumber(data.lotto_number)
      }
      setStep(questions.length)
    },
    onError: (e: unknown) => {
      let msg = 'Could not submit survey'
      if (axios.isAxiosError(e)) {
        const m = e.response?.data?.message
        if (typeof m === 'string') msg = m
      }
      toast.error(msg)
    },
  })

  const setVal = (qid: number, v: unknown) => {
    setValues((prev) => ({ ...prev, [qid]: v }))
  }

  const canAdvance = (): boolean => {
    if (!current) return true
    if (!current.is_required) return true
    const v = values[current.id]
    if (v === undefined || v === null) return false
    if (typeof v === 'string' && current.type === 'text' && !v.trim()) return false
    if (current.type === 'checkbox' && Array.isArray(v) && v.length === 0) return false
    return true
  }

  const next = () => {
    if (needsLottoDetails) {
      const newErrors: { name?: string; phone?: string } = {}
      if (!respondentName.trim()) {
        newErrors.name = 'Please enter your full name.'
      }
      
      if (!respondentPhone.trim()) {
        newErrors.phone = 'Please enter your phone number.'
      } else {
        // Strip all non-digits to check core length and pattern
        const digits = respondentPhone.replace(/\D/g, '')
        const isEthiopian = 
          (digits.startsWith('251') && digits.length === 12) || 
          (digits.startsWith('0') && digits.length === 10) || 
          (digits.length === 9)
        
        const last9 = digits.slice(-9)
        const validStart = ['7', '9'].includes(last9[0])

        if (!isEthiopian || !validStart) {
          newErrors.phone = 'Enter a valid Ethiopian number (e.g. 09... or 07...)'
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setContactErrors(newErrors)
        return
      }

      setContactErrors({})
      setHasLottoDetails(true)
      return
    }

    if (!canAdvance()) {
      toast.error('Please answer this question.')
      return
    }
    if (step >= questions.length - 1) {
      submitMut.mutate()
    } else {
      setStep((s) => s + 1)
    }
  }

  const back = () => {
    if (!needsLottoDetails && step === 0 && survey?.is_lotto_enabled) {
      setHasLottoDetails(false)
      return
    }
    setStep((s) => Math.max(0, s - 1))
  }

  if (!Number.isFinite(numericEventId)) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-muted-foreground text-sm">
        Invalid event link.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <SpinnerInline />
      </div>
    )
  }

  if (isError || !survey) {
    let msg: string | undefined
    if (axios.isAxiosError(error)) {
      const m = error.response?.data?.message
      if (typeof m === 'string') msg = m
    }
    return (
      <div className="min-h-[100dvh] flex flex-col bg-muted/40">
        <div className="flex-1 flex items-center justify-center p-6 text-center max-w-md mx-auto">
          <Card className="w-full border-destructive/30">
            <CardHeader>
              <CardTitle className="text-lg">Survey unavailable</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {(typeof msg === 'string' && msg) ||
                'There is no active survey for this event, or it is not available yet.'}
            </CardContent>
          </Card>
        </div>
        <SurveyBrandedFooter />
      </div>
    )
  }

  if (needsLottoDetails) {
    return (
      <div className="min-h-[100dvh] bg-muted/40 flex flex-col items-center px-4 py-8">
        <div className="w-full max-w-lg space-y-4 flex-1">
          <div className="text-center space-y-1 px-2">
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              Lotto Enabled
            </div>
            <h1 className="text-xl font-bold leading-tight">{survey.title}</h1>
            <p className="text-sm text-muted-foreground">
              Please provide your contact details to receive your Lotto number after completing the survey.
            </p>
          </div>
          
          <Card className="shadow-md border-border">
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={respondentName}
                  onChange={(e) => {
                    setRespondentName(e.target.value)
                    if (contactErrors.name) setContactErrors(prev => ({ ...prev, name: undefined }))
                  }}
                  className={contactErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {contactErrors.name && (
                  <p className="text-[11px] font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1">
                    {contactErrors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g. 0912345678"
                  value={respondentPhone}
                  onChange={(e) => {
                    setRespondentPhone(e.target.value)
                    if (contactErrors.phone) setContactErrors(prev => ({ ...prev, phone: undefined }))
                  }}
                  className={contactErrors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
                />
                {contactErrors.phone ? (
                  <p className="text-[11px] font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1">
                    {contactErrors.phone}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground">
                    Format: 09... or 07... (one entry per phone number)
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-4 border-t bg-muted/20">
              <Button type="button" onClick={next}>
                Start Survey
              </Button>
            </CardFooter>
          </Card>
        </div>
        <SurveyBrandedFooter />
      </div>
    )
  }

  if (step >= questions.length) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-muted/40 items-center px-4 py-8">
        <div className="flex-1 flex items-center justify-center w-full">
          <Card className="max-w-md w-full text-center shadow-lg">
            <CardHeader>
              <CardTitle>Submitted</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-sm">Thank you for your feedback.</p>
              {lottoNumber && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 space-y-2">
                  <p className="text-xs uppercase tracking-widest font-bold text-amber-600">Your Lotto Number</p>
                  <div className="text-4xl font-mono tracking-[0.25em] font-bold text-foreground">
                    {lottoNumber}
                  </div>
                  <p className="text-xs text-muted-foreground">Please keep this number for the draw.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        <SurveyBrandedFooter />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-muted/40 flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-lg space-y-4 flex-1">
        <div className="text-center space-y-1 px-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Feedback</p>
          <h1 className="text-xl font-bold leading-tight">{survey.title}</h1>
          {survey.description ? (
            <p className="text-sm text-muted-foreground">{survey.description}</p>
          ) : null}
        </div>
        <Progress value={progress} className="h-2" />
        <Card className="shadow-md border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold leading-snug">
              {current?.question_text}
            </CardTitle>
            {current?.is_required ? (
              <p className="text-xs text-muted-foreground">Required</p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {current && (
              <QuestionStep question={current} value={values[current.id]} onChange={(v) => setVal(current.id, v)} />
            )}
          </CardContent>
          <CardFooter className="flex justify-between gap-2 flex-wrap pt-4 border-t bg-muted/20">
            <Button type="button" variant="outline" disabled={step === 0 || submitMut.isPending} onClick={back}>
              Back
            </Button>
            <Button type="button" onClick={next} disabled={submitMut.isPending}>
              {submitMut.isPending ? 'Submitting…' : step >= questions.length - 1 ? 'Submit' : 'Next'}
            </Button>
          </CardFooter>
        </Card>
      </div>
      <SurveyBrandedFooter />
    </div>
  )
}

function SurveyBrandedFooter() {
  return (
    <footer className="mt-8 py-6 flex flex-col items-center gap-3 text-center w-full max-w-lg border-t border-border/40">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Powered by</span>
        <a 
          href="https://evella.et" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1.5 group transition-all"
        >
          <img src="/evella-logo.png" alt="Evella Logo" className="h-5 w-auto" />
        </a>
      </div>
      <a 
        href="https://evella.et" 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
      >
        Browse more amazing events on <span className="underline underline-offset-2 decoration-primary/30 group-hover:decoration-primary">evella.et</span>
      </a>
    </footer>
  )
}

function QuestionStep({
  question,
  value,
  onChange,
}: {
  question: SurveyQuestion
  value: unknown
  onChange: (v: unknown) => void
}) {
  const opts = question.options

  switch (question.type) {
    case 'text':
      return (
        <Textarea
          rows={5}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Your answer…"
          className="resize-none"
          maxLength={opts?.max_length ?? 5000}
        />
      )

    case 'rating': {
      const min = opts?.min ?? 1
      const max = opts?.max ?? 5
      const numeric = typeof value === 'number' ? value : min
      const range = Array.from({ length: max - min + 1 }, (_, i) => min + i)
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 justify-center py-2">
            {range.map((n) => (
              <Button
                key={n}
                type="button"
                size="lg"
                variant={numeric === n ? 'default' : 'outline'}
                className="min-w-12 rounded-xl font-bold"
                onClick={() => onChange(n)}
              >
                {n}
              </Button>
            ))}
          </div>
        </div>
      )
    }

    case 'nps': {
      const v = typeof value === 'number' ? value : 5
      return (
        <div className="space-y-4 px-2">
          <Slider
            value={[v]}
            min={0}
            max={10}
            step={1}
            onValueChange={(vals) => onChange(vals[0] ?? 0)}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Not likely · 0</span>
            <span className="text-lg font-bold text-foreground tabular-nums">{v}</span>
            <span>10 · Very likely</span>
          </div>
        </div>
      )
    }

    case 'multiple_choice': {
      const choices = opts?.choices ?? []
      const current = typeof value === 'string' ? value : ''
      return (
        <RadioGroup value={current} onValueChange={(v) => onChange(v)} className="space-y-2">
          {choices.map((c) => (
            <div key={c.value} className="flex items-center space-x-2 rounded-lg border border-border p-3">
              <RadioGroupItem value={c.value} id={`${question.id}-${c.value}`} />
              <Label htmlFor={`${question.id}-${c.value}`} className="flex-1 cursor-pointer leading-snug font-normal">
                {c.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )
    }

    case 'checkbox': {
      const choices = opts?.choices ?? []
      const selected: string[] = Array.isArray(value) ? value.map(String) : []
      const toggle = (cv: string) => {
        if (selected.includes(cv)) {
          onChange(selected.filter((x) => x !== cv))
        } else {
          onChange([...selected, cv])
        }
      }
      return (
        <div className="space-y-2">
          {choices.map((c) => (
            <div key={c.value} className="flex items-start space-x-3 rounded-lg border border-border p-3">
              <Checkbox
                id={`${question.id}-${c.value}`}
                checked={selected.includes(c.value)}
                onCheckedChange={() => toggle(c.value)}
              />
              <Label
                htmlFor={`${question.id}-${c.value}`}
                className="flex-1 cursor-pointer leading-snug font-normal"
              >
                {c.label}
              </Label>
            </div>
          ))}
        </div>
      )
    }

    default:
      return <p className="text-sm text-muted-foreground">Unsupported question type.</p>
  }
}
