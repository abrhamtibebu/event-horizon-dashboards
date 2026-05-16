import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getSessionUshers, assignSessionUshers, removeSessionUsher, updateSessionUsher, getEventUshers, getUshers } from '@/lib/api'
import { toast } from 'sonner'

interface Props {
  eventId: number
  sessionId: number
  open: boolean
  onOpenChange: (o: boolean) => void
}

export default function SessionUsherAssignmentDialog({ eventId, sessionId, open, onOpenChange }: Props) {
  const [available, setAvailable] = useState<any[]>([])
  const [assigned, setAssigned] = useState<any[]>([])
  const [newUsherId, setNewUsherId] = useState<string>('')
  const [tasks, setTasks] = useState<string>('')
  const load = async () => {
    try {
      const [eventUshersRes, sessionUshersRes, allUshersRes] = await Promise.all([
        getEventUshers(eventId),
        getSessionUshers(sessionId),
        getUshers(), // Fetch all ushers just in case
      ])
      const sessionPayload = sessionUshersRes.data as { data?: unknown[] } | unknown[]
      const assignedArr = Array.isArray(sessionPayload)
        ? sessionPayload
        : (sessionPayload?.data ?? [])
      setAssigned(assignedArr as any[])
      const assignedIds = new Set((assignedArr as any[]).map((u: any) => u.id))
      
      const eventPayload = eventUshersRes.data as { data?: unknown[] } | unknown[]
      const eventUshers = Array.isArray(eventPayload) ? eventPayload : (eventPayload?.data ?? [])
      
      // If event has ushers, use them. Otherwise, allow picking from all available ushers for this organizer
      let pool = (eventUshers as any[])
      if (pool.length === 0) {
        const allPayload = allUshersRes.data as { data?: unknown[] } | unknown[]
        pool = Array.isArray(allPayload) ? allPayload : (allPayload?.data ?? [])
      }

      setAvailable(pool.filter((u: any) => !assignedIds.has(u.id)))
    } catch (e) {
      console.error(e)
      toast.error('Could not load ushers for this session')
    }
  }
  useEffect(() => {
    if (open) load()
  }, [open, eventId, sessionId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Assign Ushers to Session</DialogTitle>
          <DialogDescription>Select ushers and define tasks for this session.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Select value={newUsherId} onValueChange={setNewUsherId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select usher" />
              </SelectTrigger>
              <SelectContent>
                {available.map((u: any) => (
                  <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input className="flex-1" placeholder="Tasks (comma separated)" value={tasks} onChange={e => setTasks(e.target.value)} />
            <Button onClick={async () => {
              if (!newUsherId) { toast.error('Select usher'); return }
              try {
                await assignSessionUshers(sessionId, [{ id: Number(newUsherId), tasks: tasks.split(',').map(s => s.trim()).filter(Boolean) }])
                setNewUsherId(''); setTasks(''); await load(); toast.success('Usher assigned')
              } catch (e: any) { toast.error(e?.response?.data?.message || 'Failed to assign usher') }
            }}>Add</Button>
          </div>

          <div className="space-y-2">
            {(Array.isArray(assigned) ? assigned : []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-2 p-2 border rounded">
                <div className="flex-1">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </div>
                <Input className="flex-1" defaultValue={(Array.isArray(u.pivot?.tasks) ? u.pivot.tasks : (typeof u.pivot?.tasks === 'string' ? (()=>{ try{ return JSON.parse(u.pivot.tasks).join(', ') }catch{return ''} })() : '')) as string}
                  onBlur={async (e) => {
                    try {
                      const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      await updateSessionUsher(sessionId, u.id, arr)
                      toast.success('Tasks updated')
                    } catch (err) { toast.error('Failed to update tasks') }
                  }}
                />
                <Button variant="destructive" onClick={async () => { await removeSessionUsher(sessionId, u.id); await load(); }}>Remove</Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}


