import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  ClipboardList,
  Copy,
  Download,
  Inbox,
  Link2,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  Trash2,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { toast } from 'sonner'
import { surveyApi } from '@/lib/api/surveys'
import type {
  Survey,
  SurveyQuestion,
  SurveyQuestionType,
  SurveyTriggerType,
  SurveyChoiceOption,
  SurveyQuestionOptions,
  SurveyResponseRow,
} from '@/types/survey'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getPublicSiteURL } from '@/config/env'
import { buildPublicSurveyFrontendLink } from '@/lib/publicRegistrationLinks'
import NewSurveyDialog from '@/components/surveys/NewSurveyDialog'

interface EventSurveyPanelProps {
  eventId: number
}

const QUESTION_TYPES: SurveyQuestionType[] = [
  'rating',
  'nps',
  'multiple_choice',
  'checkbox',
  'text',
]

function triggerLabel(t: SurveyTriggerType): string {
  switch (t) {
    case 'instant':
      return 'After check-in'
    case 'post_event':
      return 'After event ends'
    case 'manual':
      return 'Manual link'
    default:
      return t
  }
}

const defaultOptions = (type: SurveyQuestionType): SurveyQuestionOptions | null => {
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

export default function EventSurveyPanel({ eventId }: EventSurveyPanelProps) {
  const qc = useQueryClient()
  const responsesSectionRef = useRef<HTMLDivElement>(null)
  const questionsSectionRef = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [newSurveyOpen, setNewSurveyOpen] = useState(false)
  const [shareTarget, setShareTarget] = useState<Survey | null>(null)

  const { data: surveys = [], isLoading } = useQuery({
    queryKey: ['surveys', eventId],
    queryFn: () => surveyApi.listForEvent(eventId),
    retry: false,
  })

  const selected = useMemo(
    () => surveys.find((s) => s.id === selectedId) ?? null,
    [surveys, selectedId],
  )

  useEffect(() => {
    if (surveys.length === 0) {
      setSelectedId(null)
      return
    }
    if (selectedId === null || !surveys.some((s) => s.id === selectedId)) {
      setSelectedId(surveys[0].id)
    }
  }, [surveys, selectedId])

  const deleteSurvey = useMutation({
    mutationFn: (id: number) => surveyApi.remove(id),
    onSuccess: () => {
      toast.success('Survey deleted')
      setSelectedId(null)
      qc.invalidateQueries({ queryKey: ['surveys', eventId] })
    },
    onError: () => toast.error('Could not delete survey'),
  })

  const addQuestion = useMutation({
    mutationFn: async () => {
      if (!selected) return
      const max = selected.questions?.length
        ? Math.max(...selected.questions.map((q) => q.order_index))
        : -1
      await surveyApi.addQuestion(selected.id, {
        type: 'rating',
        question_text: 'New question',
        is_required: true,
        options: defaultOptions('rating'),
        order_index: max + 1,
      })
    },
    onSuccess: () => {
      toast.success('Question added')
      qc.invalidateQueries({ queryKey: ['surveys', eventId] })
    },
    onError: () => toast.error('Could not add question'),
  })

  const saveQuestionPatch = async (q: SurveyQuestion, patch: Partial<SurveyQuestion>) => {
    await surveyApi.updateQuestion(q.id, {
      type: patch.type ?? q.type,
      question_text: patch.question_text ?? q.question_text,
      is_required: patch.is_required ?? q.is_required,
      options:
        patch.options !== undefined ? patch.options : patch.type ? defaultOptions(patch.type) : q.options,
    })
    qc.invalidateQueries({ queryKey: ['surveys', eventId] })
  }

  const removeQuestion = useMutation({
    mutationFn: (questionId: number) => surveyApi.deleteQuestion(questionId),
    onSuccess: () => {
      toast.success('Question removed')
      qc.invalidateQueries({ queryKey: ['surveys', eventId] })
    },
    onError: () => toast.error('Could not remove question'),
  })

  const moveQuestion = async (q: SurveyQuestion, dir: -1 | 1) => {
    if (!selected?.questions?.length) return
    const ordered = [...selected.questions].sort((a, b) => a.order_index - b.order_index)
    const i = ordered.findIndex((x) => x.id === q.id)
    const j = i + dir
    if (j < 0 || j >= ordered.length) return
    ;[ordered[i], ordered[j]] = [ordered[j], ordered[i]]
    await surveyApi.reorderQuestions(
      selected.id,
      ordered.map((x) => x.id),
    )
    qc.invalidateQueries({ queryKey: ['surveys', eventId] })
  }

  const shareDialogUrl = useMemo(() => {
    if (!shareTarget) return ''
    return (
      buildPublicSurveyFrontendLink({
        origin: getPublicSiteURL(),
        eventId,
        triggerType: shareTarget.trigger_type,
      }) ?? ''
    )
  }, [shareTarget, eventId])

  const copyToClipboard = useCallback(async (text: string, successMessage = 'Link copied') => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success(successMessage)
    } catch {
      toast.error('Could not copy link')
    }
  }, [])

  const scrollToQuestions = useCallback(() => {
    requestAnimationFrame(() => {
      questionsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const scrollToResponses = useCallback(() => {
    requestAnimationFrame(() => {
      responsesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [])

  const handleEditSurvey = useCallback(
    (s: Survey) => {
      setSelectedId(s.id)
      scrollToQuestions()
    },
    [scrollToQuestions],
  )

  const handleViewResponses = useCallback(
    (s: Survey) => {
      setSelectedId(s.id)
      scrollToResponses()
    },
    [scrollToResponses],
  )

  const handleDeleteSurvey = useCallback(
    (s: Survey) => {
      if (!confirm(`Delete “${s.title}” and all of its responses?`)) return
      deleteSurvey.mutate(s.id)
    },
    [deleteSurvey],
  )

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground p-6">Loading surveys…</div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            Event surveys
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Build feedback forms per event. Only one survey can be active at a time.
          </p>
        </div>
        <Button type="button" onClick={() => setNewSurveyOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New survey
        </Button>
      </div>

      <NewSurveyDialog
        eventId={eventId}
        open={newSurveyOpen}
        onOpenChange={setNewSurveyOpen}
        onCreated={(s) => {
          qc.invalidateQueries({ queryKey: ['surveys', eventId] })
          setSelectedId(s.id)
          scrollToQuestions()
        }}
      />

      <SurveyShareDialog
        open={shareTarget !== null}
        onOpenChange={(o) => {
          if (!o) setShareTarget(null)
        }}
        title={shareTarget?.title ?? ''}
        url={shareDialogUrl}
        onCopy={() => copyToClipboard(shareDialogUrl)}
      />

      {surveys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground text-sm">
            No surveys yet. Create one to collect attendee feedback.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[140px]">Survey</TableHead>
                  <TableHead className="hidden md:table-cell w-[140px]">When</TableHead>
                  <TableHead className="w-[88px]">Active</TableHead>
                  <TableHead className="text-right w-[1%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surveys.map((s) => (
                  <TableRow
                    key={s.id}
                    data-state={selectedId === s.id ? 'selected' : undefined}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(s.id)}
                  >
                    <TableCell className="font-medium max-w-[220px] md:max-w-md">
                      <div className="truncate" title={s.title}>
                        {s.title}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {triggerLabel(s.trigger_type)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? 'default' : 'secondary'}>
                        {s.is_active ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                    >
                      <div className="inline-flex flex-wrap justify-end gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleEditSurvey(s)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={() => handleViewResponses(s)}
                        >
                          <Inbox className="h-3.5 w-3.5 mr-1" />
                          Responses
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-8"
                          onClick={() => {
                            setSelectedId(s.id)
                            setShareTarget(s)
                          }}
                        >
                          <Share2 className="h-3.5 w-3.5 mr-1" />
                          Share
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-8 text-destructive border-destructive/40 hover:bg-destructive/10"
                          disabled={deleteSurvey.isPending}
                          onClick={() => handleDeleteSurvey(s)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {selected && (
            <>
              <Card ref={responsesSectionRef} className="border-border scroll-mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Responses</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Submissions for <span className="font-medium text-foreground">{selected.title}</span>
                  </p>
                </CardHeader>
                <CardContent>
                  <SurveyResponsesPanel
                    surveyId={selected.id}
                    surveyTitle={selected.title}
                    questions={selected.questions ?? []}
                  />
                </CardContent>
              </Card>

              <Card ref={questionsSectionRef} className="border-border scroll-mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Questions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Edit the form shown to attendees. Use Share in the table for links and QR codes.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-end">
                    <Button size="sm" variant="secondary" onClick={() => addQuestion.mutate()}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add question
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {(selected.questions ?? [])
                      .slice()
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((q) => (
                        <QuestionEditorCard
                          key={q.id}
                          question={q}
                          onPatch={(patch) => saveQuestionPatch(q, patch)}
                          onDelete={() => removeQuestion.mutate(q.id)}
                          onMoveUp={() => moveQuestion(q, -1)}
                          onMoveDown={() => moveQuestion(q, 1)}
                        />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  )
}

function SurveyShareDialog({
  open,
  onOpenChange,
  title,
  url,
  onCopy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  url: string
  onCopy: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share survey</DialogTitle>
          <DialogDescription>
            {title ? (
              <>
                <span className="font-medium text-foreground">“{title}”</span> — attendees open this link to
                respond.
              </>
            ) : (
              'Copy the link or share the QR code for attendees to respond.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
          <div className="rounded-xl border border-border bg-background p-3 shadow-sm shrink-0">
            {url ? (
              <QRCodeSVG value={url} size={160} level="M" includeMargin />
            ) : (
              <div className="w-[160px] h-[160px] flex items-center justify-center text-xs text-muted-foreground border rounded-lg">
                Set VITE_PUBLIC_URL to generate a link.
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-2 w-full">
            <Label className="text-xs text-muted-foreground">Public link</Label>
            <p className="text-sm break-all font-mono bg-muted/50 rounded-md p-3 border border-border">
              {url || '—'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={onCopy} disabled={!url}>
                <Copy className="h-4 w-4 mr-2" />
                Copy link
              </Button>
              {url ? (
                <Button type="button" variant="outline" size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Link2 className="h-4 w-4 mr-2" />
                    Open
                  </a>
                </Button>
              ) : (
                <Button type="button" variant="outline" size="sm" disabled>
                  <Link2 className="h-4 w-4 mr-2" />
                  Open
                </Button>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function QuestionEditorCard({
  question: q,
  onPatch,
  onDelete,
  onMoveUp,
  onMoveDown,
}: {
  question: SurveyQuestion
  onPatch: (patch: Partial<SurveyQuestion>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [choices, setChoices] = useState<SurveyChoiceOption[]>(
    () => q.options?.choices ?? [{ label: '', value: '' }],
  )

  useEffect(() => {
    setChoices(q.options?.choices ?? [{ label: '', value: '' }])
  }, [q.id, q.type, q.options])

  const syncChoices = (next: SurveyChoiceOption[]) => {
    setChoices(next)
    onPatch({ options: { ...q.options, choices: next } })
  }

  return (
    <Card className="border-muted">
      <CardContent className="pt-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-start justify-between">
          <div className="flex gap-1">
            <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={onMoveUp}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button type="button" size="icon" variant="outline" className="h-8 w-8" onClick={onMoveDown}>
              <ArrowDown className="h-4 w-4" />
            </Button>
          </div>
          <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs">Type</Label>
            <Select
              value={q.type}
              onValueChange={(type: SurveyQuestionType) =>
                onPatch({ type, options: defaultOptions(type) ?? q.options })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Switch
              checked={q.is_required}
              onCheckedChange={(on) => onPatch({ is_required: on })}
            />
            <span className="text-sm">Required</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Question</Label>
          <Textarea
            defaultValue={q.question_text}
            key={`qt-${q.id}`}
            rows={2}
            onBlur={(e) => {
              if (e.target.value !== q.question_text) {
                onPatch({ question_text: e.target.value })
              }
            }}
          />
        </div>

        {q.type === 'rating' && (
          <div className="flex gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Min</Label>
              <Input
                type="number"
                className="w-20"
                defaultValue={q.options?.min ?? 1}
                onBlur={(e) =>
                  onPatch({
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
                defaultValue={q.options?.max ?? 5}
                onBlur={(e) =>
                  onPatch({
                    options: {
                      ...(q.options ?? {}),
                      min: q.options?.min ?? 1,
                      max: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
        )}

        {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
          <div className="space-y-2">
            <Label className="text-xs">Choices</Label>
            {choices.map((c, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  placeholder="Label"
                  value={c.label}
                  onChange={(e) => {
                    const next = [...choices]
                    next[idx] = { ...next[idx], label: e.target.value }
                    syncChoices(next)
                  }}
                />
                <Input
                  placeholder="Value"
                  value={c.value}
                  onChange={(e) => {
                    const next = [...choices]
                    next[idx] = { ...next[idx], value: e.target.value }
                    syncChoices(next)
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => syncChoices(choices.filter((_, i) => i !== idx))}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => syncChoices([...choices, { label: '', value: '' }])}
            >
              Add choice
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function csvEscape(cell: string): string {
  if (/[",\n\r]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`
  return cell
}

type SurveyAnswerRow = NonNullable<SurveyResponseRow['answers']>[number]

function answerTextForDisplay(a: SurveyAnswerRow | undefined): string {
  if (!a) return '—'
  if (a.answer_text != null && a.answer_text !== '') return a.answer_text
  if (a.answer_value != null) return String(a.answer_value)
  return '—'
}

function answerTextForCsv(a: SurveyAnswerRow | undefined): string {
  if (!a) return ''
  if (a.answer_text != null && a.answer_text !== '') return a.answer_text
  if (a.answer_value != null) return String(a.answer_value)
  return ''
}

function buildResponsesCsv(rows: SurveyResponseRow[], orderedQuestions: SurveyQuestion[]): string {
  const qSorted = [...orderedQuestions].sort((a, b) => a.order_index - b.order_index)
  const headers = ['response_id', 'submitted_at', 'attendee_id', ...qSorted.map((q) => q.question_text)]
  const lines = [headers.map((h) => csvEscape(h)).join(',')]
  for (const r of rows) {
    const byQ = new Map((r.answers ?? []).map((an) => [an.question_id, an]))
    const cells = [
      csvEscape(String(r.id)),
      csvEscape(r.submitted_at),
      csvEscape(r.attendee_id != null ? String(r.attendee_id) : ''),
      ...qSorted.map((q) => csvEscape(answerTextForCsv(byQ.get(q.id)))),
    ]
    lines.push(cells.join(','))
  }
  return lines.join('\r\n')
}

function SurveyResponsesPanel({
  surveyId,
  surveyTitle,
  questions,
}: {
  surveyId: number
  surveyTitle: string
  questions: SurveyQuestion[]
}) {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const perPage = 20

  useEffect(() => {
    setPage(1)
  }, [surveyId])

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['survey-responses', surveyId, page, perPage],
    queryFn: () => surveyApi.getResponses(surveyId, page, perPage),
  })

  const rows = data?.data ?? []
  const total = data?.total ?? 0
  const lastPage = Math.max(1, data?.last_page ?? 1)
  const from = total === 0 ? 0 : (page - 1) * perPage + 1
  const to = total === 0 ? 0 : (page - 1) * perPage + rows.length

  const questionLabel = useMemo(() => {
    const m = new Map<number, string>()
    for (const q of questions) {
      m.set(q.id, q.question_text)
    }
    return m
  }, [questions])

  const downloadCsv = () => {
    if (!rows.length) {
      toast.error('Nothing to export on this page')
      return
    }
    const safeTitle = surveyTitle.replace(/[^\w\-]+/g, '_').slice(0, 60) || 'survey'
    const blob = new Blob([`\ufeff${buildResponsesCsv(rows, questions)}`], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safeTitle}-responses-p${page}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Download started')
  }

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['survey-responses', surveyId] })
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-6">Loading responses…</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {total === 0 ? (
            'No responses yet.'
          ) : (
            <>
              <span className="font-medium text-foreground">{total}</span> total · showing{' '}
              <span className="font-medium text-foreground">
                {from}–{to}
              </span>
              {isFetching ? <span className="ml-2 text-xs">(updating…)</span> : null}
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" onClick={refresh} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={downloadCsv} disabled={!rows.length}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Export page (CSV)
          </Button>
        </div>
      </div>

      {!rows.length ? null : (
        <>
          <div className="rounded-md border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] whitespace-nowrap">When</TableHead>
                  <TableHead className="w-[90px] hidden sm:table-cell">Attendee</TableHead>
                  <TableHead>Answers</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="align-top text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.submitted_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="align-top text-xs hidden sm:table-cell">
                      {r.attendee_id != null ? r.attendee_id : '—'}
                    </TableCell>
                    <TableCell className="align-top">
                      <ul className="space-y-1.5 text-sm">
                        {(r.answers ?? []).map((a) => (
                          <li key={a.id}>
                            <span className="font-medium text-foreground">
                              {questionLabel.get(a.question_id) ?? `Question ${a.question_id}`}:
                            </span>{' '}
                            <span className="text-muted-foreground">{answerTextForDisplay(a)}</span>
                          </li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              Page {page} of {lastPage}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page >= lastPage || isFetching}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
