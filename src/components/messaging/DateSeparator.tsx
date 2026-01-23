import React from 'react'
import { cn } from '@/lib/utils'

interface DateSeparatorProps {
  date: string
}

export const DateSeparator: React.FC<DateSeparatorProps> = ({ date }) => {
  const formatDate = (dateString: string) => {
    const d = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return 'Today'
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'

    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="flex items-center justify-center my-8 relative">
      <div className="absolute inset-x-0 h-px bg-border/20" />
      <div className="bg-background px-4 py-1 rounded-full border border-border/40 shadow-sm relative z-10">
        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em]">
          {formatDate(date)}
        </span>
      </div>
    </div>
  )
}
