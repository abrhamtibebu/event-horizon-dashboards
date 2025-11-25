import { UnifiedTask } from '@/types/tasks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TaskCard } from './TaskCard'
import { User } from 'lucide-react'

interface TeamWorkloadViewProps {
  tasks: UnifiedTask[]
  teamMembers: Array<{ id: number; name: string; email: string }>
  onTaskClick: (task: UnifiedTask) => void
}

export function TeamWorkloadView({ tasks, teamMembers, onTaskClick }: TeamWorkloadViewProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const tasksByMember = new Map<number, UnifiedTask[]>()
  const unassignedTasks: UnifiedTask[] = []

  tasks.forEach(task => {
    if (task.assigned_to) {
      if (!tasksByMember.has(task.assigned_to)) {
        tasksByMember.set(task.assigned_to, [])
      }
      tasksByMember.get(task.assigned_to)!.push(task)
    } else {
      unassignedTasks.push(task)
    }
  })

  const getMemberTasks = (memberId: number) => {
    return tasksByMember.get(memberId) || []
  }

  const getTaskCount = (memberId: number) => {
    return getMemberTasks(memberId).length
  }

  const getPendingCount = (memberId: number) => {
    return getMemberTasks(memberId).filter(t => t.status === 'pending').length
  }

  const getInProgressCount = (memberId: number) => {
    return getMemberTasks(memberId).filter(t => t.status === 'in_progress').length
  }

  const getCompletedCount = (memberId: number) => {
    return getMemberTasks(memberId).filter(t => t.status === 'completed').length
  }

  return (
    <div className="space-y-6">
      {/* Team Members */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map((member) => {
          const taskCount = getTaskCount(member.id)
          const pendingCount = getPendingCount(member.id)
          const inProgressCount = getInProgressCount(member.id)
          const completedCount = getCompletedCount(member.id)

          return (
            <Card key={member.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-base">{member.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge variant="secondary">{taskCount}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pending</span>
                    <Badge variant="outline">{pendingCount}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">In Progress</span>
                    <Badge variant="outline" className="bg-info/10 text-info">
                      {inProgressCount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Completed</span>
                    <Badge variant="outline" className="bg-success/10 text-success">
                      {completedCount}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  {getMemberTasks(member.id).slice(0, 3).map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick(task)}
                    />
                  ))}
                  {getMemberTasks(member.id).length > 3 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      +{getMemberTasks(member.id).length - 3} more tasks
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Unassigned Tasks */}
      {unassignedTasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Unassigned Tasks</CardTitle>
              <Badge variant="secondary">{unassignedTasks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}



















