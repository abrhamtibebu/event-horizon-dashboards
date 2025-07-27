import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserPlus, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import api, { getEventUshers, updateUsherTasks, assignUshersToEvent, getUshers } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'

interface UsherAssignmentDialogProps {
  eventId: number
  eventName: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

interface UsherAssignment {
  usherId: string
  tasks: string
}

export function UsherAssignmentDialog({
  eventId,
  eventName,
  trigger,
  onSuccess,
}: UsherAssignmentDialogProps) {
  const [open, setOpen] = useState(false)
  const [availableUshers, setAvailableUshers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [usherAssignments, setUsherAssignments] = useState<UsherAssignment[]>([
    { usherId: '', tasks: '' },
  ])
  const [assignedUshers, setAssignedUshers] = useState<any[]>([])
  const { user } = useAuth()
  const [editingUsherId, setEditingUsherId] = useState<string | null>(null)
  const [editTasks, setEditTasks] = useState<string>('')

  useEffect(() => {
    if (open && eventId) {
      loadAllUshers()
      loadAssignedUshers()
    }
  }, [open, eventId])

  const loadAllUshers = async () => {
    setLoading(true)
    try {
      const response = await getUshers()
      setAvailableUshers(response.data)
    } catch (error) {
      console.error('Failed to load ushers:', error)
      toast.error('Failed to load ushers')
    } finally {
      setLoading(false)
    }
  }

  const loadAssignedUshers = async () => {
    try {
      const response = await getEventUshers(eventId)
      setAssignedUshers(response.data)
    } catch (error) {
      console.error('Failed to load assigned ushers:', error)
    }
  }

  const handleAddUsher = () => {
    setUsherAssignments([...usherAssignments, { usherId: '', tasks: '' }])
  }

  const handleRemoveUsher = (index: number) => {
    if (usherAssignments.length > 1) {
      setUsherAssignments(usherAssignments.filter((_, i) => i !== index))
    }
  }

  const handleUsherChange = (index: number, usherId: string) => {
    const updated = [...usherAssignments]
    updated[index].usherId = usherId
    setUsherAssignments(updated)
  }

  const handleTasksChange = (index: number, tasks: string) => {
    const updated = [...usherAssignments]
    updated[index].tasks = tasks
    setUsherAssignments(updated)
  }

  const handleAssign = async () => {
    // Validate all assignments before proceeding
    const invalidAssignment = usherAssignments.find((assignment) => {
      if (!assignment.usherId) return true;
      return false;
    });
    if (invalidAssignment) {
      toast.error('Please select an usher for each assignment.');
      return;
    }
    setAssigning(true);
    try {
      const payload = {
        ushers: usherAssignments.map((assignment) => ({
          id: Number(assignment.usherId),
          tasks: assignment.tasks
            .split(',')
            .map((task) => task.trim())
            .filter(Boolean),
        })),
      };
        const response = await api.post(`/events/${eventId}/ushers`, payload);
        if (response.status >= 200 && response.status < 300) {
          toast.success('Ushers assigned successfully!');
          setOpen(false);
        setUsherAssignments([{ usherId: '', tasks: '' }]);
          onSuccess?.();
          return;
        }
        throw new Error(`Unexpected response status: ${response.status}`);
      } catch (error: any) {
        let errorMessage = 'Failed to assign ushers';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
        toast.error(errorMessage);
      throw error;
    } finally {
      setAssigning(false);
    }
  }

  const isFormValid = usherAssignments.some(
    (assignment) => assignment.usherId && assignment.tasks.trim()
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start">
            <UserPlus className="w-4 h-4 mr-2" />
            Assign Ushers
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Ushers to Event</DialogTitle>
          <DialogDescription>
            Select ushers and assign tasks for "{eventName}". You can add multiple
            ushers.
          </DialogDescription>
        </DialogHeader>

        {/* Show current usher assignments */}
        {assignedUshers.length > 0 && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="font-semibold mb-2">Currently Assigned Ushers:</div>
            <ul className="space-y-2">
              {assignedUshers.map((usher: any) => (
                <li key={usher.id} className="flex flex-col md:flex-row md:items-center md:gap-4">
                  <span className="font-medium">{usher.name} ({usher.email})</span>
                  {editingUsherId === String(usher.id) ? (
                    <>
                      <input
                        className="border rounded px-2 py-1 ml-2"
                        value={editTasks}
                        onChange={e => setEditTasks(e.target.value)}
                      />
                      <Button size="sm" variant="outline" onClick={async () => {
                        await updateUsherTasks(eventId, usher.id, editTasks.split(',').map(t => t.trim()).filter(Boolean))
                        await loadAssignedUshers()
                        setEditingUsherId(null)
                      }}>Save</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingUsherId(null)}>Cancel</Button>
                    </>
                  ) : (
                    usher.pivot?.tasks && (
                      <span className="text-sm text-gray-600">Tasks: {Array.isArray(usher.pivot.tasks) ? usher.pivot.tasks.join(', ') : (typeof usher.pivot.tasks === 'string' ? JSON.parse(usher.pivot.tasks).join(', ') : '')}</span>
                    )
                  )}
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingUsherId(String(usher.id))
                    setEditTasks(Array.isArray(usher.pivot?.tasks) ? usher.pivot.tasks.join(', ') : (typeof usher.pivot?.tasks === 'string' ? JSON.parse(usher.pivot.tasks).join(', ') : ''))
                  }}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={async () => {
                    await api.delete(`/events/${eventId}/ushers/${usher.id}`)
                    await loadAssignedUshers()
                  }}>Remove</Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-4">Loading available ushers...</div>
          ) : availableUshers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No available ushers found.
            </div>
          ) : usherAssignments.map((assignment, index) => (
            <div key={index} className="p-4 border rounded-lg mb-4 bg-gray-50 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <div className="flex-1">
                  <Label>Usher</Label>
                  <Select
                    value={assignment.usherId}
                    onValueChange={val => handleUsherChange(index, val)}
                    required
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select usher" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUshers.map((usher: any) => (
                        <SelectItem key={usher.id} value={usher.id.toString()}>
                          {usher.name} ({usher.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Tasks</Label>
                  <Textarea
                    placeholder="Enter tasks separated by commas (e.g., Check-in, Security)"
                    value={assignment.tasks}
                    onChange={e => handleTasksChange(index, e.target.value)}
                    rows={2}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveUsher(index)}
                  disabled={usherAssignments.length === 1}
                >
                  <X className="w-4 h-4" /> Remove
                </Button>
                {index === usherAssignments.length - 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddUsher}
                  >
                    <Plus className="w-4 h-4" /> Add Another
                  </Button>
                )}
              </div>
            </div>
          ))}

          {availableUshers.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={handleAddUsher}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Usher
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={assigning}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!isFormValid || assigning || loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {assigning ? 'Assigning...' : 'Assign Ushers'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 