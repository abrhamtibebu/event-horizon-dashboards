import { useEffect, useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Copy, Link2, Loader2, Plus, Trash2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { surveyApi } from '@/lib/api/surveys'
import { buildPublicSurveyFrontendLink } from '@/lib/publicRegistrationLinks'
import { getPublicSiteURL } from '@/config/env'
import type {
  Survey,
  SurveyQuestionOptions,
  SurveyQuestionType,
  SurveyTriggerType,
  SurveyChoiceOption,
} from '@/types/survey'

const QUESTION_TYPES: SurveyQuestionType[] = [
  'rating',
  'nps',
  'multiple_choice',
  'checkbox',
  'text',
]

function newKey(): string {
  try {
    return crypto.randomUUID()
  } catch {
    return `q-${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

function defaultOptions(type: SurveyQuestionType): SurveyQuestionOptions | null {
  switch (type) {
    case 'rating':
      return { min: 1, max: 5 }
    case 'nps':
      return null
    case 'multiple_choice':
    case 'checkbox':
      return {
        choices: [
          { label: 'Option 1', value: 'opt1' },
          { label: 'Option 2', value: 'opt2' },
        ],
      }
    case 'text':
      return { max_length: 2000 }
    default:
      return null
  }
}

export type DraftQuestion = {
  key: string
  type: SurveyQuestionType
  question_text: string
  is_required: boolean
  options: SurveyQuestionOptions | null
}

function validateDrafts(questions: DraftQuestion[]): string | null {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    if (!q.question_text.trim()) {
      return `Question ${i + 1}: enter question text.`
    }
    if (q.type === 'rating') {
      const min = q.options?.min ?? 1
      const max = q.options?.max ?? 5
      if (min >= max) {
        return `Question ${i + 1}: rating needs min less than max.`
      }
    }
    if (q.type === 'multiple_choice' || q.type === 'checkbox') {
      const choices = q.options?.choices ?? []
      const ok = choices.some((c) => String(c?.value ?? '').trim())
      if (!ok) {
        return `Question ${i + 1}: add at least one choice with a value.`
      }
    }
  }
  return null
}

export default function NewSurveyDialog({
  eventId,
  open,
  onOpenChange,
  onCreated,
}: {
  eventId: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (survey: Survey) => void
}) {
  const [step, setStep] = useState<'form' | 'share'>('form')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState<SurveyTriggerType>('manual')
  const [isActive, setIsActive] = useState(true)
  const [questions, setQuestions] = useState<DraftQuestion[]>(() => [
    {
      key: newKey(),
      type: 'rating',
      question_text: 'How would you rate your experience?',
      is_required: true,
      options: defaultOptions('rating'),
    },
  ])
  const [createdSurvey, setCreatedSurvey] = useState<Survey | null>(null)

  useEffect(() => {
    if (!open) return
    setStep('form')
    setTitle('')
    setDescription('')
    setTriggerType('manual')
    setIsActive(true)
    setQuestions([
      {
        key: newKey(),
        type: 'rating',
        question_text: 'How would you rate your experience?',
        is_required: true,
        options: defaultOptions('rating'),
      },
    ])
    setCreatedSurvey(null)
  }, [open])

  const shareUrl = useMemo(() => {
    if (!createdSurvey) return ''
    return (
      buildPublicSurveyFrontendLink({
        origin: getPublicSiteURL(),
        eventId,
        triggerType: createdSurvey.trigger_type,
      }) ?? ''
    )
  }, [createdSurvey, eventId])

  const createMutation = useMutation({
    mutationFn: async (): Promise<Survey> => {
      const err = validateDrafts(questions)
      if (err) {
        throw new Error(err)
      }
      if (!title.trim()) {
        throw new Error('Enter a survey title.')
      }

      const survey = await surveyApi.create(eventId, {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        trigger_type: triggerType,
        is_active: isActive,
      })

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i]
        await surveyApi.addQuestion(survey.id, {
          type: q.type,
          question_text: q.question_text.trim(),
          is_required: q.is_required,
          options: q.options ?? defaultOptions(q.type),
          order_index: i,
        })
      }

      return survey
    },
    onSuccess: (survey) => {
      setCreatedSurvey(survey)
      setStep('share')
      toast.success('Survey created')
      onCreated?.(survey)
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Could not create survey'
      toast.error(msg)
    },
  })

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy')
    }
  }

  const handleClose = (next: boolean) => {
    if (!next) {
      setStep('form')
      setCreatedSurvey(null)
    }
    onOpenChange(next)
  }

  const updateQuestion = (key: string, patch: Partial<DraftQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.key !== key) return q

        if (patch.type !== undefined && patch.type !== q.type) {
          return {
            ...q,
            ...patch,
            options: defaultOptions(patch.type),
          }
        }

        if (patch.options !== undefined) {
          const merged: SurveyQuestionOptions = {
            ...(q.options ?? {}),
            ...patch.options,
          }
          if (patch.options.choices !== undefined) {
            merged.choices = patch.options.choices
          }
          return {
            ...q,
            ...patch,
            options: merged,
          }
        }

        return { ...q, ...patch }
      }),
    )
  }

  const addQuestionRow = () => {
    setQuestions((prev) => [
      ...prev,
      {
        key: newKey(),
        type: 'text',
        question_text: '',
        is_required: false,
        options: defaultOptions('text'),
      },
    ])
  }

  const removeQuestionRow = (key: string) => {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((q) => q.key !== key)))
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[calc(100vw-1.5rem)] max-h-[min(90vh,720px)] flex flex-col gap-0 p-0">
        {step === 'form' ? (
          <>
            <DialogHeader className="p-6 pb-2 shrink-0">
              <DialogTitle>New survey</DialogTitle>
              <DialogDescription>
                Set the title, description, and questions. You can share the public link after it&apos;s created.
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto max-h-[calc(min(90vh,720px)-180px)] px-6">
              <div className="space-y-4 pr-2 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="survey-title">Title</Label>
                  <Input
                    id="survey-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Post-event feedback"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="survey-desc">Description (optional)</Label>
                  <Textarea
                    id="survey-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Shown to attendees before they answer"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>When to show</Label>
                    <Select
                      value={triggerType}
                      onValueChange={(v: SurveyTriggerType) => setTriggerType(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[300]">
                        <SelectItem value="instant">After check-in</SelectItem>
                        <SelectItem value="post_event">After event ends</SelectItem>
                        <SelectItem value="manual">Manual link (eligible)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <Switch id="survey-active" checked={isActive} onCheckedChange={setIsActive} />
                    <Label htmlFor="survey-active" className="text-sm font-normal cursor-pointer">
                      Active survey for this event
                    </Label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Questions</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addQuestionRow}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add question
                    </Button>
                  </div>

                  {questions.map((q, idx) => (
                    <div
                      key={q.key}
                      className="rounded-lg border border-border bg-muted/20 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Question {idx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeQuestionRow(q.key)}
                          disabled={questions.length <= 1}
                          aria-label="Remove question"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Type</Label>
                          <Select
                            value={q.type}
                            onValueChange={(v: SurveyQuestionType) => updateQuestion(q.key, { type: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[300]">
                                {QUESTION_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t.replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2 sm:pt-6">
                          <Switch
                            checked={q.is_required}
                            onCheckedChange={(on) => updateQuestion(q.key, { is_required: on })}
                          />
                          <span className="text-sm">Required</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Question text</Label>
                        <Textarea
                          value={q.question_text}
                          onChange={(e) => updateQuestion(q.key, { question_text: e.target.value })}
                          rows={2}
                          placeholder="What do you want to ask?"
                        />
                      </div>

                      {q.type === 'rating' && (
                        <div className="flex gap-4">
                          <div className="space-y-1">
                            <Label className="text-xs">Min</Label>
                            <Input
                              type="number"
                              className="w-20"
                              value={q.options?.min ?? 1}
                              onChange={(e) =>
                                updateQuestion(q.key, {
                                  options: {
                                    ...(q.options ?? {}),
                                    min: Number(e.target.value),
                                    max: q.options?.max ?? 5,
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Max</Label>
                            <Input
                              type="number"
                              className="w-20"
                              value={q.options?.max ?? 5}
                              onChange={(e) => {
                                const raw = e.target.value
                                const max = raw === '' ? (q.options?.max ?? 5) : Number(raw)
                                const safeMax = Number.isFinite(max) ? max : (q.options?.max ?? 5)
                                updateQuestion(q.key, {
                                  options: {
                                    ...(q.options ?? {}),
                                    min: q.options?.min ?? 1,
                                    max: safeMax,
                                  },
                                })
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                        <DraftChoicesEditor
                          draftKey={q.key}
                          choices={q.options?.choices ?? []}
                          onChange={(choices) =>
                            updateQuestion(q.key, {
                              options: { ...(q.options ?? {}), choices },
                            })
                          }
                        />
                      )}

                      {q.type === 'text' && (
                        <div className="space-y-1">
                          <Label className="text-xs">Max length</Label>
                          <Input
                            type="number"
                            className="w-28"
                            min={1}
                            value={q.options?.max_length ?? 2000}
                            onChange={(e) => {
                              const raw = e.target.value
                              const n = raw === '' ? (q.options?.max_length ?? 2000) : Number(raw)
                              const safe =
                                Number.isFinite(n) && n > 0 ? Math.floor(n) : (q.options?.max_length ?? 2000)
                              updateQuestion(q.key, {
                                options: {
                                  ...(q.options ?? {}),
                                  max_length: safe,
                                },
                              })
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 pt-2 border-t border-border shrink-0">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => createMutation.mutate()}
                disabled={createMutation.isPending || !title.trim()}
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create survey'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Share your survey</DialogTitle>
              <DialogDescription>
                Copy the link or let others scan the QR code. Attendees open the same URL to respond.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 pb-4 space-y-4">
              <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start justify-between">
                <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
                  <QRCodeSVG value={shareUrl} size={160} level="M" includeMargin />
                </div>
                <div className="flex-1 min-w-0 space-y-2 w-full">
                  <Label className="text-xs text-muted-foreground">Public link</Label>
                  <p className="text-sm break-all font-mono bg-muted/50 rounded-md p-3 border border-border">
                    {shareUrl}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="default" size="sm" onClick={handleCopyLink}>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy link
                    </Button>
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                        <Link2 className="h-4 w-4 mr-2" />
                        Open
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="p-6 pt-0">
              <Button type="button" onClick={() => handleClose(false)}>
                Done
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function DraftChoicesEditor({
  draftKey,
  choices,
  onChange,
}: {
  draftKey: string
  choices: SurveyChoiceOption[]
  onChange: (c: SurveyChoiceOption[]) => void
}) {
  const rows = choices.length > 0 ? choices : [{ label: '', value: '' }]

  const sync = (next: SurveyChoiceOption[]) => onChange(next)

  return (
    <div className="space-y-2">
      <Label className="text-xs">Choices</Label>
      {rows.map((c, idx) => (
        <div key={`${draftKey}-choice-${idx}`} className="flex gap-2">
          <Input
            placeholder="Label"
            value={c.label}
            onChange={(e) => {
              const next = [...rows]
              next[idx] = { ...next[idx], label: e.target.value }
              sync(next)
            }}
          />
          <Input
            placeholder="Value"
            value={c.value}
            onChange={(e) => {
              const next = [...rows]
              next[idx] = { ...next[idx], value: e.target.value }
              sync(next)
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => sync(rows.filter((_, i) => i !== idx))}
          >
            ×
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() => sync([...rows, { label: '', value: '' }])}
      >
        Add choice
      </Button>
    </div>
  )
}
