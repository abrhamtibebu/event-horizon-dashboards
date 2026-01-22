import { UnifiedTask } from '@/types/tasks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TaskCard } from './TaskCard'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

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
    <div className="space-y-10">
      {/* Team Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {teamMembers.map((member) => {
          const taskCount = getTaskCount(member.id)
          const pendingCount = getPendingCount(member.id)
          const inProgressCount = getInProgressCount(member.id)
          const completedCount = getCompletedCount(member.id)

          return (
            <Card key={member.id} className="group border-0 shadow-2xl shadow-black/5 bg-white dark:bg-gray-900 rounded-[2.5rem] overflow-hidden hover:shadow-orange-600/5 transition-all duration-500">
              <div className="p-8">
                <div className="flex items-start gap-5 mb-8">
                  <Avatar className="h-16 w-16 rounded-[1.5rem] border-2 border-orange-50 dark:border-orange-950 shadow-sm transition-transform group-hover:scale-105">
                    <AvatarFallback className="bg-orange-600 text-white text-lg font-black">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-xl text-gray-900 dark:text-white truncate tracking-tight">{member.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate font-semibold mb-2">{member.email}</p>
                    <Badge variant="outline" className="bg-orange-50/50 dark:bg-orange-950/20 text-orange-600 border-orange-100 dark:border-orange-900/50 font-black text-[10px] uppercase tracking-widest px-2.5 py-0.5 shadow-none">
                      {taskCount} Operations
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { label: 'Wait', count: pendingCount, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50' },
                    { label: 'Active', count: inProgressCount, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-950/30' },
                    { label: 'Done', count: completedCount, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30' },
                  ].map((stat) => (
                    <div key={stat.label} className={cn("p-3 rounded-2xl flex flex-col items-center justify-center text-center", stat.bg)}>
                      <span className={cn("text-lg font-black", stat.color)}>{stat.count}</span>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-50">{stat.label}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Current Priorities</h4>
                  </div>
                  <div className="space-y-2.5">
                    {getMemberTasks(member.id).length > 0 ? (
                      getMemberTasks(member.id).slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          onClick={() => onTaskClick(task)}
                          className="p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100/50 dark:border-gray-700/30 hover:bg-white dark:hover:bg-gray-800 hover:border-orange-200 dark:hover:border-orange-900 hover:shadow-lg transition-all cursor-pointer flex items-center gap-3"
                        >
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full shrink-0",
                            task.status === 'in_progress' ? "bg-orange-500 shadow-sm shadow-orange-500/50" : "bg-gray-300 dark:bg-gray-600"
                          )} />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                            {task.title}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-300">No active work</p>
                      </div>
                    )}
                    {getMemberTasks(member.id).length > 3 && (
                      <p className="text-[10px] text-gray-400 text-center font-black uppercase tracking-widest pt-2">
                        + {getMemberTasks(member.id).length - 3} Overflow
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Unassigned Tasks Section */}
      {unassignedTasks.length > 0 && (
        <Card className="border-0 shadow-2xl shadow-black/5 bg-white dark:bg-gray-900 rounded-[3rem] overflow-hidden">
          <div className="bg-orange-600 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="text-white">
                <h3 className="text-2xl font-black uppercase tracking-tight">Open Workload</h3>
                <p className="text-orange-100 font-bold opacity-80 uppercase tracking-widest text-xs mt-1">
                  Immediate orchestration required
                </p>
              </div>
            </div>
            <div className="bg-white text-orange-600 px-6 py-2 rounded-full font-black text-sm uppercase tracking-widest flex items-center gap-2 shadow-lg">
              {unassignedTasks.length} <span className="opacity-60 text-xs">Pending Assignments</span>
            </div>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {unassignedTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className="group p-5 bg-gray-50/50 dark:bg-gray-800/30 rounded-[2.5rem] border border-gray-100 dark:border-gray-800/50 hover:bg-white dark:hover:bg-gray-900 hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-2xl transition-all duration-300 cursor-pointer"
                >
                  <div className="flex flex-col h-full">
                    <Badge className="w-fit mb-4 bg-orange-100 dark:bg-orange-950 font-black text-[9px] text-orange-600 uppercase tracking-[0.15em] border-0 px-2.5 py-0.5">
                      Unassigned
                    </Badge>
                    <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors mb-2 line-clamp-2">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium line-clamp-2 mt-auto opacity-70">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}




















