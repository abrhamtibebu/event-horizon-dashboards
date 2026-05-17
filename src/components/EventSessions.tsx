import React, { useMemo, useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import api, { getEventSessions, createEventSession, updateSession, deleteSession, createSessionAttendance, updateSessionAttendance, getSessionById, cancelSession } from '@/lib/api'
import { Switch } from '@/components/ui/switch'
import { Mic, Plus, Calendar, MapPin, Trash2, UserRound, XCircle, CheckCircle2, Lock, Globe, Upload, UserCheck, Users, Pencil, Download } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar as UiCalendar } from '@/components/ui/calendar'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import SessionUsherAssignmentDialog from '@/components/SessionUsherAssignmentDialog'

interface EventSessionsProps {
  eventId: number | string
  eventStart?: string
  eventEnd?: string
}

type SpeakerDraft = {
  speaker_name: string
  speaker_title: string
  speaker_company: string
  speaker_bio: string
  speaker_email: string
  speaker_phone: string
  is_primary_speaker: boolean
}

function emptySpeaker(): SpeakerDraft {
  return {
    speaker_name: '',
    speaker_title: '',
    speaker_company: '',
    speaker_bio: '',
    speaker_email: '',
    speaker_phone: '',
    is_primary_speaker: false,
  }
}

function speakersPayload(rows: SpeakerDraft[]) {
  return rows
    .filter((s) => s.speaker_name.trim())
    .map((s) => ({
      speaker_name: s.speaker_name.trim(),
      speaker_title: s.speaker_title.trim() || undefined,
      speaker_company: s.speaker_company.trim() || undefined,
      speaker_bio: s.speaker_bio.trim() || undefined,
      speaker_email: s.speaker_email.trim() || undefined,
      speaker_phone: s.speaker_phone.trim() || undefined,
      is_primary_speaker: Boolean(s.is_primary_speaker),
    }))
}

function mapApiSpeaker(sp: Record<string, unknown>): SpeakerDraft {
  return {
    speaker_name: typeof sp.speaker_name === 'string' ? sp.speaker_name : '',
    speaker_title: typeof sp.speaker_title === 'string' ? sp.speaker_title : '',
    speaker_company: typeof sp.speaker_company === 'string' ? sp.speaker_company : '',
    speaker_bio: typeof sp.speaker_bio === 'string' ? sp.speaker_bio : '',
    speaker_email: typeof sp.speaker_email === 'string' ? sp.speaker_email : '',
    speaker_phone: typeof sp.speaker_phone === 'string' ? sp.speaker_phone : '',
    is_primary_speaker: Boolean(sp.is_primary_speaker),
  }
}

export default function EventSessions({ eventId, eventStart, eventEnd }: EventSessionsProps) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    session_type: 'seminar',
    start_time: '',
    end_time: '',
    location: '',
    max_capacity: '',
    status: 'scheduled',
    access_type: 'public',
    speakers: [emptySpeaker()] as SpeakerDraft[],
  })
  const [editingId, setEditingId] = useState<number | null>(null)

  // CSV Import State
  const [importingSessionId, setImportingSessionId] = useState<number | null>(null)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const [authError, setAuthError] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['event-sessions', eventId],
    queryFn: async () => {
      try {
        const r = await getEventSessions(Number(eventId))
        setAuthError(false)
        return r.data
      } catch (err: any) {
        if (err?.response?.status === 401) {
          setAuthError(true)
          return { data: [] }
        }
        throw err
      }
    },
    refetchInterval: 10000, // Poll every 10 seconds for live attendance updates
  })

  const sessions = useMemo(() => (data?.data ?? []) as any[], [data])

  const createMutation = useMutation({
    mutationFn: (payload: any) => createEventSession(Number(eventId), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-sessions', eventId] })
      setOpen(false)
      setForm({
        name: '',
        session_type: 'seminar',
        start_time: '',
        end_time: '',
        location: '',
        max_capacity: '',
        status: 'scheduled',
        access_type: 'public',
        speakers: [emptySpeaker()],
      })
      setEditingId(null)
      setFormErrors({})
      toast.success('Session created')
    },
    onError: (err: any) => {
      if (err?.response?.status === 401) {
        toast.error('Please sign in to create sessions')
      } else {
        const errors = err?.response?.data?.errors
        if (errors) setFormErrors(errors)
        toast.error(err?.response?.data?.message || 'Failed to create session')
      }
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => updateSession(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-sessions', eventId] })
      setOpen(false)
      setForm({
        name: '',
        session_type: 'seminar',
        start_time: '',
        end_time: '',
        location: '',
        max_capacity: '',
        status: 'scheduled',
        access_type: 'public',
        speakers: [emptySpeaker()],
      })
      setEditingId(null)
      setFormErrors({})
      toast.success('Session updated')
    },
    onError: (err: any) => {
      const errors = err?.response?.data?.errors
      if (errors) setFormErrors(errors)
      toast.error(err?.response?.data?.message || 'Failed to update session')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (sessionId: number) => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-sessions', eventId] })
    },
    onError: () => toast.error('Failed to delete session')
  })

  // Attendance management state
  const [attendanceOpen, setAttendanceOpen] = useState(false)
  const [attendanceSession, setAttendanceSession] = useState<any | null>(null)
  const [usherDialogOpen, setUsherDialogOpen] = useState(false)
  const [usherSessionId, setUsherSessionId] = useState<number | null>(null)
  const [currentEventId] = useState<number>(() => Number(eventId))
  const [attendees, setAttendees] = useState<any[]>([])
  const [attendancesByAttendeeId, setAttendancesByAttendeeId] = useState<Record<number, any>>({})
  const [attendanceLoading, setAttendanceLoading] = useState(false)

  // Helpers for time handling
  const getHHMM = (iso: string) => (iso ? new Date(iso).toISOString().slice(11, 16) : '')
  const setTimeOnDate = (base: Date, hhmm: string) => {
    const [hh, mm] = hhmm.split(':').map(Number)
    const d = new Date(base)
    d.setHours(hh || 0, mm || 0, 0, 0)
    return d
  }
  const addHours = (base: Date, hours: number) => {
    const d = new Date(base)
    d.setHours(d.getHours() + hours)
    return d
  }
  const sameYMD = (a?: Date, b?: Date) => {
    if (!a || !b) return false
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  }


  const openAttendance = async (session: any) => {
    setAttendanceOpen(true)
    setAttendanceSession(session)
    setAttendanceLoading(true)
    try {
      // Load event attendees with guest_type relation included
      const attendeesRes = await api.get(`/events/${Number(eventId)}/attendees`, {
        params: { per_page: 500, include: 'guest,guest_type' },
      })
      const raw = attendeesRes.data as { data?: unknown[] } | unknown[]
      const list = Array.isArray(raw) ? raw : raw?.data ?? []
      setAttendees(Array.isArray(list) ? list : [])
      // Load session attendances with attendee
      const sess = await getSessionById(Number(session.id)).then(r => r.data?.data || r.data)
      const map: Record<number, any> = {}
      ;(sess?.attendances || []).forEach((a: any) => {
        if (a.attendee_id) {
          map[a.attendee_id] = a
        }
      })
      setAttendancesByAttendeeId(map)
    } finally {
      setAttendanceLoading(false)
    }
  }

  const toggleAttendance = async (attendee: any, present: boolean) => {
    if (!attendanceSession) return
    const existing = attendancesByAttendeeId[attendee.id]
    try {
      if (present) {
        if (existing) {
          const updated = await updateSessionAttendance(attendanceSession.id, existing.id, {
            attendance_status: 'present',
            check_in_time: existing.check_in_time || new Date().toISOString(),
          })
          setAttendancesByAttendeeId((prev) => ({
            ...prev,
            [attendee.id]: updated.data?.data || updated.data,
          }))
        } else {
          const created = await createSessionAttendance(attendanceSession.id, {
            attendee_id: attendee.id,
            attendance_status: 'present',
            check_in_time: new Date().toISOString(),
          })
          const rec = created.data?.data || created.data
          setAttendancesByAttendeeId((prev) => ({ ...prev, [attendee.id]: rec }))
        }
      } else if (existing) {
        const updated = await updateSessionAttendance(attendanceSession.id, existing.id, {
          attendance_status: 'absent',
          check_out_time: new Date().toISOString(),
        })
        setAttendancesByAttendeeId((prev) => ({
          ...prev,
          [attendee.id]: updated.data?.data || updated.data,
        }))
      }
      queryClient.invalidateQueries({ queryKey: ['event-sessions', eventId] })
    } catch (e: unknown) {
      console.error(e)
      toast.error('Could not update attendance')
    }
  }

  const formatConciseDateTime = (iso?: string) => {
    if (!iso) return '';
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  // Modern time picker helpers
  const getHourValue = (isoString?: string) => {
    if (!isoString) return '12';
    const date = new Date(isoString);
    let h = date.getHours();
    if (h === 0) return '12';
    if (h > 12) h -= 12;
    return String(h);
  }

  const getMinuteValue = (isoString?: string) => {
    if (!isoString) return '00';
    const date = new Date(isoString);
    const m = Math.round(date.getMinutes() / 5) * 5;
    return String(m === 60 ? 55 : m).padStart(2, '0');
  }

  const getAmpmValue = (isoString?: string) => {
    if (!isoString) return 'AM';
    const date = new Date(isoString);
    return date.getHours() >= 12 ? 'PM' : 'AM';
  }

  const updateTimeValue = (type: 'start' | 'end', hour: string, minute: string, ampm: string) => {
    const currentISO = type === 'start' ? form.start_time : form.end_time;
    const baseDate = currentISO ? new Date(currentISO) : new Date();
    
    let h = parseInt(hour, 10);
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    
    const m = parseInt(minute, 10);
    baseDate.setHours(h, m, 0, 0);

    if (type === 'start') {
      const nextISO = baseDate.toISOString();
      let endISO = form.end_time;
      if (!endISO || new Date(endISO) <= baseDate) {
        endISO = addHours(baseDate, 1).toISOString();
      }
      setForm(prev => ({ ...prev, start_time: nextISO, end_time: endISO }));
    } else {
      const nextISO = baseDate.toISOString();
      const start = form.start_time ? new Date(form.start_time) : undefined;
      if (start && baseDate <= start) {
        toast.warning('End time must be after start time');
        const fixed = addHours(start, 1);
        setForm(prev => ({ ...prev, end_time: fixed.toISOString() }));
      } else {
        setForm(prev => ({ ...prev, end_time: nextISO }));
      }
    }
  }

  const handleDownloadSampleCSV = () => {
    const csvContent = "name,email,phone\n" +
      "Almaz Yosef,almaz.yosef@example.com,+251911123456\n" +
      "Bekele Abebe,bekele.abebe@example.com,+251912234567\n" +
      "Tadesse Lemesa,tadesse.lemesa@example.com,+251913345678\n" +
      "Marta Gidey,marta.gidey@example.com,+251914456789\n" +
      "Yonas Kassa,yonas.kassa@example.com,+251915567890\n";
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'session-guests-sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sessionNeedsSpeakers = (t: string) => t === 'seminar' || t === 'panel_discussion'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Sessions</h3>
          <p className="text-sm text-muted-foreground">Manage seminars, panels, and more</p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null)
            setForm({
              name: '',
              session_type: 'seminar',
              start_time: '',
              end_time: '',
              location: '',
              max_capacity: '',
              status: 'scheduled',
              access_type: 'public',
              speakers: [emptySpeaker()],
            })
            setFormErrors({})
            setOpen(true)
          }}
          disabled={authError}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Session
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Scheduled Sessions</CardTitle>
          <CardDescription>All sessions for this event</CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogContent className="sm:max-w-md w-[95vw]">
              <DialogHeader>
                <DialogTitle>Import Session Guests</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to import guests and register them for this private session.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="space-y-0.5">
                    <span className="text-sm font-semibold">Need a template?</span>
                  </div>
                  <Button size="sm" variant="outline" onClick={handleDownloadSampleCSV} className="shrink-0">
                    <Download className="h-4 w-4 mr-1.5" />
                    Sample CSV
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select CSV File</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Input 
                        type="file" 
                        accept=".csv,.txt"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setSelectedFile(file);
                        }}
                        className="cursor-pointer"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Your CSV must include an <strong className="text-foreground">email</strong> column. Columns for <strong className="text-foreground">name</strong> and <strong className="text-foreground">phone</strong> are optional.
                  </p>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0 mt-2">
                <Button variant="outline" onClick={() => { setImportDialogOpen(false); setSelectedFile(null); }}>
                  Cancel
                </Button>
                <Button 
                  disabled={!selectedFile || uploading} 
                  onClick={async () => {
                    if (!selectedFile || !importingSessionId) return;
                    setUploading(true);
                    const formData = new FormData();
                    formData.append('file', selectedFile);
                    
                    toast.promise(
                      api.post(`/sessions/${importingSessionId}/guests/import`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      }),
                      {
                        loading: 'Importing guests and sending emails...',
                        success: (res) => {
                          setImportDialogOpen(false);
                          setSelectedFile(null);
                          queryClient.invalidateQueries({ queryKey: ['event-sessions', eventId] });
                          return res.data?.message || 'Guests imported successfully!';
                        },
                        error: (err) => {
                          return err.response?.data?.error || 'Failed to import guests';
                        }
                      }
                    );
                    setUploading(false);
                  }}
                >
                  {uploading ? 'Uploading...' : 'Import Guests'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {authError && (
            <div className="mb-4">
              <Badge variant="secondary" className="text-red-700 bg-red-50 border border-red-200">Authentication required</Badge>
              <div className="text-sm text-red-700 mt-2">Please sign in to view and manage sessions.</div>
            </div>
          )}
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No sessions yet</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {s.access_type === 'private' ? <Lock className="w-3.5 h-3.5 text-muted-foreground" /> : <Globe className="w-3.5 h-3.5 text-muted-foreground" />}
                          {s.name}
                        </div>
                        {Array.isArray(s.speakers) && s.speakers.length > 0 ? (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {s.speakers.length} speaker{s.speakers.length !== 1 ? 's' : ''}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="capitalize">{String(s.session_type).replace('_',' ')}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(s.start_time).toLocaleString()} - {new Date(s.end_time).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {s.location || '—'}
                        </div>
                      </TableCell>
                      <TableCell>{s.max_capacity ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {s.access_type === 'private' && (
                            <Button
                              variant="outline"
                              size="icon"
                              title="Import Guests"
                              className="h-8 w-8 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-800"
                              onClick={() => {
                                setImportingSessionId(s.id);
                                setImportDialogOpen(true);
                              }}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="icon"
                            title="Attendance"
                            className="h-8 w-8"
                            onClick={() => openAttendance(s)}
                          >
                            <UserCheck className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title="Assign Ushers"
                            className="h-8 w-8"
                            onClick={() => { setUsherSessionId(s.id); setUsherDialogOpen(true) }}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            title="Edit Session"
                            className="h-8 w-8"
                            onClick={() => {
                              setEditingId(s.id)
                              const st = s.session_type || 'seminar'
                              const spk = Array.isArray(s.speakers) && s.speakers.length > 0
                                ? s.speakers.map((sp: Record<string, unknown>) => mapApiSpeaker(sp))
                                : sessionNeedsSpeakers(st)
                                  ? [emptySpeaker()]
                                  : []
                              setForm({
                                name: s.name || '',
                                session_type: st,
                                start_time: s.start_time ? new Date(s.start_time).toISOString() : '',
                                end_time: s.end_time ? new Date(s.end_time).toISOString() : '',
                                location: s.location || '',
                                max_capacity: s.max_capacity?.toString?.() || '',
                                status: s.status || 'scheduled',
                                access_type: s.access_type || 'public',
                                speakers: spk,
                              })
                              setOpen(true)
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            title="Cancel Session"
                            className="h-8 w-8"
                            onClick={async () => { await cancelSession(s.id); queryClient.invalidateQueries({ queryKey: ['event-sessions', eventId] }) }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="icon"
                            title="Delete Session"
                            className="h-8 w-8"
                            onClick={() => deleteMutation.mutate(s.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditingId(null) } }}>
        <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Session' : 'Create Session'}</DialogTitle>
            <DialogDescription>{editingId ? 'Update the session details' : 'Define a new session for this event'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            {formErrors.name && <div className="text-xs text-red-600">{formErrors.name}</div>}
            <Select
              value={form.session_type}
              onValueChange={(v) =>
                setForm((prev) => {
                  const next = { ...prev, session_type: v }
                  if ((v === 'seminar' || v === 'panel_discussion') && prev.speakers.length === 0) {
                    next.speakers = [emptySpeaker()]
                  }
                  return next
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="seminar">Seminar</SelectItem>
                <SelectItem value="panel_discussion">Panel Discussion</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="keynote">Keynote</SelectItem>
                <SelectItem value="networking">Networking</SelectItem>
                <SelectItem value="break">Break</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-4 py-2 border rounded-md px-3 bg-muted/20">
              <div className="flex-1">
                <Label className="text-sm font-semibold">Private Session</Label>
                <p className="text-xs text-muted-foreground">Require attendees to be on a guest list. You can import CSV guests after creating.</p>
              </div>
              <Switch 
                checked={form.access_type === 'private'} 
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, access_type: checked ? 'private' : 'public' }))} 
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start w-full text-left font-normal truncate">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{form.start_time ? formatConciseDateTime(form.start_time) : 'Select start'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-[95vw] p-0" align="start" side="bottom" sideOffset={4} avoidCollisions>
                  <div className="p-3 space-y-3">
                    <UiCalendar
                      mode="single"
                      selected={form.start_time ? new Date(form.start_time) : undefined}
                      disabled={(date) => {
                        const start = eventStart ? new Date(new Date(eventStart).setHours(0,0,0,0)) : null;
                        const end = eventEnd ? new Date(new Date(eventEnd).setHours(23,59,59,999)) : null;
                        if (start && date < start) return true;
                        if (end && date > end) return true;
                        return false;
                      }}
                      onSelect={(d: any) => {
                        if (!d) return
                        const prev = form.start_time ? new Date(form.start_time) : new Date()
                        const next = new Date(d)
                        next.setHours(prev.getHours(), prev.getMinutes())
                        const nextISO = next.toISOString()
                        // If end missing or <= start, default end to +1h
                        let endISO = form.end_time
                        if (!endISO || new Date(endISO) <= next) {
                          endISO = addHours(next, 1).toISOString()
                        }
                        setForm({ ...form, start_time: nextISO, end_time: endISO })
                      }}
                    />
                    <div className="flex items-center gap-1.5 border-t pt-2 justify-center bg-muted/10">
                      <Label className="text-xs font-medium text-muted-foreground mr-1">Time</Label>
                      <Select 
                        value={getHourValue(form.start_time)} 
                        onValueChange={(h) => updateTimeValue('start', h, getMinuteValue(form.start_time), getAmpmValue(form.start_time))}
                      >
                        <SelectTrigger className="w-[58px] h-7 text-xs px-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }).map((_, i) => (
                            <SelectItem key={i+1} value={String(i+1)}>{i+1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground text-xs">:</span>
                      <Select 
                        value={getMinuteValue(form.start_time)} 
                        onValueChange={(m) => updateTimeValue('start', getHourValue(form.start_time), m, getAmpmValue(form.start_time))}
                      >
                        <SelectTrigger className="w-[58px] h-7 text-xs px-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }).map((_, i) => {
                            const val = String(i * 5).padStart(2, '0');
                            return <SelectItem key={val} value={val}>{val}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                      <Select 
                        value={getAmpmValue(form.start_time)} 
                        onValueChange={(ampm) => updateTimeValue('start', getHourValue(form.start_time), getMinuteValue(form.start_time), ampm)}
                      >
                        <SelectTrigger className="w-[58px] h-7 text-xs px-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start w-full text-left font-normal truncate">
                    <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{form.end_time ? formatConciseDateTime(form.end_time) : 'Select end'}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-[95vw] p-0" align="start" side="bottom" sideOffset={4} avoidCollisions>
                  <div className="p-3 space-y-3">
                    <UiCalendar
                      mode="single"
                      selected={form.end_time ? new Date(form.end_time) : undefined}
                      disabled={(date) => {
                        const start = eventStart ? new Date(new Date(eventStart).setHours(0,0,0,0)) : null;
                        const end = eventEnd ? new Date(new Date(eventEnd).setHours(23,59,59,999)) : null;
                        if (start && date < start) return true;
                        if (end && date > end) return true;
                        return false;
                      }}
                      onSelect={(d: any) => {
                        if (!d) return
                        const prev = form.end_time ? new Date(form.end_time) : (form.start_time ? new Date(form.start_time) : new Date())
                        const next = new Date(d)
                        next.setHours(prev.getHours(), prev.getMinutes())
                        // Ensure end > start
                        const start = form.start_time ? new Date(form.start_time) : undefined
                        let nextISO = next.toISOString()
                        if (start && next <= start) {
                          nextISO = addHours(start, 1).toISOString()
                        }
                        setForm({ ...form, end_time: nextISO })
                      }}
                    />
                    <div className="flex items-center gap-1.5 border-t pt-2 justify-center bg-muted/10">
                      <Label className="text-xs font-medium text-muted-foreground mr-1">Time</Label>
                      <Select 
                        value={getHourValue(form.end_time)} 
                        onValueChange={(h) => updateTimeValue('end', h, getMinuteValue(form.end_time), getAmpmValue(form.end_time))}
                      >
                        <SelectTrigger className="w-[58px] h-7 text-xs px-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }).map((_, i) => (
                            <SelectItem key={i+1} value={String(i+1)}>{i+1}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-muted-foreground text-xs">:</span>
                      <Select 
                        value={getMinuteValue(form.end_time)} 
                        onValueChange={(m) => updateTimeValue('end', getHourValue(form.end_time), m, getAmpmValue(form.end_time))}
                      >
                        <SelectTrigger className="w-[58px] h-7 text-xs px-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }).map((_, i) => {
                            const val = String(i * 5).padStart(2, '0');
                            return <SelectItem key={val} value={val}>{val}</SelectItem>;
                          })}
                        </SelectContent>
                      </Select>
                      <Select 
                        value={getAmpmValue(form.end_time)} 
                        onValueChange={(ampm) => updateTimeValue('end', getHourValue(form.end_time), getMinuteValue(form.end_time), ampm)}
                      >
                        <SelectTrigger className="w-[58px] h-7 text-xs px-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AM">AM</SelectItem>
                          <SelectItem value="PM">PM</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => {
                        const start = form.start_time ? new Date(form.start_time) : new Date()
                        setForm({ ...form, end_time: addHours(start, 1).toISOString() })
                      }}>+1h</Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        const start = form.start_time ? new Date(form.start_time) : new Date()
                        setForm({ ...form, end_time: addHours(start, 2).toISOString() })
                      }}>+2h</Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        const start = form.start_time ? new Date(form.start_time) : new Date()
                        setForm({ ...form, end_time: addHours(start, 3).toISOString() })
                      }}>+3h</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            {formErrors.start_time && <div className="text-xs text-red-600">{formErrors.start_time}</div>}
            {formErrors.end_time && <div className="text-xs text-red-600">{formErrors.end_time}</div>}
            <Input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
            <Input placeholder="Max capacity" value={form.max_capacity} onChange={e => setForm({ ...form, max_capacity: e.target.value })} />
            {sessionNeedsSpeakers(form.session_type) && (
              <div className="space-y-3 rounded-lg border border-border p-3 bg-muted/20">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Mic className="h-4 w-4" />
                  Speakers
                </div>
                <p className="text-xs text-muted-foreground">
                  Add one or more speakers for this {form.session_type === 'panel_discussion' ? 'panel' : 'seminar'}.
                </p>
                {form.speakers.map((row, idx) => (
                  <div key={idx} className="space-y-2 rounded-md border border-border/60 bg-background p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <UserRound className="h-3.5 w-3.5" />
                        Speaker {idx + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground">Primary</Label>
                        <Switch
                          checked={row.is_primary_speaker}
                          onCheckedChange={(on) => {
                            setForm((prev) => ({
                              ...prev,
                              speakers: prev.speakers.map((s, i) =>
                                i === idx
                                  ? { ...s, is_primary_speaker: on }
                                  : { ...s, is_primary_speaker: on ? false : s.is_primary_speaker },
                              ),
                            }))
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            setForm((prev) => ({
                              ...prev,
                              speakers: prev.speakers.filter((_, i) => i !== idx),
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      placeholder="Name *"
                      value={row.speaker_name}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          speakers: prev.speakers.map((s, i) =>
                            i === idx ? { ...s, speaker_name: e.target.value } : s,
                          ),
                        }))
                      }
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        placeholder="Title"
                        value={row.speaker_title}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            speakers: prev.speakers.map((s, i) =>
                              i === idx ? { ...s, speaker_title: e.target.value } : s,
                            ),
                          }))
                        }
                      />
                      <Input
                        placeholder="Company"
                        value={row.speaker_company}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            speakers: prev.speakers.map((s, i) =>
                              i === idx ? { ...s, speaker_company: e.target.value } : s,
                            ),
                          }))
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        placeholder="Email"
                        type="email"
                        value={row.speaker_email}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            speakers: prev.speakers.map((s, i) =>
                              i === idx ? { ...s, speaker_email: e.target.value } : s,
                            ),
                          }))
                        }
                      />
                      <Input
                        placeholder="Phone"
                        value={row.speaker_phone}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            speakers: prev.speakers.map((s, i) =>
                              i === idx ? { ...s, speaker_phone: e.target.value } : s,
                            ),
                          }))
                        }
                      />
                    </div>
                    <Textarea
                      placeholder="Bio (optional)"
                      rows={2}
                      value={row.speaker_bio}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          speakers: prev.speakers.map((s, i) =>
                            i === idx ? { ...s, speaker_bio: e.target.value } : s,
                          ),
                        }))
                      }
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForm((prev) => ({ ...prev, speakers: [...prev.speakers, emptySpeaker()] }))}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add speaker
                </Button>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              {editingId ? (
                <Button
                  onClick={() => {
                    const base = {
                      name: form.name,
                      session_type: form.session_type,
                      start_time: form.start_time,
                      end_time: form.end_time,
                      location: form.location || null,
                      max_capacity: form.max_capacity ? Number(form.max_capacity) : null,
                      access_type: form.access_type,
                    }
                    const payload =
                      sessionNeedsSpeakers(form.session_type)
                        ? { ...base, speakers: speakersPayload(form.speakers) }
                        : base
                    updateMutation.mutate({ id: editingId, payload })
                  }}
                  disabled={updateMutation.isPending || !form.name || !form.start_time || !form.end_time}
                >
                  Save
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    const base = {
                      name: form.name,
                      session_type: form.session_type,
                      start_time: form.start_time,
                      end_time: form.end_time,
                      location: form.location || null,
                      max_capacity: form.max_capacity ? Number(form.max_capacity) : null,
                      access_type: form.access_type,
                    }
                    const payload =
                      sessionNeedsSpeakers(form.session_type)
                        ? { ...base, speakers: speakersPayload(form.speakers) }
                        : base
                    createMutation.mutate(payload)
                  }}
                  disabled={createMutation.isPending || !form.name || !form.start_time || !form.end_time}
                >
                  Create
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Session Attendance</DialogTitle>
            <DialogDescription>
              {attendanceSession ? `${attendanceSession.name} • ${new Date(attendanceSession.start_time).toLocaleString()} - ${new Date(attendanceSession.end_time).toLocaleString()}` : ''}
            </DialogDescription>
          </DialogHeader>
          {attendanceLoading ? (
            <div className="text-sm text-muted-foreground">Loading attendees...</div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Attendance Data</span>
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase">
                  Total: {Object.values(attendancesByAttendeeId).filter(a => ['present', 'late'].includes(a.attendance_status)).length} present
                </div>
              </div>

              <div className="max-h-[60vh] overflow-y-auto border rounded-xl">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold uppercase text-[10px]">Attendee</TableHead>
                      <TableHead className="font-bold uppercase text-[10px]">Type</TableHead>
                      <TableHead className="w-40 font-bold uppercase text-[10px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const filtered = attendees.filter(a => {
                        const attendance = attendancesByAttendeeId[a.id];
                        return ['present', 'late'].includes(String(attendance?.attendance_status || ''));
                      });

                      if (filtered.length === 0) {
                        return (
                          <TableRow>
                            <TableCell colSpan={3} className="p-12 text-center">
                              <div className="flex flex-col items-center gap-2 opacity-40">
                                <UserRound className="w-8 h-8" />
                                <p className="font-bold uppercase text-xs">No live check-ins yet</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      }

                      return filtered.map(a => {
                        const attendance = attendancesByAttendeeId[a.id]
                        const present = ['present', 'late'].includes(String(attendance?.attendance_status || ''))
                        return (
                          <TableRow key={a.id} className={cn(present ? "bg-green-50/30 dark:bg-green-900/10" : "")}>
                            <TableCell>
                              <div className="font-bold text-sm">{a.guest?.name || a.name || `Guest #${a.id}`}</div>
                              <div className="text-[10px] text-muted-foreground font-medium">{a.guest?.email || a.email}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[9px] font-black uppercase">
                                {a.guest_type?.name || 
                                 a.guest_type_name || 
                                 a.guest?.guest_type?.name || 
                                 a.guest?.guest_type_name || 
                                 'Standard'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span className="text-[10px] font-black uppercase tracking-tight text-green-600">
                                  Attended
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      });
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Session Usher Assignment Dialog */}
      {usherSessionId !== null && (
        <SessionUsherAssignmentDialog
          eventId={currentEventId}
          sessionId={usherSessionId}
          open={usherDialogOpen}
          onOpenChange={(o) => setUsherDialogOpen(o)}
        />
      )}
    </div>
  )
}


