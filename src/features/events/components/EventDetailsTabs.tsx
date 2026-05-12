import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Pencil, Download, QrCode, Copy } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Event } from '../types/event.types'
import { useAuth } from '@/hooks/use-auth'
import { usePermissionCheck } from '@/hooks/use-permission-check'
import QRCode from 'react-qr-code'
import QRCodeLib from 'qrcode'
import { Badge } from '@/components/ui/badge'

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
  const downloadQRCode = async (value: string, filename: string) => {
    try {
      const url = await QRCodeLib.toDataURL(value, {
        width: 2048,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
      
      const downloadLink = document.createElement("a");
      downloadLink.download = `${filename}.png`;
      downloadLink.href = url;
      downloadLink.click();
    } catch (err) {
      toast.error('Could not generate high-quality QR code');
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
                {['Details', 'Attendees', 'Ushers', 'Badges', 'Bulk Badges', 'Team', 'Forms', 'Survey', 'Sessions', 'Invitations', 'Analytics'].map((tab) => {
                  const val = tab.toLowerCase().replace(/ /g, '-')
                  // Filter tabs based on role permissions
                  if (val === 'bulk-badges' || val === 'forms' || val === 'survey' || val === 'ushers' || val === 'analytics' || val === 'invitations' || val === 'team') {
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
            <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-popover border-border text-popover-foreground rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                  <QrCode className="w-5 h-5 text-primary" />
                  Registration Access
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Share these links or QR codes for guest registration.
                </DialogDescription>
              </DialogHeader>

              {event?.uuid ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Pre-Registration Section */}
                  <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Pre-Registration</h3>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">Recommended</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">For guests registering before the event.</p>
                    
                    <div className="flex flex-col items-center gap-3 p-3 bg-white rounded-lg">
                      <QRCode 
                        id="qr-prereg-tabs"
                        value={event.event_type === 'ticketed'
                          ? `${window.location.origin}/tickets/purchase/${event.id}?type=prereg`
                          : `${window.location.origin}/event/register/${event.uuid}?type=prereg`}
                        size={140}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] h-6 text-primary hover:bg-primary/5"
                        onClick={() => {
                          const url = event.event_type === 'ticketed'
                            ? `${window.location.origin}/tickets/purchase/${event.id}?type=prereg`
                            : `${window.location.origin}/event/register/${event.uuid}?type=prereg`;
                          downloadQRCode(url, `prereg-${event.name}`);
                        }}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download QR
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={event.event_type === 'ticketed'
                          ? `${window.location.origin}/tickets/purchase/${event.id}?type=prereg`
                          : `${window.location.origin}/event/register/${event.uuid}?type=prereg`}
                        readOnly
                        className="bg-background border-border text-[10px] h-8"
                      />
                      <Button 
                        onClick={() => {
                          const url = event.event_type === 'ticketed'
                            ? `${window.location.origin}/tickets/purchase/${event.id}?type=prereg`
                            : `${window.location.origin}/event/register/${event.uuid}?type=prereg`;
                          navigator.clipboard.writeText(url);
                          toast.success('Pre-registration link copied!');
                        }} 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Onsite Registration Section */}
                  <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-orange-500">Onsite Registration</h3>
                      <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px]">Walk-in</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">For guests registering at the venue.</p>
                    
                    <div className="flex flex-col items-center gap-3 p-3 bg-white rounded-lg">
                      <QRCode 
                        id="qr-onsite-tabs"
                        value={event.event_type === 'ticketed'
                          ? `${window.location.origin}/tickets/purchase/${event.id}?type=onsite`
                          : `${window.location.origin}/event/register/${event.uuid}?type=onsite`}
                        size={140}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] h-6 text-orange-500 hover:bg-orange-500/5"
                        onClick={() => {
                          const url = event.event_type === 'ticketed'
                            ? `${window.location.origin}/tickets/purchase/${event.id}?type=onsite`
                            : `${window.location.origin}/event/register/${event.uuid}?type=onsite`;
                          downloadQRCode(url, `onsite-${event.name}`);
                        }}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download QR
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={event.event_type === 'ticketed'
                          ? `${window.location.origin}/tickets/purchase/${event.id}?type=onsite`
                          : `${window.location.origin}/event/register/${event.uuid}?type=onsite`}
                        readOnly
                        className="bg-background border-border text-[10px] h-8"
                      />
                      <Button 
                        onClick={() => {
                          const url = event.event_type === 'ticketed'
                            ? `${window.location.origin}/tickets/purchase/${event.id}?type=onsite`
                            : `${window.location.origin}/event/register/${event.uuid}?type=onsite`;
                          navigator.clipboard.writeText(url);
                          toast.success('Onsite registration link copied!');
                        }} 
                        variant="outline" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground italic">
                  Event data not found. Please refresh the page.
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
