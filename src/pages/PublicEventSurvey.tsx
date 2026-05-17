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
import { cn } from '@/lib/utils'

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
      <div className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-background via-muted/30 to-background justify-center">
        <div className="flex-1 flex items-center justify-center p-6 text-center max-w-md mx-auto w-full">
          <Card className="w-full border-destructive/20 shadow-2xl rounded-3xl backdrop-blur-md bg-card/60">
            <CardHeader className="pt-8">
              <CardTitle className="text-xl font-extrabold text-foreground">Survey Unavailable</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground pb-8">
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
      <div className="min-h-[100dvh] bg-gradient-to-b from-background via-muted/20 to-background flex flex-col items-center px-4 py-12 justify-center">
        <div className="w-full max-w-lg space-y-6 flex-1 flex flex-col justify-center">
          <div className="text-center space-y-2 px-2">
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent leading-tight">{survey.title}</h1>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Please provide your contact details to complete the survey and register for the lucky draw.
            </p>
          </div>
          
          <Card className="border border-black/5 dark:border-white/5 shadow-2xl rounded-3xl bg-card/60 backdrop-blur-md overflow-hidden">
            <CardHeader className="pb-4 pt-6 px-6">
              <CardTitle className="text-xl font-bold">Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 px-6 pb-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={respondentName}
                  onChange={(e) => {
                    setRespondentName(e.target.value)
                    if (contactErrors.name) setContactErrors(prev => ({ ...prev, name: undefined }))
                  }}
                  className={cn(
                    "h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/20 transition-all",
                    contactErrors.name ? 'border-destructive focus-visible:ring-destructive' : ''
                  )}
                />
                {contactErrors.name && (
                  <p className="text-[11px] font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1">
                    {contactErrors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="e.g. 0912345678"
                  value={respondentPhone}
                  onChange={(e) => {
                    setRespondentPhone(e.target.value)
                    if (contactErrors.phone) setContactErrors(prev => ({ ...prev, phone: undefined }))
                  }}
                  className={cn(
                    "h-12 px-4 rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/20 transition-all",
                    contactErrors.phone ? 'border-destructive focus-visible:ring-destructive' : ''
                  )}
                />
                {contactErrors.phone ? (
                  <p className="text-[11px] font-medium text-destructive mt-1 animate-in fade-in slide-in-from-top-1">
                    {contactErrors.phone}
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground ml-1">
                    Format: 09... or 07... (one entry per phone number)
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end p-6 border-t border-border/40 bg-muted/10">
              <Button type="button" size="lg" className="rounded-2xl px-6 font-semibold" onClick={next}>
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
      <div className="min-h-[100dvh] bg-gradient-to-b from-background via-muted/20 to-background flex flex-col items-center px-4 py-12 justify-center">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg">
          <Card className="w-full text-center border border-black/5 dark:border-white/5 shadow-2xl rounded-[2.5rem] bg-card/60 backdrop-blur-md overflow-hidden p-8 space-y-6">
            <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <svg className="w-8 h-8 stroke-current stroke-2 animate-bounce" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-extrabold tracking-tight">Responses Submitted</CardTitle>
              <p className="text-muted-foreground text-sm">Thank you so much for your valuable feedback.</p>
            </div>
            {lottoNumber && (
              <div className="bg-gradient-to-br from-amber-500/5 to-amber-600/[0.02] border border-amber-500/10 rounded-2xl p-6 space-y-3 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-amber-600">Your Lotto Draw Ticket</p>
                <div className="text-4xl font-mono tracking-[0.3em] font-black text-foreground py-2 select-all">
                  {lottoNumber}
                </div>
                <p className="text-[11px] text-muted-foreground">Keep this ticket number safe for the upcoming event draw!</p>
              </div>
            )}
          </Card>
        </div>
        <SurveyBrandedFooter />
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-background via-muted/20 to-background flex flex-col items-center px-4 py-12 justify-center">
      <div className="w-full max-w-lg space-y-6 flex-1 flex flex-col justify-center">
        <div className="text-center space-y-2 px-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Feedback Survey</p>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent leading-tight">{survey.title}</h1>
          {survey.description ? (
            <p className="text-sm text-muted-foreground">{survey.description}</p>
          ) : null}
        </div>
        
        {/* Progress Bar with modern labeling */}
        <div className="space-y-2 px-1">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Question {step + 1} of {questions.length}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-1.5 bg-muted/60 transition-all duration-300" />
        </div>

        <Card className="border border-black/5 dark:border-white/5 shadow-2xl rounded-3xl bg-card/60 backdrop-blur-md overflow-hidden">
          <CardHeader className="pb-4 pt-6 px-6">
            <CardTitle className="text-lg font-bold leading-snug">
              {current?.question_text}
            </CardTitle>
            {current?.is_required ? (
              <p className="text-[10px] uppercase font-bold tracking-wider text-primary mt-1">Required Question</p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {current && (
              <QuestionStep question={current} value={values[current.id]} onChange={(v) => setVal(current.id, v)} />
            )}
          </CardContent>
          <CardFooter className="flex justify-between gap-2 p-6 border-t border-border/40 bg-muted/10">
            <Button 
              type="button" 
              variant="outline" 
              disabled={step === 0 || submitMut.isPending} 
              onClick={back}
              className="rounded-xl font-semibold"
            >
              Back
            </Button>
            <Button 
              type="button" 
              onClick={next} 
              disabled={submitMut.isPending}
              className="rounded-xl px-5 font-semibold"
            >
              {submitMut.isPending ? 'Submitting…' : step >= questions.length - 1 ? 'Submit Responses' : 'Next Question'}
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
          className="resize-none rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/20 transition-all p-4"
          maxLength={opts?.max_length ?? 5000}
        />
      )

    case 'rating': {
      const min = opts?.min ?? 1
      const max = opts?.max ?? 5
      const numeric = typeof value === 'number' ? value : null
      const range = Array.from({ length: max - min + 1 }, (_, i) => min + i)
      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3 justify-center py-2">
            {range.map((n) => (
              <Button
                key={n}
                type="button"
                size="lg"
                variant={numeric === n ? 'default' : 'outline'}
                className={cn(
                  "w-14 h-14 rounded-2xl font-bold flex items-center justify-center transition-all duration-200 border text-base",
                  numeric === n 
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-105" 
                    : "bg-background hover:bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                )}
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
        <div className="space-y-6 px-2 py-2">
          <Slider
            value={[v]}
            min={0}
            max={10}
            step={1}
            onValueChange={(vals) => onChange(vals[0] ?? 0)}
            className="py-1"
          />
          <div className="flex justify-between text-xs text-muted-foreground items-center">
            <span>Not likely · 0</span>
            <span className="text-xl font-black text-foreground bg-primary/5 border border-primary/10 rounded-2xl px-4 py-1.5 tabular-nums">{v}</span>
            <span>10 · Very likely</span>
          </div>
        </div>
      )
    }

    case 'multiple_choice': {
      const choices = opts?.choices ?? []
      const current = typeof value === 'string' ? value : ''
      return (
        <RadioGroup value={current} onValueChange={(v) => onChange(v)} className="space-y-2.5">
          {choices.map((c) => {
            const isSelected = current === c.value;
            return (
              <div 
                key={c.value} 
                onClick={() => onChange(c.value)}
                className={cn(
                  "flex items-center space-x-3 rounded-2xl border p-4 cursor-pointer transition-all duration-200 hover:bg-muted/30",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border bg-background"
                )}
              >
                <RadioGroupItem value={c.value} id={`${question.id}-${c.value}`} className="sr-only" />
                <div className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center transition-all flex-shrink-0",
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                )}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                </div>
                <span className={cn(
                  "flex-1 text-sm font-medium leading-snug transition-colors",
                  isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                )}>
                  {c.label}
                </span>
              </div>
            )
          })}
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
        <div className="space-y-2.5">
          {choices.map((c) => {
            const isSelected = selected.includes(c.value);
            return (
              <div 
                key={c.value} 
                onClick={() => toggle(c.value)}
                className={cn(
                  "flex items-start space-x-3 rounded-2xl border p-4 cursor-pointer transition-all duration-200 hover:bg-muted/30",
                  isSelected 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border bg-background"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-md border flex items-center justify-center mt-0.5 transition-all flex-shrink-0",
                  isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                )}>
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={cn(
                  "flex-1 text-sm font-medium leading-snug transition-colors",
                  isSelected ? "text-foreground font-semibold" : "text-muted-foreground"
                )}>
                  {c.label}
                </span>
              </div>
            )
          })}
        </div>
      )
    }

    default:
      return <p className="text-sm text-muted-foreground">Unsupported question type.</p>
  }
}
