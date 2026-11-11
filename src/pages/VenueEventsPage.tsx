import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { Activity, CalendarDays, CheckCircle2, Circle, ClipboardList, Package, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { VenueEmptyState } from '@/components/venue/VenueEmptyState'
import { VenuePageHeader } from '@/components/venue/VenuePageHeader'
import { bookingDateRange } from '@/components/venue/bookingLabels'
import { venueApi, type VenueEventResource, type VenueEventWorkspaceDetail, type VenueEventWorkspaceSummary } from '@/lib/api/venues'
import { toast } from 'sonner'

const statusLabel: Record<string, string> = {
  planning: 'Planning', preparation: 'Preparation', ready: 'Ready', in_progress: 'In progress', completed: 'Completed', cancelled: 'Cancelled',
}

type VenueEventPageMode = 'overview' | 'resources' | 'tasks' | 'schedule'

export default function VenueEventsPage({ mode = 'overview' }: { mode?: VenueEventPageMode }) {
  const [events, setEvents] = useState<VenueEventWorkspaceSummary[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [workspace, setWorkspace] = useState<VenueEventWorkspaceDetail | null>(null)
  const [resourceInventory, setResourceInventory] = useState<VenueEventResource[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPhase, setTaskPhase] = useState('pre_event')
  const [taskPriority, setTaskPriority] = useState('normal')
  const [taskDueAt, setTaskDueAt] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [staffId, setStaffId] = useState('')
  const [staffRole, setStaffRole] = useState('')
  const [resourceId, setResourceId] = useState('')
  const [resourceQuantity, setResourceQuantity] = useState('1')
  const [resourceName, setResourceName] = useState('')
  const [resourceCategory, setResourceCategory] = useState('other')
  const [resourceCount, setResourceCount] = useState('1')
  const [scheduleTitle, setScheduleTitle] = useState('')
  const [scheduleStart, setScheduleStart] = useState('')
  const [scheduleEnd, setScheduleEnd] = useState('')

  const loadEvents = useCallback(async (preferredId?: number | null) => {
    setLoading(true)
    try {
      const { data } = await venueApi.eventWorkspaces()
      setEvents(data)
      const nextId = preferredId && data.some((item) => item.booking.id === preferredId)
        ? preferredId
        : data.some((item) => item.booking.id === selectedId) ? selectedId : data[0]?.booking.id ?? null
      setSelectedId(nextId)
      if (nextId) {
        const detail = await venueApi.eventWorkspace(nextId)
        setWorkspace(detail.data)
      } else setWorkspace(null)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not load venue events')
    } finally { setLoading(false) }
  }, [selectedId])

  useEffect(() => { loadEvents() }, [])

  useEffect(() => {
    if (mode !== 'resources') return
    venueApi.venueResources()
      .then(({ data }) => setResourceInventory(data))
      .catch((error: any) => toast.error(error.response?.data?.error || 'Could not load venue inventory'))
  }, [mode])

  const selectEvent = async (bookingId: number) => {
    setSelectedId(bookingId)
    setWorkspace(null)
    try {
      const { data } = await venueApi.eventWorkspace(bookingId)
      setWorkspace(data)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Could not open event workspace')
    }
  }

  const refreshWorkspace = async () => {
    if (!selectedId) return
    const { data } = await venueApi.eventWorkspace(selectedId)
    setWorkspace(data)
    setEvents((current) => current.map((item) => item.booking.id === selectedId
      ? { ...item, event_status: data.workspace.status, readiness: data.readiness }
      : item))
  }

  const run = async (action: () => Promise<unknown>, success?: string) => {
    setBusy(true)
    try {
      await action()
      if (mode === 'resources') {
        const { data } = await venueApi.venueResources()
        setResourceInventory(data)
      } else {
        await refreshWorkspace()
      }
      if (success) toast.success(success)
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Could not save event operations')
    } finally { setBusy(false) }
  }

  const addTask = () => {
    if (!selectedId || !taskTitle.trim()) return
    void run(async () => {
      await venueApi.createEventTask(selectedId, {
        title: taskTitle.trim(), phase: taskPhase as any, priority: taskPriority as any, required: true,
        due_at: taskDueAt ? new Date(taskDueAt).toISOString() : null,
        assigned_user_id: taskAssignee ? Number(taskAssignee) : null,
      })
      setTaskTitle('')
      setTaskAssignee('')
      setTaskDueAt('')
    }, 'Checklist task added')
  }

  const addStaff = async () => {
    if (!selectedId || !staffId) return
    setBusy(true)
    try {
      await venueApi.assignEventStaff(selectedId, { user_id: Number(staffId), assignment_role: staffRole.trim() || undefined })
      await refreshWorkspace()
      setStaffId('')
      setStaffRole('')
      toast.success('Staff member assigned')
    } catch (error: any) {
      if (error.response?.status === 409 && workspace?.permissions.override_staff_conflicts) {
        const reason = window.prompt('This staff member has an overlapping event. Enter a reason to record an authorized override:')
        if (reason?.trim()) {
          try {
            await venueApi.assignEventStaff(selectedId, { user_id: Number(staffId), assignment_role: staffRole.trim() || undefined, override_conflict: true, override_reason: reason.trim() })
            await refreshWorkspace()
            setStaffId('')
            setStaffRole('')
            toast.success('Staff assignment saved with override reason')
          } catch (retryError: any) { toast.error(retryError.response?.data?.error || 'Could not assign staff member') }
        }
      } else toast.error(error.response?.data?.error || 'Could not assign staff member')
    } finally { setBusy(false) }
  }

  const addResource = () => {
    if (!selectedId || !resourceId || Number(resourceQuantity) < 1) return
    void run(() => venueApi.allocateEventResource(selectedId, { resource_id: Number(resourceId), quantity: Number(resourceQuantity) }), 'Equipment allocated')
    setResourceId('')
    setResourceQuantity('1')
  }

  const createResource = () => {
    if (!resourceName.trim() || Number(resourceCount) < 1) return
    void run(async () => {
      await venueApi.createVenueResource({ name: resourceName.trim(), category: resourceCategory, quantity: Number(resourceCount), condition: 'good', status: 'active' })
      const { data } = await venueApi.venueResources()
      setResourceInventory(data)
      setWorkspace((current) => current ? { ...current, resources: data } : current)
      setResourceName('')
    }, 'Resource added to inventory')
  }

  const reportResourceDamage = (resourceId: number, currentUnavailable: number) => {
    const value = window.prompt('How many units are currently unavailable or damaged?', String(currentUnavailable))
    if (value === null) return
    const unavailable = Number(value)
    const resource = workspace?.resources.find((item) => item.id === resourceId)
    if (!resource || !Number.isInteger(unavailable) || unavailable < 0 || unavailable > resource.quantity) {
      toast.error('Enter a whole number between zero and the total quantity.')
      return
    }
    void run(() => venueApi.updateVenueResource(resourceId, {
      unavailable_quantity: unavailable,
      condition: unavailable > 0 ? 'damaged' : 'good',
    }), 'Resource condition updated')
  }

  const addScheduleItem = () => {
    if (!selectedId || !scheduleTitle.trim() || !scheduleStart || !scheduleEnd) return
    void run(async () => {
      await venueApi.createEventScheduleItem(selectedId, {
        title: scheduleTitle.trim(), description: '',
        starts_at: new Date(scheduleStart).toISOString(), ends_at: new Date(scheduleEnd).toISOString(),
      })
      setScheduleTitle('')
      setScheduleStart('')
      setScheduleEnd('')
    }, 'Schedule item added')
  }

  const setEventStatus = (status: string) => {
    if (!selectedId) return
    void run(() => venueApi.updateEventWorkspace(selectedId, { status }), 'Event status updated')
  }

  const currentBooking = workspace?.booking
  const pageTitle = mode === 'resources' ? 'Resources & Equipment' : mode === 'tasks' ? 'Tasks & Checklists' : mode === 'schedule' ? 'Event Schedule' : 'Events'
  const pageSubtitle = mode === 'resources'
    ? 'Track venue inventory and allocate equipment to confirmed bookings.'
    : mode === 'tasks'
      ? 'Build event checklists, assign owners, and track readiness across confirmed bookings.'
      : mode === 'schedule'
        ? 'Plan run-of-show milestones for each confirmed venue booking.'
        : 'Manage confirmed events, staff assignments, and event readiness.'

  return <div className="space-y-6">
    <VenuePageHeader icon={mode === 'resources' ? Package : mode === 'tasks' ? ClipboardList : mode === 'schedule' ? CalendarDays : CalendarDays} title={pageTitle} subtitle={pageSubtitle} />
    <nav aria-label="Event operations" className="flex flex-wrap gap-2">
      {[
        { key: 'overview', label: 'Event overview', to: '/dashboard/venue/events' },
        { key: 'resources', label: 'Resources & equipment', to: '/dashboard/venue/resources' },
        { key: 'tasks', label: 'Tasks & checklists', to: '/dashboard/venue/tasks' },
        { key: 'schedule', label: 'Event schedule', to: '/dashboard/venue/event-schedule' },
      ].map((item) => <Button key={item.key} asChild size="sm" variant={mode === item.key ? 'default' : 'outline'}><Link to={item.to}>{item.label}</Link></Button>)}
    </nav>
    {loading ? <div className="rounded-2xl border p-8 text-sm text-muted-foreground">Loading event workspaces…</div> : events.length === 0 && mode !== 'resources' ? <VenueEmptyState icon={CalendarDays} title="No confirmed events yet" description="Confirmed venue bookings will appear here for operational planning." /> : mode === 'resources' && events.length === 0 ? <section className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
      <div><h2 className="text-lg font-semibold">Venue inventory</h2><p className="text-sm text-muted-foreground">Add and maintain equipment here, then allocate it to an event when a booking is confirmed.</p></div>
      <div className="grid gap-2 sm:grid-cols-[minmax(160px,1fr)_160px_100px_auto]"><Input value={resourceName} onChange={(event) => setResourceName(event.target.value)} placeholder="Resource name" /><select aria-label="Equipment category" className="h-10 rounded-md border bg-background px-2 text-sm" value={resourceCategory} onChange={(event) => setResourceCategory(event.target.value)}><option value="other">Other</option><option value="furniture">Furniture</option><option value="audio">Audio</option><option value="lighting">Lighting</option><option value="video">Video</option><option value="power">Power</option><option value="security">Security</option><option value="catering">Catering</option></select><Input aria-label="Equipment quantity" type="number" min="1" value={resourceCount} onChange={(event) => setResourceCount(event.target.value)} /><Button onClick={createResource} disabled={busy || !resourceName.trim()}><Plus className="mr-2 size-4" />Add item</Button></div>
      {resourceInventory.length === 0 ? <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Your equipment inventory is empty. Add the first resource above.</p> : <div className="divide-y rounded-xl border px-4">{resourceInventory.map((resource) => <div key={resource.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div><p className="font-medium">{resource.name}</p><p className="text-xs capitalize text-muted-foreground">{resource.category.replaceAll('_', ' ')} · {resource.quantity - resource.unavailable_quantity} available of {resource.quantity} · {resource.condition}</p></div><Button size="sm" variant="outline" onClick={() => reportResourceDamage(resource.id, resource.unavailable_quantity)}>Update condition</Button></div>)}</div>}
    </section> : <div className="grid min-w-0 gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="space-y-3">
        <h2 className="font-semibold">Confirmed bookings</h2>
        {events.map((event) => {
          const booking = event.booking
          return <button key={booking.id} onClick={() => selectEvent(booking.id)} className={`w-full rounded-xl border p-4 text-left transition-colors ${selectedId === booking.id ? 'border-primary bg-primary/5' : 'hover:border-primary/40'}`}>
            <div className="flex items-start justify-between gap-2"><span className="font-semibold">{booking.title || booking.event?.name || 'Venue booking'}</span><span className="rounded-full bg-muted px-2 py-0.5 text-[11px]">{event.readiness.percent}%</span></div>
            <p className="mt-1 text-sm text-muted-foreground">{booking.space?.name || 'Space'} · {format(new Date(booking.starts_at), 'MMM d, yyyy')}</p>
            <p className="mt-2 text-xs capitalize text-muted-foreground">{statusLabel[event.event_status] || event.event_status} · {event.readiness.completed_tasks}/{event.readiness.required_tasks} required tasks</p>
          </button>
        })}
      </aside>

      {!workspace || !currentBooking ? <div className="rounded-2xl border p-8 text-sm text-muted-foreground">Loading selected event…</div> : <main className="min-w-0 space-y-5">
        <section className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><h2 className="text-xl font-bold">{currentBooking.title || currentBooking.event?.name || 'Venue booking'}</h2><p className="mt-1 text-sm text-muted-foreground">{currentBooking.space?.name} · {bookingDateRange(currentBooking.starts_at, currentBooking.ends_at)}</p><p className="mt-1 text-sm text-muted-foreground">Client: {currentBooking.contact_name || currentBooking.organizer?.name || '—'}</p></div>
            <div className="min-w-48 space-y-2"><Label htmlFor="event-status">Event status</Label><select id="event-status" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={workspace.workspace.status} onChange={(event) => setEventStatus(event.target.value)} disabled={busy}><option value="planning">Planning</option><option value="preparation">Preparation</option><option value="ready">Ready</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
          </div>
          {mode === 'overview' ? <div className="mt-5 rounded-xl bg-muted/50 p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-medium"><Activity className="size-4" />Event readiness</div><span className="text-sm font-semibold">{workspace.readiness.completed_tasks}/{workspace.readiness.required_tasks} required tasks</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${workspace.readiness.percent}%` }} /></div><p className="mt-2 text-xs text-muted-foreground">{workspace.readiness.ready ? 'All required checklist tasks are complete.' : workspace.readiness.required_tasks ? 'Complete the required tasks before marking the event ready.' : 'Add required tasks to start measuring readiness.'}</p></div> : null}
        </section>

        {mode === 'tasks' ? <section className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2"><ClipboardList className="size-5" /><h3 className="font-semibold">Tasks & checklist</h3></div>
          <div className="mb-4 grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            <Input className="min-w-0" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add a required event task" />
            <select className="h-10 min-w-0 w-full rounded-md border bg-background px-3 text-sm" value={taskPhase} onChange={(event) => setTaskPhase(event.target.value)}><option value="pre_event">Pre-event</option><option value="during_event">During event</option><option value="post_event">Post-event</option></select>
            <select className="h-10 min-w-0 w-full rounded-md border bg-background px-3 text-sm" value={taskAssignee} onChange={(event) => setTaskAssignee(event.target.value)}><option value="">Unassigned</option>{workspace.staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select>
            <select className="h-10 min-w-0 w-full rounded-md border bg-background px-3 text-sm" value={taskPriority} onChange={(event) => setTaskPriority(event.target.value)}><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>
            <Input className="min-w-0 w-full" aria-label="Task deadline" type="datetime-local" value={taskDueAt} onChange={(event) => setTaskDueAt(event.target.value)} />
            <Button className="w-full" onClick={addTask} disabled={busy || !taskTitle.trim()}><Plus className="mr-2 size-4" />Add task</Button>
          </div>
          {workspace.workspace.tasks.length === 0 ? <p className="py-5 text-center text-sm text-muted-foreground">No checklist tasks yet.</p> : <div className="divide-y">{workspace.workspace.tasks.map((task) => <div key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div className="flex min-w-0 flex-1 items-start gap-3">{task.status === 'completed' ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />}<div className="min-w-0"><p className={`font-medium ${task.status === 'completed' ? 'text-muted-foreground line-through' : ''}`}>{task.title}</p><p className="text-xs capitalize text-muted-foreground">{task.phase.replace('_', ' ')} · {task.priority}{task.assignee ? ` · ${task.assignee.name}` : ''}</p></div></div><select className="h-9 w-32 shrink-0 rounded-md border bg-background pl-3 pr-8 text-sm" value={task.status} onChange={(event) => void run(() => venueApi.updateEventTask(currentBooking.id, task.id, { status: event.target.value as any }), 'Task updated')} disabled={busy}><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="blocked">Blocked</option></select></div>)}</div>}
        </section> : null}

        {mode === 'overview' ? <section className="space-y-4 rounded-2xl border bg-card p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2"><Users className="size-5" /><h3 className="font-semibold">Staff assignments</h3></div>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><select className="h-10 rounded-md border bg-background px-3 text-sm" value={staffId} onChange={(event) => setStaffId(event.target.value)}><option value="">Select staff</option>{workspace.staff.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><Input value={staffRole} onChange={(event) => setStaffRole(event.target.value)} placeholder="Assignment / role" /><Button onClick={addStaff} disabled={busy || !staffId}>Assign</Button></div>
            {workspace.workspace.staff_assignments.length === 0 ? <p className="text-sm text-muted-foreground">No staff assigned.</p> : <ul className="divide-y">{workspace.workspace.staff_assignments.map((assignment) => <li key={assignment.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"><span><b>{assignment.user.name}</b>{assignment.assignment_role ? ` · ${assignment.assignment_role}` : ''}{assignment.override_reason ? <span className="ml-2 text-amber-700">Schedule override</span> : null}</span><div className="flex items-center gap-2"><select aria-label={`${assignment.user.name} attendance`} className="h-8 rounded-md border bg-background px-2 text-xs" value={assignment.status} onChange={(event) => void run(() => venueApi.updateEventStaffAttendance(currentBooking.id, assignment.id, event.target.value as any), 'Attendance updated')} disabled={busy}><option value="assigned">Assigned</option><option value="attended">Attended</option><option value="absent">Absent</option></select><Button size="sm" variant="ghost" onClick={() => void run(() => venueApi.removeEventStaff(currentBooking.id, assignment.id), 'Assignment removed')}>Remove</Button></div></li>)}</ul>}
          </div></section> : null}

        {mode === 'resources' ? <section className="space-y-4 rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2"><Package className="size-5" /><h3 className="font-semibold">Resources & equipment</h3></div>
            <div className="grid gap-2 sm:grid-cols-[1fr_90px_auto]"><select className="h-10 rounded-md border bg-background px-3 text-sm" value={resourceId} onChange={(event) => setResourceId(event.target.value)}><option value="">Select resource</option>{workspace.resources.filter((item) => item.status === 'active').map((item) => <option key={item.id} value={item.id}>{item.name} · {item.quantity - item.unavailable_quantity} available</option>)}</select><Input type="number" min="1" value={resourceQuantity} onChange={(event) => setResourceQuantity(event.target.value)} /><Button onClick={addResource} disabled={busy || !resourceId}>Allocate</Button></div>
            {workspace.workspace.resource_allocations.length === 0 ? <p className="text-sm text-muted-foreground">No equipment allocated.</p> : <ul className="divide-y">{workspace.workspace.resource_allocations.map((allocation) => <li key={allocation.id} className="flex items-center justify-between gap-2 py-2 text-sm"><span><b>{allocation.resource.name}</b> · {allocation.quantity} · {allocation.status}</span>{allocation.status === 'allocated' ? <Button size="sm" variant="outline" onClick={() => void run(() => venueApi.returnEventResource(currentBooking.id, allocation.id), 'Equipment returned')}>Mark returned</Button> : null}</li>)}</ul>}
            {workspace.permissions.manage_resources && workspace.resources.length > 0 ? <div className="space-y-2 border-t pt-3"><p className="text-xs font-semibold uppercase text-muted-foreground">Inventory condition</p>{workspace.resources.map((resource) => <div key={resource.id} className="flex items-center justify-between gap-2 text-xs"><span>{resource.name} · {resource.unavailable_quantity}/{resource.quantity} unavailable · {resource.condition}</span><Button size="sm" variant="ghost" onClick={() => reportResourceDamage(resource.id, resource.unavailable_quantity)}>Update condition</Button></div>)}</div> : null}
            {workspace.permissions.manage_resources ? <div className="border-t pt-3"><p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Add inventory</p><div className="grid gap-2 sm:grid-cols-[1fr_130px_80px_auto]"><Input value={resourceName} onChange={(event) => setResourceName(event.target.value)} placeholder="Resource name" /><select className="h-10 rounded-md border bg-background px-2 text-sm" value={resourceCategory} onChange={(event) => setResourceCategory(event.target.value)}><option value="other">Other</option><option value="furniture">Furniture</option><option value="audio">Audio</option><option value="lighting">Lighting</option><option value="video">Video</option><option value="power">Power</option><option value="security">Security</option><option value="catering">Catering</option></select><Input type="number" min="1" value={resourceCount} onChange={(event) => setResourceCount(event.target.value)} /><Button size="sm" variant="outline" onClick={createResource} disabled={busy || !resourceName.trim()}>Add</Button></div></div> : null}
        </section> : null}

        {mode === 'schedule' ? <section className="rounded-2xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2"><CalendarDays className="size-5" /><h3 className="font-semibold">Event schedule</h3></div>
          <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px_200px_auto]"><Input value={scheduleTitle} onChange={(event) => setScheduleTitle(event.target.value)} placeholder="Schedule item" /><Input type="datetime-local" value={scheduleStart} onChange={(event) => setScheduleStart(event.target.value)} /><Input type="datetime-local" value={scheduleEnd} onChange={(event) => setScheduleEnd(event.target.value)} /><Button onClick={addScheduleItem} disabled={busy || !scheduleTitle.trim() || !scheduleStart || !scheduleEnd}><Plus className="mr-2 size-4" />Add</Button></div>
          {workspace.workspace.schedule_items.length === 0 ? <p className="text-sm text-muted-foreground">No schedule items yet.</p> : <ul className="divide-y">{workspace.workspace.schedule_items.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{format(new Date(item.starts_at), 'MMM d · HH:mm')} – {format(new Date(item.ends_at), 'HH:mm')}</p></div><Button size="sm" variant="ghost" onClick={() => void run(() => venueApi.deleteEventScheduleItem(currentBooking.id, item.id), 'Schedule item removed')}>Remove</Button></li>)}</ul>}
        </section> : null}
      </main>}
    </div>}
  </div>
}
