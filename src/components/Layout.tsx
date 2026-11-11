import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Header } from '@/components/Header'
import { SuspendedOrganizerGuard } from '@/components/SuspendedOrganizerGuard'
import { VenueSetupGuard } from '@/components/VenueSetupGuard'
import { UsherBottomNav } from '@/components/UsherBottomNav'
import { VenueBottomNav } from '@/components/venue/VenueBottomNav'
import { MessagesTrayProvider } from '@/components/messaging/MessagesTrayContext'
import { MessagesFloatingTray } from '@/components/messaging/MessagesFloatingTray'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import { isVenueRole } from '@/lib/roles'

export function Layout() {
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()
  const location = useLocation()
  const isUsher = user?.role === 'usher' || location.pathname.startsWith('/dashboard/usher')
  const isVenue = isVenueRole(user?.role)

  return (
    <SidebarProvider defaultOpen={true}>
      <MessagesTrayProvider>
        <div
          className={cn('min-h-screen flex w-full', isUsher ? 'dark bg-[#0b1630] text-white' : 'bg-background')}
          style={isUsher ? { colorScheme: 'dark' } : undefined}
        >
          <AppSidebar />
          <div className={cn('min-w-0 flex-1 flex flex-col', isUsher && 'md:pl-0')}>
            <div className={cn(isUsher && 'hidden md:block')}>
              <Header onSearch={setSearchQuery} />
            </div>
            <main className={cn('min-w-0 w-full flex-1', !isUsher && 'p-6', isUsher && 'p-0 md:p-6 pb-24 md:pb-6', isVenue && !isUsher && 'pb-24 md:pb-6')}>
              <SuspendedOrganizerGuard>
                <VenueSetupGuard>
                  <Outlet context={{ searchQuery }} />
                </VenueSetupGuard>
              </SuspendedOrganizerGuard>
            </main>
          </div>
          {isUsher && <UsherBottomNav />}
          {isVenue && !isUsher && <VenueBottomNav />}
          <MessagesFloatingTray />
        </div>
      </MessagesTrayProvider>
    </SidebarProvider>
  )
}
