import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, UserPlus, Flag, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface BulkActionsBarProps {
  selectedCount: number
  onBulkAssign: (userId: number) => void
  onBulkStatusChange: (status: string) => void
  onBulkPriorityChange: (priority: string) => void
  onBulkDelete: () => void
  teamMembers: Array<{ id: number; name: string }>
}

export function BulkActionsBar({
  selectedCount,
  onBulkAssign,
  onBulkStatusChange,
  onBulkPriorityChange,
  onBulkDelete,
  teamMembers,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null

  return (
    <Card className="p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {selectedCount} task{selectedCount !== 1 ? 's' : ''} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Select onValueChange={(value) => onBulkAssign(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Assign to..." />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id.toString()}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select onValueChange={onBulkStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Change status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={onBulkPriorityChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Change priority..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}



















