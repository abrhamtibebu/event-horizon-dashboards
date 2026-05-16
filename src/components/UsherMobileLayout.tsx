import type { ReactNode } from 'react'
import { Bell } from 'lucide-react'

interface UsherMobileLayoutProps {
  children: ReactNode
  title?: string
}

/** Mobile-first page chrome for usher views (header + dark theme). Bottom nav is provided by Layout. */
export function UsherMobileLayout({ children, title = 'Usher App' }: UsherMobileLayoutProps) {
  return (
    <div className="flex flex-col min-h-[calc(100vh-8rem)] md:min-h-0 -m-6 md:m-0 bg-[#0b1630] text-white font-sans selection:bg-primary/30 overflow-x-hidden">
      <header className="sticky top-0 z-40 bg-[#0b1630]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between md:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="font-bold text-xs">EV</span>
          </div>
          <h1 className="font-bold text-lg tracking-tight">{title}</h1>
        </div>
        <button type="button" className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
          <Bell className="w-5 h-5 text-gray-400" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-[#0b1630]" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pt-4 md:pt-0 px-0">
        {children}
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden md:hidden" aria-hidden>
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full" />
      </div>
    </div>
  )
}
