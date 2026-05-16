import type { ReactNode } from 'react'
import { Bell } from 'lucide-react'

interface UsherMobileLayoutProps {
  children: ReactNode
  title?: string
}

export function UsherMobileLayout({ children, title = 'Usher App' }: UsherMobileLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-[#0b1630] text-white font-sans selection:bg-primary/30 overflow-hidden">
      {/* Fixed Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0b1630] border-b border-white/5 px-4 h-14 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          <img src="/evella-logo.png" alt="Evella" className="h-6 w-auto object-contain" />
          <div className="w-[1px] h-4 bg-white/10 mx-1" />
          <h1 className="font-bold text-sm tracking-tight text-gray-300">{title}</h1>
        </div>
        <button type="button" className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
      </header>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-14 md:pt-0">
        {children}
      </div>
    </div>
  )
}
