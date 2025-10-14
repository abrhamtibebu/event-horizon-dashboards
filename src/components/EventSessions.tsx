import React, { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import api, { getEventSessions, createEventSession, updateSession, deleteSession, createSessionAttendance, updateSessionAttendance, getSessionById, cancelSession } from '@/lib/api'
import { Switch } from '@/components/ui/switch'
import { Plus, Calendar, Clock, MapPin, Trash2, XCircle } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar as UiCalendar } from '@/components/ui/calendar'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import SessionUsherAssignmentDialog from '@/components/SessionUsherAssignmentDialog'

interface EventSessionsProps {
  eventId: number | string
}

export default function EventSessions({ eventId }: EventSessionsProps) {
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
  })
  const [editingId, setEditingId] = useState<number | null>(null)

  const [authError, setAuthError] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { data, isLoading } = useQuery({
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
  })

  const sessions = useMemo(() => (data?.data ?? []) as any[], [data])

  const createMutation = useMutation({
    mutationFn: (payload: any) => createEventSession(Number(eventId), payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-sessions', eventId] })
      setOpen(false)
      setForm({ name: '', session_type: 'seminar', start_time: '', end_time: '', location: '', max_capacity: '', status: 'scheduled' })
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
      setForm({ name: '', session_type: 'seminar', start_time: '', end_time: '', location: '', max_capacity: '', status: 'scheduled' })
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
      // Load event attendees
      const attendeesRes = await api.get(`/events/${Number(eventId)}/attendees`)
      setAttendees(attendeesRes.data || [])
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
    if (present) {
      if (existing) {
        const updated = await updateSessionAttendance(attendanceSession.id, existing.id, {
          attendance_status: 'present',
          check_in_time: existing.check_in_time || new Date().toISOString(),
        })
        setAttendancesByAttendeeId(prev => ({ ...prev, [attendee.id]: updated.data?.data || updated.data }))
      } else {
        const created = await createSessionAttendance(attendanceSession.id, {
          attendee_id: attendee.id,
          attendance_status: 'present',
          check_in_time: new Date().toISOString(),
        })
        const rec = created.data?.data || created.data
        setAttendancesByAttendeeId(prev => ({ ...prev, [attendee.id]: rec }))
      }
    } else {
      if (existing) {
        const updated = await updateSessionAttendance(attendanceSession.id, existing.id, {
          attendance_status: 'absent',
          check_out_time: new Date().toISOString(),
        })
        setAttendancesByAttendeeId(prev => ({ ...prev, [attendee.id]: updated.data?.data || updated.data }))
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Sessions</h3>
          <p className="text-sm text-muted-foreground">Manage seminars, panels, and more</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={authError}>
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
                      <TableCell className="font-medium">{s.name}</TableCell>
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
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAttendance(s)}
                          >
                            Attendance
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setUsherSessionId(s.id); setUsherDialogOpen(true) }}
                          >
                            Ushers
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingId(s.id)
                              setForm({
                                name: s.name || '',
                                session_type: s.session_type || 'seminar',
                                start_time: s.start_time ? new Date(s.start_time).toISOString() : '',
                                end_time: s.end_time ? new Date(s.end_time).toISOString() : '',
                                location: s.location || '',
                                max_capacity: s.max_capacity?.toString?.() || '',
                                status: s.status || 'scheduled',
                              })
                              setOpen(true)
                            }}
                          >
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={async () => { await cancelSession(s.id); queryClient.invalidateQueries({ queryKey: ['event-sessions', eventId] }) }}>
                            <XCircle className="h-4 w-4 mr-1" /> Cancel
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(s.id)}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Session' : 'Create Session'}</DialogTitle>
            <DialogDescription>{editingId ? 'Update the session details' : 'Define a new session for this event'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            {formErrors.name && <div className="text-xs text-red-600">{formErrors.name}</div>}
            <Select value={form.session_type} onValueChange={v => setForm({ ...form, session_type: v })}>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    {form.start_time ? new Date(form.start_time).toLocaleString() : 'Select start'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="p-3 space-y-3">
                    <UiCalendar
                      mode="single"
                      selected={form.start_time ? new Date(form.start_time) : undefined}
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
                    <div className="flex items-center gap-2">
                      <Input type="time" value={getHHMM(form.start_time)} onChange={e => {
                        const v = e.target.value
                        const base = form.start_time ? new Date(form.start_time) : new Date()
                        const next = setTimeOnDate(base, v)
                        let endISO = form.end_time
                        if (!endISO || new Date(endISO) <= next) {
                          endISO = addHours(next, 1).toISOString()
                        }
                        setForm({ ...form, start_time: next.toISOString(), end_time: endISO })
                      }} />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start w-full">
                    <Calendar className="h-4 w-4 mr-2" />
                    {form.end_time ? new Date(form.end_time).toLocaleString() : 'Select end'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <div className="p-3 space-y-3">
                    <UiCalendar
                      mode="single"
                      selected={form.end_time ? new Date(form.end_time) : undefined}
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
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        min={(() => {
                          const s = form.start_time ? new Date(form.start_time) : undefined
                          const e = form.end_time ? new Date(form.end_time) : undefined
                          return s && e && sameYMD(s, e) ? getHHMM(form.start_time) : undefined
                        })()}
                        value={getHHMM(form.end_time)}
                        onChange={e => {
                          const v = e.target.value
                          const base = form.end_time ? new Date(form.end_time) : (form.start_time ? new Date(form.start_time) : new Date())
                          const next = setTimeOnDate(base, v)
                          const start = form.start_time ? new Date(form.start_time) : undefined
                          if (start && next <= start) {
                            toast.warning('End time must be after start time')
                            const fixed = addHours(start, 1)
                            setForm({ ...form, end_time: fixed.toISOString() })
                          } else {
                            setForm({ ...form, end_time: next.toISOString() })
                          }
                        }}
                      />
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
            {/* Sessions are optional by default; no extra flags */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              {editingId ? (
                <Button onClick={() => updateMutation.mutate({
                  id: editingId,
                  payload: {
                    name: form.name,
                    session_type: form.session_type,
                    start_time: form.start_time,
                    end_time: form.end_time,
                    location: form.location || null,
                    max_capacity: form.max_capacity ? Number(form.max_capacity) : null,
                  }
                })} disabled={updateMutation.isPending || !form.name || !form.start_time || !form.end_time}>
                  Save
                </Button>
              ) : (
                <Button onClick={() => createMutation.mutate({
                  name: form.name,
                  session_type: form.session_type,
                  start_time: form.start_time,
                  end_time: form.end_time,
                  location: form.location || null,
                  max_capacity: form.max_capacity ? Number(form.max_capacity) : null,
                })} disabled={createMutation.isPending || !form.name || !form.start_time || !form.end_time}>
                  Create
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Session Attendance</DialogTitle>
            <DialogDescription>
              {attendanceSession ? `${attendanceSession.name} • ${new Date(attendanceSession.start_time).toLocaleString()} - ${new Date(attendanceSession.end_time).toLocaleString()}` : ''}
            </DialogDescription>
          </DialogHeader>
          {attendanceLoading ? (
            <div className="text-sm text-muted-foreground">Loading attendees...</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attendee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-40">Present</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendees.map(a => {
                    const attendance = attendancesByAttendeeId[a.id]
                    const present = attendance?.attendance_status === 'present'
                    return (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div className="font-medium">{a.guest?.name || a.name || `Guest #${a.id}`}</div>
                          <div className="text-xs text-muted-foreground">{a.guest?.email || a.email}</div>
                        </TableCell>
                        <TableCell>{a.guest_type?.name || a.guest_type_name || '—'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Switch checked={present} onCheckedChange={(v) => toggleAttendance(a, v)} />
                            <span className={`text-xs ${present ? 'text-green-600' : 'text-gray-500'}`}>{present ? 'Present' : 'Absent'}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
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


