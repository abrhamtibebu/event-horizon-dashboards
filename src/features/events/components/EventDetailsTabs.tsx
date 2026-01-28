import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Pencil, Download, QrCode, Copy } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Event } from '../types/event.types'
import { useAuth } from '@/hooks/use-auth'
import { usePermissionCheck } from '@/hooks/use-permission-check'

interface EventDetailsTabsProps {
  eventId: string
  event: Event
  activeTab: string
  onTabChange: (tab: string) => void
  onEdit: () => void
  onExport: () => void
  children: React.ReactNode
}

export function EventDetailsTabs({
  eventId,
  event,
  activeTab,
  onTabChange,
  onEdit,
  onExport,
  children,
}: EventDetailsTabsProps) {
  const { user } = useAuth()
  const { hasPermission } = usePermissionCheck()
  const canManageEvent = hasPermission('events.manage')

  const copyRegistrationLink = () => {
    if (event?.uuid) {
      const url = `${window.location.origin}/event/register/${event.uuid}`
      navigator.clipboard.writeText(url)
      toast.success('Registration link copied to clipboard!')
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full space-y-6">
      <div className="flex flex-col gap-6 bg-card rounded-2xl p-6 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <TabsList className="bg-transparent border-b border-border w-full justify-start p-0 h-auto gap-8 rounded-none">
            {user?.role === 'usher' ? (
              <>
                <TabsTrigger
                  value="attendees"
                  className="px-0 py-3 text-sm font-semibold transition-all border-b-2 border-transparent rounded-none bg-transparent shadow-none data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground"
                >
                  Attendees
                </TabsTrigger>
                <TabsTrigger
                  value="badges"
                  className="px-0 py-3 text-sm font-semibold transition-all border-b-2 border-transparent rounded-none bg-transparent shadow-none data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground"
                >
                  Badges
                </TabsTrigger>
              </>
            ) : (
              <div className="flex flex-wrap gap-x-6">
                {['Details', 'Attendees', 'Ushers', 'Badges', 'Bulk Badges', 'Team', 'Forms', 'Sessions', 'Invitations', 'Analytics'].map((tab) => {
                  const val = tab.toLowerCase().replace(/ /g, '-')
                  // Filter tabs based on role permissions
                  if (val === 'bulk-badges' || val === 'forms' || val === 'ushers' || val === 'analytics' || val === 'invitations' || val === 'team') {
                    if (!canManageEvent) return null
                  }
                  return (
                    <TabsTrigger
                      key={val}
                      value={val}
                      className="px-0 py-3 text-sm font-semibold transition-all border-b-2 border-transparent rounded-none bg-transparent shadow-none data-[state=active]:border-primary data-[state=active]:text-primary text-muted-foreground hover:text-foreground"
                    >
                      {tab}
                    </TabsTrigger>
                  )
                })}
              </div>
            )}
          </TabsList>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-2">
          {canManageEvent && (
            <Button
              onClick={onEdit}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl h-10 px-6 shadow-sm transition-all"
            >
              <Pencil className="w-3.5 h-3.5 mr-2" />
              Edit Event
            </Button>
          )}

          <Button
            variant="outline"
            onClick={onExport}
            className="bg-background border-border text-foreground font-semibold rounded-xl h-10 px-5 hover:bg-muted transition-all"
          >
            <Download className="w-3.5 h-3.5 mr-2 text-primary" />
            Export
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-background border-border text-foreground font-semibold rounded-xl h-10 px-5 hover:bg-muted transition-all"
              >
                <QrCode className="w-3.5 h-3.5 mr-2 text-primary" />
                Registration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl bg-popover border-border text-popover-foreground rounded-2xl p-6 shadow-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <QrCode className="w-5 h-5 text-primary" />
                  Registration Access
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Share this link to allow guests to register for your event.
                </DialogDescription>
              </DialogHeader>

              {event?.status?.toLowerCase().trim() === 'active' && event?.uuid ? (
                <div className="space-y-6 mt-4">
                  <div className="bg-muted/50 rounded-xl p-4 border border-border">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                      Registration URL
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/event/register/${event.uuid}`}
                        readOnly
                        className="bg-background border-border text-foreground h-10 text-sm"
                      />
                      <Button onClick={copyRegistrationLink} variant="outline" size="sm" className="shrink-0">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Event must be active to generate registration link.
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {children}
      </div>
    </Tabs>
  )
}
