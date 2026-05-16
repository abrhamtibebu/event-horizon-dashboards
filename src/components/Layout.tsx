import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Header } from '@/components/Header'
import { SuspendedOrganizerGuard } from '@/components/SuspendedOrganizerGuard'
import { UsherBottomNav } from '@/components/UsherBottomNav'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export function Layout() {
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()
  const location = useLocation()
  const isUsher = user?.role === 'usher' || location.pathname.startsWith('/dashboard/usher')

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
          <div className={cn("flex-1 flex flex-col", isUsher && "md:pl-0")}>
            <div className={cn(isUsher && "hidden md:block")}>
              <Header onSearch={setSearchQuery} />
            </div>
              <main className={cn('flex-1', !isUsher && 'p-6', isUsher && 'p-0 md:p-6 pb-24 md:pb-6')}>
              <SuspendedOrganizerGuard>
                <Outlet context={{ searchQuery }} />
              </SuspendedOrganizerGuard>
            </main>
        </div>
        {isUsher && <UsherBottomNav />}
      </div>
    </SidebarProvider>
  )
}
