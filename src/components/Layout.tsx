import { useState } from 'react'
import { Outlet } from 'react-router-dom'
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
  const isUsher = user?.role === 'usher'

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header onSearch={setSearchQuery} />
          <main className={cn('flex-1 p-6', isUsher && 'pb-24 md:pb-6')}>
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
