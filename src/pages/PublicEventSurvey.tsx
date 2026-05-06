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
          answers,
        },
        { eligible: !!eligible },
      )
    },
    onSuccess: () => {
      toast.success('Thank you — your responses were submitted.')
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

  const back = () => setStep((s) => Math.max(0, s - 1))

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
      <div className="min-h-[50vh] flex items-center justify-center p-6 text-center max-w-md mx-auto">
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
    )
  }

  if (step >= questions.length) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <Card className="max-w-md w-full text-center shadow-lg">
          <CardHeader>
            <CardTitle>Submitted</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">Thank you for your feedback.</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-muted/40 flex flex-col items-center px-4 py-8 pb-16">
      <div className="w-full max-w-lg space-y-4">
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
    </div>
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
