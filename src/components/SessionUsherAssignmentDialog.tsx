import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { getSessionUshers, assignSessionUshers, removeSessionUsher, updateSessionUsher, getEventUshers } from '@/lib/api'
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
      const [eventUshersRes, sessionUshersRes] = await Promise.all([
        getEventUshers(eventId),
        getSessionUshers(sessionId),
      ])
      const assignedArr = Array.isArray(sessionUshersRes.data) ? sessionUshersRes.data : (sessionUshersRes.data?.data ?? [])
      setAssigned(assignedArr)
      const assignedIds = new Set(assignedArr.map((u: any) => u.id))
      const eventUshers = Array.isArray(eventUshersRes.data) ? eventUshersRes.data : (eventUshersRes.data?.data ?? [])
      setAvailable(eventUshers.filter((u: any) => !assignedIds.has(u.id)))
    } catch (e) {
      console.error(e)
    }
  }
  useEffect(() => { if (open) load() }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
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


