import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowLeft,
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
    if (selectedId !== null && !surveys.some((s) => s.id === selectedId)) {
      setSelectedId(null)
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
    },
    [],
  )

  const handleViewResponses = useCallback(
    (s: Survey) => {
      setSelectedId(s.id)
    },
    [],
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

  if (selected) {
    return (
      <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setSelectedId(null)} className="h-9 w-9 p-0 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h2 className="text-xl font-bold tracking-tight">{selected.title}</h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <Badge variant="outline" className="text-[10px] uppercase font-bold py-0 h-4">
                  {triggerLabel(selected.trigger_type)}
                </Badge>
                {selected.is_active && (
                  <Badge className="bg-success/10 text-success border-success/20 text-[10px] uppercase font-bold py-0 h-4">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShareTarget(selected)}
              className="h-9"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        <SurveyShareDialog
          open={shareTarget !== null}
          onOpenChange={(o) => {
            if (!o) setShareTarget(null)
          }}
          title={shareTarget?.title ?? ''}
          url={shareDialogUrl}
          onCopy={() => copyToClipboard(shareDialogUrl)}
        />

        <div className="grid gap-6">
          <Card ref={responsesSectionRef} className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Responses</CardTitle>
              <p className="text-sm text-muted-foreground">
                Submissions for <span className="font-medium text-foreground">{selected.title}</span>
              </p>
            </CardHeader>
            <CardContent>
              <SurveyResponsesPanel survey={selected} />
            </CardContent>
          </Card>

          <Card ref={questionsSectionRef} className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Questions</CardTitle>
              <p className="text-sm text-muted-foreground">
                Edit the form shown to attendees. Use Share to get links and QR codes.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="flex justify-center pt-2">
                <Button size="sm" variant="secondary" onClick={() => addQuestion.mutate()}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add question
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const activeSurveys = surveys.filter(s => s.is_active).length

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Tab Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center border border-border shadow-sm">
            <ClipboardList className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Event Surveys</h1>
            <p className="text-sm text-muted-foreground">
              Build and manage feedback forms for your event.
            </p>
          </div>
        </div>
        <Button type="button" onClick={() => setNewSurveyOpen(true)} className="w-full md:w-auto shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          New survey
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Surveys</p>
              <ClipboardList className="h-4 w-4 text-primary opacity-70" />
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold">{surveys.length}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Active Surveys</p>
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold">{activeSurveys}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Lotto Rewards</p>
              <div className="text-[10px] font-bold text-amber-500 border border-amber-500/30 px-1 rounded">ON</div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-bold">{surveys.filter(s => s.is_lotto_enabled).length}</h3>
            </div>
          </CardContent>
        </Card>
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
        <Card className="border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 border-b border-border">
                  <TableHead className="font-semibold text-foreground text-xs uppercase py-4 min-w-[200px]">Survey Details</TableHead>
                  <TableHead className="hidden md:table-cell font-semibold text-foreground text-xs uppercase py-4 w-[160px]">Trigger</TableHead>
                  <TableHead className="font-semibold text-foreground text-xs uppercase py-4 w-[100px]">Status</TableHead>
                  <TableHead className="text-right font-semibold text-foreground text-xs uppercase py-4 w-[120px]">Actions</TableHead>
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
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                          {s.title.charAt(0).toUpperCase()}
                        </div>
                        <div className="max-w-[220px] md:max-w-md">
                          <div className="font-semibold text-foreground truncate" title={s.title}>
                            {s.title}
                          </div>
                          {s.is_lotto_enabled && (
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-tight mt-0.5">
                              Lotto Entry Enabled
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-4">
                      <div className="text-sm text-muted-foreground">
                        {triggerLabel(s.trigger_type)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant={s.is_active ? 'default' : 'secondary'} className={s.is_active ? 'bg-success/10 text-success border-success/20 hover:bg-success/20' : ''}>
                        {s.is_active ? 'Active' : 'Inactive'}
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
          </div>
        </Card>
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
      <DialogContent className="w-[95vw] max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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
  onPatch: (patch: Partial<SurveyQuestion>) => Promise<void>
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) {
  const [type, setType] = useState<SurveyQuestionType>(q.type)
  const [questionText, setQuestionText] = useState(q.question_text)
  const [isRequired, setIsRequired] = useState(q.is_required)
  const [options, setOptions] = useState<SurveyQuestionOptions | null>(q.options)
  const [choices, setChoices] = useState<SurveyChoiceOption[]>(
    () => q.options?.choices ?? [{ label: '', value: '' }],
  )

  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setType(q.type)
    setQuestionText(q.question_text)
    setIsRequired(q.is_required)
    setOptions(q.options)
    setChoices(q.options?.choices ?? [{ label: '', value: '' }])
    setIsDirty(false)
  }, [q])

  const handleSave = async () => {
    setIsSaving(true)
    const patchOpts = { ...options }
    if (type === 'multiple_choice' || type === 'checkbox') {
      patchOpts.choices = choices
    }
    await onPatch({
      type,
      question_text: questionText,
      is_required: isRequired,
      options: patchOpts,
    })
    setIsSaving(false)
    setIsDirty(false)
    toast.success('Question saved')
  }

  const handleTypeChange = (newType: SurveyQuestionType) => {
    setType(newType)
    setOptions(defaultOptions(newType) ?? q.options)
    setIsDirty(true)
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
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 mt-6">
            <Switch
              checked={isRequired}
              onCheckedChange={(on) => {
                setIsRequired(on)
                setIsDirty(true)
              }}
            />
            <span className="text-sm">Required</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Question</Label>
          <Textarea
            value={questionText}
            rows={2}
            onChange={(e) => {
              setQuestionText(e.target.value)
              setIsDirty(true)
            }}
          />
        </div>

        {type === 'rating' && (
          <div className="flex gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Min</Label>
              <Input
                type="number"
                className="w-20"
                value={options?.min ?? 1}
                onChange={(e) => {
                  setOptions({ ...(options ?? {}), min: Number(e.target.value) })
                  setIsDirty(true)
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max</Label>
              <Input
                type="number"
                className="w-20"
                value={options?.max ?? 5}
                onChange={(e) => {
                  setOptions({ ...(options ?? {}), max: Number(e.target.value) })
                  setIsDirty(true)
                }}
              />
            </div>
          </div>
        )}

        {(type === 'multiple_choice' || type === 'checkbox') && (
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
                    setChoices(next)
                    setIsDirty(true)
                  }}
                />
                <Input
                  placeholder="Value"
                  value={c.value}
                  onChange={(e) => {
                    const next = [...choices]
                    next[idx] = { ...next[idx], value: e.target.value }
                    setChoices(next)
                    setIsDirty(true)
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setChoices(choices.filter((_, i) => i !== idx))
                    setIsDirty(true)
                  }}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                setChoices([...choices, { label: '', value: '' }])
                setIsDirty(true)
              }}
            >
              Add choice
            </Button>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t mt-4 border-border/50">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            variant={isDirty ? 'default' : 'secondary'}
          >
            {isSaving ? 'Saving…' : isDirty ? 'Save question' : 'Saved'}
          </Button>
        </div>
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

function buildResponsesCsv(rows: SurveyResponseRow[], questions: SurveyQuestion[]) {
  const header = ['Submitted At', 'Respondent Name', 'Respondent Phone', 'Lotto', ...questions.map((q) => q.question_text)]
  const lines = [header.map(csvEscape).join(',')]

  rows.forEach((r) => {
    const byQ = new Map((r.answers ?? []).map((an) => [an.question_id, an]))
    const row = [
      csvEscape(new Date(r.submitted_at).toLocaleString()),
      csvEscape(r.respondent_name || ''),
      csvEscape(r.respondent_phone || ''),
      csvEscape(r.lotto_number || ''),
      ...questions.map((q) => csvEscape(answerTextForCsv(byQ.get(q.id)))),
    ]
    lines.push(row.join(','))
  })
  return lines.join('\r\n')
}

function SurveyResponsesPanel({
  survey,
}: {
  survey: Survey
}) {
  const surveyId = survey.id
  const surveyTitle = survey.title
  const questions = survey.questions ?? []
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

  const downloadLottoCsv = async () => {
    try {
      const blob = await surveyApi.downloadLottoNumbers(surveyId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lotto-numbers-${surveyId}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Lotto numbers downloaded')
    } catch (e) {
      toast.error('Could not download lotto numbers')
    }
  }

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['survey-responses', surveyId] })
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground py-6">Loading responses…</p>
  }

  const hasAnyLotto = rows.some((r) => !!r.lotto_number) || !!survey.is_lotto_enabled

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
          {hasAnyLotto && (
            <Button type="button" size="sm" variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20" onClick={downloadLottoCsv}>
              <Download className="h-3.5 w-3.5 mr-1.5" />
              Lotto List
            </Button>
          )}
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
                  <TableHead className="w-[180px] hidden sm:table-cell">Respondent</TableHead>
                  {hasAnyLotto && <TableHead className="w-[100px]">Lotto</TableHead>}
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
                      <div className="font-medium text-foreground">{r.respondent_name || 'Anonymous'}</div>
                      <div className="text-muted-foreground mt-0.5">{r.respondent_phone || '—'}</div>
                    </TableCell>
                    {hasAnyLotto && (
                      <TableCell className="align-top text-xs font-mono font-medium">
                        {r.lotto_number || '—'}
                      </TableCell>
                    )}
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
