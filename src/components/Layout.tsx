import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Header } from '@/components/Header'
import { SuspendedOrganizerGuard } from '@/components/SuspendedOrganizerGuard'

export function Layout() {
  const [searchQuery, setSearchQuery] = useState('')
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header onSearch={setSearchQuery} />
          <main className="flex-1 p-6">
            <SuspendedOrganizerGuard>
              <Outlet context={{ searchQuery }} />
            </SuspendedOrganizerGuard>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
