import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Header } from '@/components/Header'

export function Layout() {
  const [searchQuery, setSearchQuery] = useState('')
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header onSearch={setSearchQuery} />
          <main className="flex-1 p-6">
            <Outlet context={{ searchQuery }} />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
